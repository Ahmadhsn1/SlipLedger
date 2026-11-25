const { test } = require('node:test'), assert = require('node:assert/strict');
const { addInvoice, recordPayment, balance } = require('../src/invoices.cjs');
const { verify } = require('../src/backup.cjs');
test('issued invoice survives backup, partial payment, duplicate and overpayment checks', () => {
    const x = { id: 'inv-01', number: 'INV-001', client: 'Studio', description: 'Photography', total: 42850, currency: 'GBP', due: '2026-11-30', payments: [] };
    const old = { version: 1, projects: [], expenses: [], reports: [] }; let st = addInvoice(verify(old), x);
    assert.throws(() => addInvoice(st, { ...x, id: 'inv-02' }));
    const p = { id: 'pay-01', date: '2026-11-23', amount: 2850 };
    st = recordPayment(st, x.id, p); assert.equal(balance(verify(st).invoices[0]), 40000);
    assert.throws(() => recordPayment(st, x.id, p)); assert.throws(() => recordPayment(st, x.id, { ...p, id: 'pay-02', amount: 40001 }));
    assert.equal(balance(recordPayment(st, x.id, { ...p, id: 'pay-03', amount: 40000 }).invoices[0]), 0);
});
test('supplier bills and legacy invoices can use the same reference', () => {
    const doc = { id: 'inv-001', number: 'AB1', client: 'Alpha', description: 'Tools', total: 500, currency: 'GBP', due: '2026-11-30', payments: [] };
    const items = [{ label: 'Travel', qty: 2, rate: 100 }, { label: 'Hire', qty: 1, rate: 300 }];
    const st = addInvoice({ version: 1, expenses: [], projects: [], reports: [] }, doc);
    const bill = { ...doc, kind: 'Bill', id: 'bill-001', items };
    assert.equal(verify(addInvoice(st, bill)).invoices.length, 2);
    assert.throws(() => addInvoice(st, { ...bill, total: 499 }));
    assert.throws(() => addInvoice(st, { ...bill, items: [{ label: 'Unit', qty: -1, rate: 500 }] }));
});
