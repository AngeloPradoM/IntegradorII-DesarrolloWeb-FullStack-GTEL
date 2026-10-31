import assert from "node:assert/strict";
import { test } from "node:test";
import { getSafeAuthRedirect } from "../src/utils/auth.js";

test("preserves the application route when returning from login", () => {
  assert.equal(getSafeAuthRedirect("/postular/42"), "/postular/42");
  assert.equal(getSafeAuthRedirect("/postular/job-42"), "/postular/job-42");
  assert.equal(getSafeAuthRedirect("/postulacion/42"), null);
  assert.equal(getSafeAuthRedirect("//example.test"), null);
});
