// Single place for the offer, the legal terms and the GHL custom-field map.
// Change the numbers here and the sales page, agreement, PDF and invoice all follow.

export const OFFER = {
  name: "GBP Management",
  priceMonthly: 500, // AUD, inc GST
  gstRate: 0.1,
  minimumTermMonths: 3,
  noticeDays: 30,
  currency: "AUD",
  invoiceDueDays: 7,
};

export const COMPANY = {
  tradingName: "Local Service Pro",
  legalName: "Local Service Pro",
  abn: "62 752 928 611",
  email: "support@localservicepro.com.au",
  website: "https://localservicepro.com.au",
  address: "Australia-wide, online",
};

// Custom fields written to the GHL contact. `key` is the GHL fieldKey without the
// "contact." prefix; `name` is what gets created in GHL if the field is missing.
export const CUSTOM_FIELDS = {
  registered_business_name: { name: "Registered Business Name", dataType: "TEXT" },
  abn: { name: "ABN", dataType: "TEXT" },
  contact_role: { name: "Contact Role", dataType: "TEXT" },
  business_address: { name: "Business Address", dataType: "TEXT" },
  gbp_priority_suburbs: { name: "GBP Priority Suburbs", dataType: "LARGE_TEXT" },
  gbp_priority_services: { name: "GBP Priority Services", dataType: "LARGE_TEXT" },
  gbp_agreement_status: { name: "GBP Agreement Status", dataType: "TEXT" },
  gbp_agreement_signed_at: { name: "GBP Agreement Signed At", dataType: "TEXT" },
  gbp_agreement_signer: { name: "GBP Agreement Signer", dataType: "TEXT" },
  gbp_agreement_pdf_url: { name: "GBP Agreement PDF URL", dataType: "TEXT" },
  gbp_agreement_pdf: { name: "GBP Agreement PDF", dataType: "FILE_UPLOAD" },
  gbp_invoice_id: { name: "GBP Invoice ID", dataType: "TEXT" },
  gbp_invoice_number: { name: "GBP Invoice Number", dataType: "TEXT" },
} as const;

export type CustomFieldKey = keyof typeof CUSTOM_FIELDS;

export const TAGS = {
  lead: "gbp-lead",
  details: "gbp-details-complete",
  signed: "gbp-agreement-signed",
  invoiced: "gbp-invoice-sent",
};

export const SERVICE_SCOPE = [
  "Primary and secondary Google Business Profile categories restructured around the Client's priority services.",
  "Service area set to the Client's priority suburbs.",
  "Services list rewritten with a description for each priority service.",
  "Business description rewritten to name the Client's services and suburbs.",
  "Opening hours and contact details reviewed and corrected with the Client.",
  "Eight (8) Google Business Profile posts per month, written from photos and job details supplied by the Client.",
  "Automated Google review requests sent to customers the Client supplies and has confirmed consent to contact.",
  "A single lead inbox in the LSP system for calls, texts, web chat and Google messages.",
  "A progress report every six (6) weeks covering profile views, searches, calls, direction requests and review count.",
];

export const AGREEMENT_CLAUSES: { title: string; body: string }[] = [
  {
    title: "1. Services",
    body: `Local Service Pro ("LSP") will manage the Client's Google Business Profile as described in the Scope of Services. All changes to the profile in the first-month optimisation are sent to the Client for approval before they go live. LSP does not guarantee rankings, positions, call volume or revenue; Google controls search results and they vary by searcher location.`,
  },
  {
    title: "2. Fees and billing",
    body: `The fee is $${OFFER.priceMonthly} per month including GST, billed monthly in advance. The first payment is due on signing and the Services start once the first payment clears. Subsequent invoices are issued monthly on the anniversary of the start date and are due within ${OFFER.invoiceDueDays} days. There is no setup fee. Advertising spend, website changes and photography are not included and are quoted separately.`,
  },
  {
    title: "3. Term and cancellation",
    body: `The minimum term is ${OFFER.minimumTermMonths} months from the start date ($${OFFER.priceMonthly * OFFER.minimumTermMonths} inc GST in total). After the minimum term the agreement continues month to month. Either party may end it after the minimum term with ${OFFER.noticeDays} days' written notice (email is sufficient). Fees for the notice period remain payable. LSP may suspend the Services if an invoice is more than 14 days overdue.`,
  },
  {
    title: "4. Client responsibilities",
    body: `The Client will: grant LSP manager access to the Google Business Profile; complete the onboarding form with priority suburbs and services; supply job photos and details for posts; supply customer contact details for review requests only where the customer has agreed to be contacted; and respond to approval requests within a reasonable time. Delays caused by the Client do not extend or pause the billing period.`,
  },
  {
    title: "5. Ownership and access",
    body: `The Google Business Profile, its reviews and the Client's customer list remain the property of the Client at all times. On termination LSP removes its manager access and, on request, provides an export of the contacts held in the LSP system within 14 days. Content LSP creates for the profile may continue to be used by the Client after termination.`,
  },
  {
    title: "6. Privacy and compliance",
    body: `Each party will comply with the Privacy Act 1988 (Cth) and the Spam Act 2003 (Cth). The Client warrants it has consent to share customer details it provides to LSP for review requests. LSP will only use Client and customer data to deliver the Services.`,
  },
  {
    title: "7. Liability",
    body: `To the extent permitted by law, LSP's total liability under this agreement is limited to the fees paid by the Client in the three (3) months before the claim. Neither party is liable for indirect or consequential loss. Nothing in this agreement excludes rights under the Australian Consumer Law that cannot be excluded.`,
  },
  {
    title: "8. General",
    body: `This agreement is governed by the laws of Queensland, Australia. It is the entire agreement between the parties for the Services and may be varied only in writing. Electronic signature of this agreement is binding under the Electronic Transactions Act 1999 (Cth).`,
  },
];
