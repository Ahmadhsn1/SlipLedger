# Fieldtab • product and validation brief

23 November 2026 | Android and iOS | Working name, pending clearance

## Customer and buying event

Start with independent commercial photographers and small production studios in the UK and US who pay a supplier up front and must later send a client documentary evidence. A shoot is an identifiable job with a beginning, expenses and a settlement date. Test photographers first, then producers and independent consultants. A photographer who collects all expenses in advance or charges an all-inclusive day rate can be a poor fit. Interview that group separately to measure how common this disqualifier is.

The first offer is simple: finish the shoot, select its project and share an evidence pack without exposing another client's receipts. The claim is a report for attachment to the customer's existing invoice. The app records reimbursement after explicit confirmation. It does not collect or transfer a client's money.

## What the evidence supports

| Alternative                         | Verified overlap                                                                                | Implication for design                                                     |
| ----------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| FreshBooks                          | Assign expenses to a client/project, make them billable, include the original on an invoice [1] | Let users keep their existing invoicing system.                            |
| Harvest                             | An expense report with receipt images can accompany an invoice [2]                              | Test a stand-alone pack against an actual Harvest workflow.                |
| Smart Receipts                      | PDF, CSV and ZIP with original receipt images [3]                                               | Export formats offer feature parity. Test fewer corrections and taps.      |
| Expensify                           | Individual SmartScans are free and unlimited [4]                                                | Charging per scan alone gives a weak reason to switch.                     |
| Zoho Invoice                        | Photo capture, receipts, expense tracking and client rebilling [5]                              | Offer a quick route from project to outstanding balance.                   |
| Dext                                | Extraction into bookkeeping software [6]                                                        | Accountant-led firms have stronger alternatives.                           |
| Veryfi                              | Offers a mobile expense product with extraction, projects and reporting [7]                     | Benchmark the alternative before purchasing an OCR API.                    |
| Phone camera + folder + spreadsheet | Interview baseline, no new app subscription assumed                                             | Time the user's actual method; account for familiarity and switching cost. |

Public terms from photographer Rob Lawson describe equipment, assistants, catering and travel costs. Olivia Brabbs defaults to advance payment of production costs. These are opposing recruitment signals: a real expense workflow exists, but some photographers have already solved the financing problem. Neither source establishes a sale. [8, 9]

ReceiptFlow already appears as a receipt scanner on Google Play [10]. Fieldtab is an internal candidate. Search the target stores and relevant trademark registers and confirm clearance before spending on a public identity. Voice: direct, calm, specific. The receipt mark, ink green, off-white paper, soft green selected states and clear currency codes carry through the ledger and exported reports.

## Screens and interaction contract

| Screen                  | Primary decision                                                       | States and safeguards                                                                                     |
| ----------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Ledger                  | What money is outstanding?                                             | One total per currency; search; six status choices; empty and no-match states.                            |
| Add receipt             | Camera, file or manual entry?                                          | Permission denial, cancellation, 8 MB limit and unreadable originals.                                     |
| Review                  | Are merchant, date, currency, total, included tax and project correct? | Optional tax; original preview; explicit confirmation; warning for likely duplicates.                     |
| Projects / new project  | Which client and job owns this expense?                                | Duplicate names per client rejected; project can be created during receipt review.                        |
| Project detail          | What can I claim next?                                                 | Billable totals omit internal and previously reported receipts.                                           |
| Expense detail          | Correct, share or remove an original                                   | Editing locked once included in a report.                                                                 |
| Report preparation      | Check rows before committing                                           | Immutable values; empty draft blocked; review merchant details before locking.                            |
| Report detail / history | Share evidence and record progress                                     | Prepared → Sent → Reimbursed; cancelling a prepared report releases its expenses.                         |
| Settings / account      | How do I protect and move records?                                     | Manual backup with email verification; restore to empty workspace; local and cloud deletion are separate. |
| Plan                    | Purchase or restore access                                             | Localized store product/price; restore and manage subscription; existing reports always accessible.       |

Use a native share sheet, scrollable forms and 44-point-or-larger touch targets. Show full currency codes. A plain dollar sign leaves currency unconfirmed. A multi-page PDF can be retained intact; data entry falls back to manual review. A cancelled share sheet never marks a report sent. Do not infer payment from sending a PDF.

## Revenue and cash

The subscription is Fieldtab revenue. A client's reimbursement belongs to the freelancer and never passes through Fieldtab. The proposed store test is USD 7.99/month or 71.99/year (localized by storefront). Free includes local capture, two projects and one prepared report. Pro allows unlimited projects and reports. Evaluation builds unlock the workflow at no charge. The 24 MB cloud backup cap applies to both plans.

