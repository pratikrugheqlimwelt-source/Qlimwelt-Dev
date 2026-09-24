/**
 * PACT V3 Phase 3b — OpenAPI pin, schema validator, URN helpers.
 * Run: npm run test:bom:pact:3b
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertUrn,
  buildCompanyUrn,
  buildCustomProductUrn,
  buildGtinProductUrn,
  normalizeUrnList,
  parsePactUrn,
  parseProductFootprint,
  PACT_OPENAPI_VERSION,
  validateProductFootprintSchema,
} from "./index";

const here = dirname(fileURLToPath(import.meta.url));

assert.equal(PACT_OPENAPI_VERSION, "3.0.3");

const valid = JSON.parse(
  readFileSync(join(here, "fixtures/product-footprint-valid.json"), "utf8")
);
const invalid = JSON.parse(
  readFileSync(join(here, "fixtures/product-footprint-invalid.json"), "utf8")
);

const ok = validateProductFootprintSchema(valid);
assert.equal(ok.ok, true, `expected valid fixture: ${JSON.stringify(ok.issues)}`);

const parsed = parseProductFootprint(valid);
assert.equal(parsed.ok, true);
if (parsed.ok) {
  assert.equal(parsed.value.pcf.declaredUnitOfMeasurement, "piece");
  assert.equal(parsed.value.pcf.pcfExcludingBiogenicUptake, "1.234");
}

const bad = validateProductFootprintSchema(invalid);
assert.equal(bad.ok, false);
assert.ok(bad.issues.length >= 1);
assert.ok(bad.issues.every((i) => i.category === "SCHEMA_INVALID"));

const empty = validateProductFootprintSchema({});
assert.equal(empty.ok, false);
assert.equal(empty.issues[0]?.category, "SCHEMA_INVALID");

const productUrn = buildCustomProductUrn("qlimwelt", "PN-100");
const companyUrn = buildCompanyUrn("custom", "acme");
const gtinUrn = buildGtinProductUrn("04012345678905");
assert.equal(parsePactUrn(productUrn).kind, "product");
assert.equal(parsePactUrn(companyUrn).kind, "company");
assert.ok(gtinUrn.includes(":gtin:"));
assert.equal(assertUrn(productUrn), productUrn);
assert.deepEqual(normalizeUrnList([productUrn, productUrn, companyUrn]), [
  productUrn,
  companyUrn,
]);

console.log("pact-3b.test.ts: all assertions passed");
