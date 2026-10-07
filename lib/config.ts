// Single place for the offer, the legal terms and the GHL custom-field map.
// Change the numbers here and the sales page, agreement, PDF and invoice all follow.

export const OFFER = {
  name: "GBP Management",
  priceMonthly: 500, // AUD, inc GST
  gstRate: 0.1,
  minimumTermMonths: 3,
  noticeDays: 30,
  currency: "AUD",
};

export const COMPANY = {
  tradingName: "Local Service Pro",
  legalName: "Local Service Pro",
  abn: "62 752 928 611",
  email: "info@localservicepro.com.au",
  // Signs on the Provider's behalf. The signature image lives at public/provider-signature.png.
  signatory: { name: "Ryan Henderson", role: "Director" },
  signatureFile: "provider-signature.png",
  // Google accounts the client invites as Managers on their Business Profile.
  gbpManagerEmails: ["support@localservicepro.com.au", "info@localservicepro.com.au"],
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
  gbp_invoice_schedule_id: { name: "GBP Invoice Schedule ID", dataType: "TEXT" },
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

export const SERVICE_SCOPE = {
  month1: {
    title: "Month 1: profile rebuild",
    note: "The first month is the rebuild only. Monthly posting starts in month 2.",
    items: [
      "Primary and secondary Google Business Profile categories restructured around the Client's priority services.",
      "Service area set to the Client's priority suburbs.",
      "Services list rewritten with a description for each priority service.",
      "Business description rewritten to name the Client's services and suburbs.",
      "Opening hours and contact details reviewed and corrected with the Client.",
    ],
  },
  ongoing: {
    title: "Month 2 onwards: monthly management",
    note: "Starts on the first day of the second billing month.",
    items: [
      "Eight (8) Google Business Profile posts per month, written from photos and job details supplied by the Client.",
      "Profile kept accurate as the Client's hours, services and details change.",
      "A progress report every six (6) weeks covering profile views, searches, calls, direction requests and review count.",
    ],
  },
};

export const AGREEMENT_CLAUSES: { title: string; body: string }[] = [
  {
    title: "1. Services",
    body: `Local Service Pro ("LSP") will manage the Client's Google Business Profile as described in the Scope of Services. Month one of the term is the profile rebuild only; the monthly posting and management services begin in month two. All changes to the profile in the first-month rebuild are sent to the Client for approval before they go live. LSP does not guarantee rankings, positions, call volume or revenue; Google controls search results and they vary by searcher location.`,
  },
  {
    title: "2. Fees and billing",
    body: `The fee is $${OFFER.priceMonthly} per month including GST, billed monthly in advance. The first invoice is issued on signing and the Services start once it is paid. Following invoices are issued by email monthly on the same day each month and are payable on issue. There is no setup fee. Advertising spend, website changes and photography are not included and are quoted separately.`,
  },
  {
    title: "3. Term and cancellation",
    body: `The minimum term is ${OFFER.minimumTermMonths} months from the start date ($${OFFER.priceMonthly * OFFER.minimumTermMonths} inc GST in total). After the minimum term the agreement continues month to month. Either party may end it after the minimum term with ${OFFER.noticeDays} days' written notice (email is sufficient). Fees for the notice period remain payable. LSP may suspend the Services if an invoice is more than 14 days overdue.`,
  },
  {
    title: "4. Client responsibilities",
    body: `The Client will: grant LSP manager access to the Google Business Profile; complete the onboarding form with priority suburbs and services; supply job photos and details for posts; and respond to approval requests within a reasonable time. Delays caused by the Client do not extend or pause the billing period.`,
  },
  {
    title: "5. Ownership and access",
    body: `The Google Business Profile and its reviews remain the property of the Client at all times. LSP only ever acts as a manager on the Client's profile and never holds the Client's Google login. On termination LSP removes its manager access. Content LSP creates for the profile may continue to be used by the Client after termination.`,
  },
];