On a hypothetical US dollar 7.99 sale, ignoring sales tax, a 15% store-fee assumption leaves 6.79. Assume another 0.50 for infrastructure, support, refunds and billing service as a placeholder: contribution is 6.29/month. At 30% store fee it is 5.09. At 71.99/year and 15%, net proceeds are 61.19 before other costs; budgeting that over 12 service months gives 5.10 per service month, or 4.60 after the 0.50 allowance. Annual cash collected and monthly contribution measure different things. At 200/month fixed costs this requires 32 monthly-plan subscribers in the first scenario. A three-month acquisition payback ceiling is 18.87 at 6.29 monthly contribution and uninterrupted retention. Free users, owner labour, tax, FX and refunds can change the result. Replace every assumption with settlement and invoice data from the pilot.

A cloud Expense Parser call for a single document of up to ten pages costs 0.10 at Google's standard rate [11]. At 100 such receipts the cost is 10.00. Native on-device recognition avoids that per-document API charge in this implementation. Measure actual correction time, battery, storage, support and backup retrieval costs before setting paid limits. A store's 15% rate can depend on program eligibility [12]. Google lists Pakistan for merchant registration [13]. Individual seller approval, identity verification, bank settlement and tax treatment remain unverified.

Reconcile monthly by storefront, settlement currency and payout ID: customer gross → indirect taxes → refunds → store adjustments and commission → cash due → bank deposit and FX difference. Track recurring revenue separately from deposits; never count reimbursable receipt totals as product revenue.

## Validation protocol and decision gates

1. Recruit 20: ten UK and ten US professionals. Qualify with at least two client-paid jobs and five reimbursable purchases in the previous 90 days. Record disqualifications. Seek a mixture of folders/spreadsheets, invoice suites and expense apps. Do not select only people who like the idea.
2. Ask: Show the last paid job. Who paid for each purchase? How did you split internal expenses? What did the client require? Did they reject evidence? What took time? What did you last pay for? Ask permission before viewing a redacted example.
3. Counterbalance task order. Give participants five consented or synthetic receipts, including a mixed currency, a duplicate and an internal item. Ask for a shareable claim using their existing workflow and Fieldtab. Observe independently: completion time, wrong totals, leakage of internal items, omitted originals, assistance and whether a client could audit the pack.
4. Offer the same initial monthly price. Count a real paid pilot or a dated buyer commitment separately from verbal enthusiasm. Track second-project usage after 30 days. Do not simulate payments or present test purchases as revenue.
5. Proceed with distribution investment if at least three qualified customers commit, eight of ten pilot users can independently generate a correct pack, median task time improves by at least 30%, and no cross-client exposure occurs. Reposition if users value existing invoicing-suite integration above speed. Stop the paid hypothesis after 30 qualified offers with zero commitments.

OCR benchmark: 200 consented, de-identified receipts stratified by platform, currency, lighting, rotated photos, totals with tips, ambiguous dates and digital PDFs. Double-label the ground truth and adjudicate disagreements. Record merchant/date/currency/total accuracy before edits, abstention, median and p90 correction time, and final accuracy after review. Pilot targets: ≥95% exact total among all test receipts, 100% correct amounts in exported accepted reports, zero silent currency guesses. Separate synthetic parser results from device OCR results. No interview, paid conversion, device benchmark or settlement has been observed in this delivery.

## Sources

1. FreshBooks — https://support.freshbooks.com/hc/en-us/articles/231963968-How-do-I-rebill-expenses
2. Harvest — https://support.getharvest.com/hc/en-us/articles/9864825272589-Attaching-files-and-reports-to-invoices
3. Smart Receipts — https://help.smartreceipts.co/en/articles/15545285-exporting-and-sharing
4. Expensify — https://www.expensify.com/pricing
5. Zoho Invoice — https://www.zoho.com/us/invoice/invoice-expenses/
6. Dext — https://dext.com/en/business/product/receipts-scanner-tracker-app
7. Veryfi — https://www.veryfi.com/plans-pricing/
8. Rob Lawson — https://roblawson.com/termsandconditions/
9. Olivia Brabbs — https://www.oliviabrabbs.co.uk/terms-conditions
10. Google Play listing — https://play.google.com/store/apps/details?id=com.receiptflow.mobile
11. Document AI pricing — https://cloud.google.com/products/document-ai/pricing
12. Apple Small Business Program — https://developer.apple.com/app-store/small-business-program/
13. Google Play supported merchant locations — https://support.google.com/googleplay/android-developer/answer/9306917
