import assert from "node:assert/strict";
import test from "node:test";
import { getPublicUploadPath, publicUploadUrl } from "../../src/server/uploads/public-upload-storage";

test("public upload storage accepts generated flat filenames", () => {
  const path = getPublicUploadPath("1786692454257-59d2657e.webp");
  assert.ok(path?.endsWith("var/uploads/public/1786692454257-59d2657e.webp"));
  assert.equal(publicUploadUrl("1786692454257-59d2657e.webp"), "/uploads/1786692454257-59d2657e.webp");
});

test("public upload storage rejects traversal and nested paths", () => {
  assert.equal(getPublicUploadPath("../secret.webp"), null);
  assert.equal(getPublicUploadPath("folder/image.webp"), null);
  assert.equal(getPublicUploadPath("image name.webp"), null);
});
