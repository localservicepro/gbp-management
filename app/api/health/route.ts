// Config self-check: GET /api/health reports whether the env vars are set and the
// PIT token can reach the sub-account. Never echoes the token itself.
import { NextResponse } from "next/server";
import { ghl, GhlError } from "@/lib/ghl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const env = {
    GHL_PIT_TOKEN: !!process.env.GHL_PIT_TOKEN,
    GHL_LOCATION_ID: !!process.env.GHL_LOCATION_ID,
    GHL_USER_ID: !!process.env.GHL_USER_ID,
    APP_SECRET: !!process.env.APP_SECRET,
  };
  const checks: Record<string, string> = {};

  if (env.GHL_PIT_TOKEN && env.GHL_LOCATION_ID) {
    const loc = process.env.GHL_LOCATION_ID!;
    const probe = async (name: string, path: string) => {
      try {
        await ghl("GET", path);
        checks[name] = "ok";
      } catch (e) {
        checks[name] = e instanceof GhlError ? `HTTP ${e.status}: ${e.body.slice(0, 160)}` : String(e);
      }
    };
    await probe("customFields (locations/customFields.readonly)", `/locations/${loc}/customFields?model=contact`);
    await probe("contacts (contacts.readonly)", `/contacts/?locationId=${loc}&limit=1`);
    await probe("invoices (invoices.readonly)", `/invoices/?altId=${loc}&altType=location&limit=1&offset=0`);
    await probe("recurring invoices (invoices/schedule.readonly)", `/invoices/schedule?altId=${loc}&altType=location&limit=1&offset=0`);
    if (!env.GHL_USER_ID) await probe("users (users.readonly, needed because GHL_USER_ID is unset)", `/users/?locationId=${loc}`);
  }

  const ok = env.GHL_PIT_TOKEN && env.GHL_LOCATION_ID && Object.values(checks).every((v) => v === "ok");
  return NextResponse.json({ ok, env, checks }, { status: ok ? 200 : 503 });
}
