# Release evidence

## Checks executed
- Android release compilation completed successfully (579 Gradle tasks). The installable internal preview is signed and verified with APK signature schemes v2 and v3. It targets API 36, requires API 24 or later and contains the ARM64 ABI. Its package ID is studio.fieldtab.mobile.preview.
- Clean dependency installation applied the pinned Metro compatibility patch. The JS dependency audit reported zero known vulnerabilities on the final resolved tree. This is one dependency check, not a security certification.
- 25 automated ledger, parser and backup-validation tests passed. Cases include integer amounts, calendar dates, ambiguous currency/date, grouped European totals, internal exclusions, duplicate claims, formula-safe CSV and unsafe backup references.
- Production-mode Hermes JavaScript bundles were generated for Android and iOS. Expo identified the custom OCR native module on both platforms.
- The implemented UI was rendered in a mobile-size component harness. A scripted journey created a client project and a manual receipt, handled a required-field error, prepared a report, reloaded the ledger, filtered records and checked a 320-pixel viewport. The four visual previews use synthetic records. Native integrations were substituted for this test.
- A local PostgreSQL test exercised the actual storage policies with simulated auth and storage schemas. A user could access their own backup; another user, a deleted identity and the anonymous role could not read it. Writes outside the single allowed object path failed.
- A native-adapter test used real SQLite and ZIP processing with test filesystem and print/share adapters. It checked transaction rollback, evidence bytes, PDF markup, quoted CSV, missing originals and erasure.
- The production configuration guard rejects a release missing provider keys or privacy/terms URLs. This prevents publishing an evaluation edition as a configured commercial app.

## Evidence outstanding
| Release area | Required evidence |
|---|---|
| Device reliability | Physical-device tests covering camera, file import, rotation, offline restart, memory pressure, native picker cancellation, OCR, PDF rendering/sharing, accessibility, and backup restoration. |
| Accuracy | 200 labelled documents with correction-time measurements. Parser unit tests alone cannot measure on-device text recognition. |
| Accounts | Owner-controlled deployment, production transactional email, OTP login, secure session lifecycle, actual two-account backup/restore and complete account deletion. |
| Money | Store products, localized pricing, approved seller accounts, sandbox purchase/renewal/cancellation/refund/restore tests and eventual settlement reconciliation. |
| Publication | Owner signing identities, supported releases, approved product name and disclosures, published terms/privacy, support contact and submission review. |
| Market | Qualified interviews, timed comparison against existing tools, repeat use and paid commitments. |
