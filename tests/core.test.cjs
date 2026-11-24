const test = require("node:test"),
  assert = require("node:assert/strict");
const {
  cents,
  validDate,
  validate,
  csv,
  suggest,
  totals,
  eligible,
  report,
} = require("../src/ledger.cjs");
const { verify } = require("../src/backup.cjs");
const x = {
  id: "row-01",
  merchant: "Print Lab",
  date: "2026-11-01",
  minor: 3150,
  currency: "GBP",
  category: "Supplies",
  billable: true,
  project: "job-01",
  taxMinor: 525,
  file: "receipt-01.pdf",
};
const state = {
  version: 1,
  projects: [{ id: "job-01", client: "Juniper", name: "Launch shoot" }],
  expenses: [x],
  reports: [],
};
for (const [amount, result] of [
  ["10,05", 1005],
  ["0.10", 10],
  ["1.001", null],
  ["-1", null],
  ["1e3", null],
  ["12,000.00", null],
])
  test("amount " + amount, () => assert.equal(cents(amount), result));
test("real calendar dates", () => {
  assert.ok(validDate("2024-02-29"));
  assert.equal(validDate("2025-02-29"), false);
});
test("review requires explicit currency and included tax within total", () => {
  const d = { ...x, amount: "31.50", tax: "5.25" };
  assert.equal(validate(d), "");
  assert.ok(validate({ ...d, currency: "" }));
  assert.ok(validate({ ...d, tax: "40" }));
});
test("recognition suggests only labelled totals", () => {
  const r = suggest(
    "Print Lab\n2026-11-01\nSUBTOTAL 26.25\nVAT 5.25\nTOTAL GBP 31.50",
  );
  assert.equal(r.amount, "31.50");
  assert.equal(r.currency, "GBP");
  assert.equal(r.tax, "5.25");
  assert.equal(r.date, "2026-11-01");
});
test("unknown dollars and conflicting totals require review", () => {
  const r = suggest("Shop\nTOTAL $20.22\nTOTAL $21.22");
  assert.equal(r.currency, "");
  assert.equal(r.amount, "");
});
test("separate currency totals and integer math", () =>
  assert.deepEqual(
    totals([x, { ...x, currency: "USD", minor: 11 }, { ...x, minor: 1 }]),
    [
      { currency: "USD", minor: 11 },
      { currency: "GBP", minor: 3151 },
    ],
  ));
test("internal and other projects are excluded", () =>
  assert.deepEqual(
    eligible(
      {
        ...state,
        expenses: [x, { ...x, billable: false }, { ...x, project: "other" }],
      },
      x.project,
    ),
    [x],
  ));
test("snapshot survives edit and prevents claiming again", () => {
  const r = report(state, x.project, "report-1", x.date);
  assert.notEqual(r.items[0], x);
  assert.throws(() =>
    report({ ...state, reports: [r] }, x.project, "other", x.date),
  );
});
test("CSV escapes quotes, commas and formula prefixes", () =>
  assert.ok(
    csv([{ ...x, merchant: ' =CALL("A,B")' }]).includes('"\' =CALL(""A,B"")"'),
  ));
test("backup with report round trips", () => {
  const b = {
    ...state,
    reports: [report(state, x.project, "report-1", x.date)],
  };
  assert.deepEqual(verify(JSON.parse(JSON.stringify(b))), b);
});
for (const [key, value] of [
  ["file", "../other.pdf"],
  ["project", "missing"],
  ["minor", -100],
  ["category", "unknown"],
  ["currency", "X"],
  ["taxMinor", 9999],
])
  test("backup rejects invalid " + key, () =>
    assert.throws(() =>
      verify({ ...state, expenses: [{ ...x, [key]: value }] }),
    ),
  );
test("duplicate claims are rejected on restore", () => {
  const r = report(state, x.project, "report-1", x.date);
  assert.throws(() =>
    verify({ ...state, reports: [r, { ...r, id: "report-2" }] }),
  );
});
test("clear dates and grouped European totals", () => {
  const r = suggest("Studio\n23/11/2026\nTOTAL EUR 1.234,50");
  assert.equal(r.date, "2026-11-23");
  assert.equal(r.amount, "1234.50");
});
test("ambiguous US and UK dates are left blank", () =>
  assert.equal(suggest("Shop\n07/08/2026").date, ""));
test("receipt heading is skipped", () =>
  assert.equal(suggest("TAX INVOICE\nJuniper Lab").merchant, "Juniper Lab"));
