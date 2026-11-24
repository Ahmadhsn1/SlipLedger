<div align="center">

<img src="assets/icon.png" alt="SlipLedger app icon" width="112" />

# SlipLedger

### One thoughtful workspace for expenses, projects, invoices, and cash flow

[![Expo](https://img.shields.io/badge/Expo-54-000020?logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react&logoColor=20232A)](https://reactnative.dev)
[![Android](https://img.shields.io/badge/Android-API_24+-3DDC84?logo=android&logoColor=white)](https://developer.android.com)
[![iOS](https://img.shields.io/badge/iOS-Native_Module-000000?logo=apple&logoColor=white)](https://developer.apple.com)
[![Supabase](https://img.shields.io/badge/Supabase-Optional-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Tests](https://github.com/Ahmadhsn1/SlipLedger/actions/workflows/tests.yml/badge.svg)](https://github.com/Ahmadhsn1/SlipLedger/actions/workflows/tests.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**SlipLedger** is a polished, offline-first mobile ledger designed to keep personal spending and business money in order—without sending your financial records to a third party by default.

</div>

---

## What makes SlipLedger different

- **Personal and business, side by side** — Maintain separate workspaces while sharing one fast, familiar interface.
- **Capture once, review before saving** — Photographs, images, and PDFs pass through an on-device OCR review flow.
- **Project-aware expenses** — Connect business costs to projects, reimbursement status, reports, and invoices.
- **Clean financial records** — Integer minor units, currency-safe grouping, validation rules, and derived balances prevent avoidable mistakes.
- **Invoices and supplier bills** — Create multi-line documents, record partial payments, and share polished PDFs.
- **Private cloud backup** — Optional passwordless account backup to Supabase, with restore and account deletion controls.
- **Built for real devices** — Automatic or saved appearance, safe-area layouts, native sharing, and upgrade-conscious identifiers.

> SlipLedger is an actively developed, native mobile application. The repository is intended for development and release verification, not as a pre-published commercial build.

---

## Product experience

### Ledger
Track merchants, dates, categories, currencies, projects, reimbursement choices, and attached originals. Manual entries and OCR suggestions both pass through the same validation flow.

### Projects
Organize business costs by project, see linked work, prepare claims, and keep reimbursement state clear. Project costs can be carried into invoices atomically.

### Invoices & bills
Create client invoices or supplier bills with up to 100 lines, due dates, currencies, payment history, balances, and shareable PDF documents.

### Reports
Generate expense summaries and export records without losing the original receipt context. Currency totals are kept separate rather than mixed into one misleading amount.

### Settings & account
Choose system, light, or dark appearance, set a default currency, erase the local workspace, sign in for private backup, restore data, or delete the cloud account.

---

## Architecture

```text
SlipLedger
├── src
│   ├── App.js                 Application shell and navigation
│   ├── LedgerScreen.js        Ledger views and expense workflows
│   ├── ProjectInvoiceScreen.js Project-to-invoice journey
│   ├── InvoiceScreen.js       Client invoices and supplier bills
│   ├── Account.js             Supabase account and backup UI
│   ├── native.js              SQLite, files, PDFs, CSV, and sharing
│   ├── ledger.cjs             Financial rules and report calculations
│   ├── invoices.cjs           Invoice totals and payment rules
│   └── backup.cjs             Backup validation and integrity checks
├── modules/field-reader        Android and iOS native OCR adapters
├── supabase
│   ├── schema.sql              Private backup storage policies
│   └── functions/delete-account Account erasure function
├── tests                      Core, invoice, journey, and workspace tests
└── docs                       Product and release documentation
```

### Storage model

The primary workspace is stored locally with Expo SQLite. Receipt originals live in the device receipt directory, while the app state references the saved file. Optional cloud backup packages the validated workspace and originals into a ZIP archive.

- Local-first: the ledger remains usable without an account or internet connection.
- Integer money: amounts are stored and calculated in minor units.
- Transaction-oriented writes: project invoice links and payment changes are validated as state operations.
- Portable backups: validation rejects unsafe paths and incompatible workspace shapes.
- Upgrade-conscious: existing Fieldtab package and bundle identifiers preserve compatibility where the signing identity is retained.

---

## Technology

| Area | Implementation |
|---|---|
| Mobile framework | React Native 0.81 with Expo SDK 54 |
| Language | JavaScript / React with CJS domain modules |
| Local database | Expo SQLite |
| File and PDF support | Expo FileSystem, Print, Sharing, Image Picker, and Document Picker |
| Document capture | Custom native OCR module for Android and iOS |
| Cloud account and backup | Supabase Auth, Storage, Edge Functions, and signed URLs |
| Build and distribution | Expo CLI and EAS profiles |
| Automated validation | Node test runner for domain and workspace behavior |

---

## Native OCR

The custom `FieldReader` module reads text from:

- Camera photographs
- JPEG and PNG imports
- PDF documents

Recognized values are suggestions only. The review step always lets the user inspect and correct merchant, date, amount, currency, category, project, and reimbursement fields before saving.

A native/prebuild run is required for OCR. Expo Go or a JavaScript-only environment does not provide the custom module.

---

## Getting started

### Requirements

- **Node.js 22 LTS**
- **npm**
- **Android:** Android SDK and JDK 17
- **iOS:** macOS, Xcode, and CocoaPods

### Install

```bash
npm ci
```

### Run the unit suite

```bash
npm test
```

### Generate native projects

```bash
npm run prebuild
```

### Run on Android

```bash
npm run android
```

### Run on iOS

```bash
npm run ios
```

### Start a Metro development session

```bash
npm start
```

---

## Optional cloud configuration

Copy `.env.example` to `.env`, then provide the public deployment values:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_PRIVACY_URL=
EXPO_PUBLIC_TERMS_URL=
```

These values belong in an Expo environment and are safe for the public mobile bundle. Never place a Supabase service-role key or store signing credential in the app.

### Deploy Supabase

1. Create an owner-controlled Supabase project.
2. Apply [`supabase/schema.sql`](supabase/schema.sql).
3. Deploy [`supabase/functions/delete-account/index.ts`](supabase/functions/delete-account/index.ts).
4. Configure the Edge Function with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
5. Use the public URL and anonymous key as the two `EXPO_PUBLIC_SUPABASE_*` values.

Cloud backup is disabled automatically if public Supabase configuration is missing. A backup is limited to 24 MB and must be restored into an empty local workspace.

### Enable email and Google sign-in

The Account screen supports passwordless email sign-in/sign-up and Google OAuth. Configure the provider before testing authentication:

1. In Supabase **Authentication → URL Configuration**, add `slipledger://auth/callback` to the allowed redirect URLs.
2. In **Authentication → Providers → Google**, enable Google and add the OAuth client credentials from your Google Cloud project.
3. Add the Supabase callback URL shown in the Google provider settings to the authorized redirect URIs in Google Cloud.
4. In the Supabase **Confirm signup** and **Magic link** email templates, include `{{ .Token }}` so the app can verify the one-time code it requests.
5. Configure the public Supabase values above, then rebuild the native app so the `slipledger` URL scheme is registered.

Google sign-in uses the system browser and a PKCE authorization flow. Email sign-in sends a one-time verification code; account creation also collects a display name. The local ledger remains available without signing in. Expo Go does not support this app's custom native callback scheme; use a development or release build.

---

## Scripts

| Command | Purpose |
|---|---|
| `npm start` | Start Metro for a development build |
| `npm run android` | Generate/build and launch Android |
| `npm run ios` | Generate/build and launch iOS |
| `npm run prebuild` | Generate native Android and iOS projects |
| `npm test` | Run the complete Node test suite |
| `npm run bundle` | Export JavaScript bundles for both platforms |
| `npm run postinstall` | Apply pinned dependency patches |

---

## Quality and verification

The repository includes tests for:

- Calendar and amount validation
- Ambiguous currency and date parsing
- Integer-cent calculations
- Currency-specific totals
- Project reimbursement eligibility
- Invoice and payment balances
- Duplicate claims and atomic project invoicing
- Formula-safe CSV output
- Backup structure and unsafe archive references
- Workspace restore and erasure behavior

Run the suite after any domain or workspace change:

```bash
npm test
```

Detailed release evidence and remaining gates are maintained in:

- [`docs/validation.md`](docs/validation.md)
- [`docs/current-plan.md`](docs/current-plan.md)
- [`docs/product.md`](docs/product.md)

### Release status

The core rules and backup validation have automated coverage, and production JavaScript bundles are exportable. Before public distribution, the project still requires owner-controlled signing, physical-device verification, OCR accuracy checks, account workflow testing, app-store assets, and publication disclosures.

---

## Upgrade compatibility

SlipLedger retains the historical production and SQLite identity used by the Fieldtab mobile application:

- Android package: `studio.fieldtab.mobile`
- iOS bundle ID: `studio.fieldtab.mobile`
- Preview builds use `.preview` variants

This is intentional for upgrades where the same signing identity and app store account are in use. New distribution arrangements should be reviewed before publication.

---

## Contributing

Development work is strongest when changes follow these principles:

1. Preserve local-first behavior.
2. Keep money as integer minor units.
3. Treat OCR output as untrusted suggestion data.
4. Add or update tests before changing domain rules.
5. Validate native behavior on a real device as well as in tests.
6. Keep cloud configuration out of source control.

Before opening a release candidate:

```bash
npm ci
npm test
npm run prebuild
npm run bundle
```

---

## Project status

SlipLedger is a feature-rich in-development mobile workspace. It already includes the ledger, projects, OCR review, invoices, supplier bills, reports, backup, and account workflows—but physical-device and store-release verification remain essential before claiming production readiness.

<div align="center">

**SlipLedger** — Quietly organized. Financially clear.

</div>
