/**
 * Seed realistic FY 2024 dashboard data for a user email.
 * Completes onboarding and creates a company if missing.
 *
 * Usage:
 *   set SUPABASE_SERVICE_ROLE_KEY=...   (from Supabase → Settings → API)
 *   npx tsx scripts/seed-user-demo.ts pratikrughe.qlimwelt@gmail.com
 *
 * Prefer SQL (no service role needed):
 *   Run supabase/seed_demo_pratik.sql in the Supabase SQL Editor.
 *
 * Loads .env.local automatically when present.
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

async function main() {
  loadEnvLocal();

  const email = (process.argv[2] || "pratikrughe.qlimwelt@gmail.com").trim().toLowerCase();

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      "Missing SUPABASE_SERVICE_ROLE_KEY.\n" +
        "Add it to .env.local from Supabase → Project Settings → API → service_role.\n\n" +
        "Or run supabase/seed_demo_pratik.sql in the Supabase SQL Editor (no service role needed)."
    );
    process.exit(1);
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL (use https://tounuejaspxijqlobvuu.supabase.co).");
    process.exit(1);
  }

  const { ensureDemoWorkspaceForEmail } = await import("../src/services/carbon/seed-admin");

  console.log(`Bootstrapping demo workspace for ${email}…`);
  const result = await ensureDemoWorkspaceForEmail(email);
  console.log("Done:", result);
  console.log("Log in again — you should land on /dashboard/overview with charts.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
