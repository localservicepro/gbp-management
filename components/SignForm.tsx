"use client";
import { useRef, useState } from "react";
import { useSubmit } from "./useSubmit";
import { COMPANY, OFFER } from "@/lib/config";

type Props = {
  c: string;
  t: string;
  defaultName: string;
  role: string;
  businessName: string;
  providerSig: boolean;
};

/**
 * Execution block: Provider slot (pre-signed) on the left, the client's slot
 * on the right IS the signature pad, so the place to sign is where the
 * printed name is. Name and consent sit underneath.
 */
export function SignForm({ c, t, defaultName, role, businessName, providerSig }: Props) {
  const { submit, busy, errors, error } = useSubmit("/api/sign");
  const [signerName, setSignerName] = useState(defaultName);
  const [agreed, setAgreed] = useState(false);
  const [hasInk, setHasInk] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  // Canvas is sized to its CSS box at device pixel ratio so the stroke is crisp in the PDF.
  function ctx() {
    const el = canvas.current!;
    const dpr = window.devicePixelRatio || 1;
    const w = el.clientWidth, h = el.clientHeight;
    if (el.width !== Math.round(w * dpr) || el.height !== Math.round(h * dpr)) {
      const img = hasInk ? el.toDataURL() : null;
      el.width = Math.round(w * dpr); el.height = Math.round(h * dpr);
      const c2 = el.getContext("2d")!;
      c2.scale(dpr, dpr);
      if (img) { const i = new Image(); i.onload = () => c2.drawImage(i, 0, 0, w, h); i.src = img; }
    }
    const c2 = el.getContext("2d")!;
    c2.lineWidth = 2.4; c2.lineCap = "round"; c2.lineJoin = "round"; c2.strokeStyle = "#0b1a3a";
    return c2;
  }
  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = canvas.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function down(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    canvas.current!.setPointerCapture(e.pointerId);
    drawing.current = true; last.current = pos(e);
    const c2 = ctx(); c2.beginPath(); c2.arc(last.current.x, last.current.y, 1.2, 0, Math.PI * 2); c2.fillStyle = "#0b1a3a"; c2.fill();
    setHasInk(true);
  }
  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || !last.current) return;
    const p = pos(e); const c2 = ctx();
    c2.beginPath(); c2.moveTo(last.current.x, last.current.y); c2.lineTo(p.x, p.y); c2.stroke();
    last.current = p;
  }
  function up() { drawing.current = false; last.current = null; }
  function clear() {
    const el = canvas.current!; el.getContext("2d")!.clearRect(0, 0, el.width, el.height); setHasInk(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clientErrors: Record<string, string> = {};
    if (!signerName.trim()) clientErrors.signerName = "Type your full name.";
    if (!hasInk) clientErrors.signature = "Sign in the box above your name.";
    if (!agreed) clientErrors.agreed = "Tick the box to agree.";
    const signature = hasInk ? canvas.current!.toDataURL("image/png") : "";
    await submit({ c, t, signerName: signerName.trim(), signature, agreed }, clientErrors);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="stack">
      <div className="sig-line">
        {/* Provider: already signed */}
        <div className="sig-col">
          <div className="sig-box static">
            {providerSig && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/${COMPANY.signatureFile}`} alt={`${COMPANY.signatory.name}'s signature`} className="provider-sig" />
            )}
          </div>
          <div className="slot"><b>{COMPANY.signatory.name}</b>{COMPANY.signatory.role}, {COMPANY.legalName}</div>
        </div>

        {/* Client: the slot is the pad */}
        <div className={"sig-col" + (errors.signature ? " bad" : "")}>
          <div className={"sig-box" + (hasInk ? " inked" : "")}>
            {!hasInk && <span className="sig-prompt">Sign here with your finger or mouse</span>}
            <canvas ref={canvas} className="sigpad" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={up} aria-label="Signature pad" />
            {hasInk && <button type="button" className="sig-clear" onClick={clear}>Clear</button>}
          </div>
          <div className="slot"><b>{signerName.trim() || defaultName}</b>{role}, {businessName}</div>
          {errors.signature && <span className="err">{errors.signature}</span>}
        </div>
      </div>

      <div className={errors.signerName ? "field bad" : "field"}>
        <label htmlFor="signerName">Full name of signatory <em>(as it should appear on the agreement)</em></label>
        <input id="signerName" value={signerName} onChange={(e) => setSignerName(e.target.value)} autoComplete="name" required />
        {errors.signerName && <span className="err">{errors.signerName}</span>}
      </div>

      <div className={errors.agreed ? "field bad" : "field"}>
        <label className="check">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <span>I have read the agreement above, I have authority to sign on behalf of the Client, and I agree to its terms including the ${OFFER.priceMonthly}/month fee and the {OFFER.minimumTermMonths}-month minimum term.</span>
        </label>
        {errors.agreed && <span className="err">{errors.agreed}</span>}
      </div>

      <div className="actions" style={{ marginTop: 4 }}>
        <button className="btn" type="submit" disabled={busy} style={{ padding: "16px 28px", fontSize: "1.05rem" }}>{busy ? "Preparing your agreement…" : "Sign and send my invoice"}</button>
        <span className="hint">A signed PDF copy is saved to your file. The first invoice is emailed straight after.</span>
      </div>
      {error && <div className="banner">{error}</div>}
    </form>
  );
}
