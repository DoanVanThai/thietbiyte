import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword, hashToken, passwordPolicyError, randomToken, verifyPassword } from "../../src/server/auth/crypto";

test("password hashes use a salted one-way representation", async () => {
  const password = "ThienLoc@2026";
  const first = await hashPassword(password);
  const second = await hashPassword(password);
  assert.match(first, /^scrypt\$/);
  assert.notEqual(first, second);
  assert.equal(first.includes(password), false);
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword("wrong-password", first), false);
});

test("password policy is explicit and bounded", () => {
  assert.match(passwordPolicyError("short1!") || "", /10/);
  assert.match(passwordPolicyError("onlyletterslong") || "", /chữ số/);
  assert.equal(passwordPolicyError("StrongPass@2026"), null);
  assert.match(passwordPolicyError(`A1!${"x".repeat(126)}`) || "", /128/);
});

test("reset and session tokens are random and stored by digest", () => {
  const first = randomToken();
  const second = randomToken();
  assert.notEqual(first, second);
  assert.ok(first.length >= 40);
  assert.notEqual(hashToken(first), first);
  assert.equal(hashToken(first), hashToken(first));
});
