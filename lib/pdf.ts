// Renders the signed agreement as a PDF with pdf-lib (no browser needed, runs on Vercel).
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { AGREEMENT_CLAUSES, COMPANY, OFFER, SERVICE_SCOPE } from "./config";

export type AgreementData = {
  contactName: string;
  contactRole: string;
  email: string;
  phone: string;
  companyName: string;
  registeredBusinessName: string;
  abn: string;
  businessAddress: string;
  website?: string;
  suburbs?: string;
  services?: string;
  // signature
  signerName: string;
  signedAtISO: string;
  signaturePngBase64: string; // data without the data: prefix
  ip: string;
  userAgent: string;
  agreementId: string;
};

const A4 = { w: 595.28, h: 841.89 };
const M = 56; // margin
const NAVY = rgb(0.043, 0.067, 0.11);
const CYAN = rgb(0.31, 0.765, 0.878);
const GREY = rgb(0.4, 0.44, 0.5);

export async function renderAgreementPdf(d: AgreementData, logoPng?: Uint8Array): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`GBP Management Agreement - ${d.registeredBusinessName}`);
  doc.setAuthor(COMPANY.tradingName);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const logo = logoPng ? await doc.embedPng(logoPng) : null;

  let page = doc.addPage([A4.w, A4.h]);
  let y = A4.h - M;
  let pageNo = 1;

  const newPage = () => {
    page = doc.addPage([A4.w, A4.h]);
    pageNo++;
    y = A4.h - M;
  };
  const ensure = (needed: number) => {
    if (y - needed < M + 24) newPage();
  };
  const text = (s: string, size: number, f: PDFFont = font, color = NAVY, x = M) => {
    ensure(size + 4);
    page.drawText(s, { x, y: y - size, size, font: f, color });
    y -= size + 4;
  };
  const para = (s: string, size = 10, f: PDFFont = font, color = NAVY, indent = 0, lineGap = 3) => {
    const maxW = A4.w - M * 2 - indent;
    const lines = wrap(s, f, size, maxW);
    for (const line of lines) {
      ensure(size + lineGap);
      page.drawText(line, { x: M + indent, y: y - size, size, font: f, color });
      y -= size + lineGap;
    }
  };
  const gap = (n: number) => {
    y -= n;
  };
  const rule = () => {
    ensure(8);
    page.drawLine({ start: { x: M, y: y - 2 }, end: { x: A4.w - M, y: y - 2 }, thickness: 0.6, color: rgb(0.85, 0.87, 0.9) });
    y -= 10;
  };

  // Header
  if (logo) {
    const lw = 150;
    const lh = (logo.height / logo.width) * lw;
    page.drawImage(logo, { x: M, y: y - lh, width: lw, height: lh });
    y -= lh + 6;
  } else {
    text(COMPANY.tradingName, 16, bold);
  }
  text("GOOGLE BUSINESS PROFILE MANAGEMENT AGREEMENT", 9, bold, CYAN);
  gap(2);
  text(`Agreement ID ${d.agreementId}`, 8, font, GREY);
  gap(8);
  rule();

  // Parties
  text("Parties", 12, bold);
  gap(4);
  const kv = (k: string, v: string) => {
    ensure(14);
    page.drawText(k, { x: M, y: y - 10, size: 9, font: bold, color: GREY });
    const lines = wrap(v || "-", font, 10, A4.w - M * 2 - 150);
    lines.forEach((l, i) => {
      if (i > 0) ensure(14);
      page.drawText(l, { x: M + 150, y: y - 10, size: 10, font, color: NAVY });
      y -= 14;
    });
  };
  kv("Provider", `${COMPANY.legalName} (ABN ${COMPANY.abn}), ${COMPANY.email}`);
  gap(4);
  kv("Client", `${d.registeredBusinessName} (ABN ${d.abn})`);
  kv("Trading as", d.companyName);
  kv("Address", d.businessAddress);
  if (d.website) kv("Website", d.website);
  kv("Signatory", `${d.contactName}, ${d.contactRole}`);
  kv("Contact", `${d.email} · ${d.phone}`);
  gap(8);
  rule();

  // Commercials
  text("Commercial terms", 12, bold);
  gap(4);
  kv("Service", `${OFFER.name} (monthly)`);
  kv("Fee", `$${OFFER.priceMonthly}.00 per month inc GST (${OFFER.currency})`);
  kv("Minimum term", `${OFFER.minimumTermMonths} months from the start date ($${OFFER.priceMonthly * OFFER.minimumTermMonths} inc GST total)`);
  kv("Billing", "Monthly in advance. First payment on signing; Services start when it clears.");
  kv("After minimum term", `Month to month, ${OFFER.noticeDays} days' written notice either way.`);
  kv("Not included", "Website changes, paid advertising, photography (quoted separately).");
  gap(8);
  rule();

  // Scope
  text("Scope of services", 12, bold);
  gap(4);
  for (const item of SERVICE_SCOPE) {
    ensure(14);
    page.drawText("•", { x: M, y: y - 10, size: 10, font, color: CYAN });
    para(item, 10, font, NAVY, 14);
    gap(2);
  }
  if (d.suburbs || d.services) {
    gap(6);
    text("Client priorities (from sign-up)", 10, bold);
    gap(2);
    if (d.suburbs) para(`Suburbs: ${d.suburbs}`, 9.5, font, NAVY, 0);
    if (d.services) para(`Services: ${d.services}`, 9.5, font, NAVY, 0);
  }
  gap(8);
  rule();

  // Clauses
  text("Terms and conditions", 12, bold);
  gap(4);
  for (const c of AGREEMENT_CLAUSES) {
    ensure(40);
    text(c.title, 10, bold);
    para(c.body, 9.5, font, NAVY, 0, 2.5);
    gap(6);
  }
  gap(6);
  rule();

  // Signature block
  ensure(170);
  text("Execution", 12, bold);
  gap(4);
  para(
    `Signed electronically by the Client's authorised representative. By signing, the signatory confirms they have authority to bind the Client and agree to the terms above.`,
    9.5,
    font,
    GREY,
  );
  gap(10);

  const sigBytes = Buffer.from(d.signaturePngBase64, "base64");
  const sig = await doc.embedPng(sigBytes);
  const sigW = 220;
  const sigH = Math.min(80, (sig.height / sig.width) * sigW);
  ensure(sigH + 60);
  page.drawImage(sig, { x: M, y: y - sigH, width: sigW, height: sigH });
  page.drawLine({ start: { x: M, y: y - sigH - 4 }, end: { x: M + sigW + 40, y: y - sigH - 4 }, thickness: 0.8, color: NAVY });
  y -= sigH + 10;
  text(d.signerName, 11, bold);
  text(`${d.contactRole}, ${d.registeredBusinessName}`, 9, font, GREY);
  text(`Signed ${formatDate(d.signedAtISO)}`, 9, font, GREY);
  gap(12);

  text("Audit trail", 9, bold, GREY);
  para(`Agreement ID ${d.agreementId} · Signed at ${d.signedAtISO} (UTC) · IP ${d.ip} · ${d.userAgent}`, 7.5, font, GREY);

  // Footers
  const pages = doc.getPages();
  pages.forEach((p: PDFPage, i: number) => {
    p.drawText(`${COMPANY.tradingName} · ABN ${COMPANY.abn} · ${COMPANY.email}`, { x: M, y: 30, size: 7.5, font, color: GREY });
    p.drawText(`Page ${i + 1} of ${pages.length}`, { x: A4.w - M - 60, y: 30, size: 7.5, font, color: GREY });
  });
  void pageNo;

  return doc.save();
}

function wrap(s: string, font: PDFFont, size: number, maxW: number): string[] {
  const out: string[] = [];
  for (const rawLine of String(s).split(/\r?\n/)) {
    const words = rawLine.split(/\s+/).filter(Boolean);
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(test, size) <= maxW) line = test;
      else {
        if (line) out.push(line);
        line = w;
      }
    }
    out.push(line);
  }
  return out;
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-AU", { timeZone: "Australia/Brisbane", dateStyle: "long", timeStyle: "short" });
  } catch {
    return iso;
  }
}
