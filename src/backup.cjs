const { validDate, validCurrency, categories } = require("./ledger.cjs");
const id = (v) => typeof v === "string" && /^[a-z0-9-]{2,64}$/.test(v);
const file = (v) =>
  typeof v === "string" && /^[a-z0-9-]{2,64}\.(jpeg|jpg|png|pdf|heic)$/.test(v);
const text = (v) =>
  typeof v === "string" && v.trim().length > 0 && v.length <= 120;
function verify(state) {
  const fail = () => {
    throw Error("This backup contains unsupported or inconsistent data.");
  };
  if (
    !state ||
    state.version !== 1 ||
    !["expenses", "reports", "projects"].every(
      (k) => Array.isArray(state[k]) && state[k].length <= 50000,
    )
  )
    fail();
  for (const group of [state.projects, state.expenses, state.reports]) {
    if (
      group.some((x) => !x || !id(x.id)) ||
      new Set(group.map((x) => x.id)).size !== group.length
    )
      fail();
  }
  const projects = new Map(state.projects.map((x) => [x.id, x]));
  for (const p of projects.values())
    if (!text(p.client) || !text(p.name)) fail();
  const expenses = new Map(state.expenses.map((x) => [x.id, x]));
  for (const x of expenses.values()) {
    if (
      (x.workspace != null && !["Business","Personal"].includes(x.workspace)) ||
      (x.workspace === "Personal" ? (x.project !== null || x.billable !== false) : !projects.has(x.project)) ||
      !validDate(x.date) ||
      !text(x.merchant) ||
      !Number.isSafeInteger(x.minor) ||
      x.minor <= 0 ||
      x.minor > 9999999999 ||
      !validCurrency(x.currency) ||
      !categories.includes(x.category) ||
      typeof x.billable !== "boolean" ||
      (x.file != null && !file(x.file)) ||
      (x.taxMinor != null &&
        (!Number.isSafeInteger(x.taxMinor) ||
          x.taxMinor < 0 ||
          x.taxMinor > x.minor))
    )
      fail();
  }
  if (state.customCurrencies !== undefined && (!Array.isArray(state.customCurrencies) || state.customCurrencies.length > 200 || !state.customCurrencies.every(validCurrency) || new Set(state.customCurrencies).size !== state.customCurrencies.length)) fail();
  const claimed = new Set();
  for (const r of state.reports) {
    if (
      !projects.has(r.projectId) ||
      !text(r.client) ||
      !text(r.project) ||
      !validDate(r.date) ||
      !["Prepared", "Sent", "Reimbursed"].includes(r.status) ||
      !Array.isArray(r.items) ||
      !r.items.length
    )
      fail();
    for (const item of r.items) {
      const x = expenses.get(item.id);
      if (
        !x ||
        claimed.has(x.id) ||
        !x.billable ||
        x.project !== r.projectId ||
        Object.keys(x).some((k) => x[k] !== item[k])
      )
        fail();
      claimed.add(x.id);
    }
  }
  if (state.currency && !validCurrency(state.currency)) fail();
  if(state.invoices!==undefined){
    const {validInvoice,documentKey}=require('./invoices.cjs');
    if(!Array.isArray(state.invoices)||state.invoices.length>50000||!state.invoices.every(validInvoice)||
      new Set(state.invoices.map(x=>x.id)).size!==state.invoices.length||
      new Set(state.invoices.map(documentKey)).size!==state.invoices.length) fail();
    for(const doc of state.invoices){
      for(const item of doc.items || []){
        if(item.expenseId === undefined)continue;
        const expense = expenses.get(item.expenseId);
        if(doc.kind!=="Invoice" || !expense || !expense.billable || !projects.has(doc.projectId) ||
           expense.project!==doc.projectId || doc.currency!==expense.currency || item.qty!==1 ||
           expense.minor!==item.rate || item.label!==expense.merchant || claimed.has(expense.id))fail();
        claimed.add(expense.id);
      }
    }
  }
  return state;
}
module.exports = { verify };
