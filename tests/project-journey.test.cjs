const { test } = require('node:test');
const assert = require('node:assert/strict');
const JSZip = require('jszip');
const { issueProjectInvoice } = require('../src/projectInvoice.cjs');
const { report, eligible, suggest, totals } = require('../src/ledger.cjs');
const { recordPayment, balance } = require('../src/invoices.cjs');
const { verify } = require('../src/backup.cjs');
const date = '2026-11-23';
const source = { id: 'ex-01', merchant: 'Equipment', minor: 18000, project: 'job-01', currency: 'GBP', date, category: 'Equipment', billable: true };
const state = { version: 1, projects: [{ id: 'job-01', name: 'Shoot', client: 'Studio' }], reports: [], expenses: [source, { ...source, id: 'ex-02', minor: 6000 }, { ...source, id: 'ex-03', minor: 5000, currency: 'EUR' }] };
const issue = (s, ids) => issueProjectInvoice(s, 'job-01', ids, 'inv-01', date);
test('project → invoice → partial payment → ZIP round trip → settlement', async () => {
    let s = issue(state, ['ex-01', 'ex-02']); assert.equal(s.invoices[0].total, 24000);
    const pay = (s, id, amount) => recordPayment(s, 'inv-01', { id, date, amount });
    s = pay(s, 'p-01', 4000); assert.equal(balance(s.invoices[0]), 20000);
    const archive = new JSZip(); archive.file('workspace.json', JSON.stringify(s)); const bytes = await archive.generateAsync({ type: 'nodebuffer', compression: 'STORE' });
    const opened = await JSZip.loadAsync(bytes); s = verify(JSON.parse(await opened.file('workspace.json').async('string')));
    assert.equal(balance(pay(s, 'p-02', 20000).invoices[0]), 0);
    assert.deepEqual(eligible(s, 'job-01').map(x => x.id), ['ex-03']);
    assert.deepEqual(totals(report(s, 'job-01', 'report-01', date).items), [{ currency: 'EUR', minor: 5000 }]);
    assert.throws(() => issue(s, ['ex-01']));
});
test('mixed currency, repeated ids, already reported expenses rejected', () => {
    for (const ids of [['ex-01', 'ex-03'], ['ex-01', 'ex-01'], [], ['missing']]) assert.throws(() => issue(state, ids));
    const reported = { ...state, reports: [report(state, 'job-01', 'report-01', date)] };
    assert.throws(() => issue(reported, ['ex-02']));
});
test('restore checks invoice line links to source expense and against report claims', () => {
    const s = issue(state, ['ex-01']);
    assert.throws(() => verify({ ...s, expenses: s.expenses.slice(1) }));
    assert.throws(() => verify({ ...s, reports: [report(state, 'job-01', 'report-01', date)] }));
    const different = { ...s, expenses: s.expenses.map(x => ({ ...x, minor: 50 })) }; assert.throws(() => verify(different));
});
test('OCR signed refund totals are left for manual review', () => {
    for (const line of ['TOTAL -£12.00', 'TOTAL GBP −12.00', 'TOTAL (12.00)', 'TOTAL CREDIT 12.00']) assert.equal(suggest('Cafe\n' + line).amount, '');
});
