# Implementation and release plan

## 1. Offline ledger
Personal entries need a merchant, date, supported currency and positive amount. Business entries require a valid project and an explicit reimbursement choice. Keep existing project records in Business. Review OCR before saving. Store amounts in integer minor units, and aggregate each currency separately.

## 2. Invoices and bills
Keep customer receivables and supplier payables in separate views. Validate quantities and prices before writing. Record payments inside the SQLite state transaction. Keep paid and remaining amounts derived from the same payment history. Support older single-item invoices in detail views and PDF exports.

## 3. Remaining product integration
Selected project costs now link to invoices atomically. Linked costs are excluded from later invoices and reimbursement reports. Add supplier-invoice OCR review and document attachment. Complete approved navigation, invoice sender details and editable pre-issue drafts. Document optional account backup separately from continuous cross-device synchronization.

## 4. Release verification
Test Android and iOS on device, including first launch offline, camera permission denial, PDF selection, restart persistence, light/dark changes, share cancellation, large text and screen readers. Exercise install and upgrade with an existing ledger. Deploy and verify the chosen cloud account, restore, deletion and retention workflow. Produce signed builds and verify them before distribution.
