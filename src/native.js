import * as SQLite from "expo-sqlite";
import * as FS from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import JSZip from "jszip";
import { csv, totals } from "./ledger.cjs";
import { verify } from "./backup.cjs";
let connection;
function database() {
  if (!connection) {
    const db = SQLite.openDatabaseSync("fieldtab.sqlite");
    db.execSync(
      "PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS workspace (id INTEGER PRIMARY KEY CHECK(id=1), body TEXT NOT NULL)",
    );
    connection = db;
  }
  return connection;
}
export function read() {
  const row = database().getFirstSync("SELECT body FROM workspace WHERE id=1");
  return row
    ? JSON.parse(row.body)
    : { version: 1, projects: [], expenses: [], reports: [] };
}
export function change(fn) {
  const db = database();
  let updated;
  db.withTransactionSync(() => {
    updated = fn(read());
    db.runSync(
      "INSERT OR REPLACE INTO workspace(id,body) VALUES(1,?)",
      JSON.stringify(updated),
    );
  });
  return updated;
}
export const receiptDir = FS.documentDirectory + "evidence/";
export const uid = () =>
  Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
export const today = () => {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
};
export const money = (minor, currency) =>
  currency + " " + (minor / 100).toFixed(2);
export async function keep(uri, ext) {
  const info = await FS.getInfoAsync(uri);
  if (!info.exists || !info.size || info.size > 8 * 1024 * 1024)
    throw Error("Choose a readable file under 8 MB.");
  await FS.makeDirectoryAsync(receiptDir, { intermediates: true });
  const file = uid() + "." + ext;
  await FS.copyAsync({ from: uri, to: receiptDir + file });
  return file;
}
export const removeFile = (file) =>
  FS.deleteAsync(receiptDir + file, { idempotent: true });
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        ch
      ],
  );
function html(r) {
  const rows = r.items
    .map(
      (x, i) =>
        "<tr><td>" +
        String(i + 1).padStart(2, "0") +
        "</td><td>" +
        esc(x.date) +
        "</td><td>" +
        esc(x.merchant) +
        "<br><small>" +
        esc(x.category) +
        "</small></td><td>" +
        esc(money(x.minor, x.currency)) +
        "</td><td>" +
        esc(x.file || "Manual entry") +
        "</td></tr>",
    )
    .join("");
  return (
    '<html><head><meta charset="utf-8"><style>@page{margin:32px}body{font:14px Helvetica,Arial;color:#1a1c31}h1{font-size:32px}table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:10px 4px;border-bottom:1px solid #ddd;word-break:break-word}thead{display:table-header-group}tr{page-break-inside:avoid}small{color:#444}</style></head><body><b>SlipLedger / Expense report</b><h1>' +
    esc(r.project) +
    "</h1><p>Prepared for " +
    esc(r.client) +
    " · " +
    esc(r.date) +
    " · Ref " +
    esc(r.id) +
    "</p><table><thead><tr><th>#</th><th>Date</th><th>Merchant</th><th>Amount</th><th>Evidence reference</th></tr></thead><tbody>" +
    rows +
    "</tbody></table><h2>Reimbursement requested</h2>" +
    totals(r.items)
      .map((t) => "<p>" + esc(money(t.minor, t.currency)) + "</p>")
      .join("") +
    "<p>Amounts include any recorded tax. Original files accompany the evidence pack.</p></body></html>"
  );
}
export async function shareReport(r, format) {
  if (!(await Sharing.isAvailableAsync()))
    throw Error("File sharing is unavailable on this device.");
  const root = FS.cacheDirectory + "fieldtab-exports/";
  await FS.makeDirectoryAsync(root, { intermediates: true });
  const uri = root + r.id + "." + format;
  if (format === "csv")
    await FS.writeAsStringAsync(uri, "\uFEFF" + csv(r.items));
  else {
    if (format === "zip") {
      let bytes = 0;
      for (const x of r.items.filter((x) => x.file)) {
        const info = await FS.getInfoAsync(receiptDir + x.file);
        if (!info.exists)
          throw Error(
            "A receipt file is missing. Share the summary or CSV and check your originals.",
          );
        bytes += info.size;
      }
      if (bytes > 24 * 1024 * 1024)
        throw Error(
          "This evidence pack exceeds 24 MB. Export the summary and share the originals individually.",
        );
    }
    const pdf = await Print.printToFileAsync({ html: html(r) });
    try {
      if (format === "pdf") await FS.copyAsync({ from: pdf.uri, to: uri });
      else {
        const zip = new JSZip();
        const add = async (name, path) =>
          zip.file(
            name,
            await FS.readAsStringAsync(path, { encoding: "base64" }),
            { base64: true },
          );
        await add("Expense-report.pdf", pdf.uri);
        zip.file("Expenses.csv", csv(r.items));
        for (const x of r.items.filter((x) => x.file))
          await add("Receipts/" + x.file, receiptDir + x.file);
        await FS.writeAsStringAsync(
          uri,
          await zip.generateAsync({ type: "base64" }),
          { encoding: "base64" },
        );
      }
    } finally {
      await FS.deleteAsync(pdf.uri, { idempotent: true });
    }
  }
  await Sharing.shareAsync(uri, {
    mimeType: {
      pdf: "application/pdf",
      csv: "text/csv",
      zip: "application/zip",
    }[format],
  });
}
export async function eraseWorkspace() {
  change(() => ({ version: 1, projects: [], expenses: [], reports: [] }));
  await recoverWorkspace();
}
export async function recoverWorkspace() {
  const state = verify(read());
  const originals = new Set(state.expenses.map((x) => x.file).filter(Boolean));
  const directory = await FS.getInfoAsync(receiptDir);
  if (directory.exists) {
    const names = await FS.readDirectoryAsync(receiptDir);
    for (const name of names) {
      if (!originals.has(name)) await removeFile(name);
    }
  }
  await FS.deleteAsync(FS.cacheDirectory + "fieldtab-exports/", {
    idempotent: true,
  });
}
export async function checkInput(uri) {
  const info = await FS.getInfoAsync(uri);
  if (!info.exists || !info.size || info.size > 8 * 1024 * 1024)
    throw Error("Choose a readable receipt under 8 MB.");
}

