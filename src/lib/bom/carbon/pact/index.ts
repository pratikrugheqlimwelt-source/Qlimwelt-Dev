/** PACT V3 adapter — Phase 3a types + local stubs; mapper/validator in 3b+. */

export * from "./types";
export * from "./store";
export * from "./identity/urn";
export * from "./identity/mapping-service";
export * from "./exchange/service";
export { validateProductFootprintSchema } from "./validator/schema";
export {
  validateExportSemantics,
  validateImportSemantics,
} from "./validator/semantic";
export { toProductFootprint } from "./mapper/to-product-footprint";
export { fromProductFootprint } from "./mapper/from-product-footprint";
