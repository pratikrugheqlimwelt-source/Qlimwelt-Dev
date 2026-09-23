/**
 * Seed realistic FY 2024 dashboard data for a user email.
 *
 * Usage:
 *   set SUPABASE_SERVICE_ROLE_KEY=...   (from Supabase → Settings → API)
 *   npx tsx scripts/seed-user-demo.ts pratikrughe.qlimwelt@gmail.com
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
        "Add it to .env.local from Supabase → Project Settings → API → service_role."
    );
    process.exit(1);
  }

  const { findCompanyIdByEmail, seedCompanyDemoAdmin } = await import(
    "../src/services/carbon/seed-admin"
  );

  console.log(`Looking up company for ${email}…`);
  const companyId = await findCompanyIdByEmail(email);
  if (!companyId) {
    console.error(
      `No company found for ${email}. Sign in once and finish onboarding, then re-run.`
    );
    process.exit(1);
  }

  console.log(`Seeding company ${companyId}…`);
  const result = await seedCompanyDemoAdmin(companyId);
  console.log("Done:", result);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
