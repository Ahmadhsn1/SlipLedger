const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validate } = require('../src/ledger.cjs');
const { verify } = require('../src/backup.cjs');
const draft = { merchant: 'Train', date: '2026-11-24', currency: 'GBP', amount: '10', workspace: 'Personal' };
const expense = { ...draft, id: 'ex-01', minor: 1000, project: null, billable: false, category: 'Travel' };
const state = { version: 1, projects: [], reports: [], expenses: [expense] };
test('personal manual entry and backup need no project', () => {
    assert.equal(validate(draft), ''); assert.equal(verify(state), state);
});
test('personal records cannot restore as billable or project-linked', () => {
    for (const change of [{ billable: true }, { project: 'project-1' }]) assert.throws(() => verify({ ...state, expenses: [{ ...expense, ...change }] }));
});
test('business and existing unscoped drafts still require a project', () => {
    for (const workspace of [undefined, 'Business']) assert.match(validate({ ...draft, workspace }), /project/);
});