export async function shareInvoice(document) {
  if (!(await Sharing.isAvailableAsync())) throw Error("Sharing unavailable on this device.");
  const items = document.items || [{label: document.description, qty: 1, rate: document.total}];
  const amount = value => esc(money(value, document.currency));
  const paid = document.payments.reduce((sum,p) => sum+p.amount,0);
  const rows = items.map(item => `<tr><td>${esc(item.label)}</td><td>${item.qty}</td><td>${amount(item.rate)}</td><td>${amount(item.qty*item.rate)}</td></tr>`).join("");
  const sender = document.sender || read().businessProfile || {};
  const detail = value => esc(value || "").replace(/\n/g,"<br>");
  const markup = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  @page{size:A4;margin:42px}body{font:12px Helvetica,Arial,sans-serif;color:#17213a;line-height:1.5}h1{font-size:32px;letter-spacing:2px;margin:0;color:#164e47}h2{font-size:19px;margin:0 0 8px}.header{width:100%;margin-bottom:32px}.header td{border:0;vertical-align:top}.right{text-align:right}.muted{color:#64748b}.party{padding:18px;background:#f1f5f4;margin:20px 0}table{width:100%;border-collapse:collapse}th{background:#164e47;color:white;text-align:left;padding:11px}td{padding:11px;border-bottom:1px solid #e2e8f0}th:not(:first-child),.items td:not(:first-child){text-align:right}thead{display:table-header-group}tr{page-break-inside:avoid}.summary{width:48%;margin:22px 0 30px auto}.balance{font-size:17px;font-weight:bold;background:#e9f3ef}.notes{border-top:1px solid #dbe4e1;padding-top:18px;white-space:normal}.footer{margin-top:35px;font-size:10px;color:#64748b}</style></head><body>
  <table class="header"><tr><td><h2>${detail(sender.name || "Business details not provided")}</h2>${detail(sender.address)}<br>${detail(sender.email)} ${detail(sender.phone)}${sender.taxId?"<br>Tax ID: "+detail(sender.taxId):""}</td><td class="right"><h1>${document.kind==="Bill"?"SUPPLIER BILL":"INVOICE"}</h1><strong>${esc(document.number)}</strong>${document.issued?"<br>Issued: "+esc(document.issued):""}<br>Due: ${esc(document.due)}<br><span class="muted">Currency: ${esc(document.currency)}</span></td></tr></table>
  <div class="party"><span class="muted">${document.kind==="Bill"?"SUPPLIER":"BILL TO"}</span><h2>${esc(document.client)}</h2>${detail(document.clientDetails)}</div>
  <table class="items"><thead><tr><th>Description</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table>
  <table class="summary"><tr><td>Total</td><td class="right">${amount(document.total)}</td></tr><tr><td>Paid</td><td class="right">${amount(paid)}</td></tr><tr class="balance"><td>Balance due</td><td class="right">${amount(document.total-paid)}</td></tr></table>
  ${sender.paymentDetails?"<div class='notes'><strong>Payment instructions</strong><br>"+detail(sender.paymentDetails)+"</div>":""}
  <div class="footer">Please reference ${esc(document.number)} when making payment. All amounts are in ${esc(document.currency)}.</div></body></html>`;
  const {uri} = await Print.printToFileAsync({html:markup});
  try {await Sharing.shareAsync(uri,{mimeType:"application/pdf",UTI:"com.adobe.pdf"});}
  finally {await FS.deleteAsync(uri,{idempotent:true});}
}
