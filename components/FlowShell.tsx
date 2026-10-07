import Link from "next/link";
import { COMPANY, OFFER } from "@/lib/config";

const STEPS = [
  { n: "01", label: "Your details", sub: "Name, business, contact" },
  { n: "02", label: "Business details", sub: "Legal name, ABN, address" },
  { n: "03", label: "Agreement", sub: "Read and sign on screen" },
  { n: "04", label: "Invoice", sub: "First month by email" },
];

/**
 * Full-page split layout for the sign-up flow: fixed brand rail with the
 * progress stepper and order summary on the left, the working area on the right.
 */
export function FlowShell({ current, title, intro, children, wide }: { current: number; title: string; intro?: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="flow-shell">
      <aside className="rail">
        <Link className="brand" href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/lsp-logo.png" alt="Local Service Pro" />
        </Link>

        <ol className="stepper" aria-label="Sign-up progress">
          {STEPS.map((s, i) => (
            <li key={s.n} className={i < current ? "done" : i === current ? "on" : ""} aria-current={i === current ? "step" : undefined}>
              <span className="dot">{i < current ? "✓" : s.n}</span>
              <span>
                <b>{s.label}</b>
                <small>{s.sub}</small>
              </span>
            </li>
          ))}
        </ol>

        <div className="summary">
          <div className="eyebrow">Your order</div>
          <div className="line"><span>{OFFER.name}</span><b>${OFFER.priceMonthly}<small>/mo</small></b></div>
          <div className="line muted"><span>Includes GST</span><span>Yes</span></div>
          <div className="line muted"><span>Minimum term</span><span>{OFFER.minimumTermMonths} months</span></div>
          <div className="line muted"><span>Setup fee</span><span>None</span></div>
          <div className="line muted"><span>Due today</span><span>Nothing until you sign</span></div>
        </div>

        <div className="rail-foot">
          <div>Questions? <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></div>
          <div>ABN {COMPANY.abn}</div>
        </div>
      </aside>

      <main className={wide ? "stage wide" : "stage"}>
        <div className="stage-head">
          <div className="eyebrow">Step {STEPS[current].n} of 04</div>
          <h1>{title}</h1>
          {intro && <p className="muted">{intro}</p>}
        </div>
        {children}
      </main>
    </div>
  );
}
