# GBP Management by LSP

Sales page and self-serve sign-up for Local Service Pro's Google Business Profile management offer. Next.js 15 (App Router), deployed on Vercel, with GoHighLevel as the only data store.

## Flow

```
/            Sales page
/start       Step 1  Simple form (name, business, email, mobile)      -> POST /api/lead     upserts the GHL contact
/details     Step 2  Contract data (legal name, ABN, role, address…)  -> POST /api/details  writes custom fields
/contract    Step 3  Pre-filled agreement + on-screen e-signature     -> POST /api/sign     PDF -> GHL file field, invoice created + sent
/done        Step 4  Confirmation with PDF link
```

Links between steps carry the GHL contact id plus an HMAC token (`?c=…&t=…`), so a contact can only be opened with a link this app issued. There's no database: every step reads/writes the GHL contact, so a refresh or back button re-populates from GHL.

## What happens on sign

1. The agreement is rendered to PDF with `pdf-lib` (parties, commercial terms, scope, clauses, signature image, audit trail: agreement ID, timestamp, IP, user agent).
2. The PDF is uploaded to the contact's **GBP Agreement PDF** (FILE_UPLOAD) custom field; its hosted URL is also written to **GBP Agreement PDF URL** as a plain-text fallback.
3. Status / signed-at / signer custom fields are set and the `gbp-agreement-signed` tag is added.
4. A recurring monthly invoice schedule ($500 inc GST, same day each month, due on issue, email only) is created and started in GHL Invoices, which emails the first invoice immediately. Schedule id, first invoice id and number are written back to the contact and the `gbp-invoice-sent` tag is added. If the schedule scope is missing, it falls back to a one-off invoice for month 1.

Submitting twice (back button, double-click) is safe: a contact already marked Signed with an invoice id is redirected to `/done` without a second invoice.

## GHL custom fields

All fields are on the **contact** model and are created automatically on first use if missing (matched by field key or by display name, so hand-made fields are reused rather than duplicated). See `lib/config.ts`:

| Field | Type |
|---|---|
| Registered Business Name | TEXT |
| ABN | TEXT |
| Contact Role | TEXT |
| Business Address | TEXT |
| GBP Priority Suburbs | LARGE_TEXT |
| GBP Priority Services | LARGE_TEXT |
| GBP Agreement Status | TEXT (`Awaiting signature` / `Signed`) |
| GBP Agreement Signed At | TEXT (ISO timestamp) |
| GBP Agreement Signer | TEXT |
| GBP Agreement PDF URL | TEXT |
| GBP Agreement PDF | FILE_UPLOAD (.pdf) |
| GBP Invoice Schedule ID | TEXT |
| GBP Invoice ID | TEXT |
| GBP Invoice Number | TEXT |

Tags: `gbp-lead`, `gbp-details-complete`, `gbp-agreement-signed`, `gbp-invoice-sent`. Use them to trigger GHL workflows (e.g. send the onboarding form once the invoice is paid).

## Environment variables (Vercel)

| Name | Required | Notes |
|---|---|---|
| `GHL_PIT_TOKEN` | yes | Private Integration Token. Scopes: `contacts.write`, `contacts.readonly`, `locations/customFields.write`, `locations/customFields.readonly`, `invoices.write`, `invoices.readonly`, `invoices/schedule.write`, `invoices/schedule.readonly`, `users.readonly` |
| `GHL_LOCATION_ID` | yes | Sub-account ID |
| `GHL_USER_ID` | no | User the invoice is sent from. Defaults to the first user in the location. |
| `APP_SECRET` | no | Signs step links. Defaults to a hash of the PIT token; set it so links survive a token rotation. |
| `APP_URL` | no | Public URL (for the invoice logo). Vercel's `VERCEL_URL` is used otherwise. |

Invoices need a payment provider connected in the sub-account (Payments > Integrations) for the "Pay" button to work.

## Develop

```
npm install
cp .env.example .env.local   # fill in
npm run dev
```

`npm run typecheck` and `npm run build` are the pre-push checks.

Prices, terms, clauses and the scope list live in `lib/config.ts`; the sales page, agreement page, PDF and invoice all read from there.
