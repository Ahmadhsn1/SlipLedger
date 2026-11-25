const { validCurrency, validDate } = require('./ledger.cjs');
function lineTotal(items) {
  if (!Array.isArray(items) || !items.length || items.length > 100) return null;
  let total = 0;
  for (const item of items) {
    if (!item || typeof item.label !== 'string' || !item.label.trim() || item.label.length > 120 ||
      !Number.isSafeInteger(item.qty) || item.qty < 1 || item.qty > 99999 || !Number.isSafeInteger(item.rate) || item.rate < 1) return null;
    total += item.qty * item.rate;
    if (!Number.isSafeInteger(total) || total > 9999999999) return null;
  }
  return total;
}
function documentKey(x) {
  return JSON.stringify([x.kind || 'Invoice', x.kind === 'Bill' ? x.client.trim().toLowerCase() : '', x.number.trim().toLowerCase()]);
}
function validInvoice(x) {
  const text = v => typeof v === 'string' && v.trim().length > 0 && v.length <= 120;
  return x && [x.id, x.client, x.description, x.number].every(text) &&
    (x.kind == null || ['Invoice', 'Bill'].includes(x.kind)) && (x.items == null || lineTotal(x.items) === x.total) &&
    validCurrency(x.currency) && validDate(x.due) && (x.issued == null || validDate(x.issued)) &&
    Number.isSafeInteger(x.total) && x.total > 0 && x.total <= 9999999999 &&
    Array.isArray(x.payments) && x.payments.every(p => p && Number.isSafeInteger(p.amount) && p.amount > 0 && validDate(p.date) && text(p.id)) &&
    new Set(x.payments.map(p => p.id)).size === x.payments.length && balance(x) >= 0;
}
function balance(x) { return x.total - x.payments.reduce((sum, p) => sum + p.amount, 0); }
function addInvoice(st, invoice) {
  const all = st.invoices || [];
  if (!validInvoice(invoice) || all.some(x => x.id === invoice.id || documentKey(x) === documentKey(invoice))) throw Error('Check the invoice fields and use a unique invoice number.');
  return { ...st, invoices: [invoice, ...all] };
}
function recordPayment(st, id, payment) {
  const x = (st.invoices || []).find(item => item.id === id);
  if (!x) throw Error('Invoice no longer exists.');
  const next = { ...x, payments: [...x.payments, payment] };
  if (!validInvoice(next)) throw Error('Enter a positive payment within the outstanding balance.');
  return { ...st, invoices: st.invoices.map(item => item.id === id ? next : item) };
}
module.exports = { documentKey, lineTotal, validInvoice, balance, addInvoice, recordPayment };

function updateInvoice(st, invoice) {
  const old = (st.invoices || []).find(x => x.id === invoice.id);
  if (!old) throw Error('Document no longer exists.');
  if (old.payments.length && old.currency !== invoice.currency) throw Error('Remove payments before changing currency.');
  const next = addInvoice({ ...st, invoices: st.invoices.filter(x => x.id !== invoice.id) }, invoice);
  require('./backup.cjs').verify(next);
  return next;
}
function deleteInvoice(st, id) {
  const old = (st.invoices || []).find(x => x.id === id);
  if (!old) throw Error('Document no longer exists.');
  if (old.payments.length) throw Error('Remove recorded payments before deleting this document.');
  return { ...st, invoices: st.invoices.filter(x => x.id !== id) };
}
function changePayment(st, id, paymentId, replacement) {
  const old = (st.invoices || []).find(x => x.id === id);
  if (!old || !old.payments.some(p => p.id === paymentId)) throw Error('Payment no longer exists.');
  return updateInvoice(st, { ...old, payments: replacement ? old.payments.map(p => p.id === paymentId ? { ...replacement, id: paymentId } : p) : old.payments.filter(p => p.id !== paymentId) });
}
Object.assign(module.exports, { updateInvoice, deleteInvoice, changePayment });
