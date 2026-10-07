import Link from "next/link";
import { COMPANY } from "@/lib/config";

export function TopBar() {
  return (
    <div className="bar">
      <Link className="brand" href="/">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/lsp-logo.png" alt="Local Service Pro" />
        <span className="sub">Google Business Profile management</span>
      </Link>
      <div className="help">
        Need a hand? <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <footer>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/lsp-logo.png" alt="Local Service Pro" />
      <div>
        ABN {COMPANY.abn} · {COMPANY.email} · {COMPANY.address}.
      </div>
    </footer>
  );
}

const STEPS = ["01 YOUR DETAILS", "02 BUSINESS DETAILS", "03 SIGN AGREEMENT", "04 INVOICE SENT"];

export function Steps({ current }: { current: number }) {
  return (
    <div className="steps" aria-label="Sign-up progress">
      {STEPS.map((s, i) => (
        <span key={s} className={i < current ? "done" : i === current ? "on" : ""}>
          {s}
        </span>
      ))}
    </div>
  );
}
