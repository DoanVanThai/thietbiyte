import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { hasExecutableMagic } from "../../src/server/validation/attachment";
import { defaultRoles } from "../../src/server/auth/catalog";

test("quote attachments reject common executable signatures", () => {
  assert.equal(hasExecutableMagic(Uint8Array.from([0x4d, 0x5a, 0x90, 0x00])), true);
  assert.equal(hasExecutableMagic(Uint8Array.from([0x7f, 0x45, 0x4c, 0x46])), true);
  assert.equal(hasExecutableMagic(Uint8Array.from([0xcf, 0xfa, 0xed, 0xfe])), true);
  assert.equal(hasExecutableMagic(Uint8Array.from([0x25, 0x50, 0x44, 0x46])), false);
});

test("sales roles keep assignment permissions manager-only", () => {
  const manager = defaultRoles.find((role) => role.id === "sales-manager")!;
  const staff = defaultRoles.find((role) => role.id === "sales-staff")!;
  for (const permission of ["quote.assign", "lead.assign"]) {
    assert.equal(manager.permissions.includes(permission as never), true);
    assert.equal(staff.permissions.includes(permission as never), false);
  }
  for (const permission of ["quote.view", "quote.edit", "lead.view", "lead.edit", "customer.view"]) {
    assert.equal(staff.permissions.includes(permission as never), true);
  }
});

test("customer quote API maps an explicit public DTO", async () => {
  const source = await readFile(new URL("../../src/pages/api/portal/quotes/[id].ts", import.meta.url), "utf8");
  assert.match(source, /customerUpdates\.map/);
  assert.match(source, /documents: \{ where: \{ access: "CUSTOMER" \} \}/);
  assert.doesNotMatch(source, /internalNotes/);
});

test("notification foundation records pending unconfigured delivery", async () => {
  const source = await readFile(new URL("../../src/server/repositories/quote-repository.ts", import.meta.url), "utf8");
  assert.match(source, /eventType: "QUOTE_RECEIVED"/);
  assert.match(source, /channel: "UNCONFIGURED", status: "PENDING"/);
  assert.match(source, /customerLink/);
  assert.match(source, /quote_public_number_seq/);
});
