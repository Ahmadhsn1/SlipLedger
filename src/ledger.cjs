const currencies = ["PKR", "USD", "GBP", "EUR"];
const validCurrency = code => typeof code === "string" && /^[A-Z]{3}$/.test(code);
const currencyOptions = (state = {}) => [...new Set([...currencies, ...(state.customCurrencies || []), state.currency, ...(state.expenses || []).map(x => x.currency), ...(state.invoices || []).map(x => x.currency)])].filter(validCurrency);
const categories = ["Supplies", "Travel", "Meals", "Equipment", "Other"];
function cents(value) {
  const clean = String(value ?? "")
    .trim()
    .replace(",", ".");
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(clean)) return null;
  const [whole, fraction = ""] = clean.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}
function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T12:00:00Z");
  return !Number.isNaN(+date) && date.toISOString().slice(0, 10) === value;
}
function validate(d) {
  if (!d.merchant.trim()) return "Enter the merchant name.";
  if (!validDate(d.date)) return "Enter a valid date in YYYY-MM-DD format.";
  if (!(cents(d.amount) > 0))
    return "Enter a positive amount with up to two decimal places.";
  if (!validCurrency(d.currency))
    return "Choose the currency printed on the receipt.";
  if (d.workspace !== "Personal" && !d.project) return "Choose a project.";
  if (d.tax && (cents(d.tax) === null || cents(d.tax) > cents(d.amount)))
    return "Tax must be between zero and the receipt total.";
  return "";
}
function printedAmount(line) {
  // Credits and ambiguous signed totals need manual review.
  if (/[−–-]|\(|\)|\b(?:refund|credit|CR)\b/i.test(line)) return null;
  const match = line.match(
    /(?:^|[^\d.,])((?:\d{1,3}(?:[., ]\d{3})+|\d{1,8})[.,]\d{2})\s*(?:[A-Z]{3})?\s*$/i,
  );
  if (!match) {
    const whole = line.match(/(?:^|[^\d.,])((?:\d{1,3}(?:[, ]\d{3})+|\d{1,8}))\s*(?:[A-Z]{3})?\s*$/i);
    if (!whole) return null;
    const amount = whole[1].replace(/[, ]/g, "") + ".00";
    return cents(amount) === null ? null : amount;
  }
  const raw = match[1],
    major = raw.slice(0, -3).replace(/[., ]/g, "");
  const amount = major + "." + raw.slice(-2);
  return cents(amount) === null ? null : amount;
}
function standaloneAmount(line, enabledCurrencies) {
  const codes = line.match(/[A-Za-z]+/g) || [];
  if (codes.some(code => !enabledCurrencies.includes(code.toUpperCase()))) return null;
  if (!/^(?:(?:[A-Z]{3}|[$£€])\s*)?[\d., ]+\s*(?:[A-Z]{3})?$/i.test(line)) return null;
  return printedAmount(line);
}
function printedDate(text) {
  const iso = text.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0];
  if (iso && validDate(iso)) return iso;
  const numeric = text.match(/\b(\d{1,2})[/.](\d{1,2})[/.](\d{4})\b/);
  if (!numeric) return "";
  const [, first, second, year] = numeric;
  if (
    Number(first) <= 12 &&
    Number(second) <= 12 &&
    Number(first) !== Number(second)
  )
    return "";
  const [month, day] = Number(first) > 12 ? [second, first] : [first, second];
  const date = year + "-" + month.padStart(2, "0") + "-" + day.padStart(2, "0");
  return validDate(date) ? date : "";
}
function suggestedCategory(text) {
  const signals = [
    ["Travel", /\b(?:airline|airport|flight|hotel|lodging|taxi|uber|lyft|train|rail|transit|parking|toll)\b/i],
    ["Meals", /\b(?:restaurant|cafe|coffee|café|diner|food|meal|takeaway|takeout|bakery)\b/i],
    ["Equipment", /\b(?:laptop|computer|monitor|electronics|equipment|camera|printer|tablet)\b/i],
    ["Supplies", /\b(?:office supplies|stationery|printing|paper|ink|toner|hardware store)\b/i],
  ]
    .filter(([, pattern]) => pattern.test(text))
    .map(([category]) => category);
  return signals.length === 1 ? signals[0] : "";
}
function suggest(text, enabledCurrencies = currencies) {
  const lines = text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const gross = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (
      !/^(?:grand\s+total|total(?:\s+(?:amount|due|paid|payable))?|amount\s+(?:paid|due)|balance\s+due)\b/i.test(
        line,
      ) ||
      /tax|savings|discount|items/i.test(line)
    )
      continue;
    const inline = printedAmount(line);
    if (inline) gross.push(inline);
    else if (i + 1 < lines.length && standaloneAmount(lines[i + 1], enabledCurrencies))
      gross.push(standaloneAmount(lines[i + 1], enabledCurrencies));
  }
  const candidates = new Set(gross);
  const currency = enabledCurrencies.filter(
    (c) =>
      new RegExp("\\b" + c + "\\b", "i").test(text) ||
      (c === "GBP" && text.includes("£")) ||
      (c === "EUR" && text.includes("€")),
  );
  const taxes = new Set();
  for (let i = 0; i < lines.length; i++) {
    if (!/^(?:VAT|SALES TAX|TAX)\b/i.test(lines[i])) continue;
    const inline = printedAmount(lines[i]);
    if (inline) taxes.add(inline);
    else if (i + 1 < lines.length && standaloneAmount(lines[i + 1], enabledCurrencies))
      taxes.add(standaloneAmount(lines[i + 1], enabledCurrencies));
  }
  const merchant = lines.find(
    (l) =>
      !/^(?:receipt|invoice|sales receipt|tax invoice|date|total|grand total|subtotal|sub-total|vat|tax|sales tax|amount due|balance due)\b/i.test(
        l,
      ) &&
      !/^\d{1,2}[/.]\d{1,2}[/.]\d{2,4}$/.test(l) &&
      !/^\d[\d\s().+-]{6,}$/.test(l),
  );
  return {
    merchant: merchant?.slice(0, 100) || "",
    tax: taxes.size === 1 ? [...taxes][0] : "",
    amount: candidates.size === 1 ? [...candidates][0] : "",
    currency: currency.length === 1 ? currency[0] : "",
    date: printedDate(text),
    category: suggestedCategory(text) || "Other",
  };
}
function totals(items) {
  return [...new Set([...currencies, ...items.map(x => x.currency)])]
    .map((currency) => ({
      currency,
      minor: items
        .filter((x) => x.currency === currency)
        .reduce((sum, x) => sum + x.minor, 0),
    }))
    .filter((x) => x.minor);
}
function eligible(state, project) {
  const used = new Set(state.reports.flatMap((r) => r.items.map((x) => x.id)));
  for (const invoice of state.invoices || []) {
    for (const item of invoice.items || []) if (item.expenseId) used.add(item.expenseId);
  }
  return state.expenses.filter(
    (x) => x.project === project && x.billable && !used.has(x.id),
  );
}
function report(state, projectId, id, date) {
  const project = state.projects.find((p) => p.id === projectId);
  const items = eligible(state, projectId);
  if (!project || !items.length)
    throw Error("There are no new billable expenses for this project.");
  return {
    id,
    date,
    client: project.client,
    project: project.name,
    projectId,
    items: items.map((x) => ({ ...x })),
    status: "Prepared",
  };
}
function csv(items) {
  const escape = (v) => {
    let s = String(v ?? "");
    if (/^[\s]*[=+@-]|^[\t\r\n]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  return [
    [
      "Date",
      "Merchant",
      "Category",
      "Currency",
      "Total",
      "Included tax",
      "Evidence",
    ],
    ...items.map((x) => [
      x.date,
      x.merchant,
      x.category,
      x.currency,
      (x.minor / 100).toFixed(2),
      x.taxMinor == null ? "" : (x.taxMinor / 100).toFixed(2),
      x.file || "Manual entry",
    ]),
  ]
    .map((row) => row.map(escape).join(","))
    .join("\r\n");
}
module.exports = {
  currencies,
  validCurrency,
  currencyOptions,
  categories,
  cents,
  validDate,
  validate,
  suggest,
  totals,
  eligible,
  report,
  csv,
};
