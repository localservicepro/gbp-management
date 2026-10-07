"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Result = { next?: string; errors?: Record<string, string>; error?: string };

/** Posts JSON to an API route; on `next` it navigates, on 422 it surfaces field errors. */
export function useSubmit(path: string) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  async function submit(body: unknown, clientErrors?: Record<string, string>) {
    setError("");
    if (clientErrors && Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      return false;
    }
    setErrors({});
    setBusy(true);
    try {
      const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data: Result = await res.json().catch(() => ({}));
      if (res.ok && data.next) {
        router.push(data.next);
        return true;
      }
      if (data.errors) setErrors(data.errors);
      else setError(data.error || "Something went wrong. Try again in a moment.");
      setBusy(false);
      return false;
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setBusy(false);
      return false;
    }
  }

  return { submit, busy, errors, error };
}
