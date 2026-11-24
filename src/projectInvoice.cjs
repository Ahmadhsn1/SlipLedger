const {eligible, validDate} = require('./ledger.cjs');
const {addInvoice} = require('./invoices.cjs');

function issueProjectInvoice(state, projectId, selectedIds, invoiceId, due) {
  const project = state.projects.find(p => p.id === projectId);
  if (!project || !validDate(due)) throw Error('Choose a project and valid due date.');
  const wanted = new Set(selectedIds);
  const rows = eligible(state, projectId).filter(x => wanted.has(x.id));
  if (!rows.length || rows.length !== selectedIds.length)
    throw Error('Some expenses are no longer available. Review the selection.');
  const currency = rows[0].currency;
  if (rows.some(x => x.currency !== currency)) throw Error('Choose expenses in one currency.');
  const invoices = state.invoices || [];
  const numbers = new Set(invoices.filter(x => x.kind !== 'Bill').map(x => x.number.toUpperCase()));
  let sequence = invoices.length + 1;
  let number;
  do { number = 'INV-' + String(sequence++).padStart(3,'0'); } while (numbers.has(number));
  return addInvoice(state, {
    id:invoiceId, number, kind:'Invoice', client:project.client, description:project.name,
    due, currency, projectId, items:rows.map(x=>({expenseId:x.id,label:x.merchant,qty:1,rate:x.minor})),
    total:rows.reduce((n,x)=>n+x.minor,0),payments:[]
  });
}
module.exports={issueProjectInvoice};
