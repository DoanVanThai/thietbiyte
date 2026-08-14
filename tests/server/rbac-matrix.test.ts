import assert from "node:assert/strict";
import test from "node:test";
import type { APIContext } from "astro";
import { canModifyRole, canManageTargetUser, validatePermissionIds } from "../../src/server/auth/admin-policy";
import { defaultRoles } from "../../src/server/auth/catalog";
import { isResponse, requireCustomer, requirePermission } from "../../src/server/auth/http";
import { can, isCustomerOnly, isStaff, PERMISSIONS, type AuthPrincipal } from "../../src/server/auth/permissions";

const principal = (roleId: string): AuthPrincipal => {
  const role = defaultRoles.find((candidate) => candidate.id === roleId);
  if (!role) throw new Error(`Unknown role ${roleId}`);
  return {
    id: `user-${roleId}`,
    email: `${roleId}@example.com`,
    name: role.name,
    status: "ACTIVE",
    roleIds: [role.id],
    permissions: [...role.permissions],
    sessionId: `session-${roleId}`,
  };
};

const contextFor = (auth: AuthPrincipal | null) => ({ locals: { auth } }) as unknown as APIContext;

test("guest, customer and staff area boundaries are separate", () => {
  const customer = principal("customer");
  const sales = principal("sales-staff");
  assert.equal(isCustomerOnly(customer), true);
  assert.equal(isStaff(customer), false);
  assert.equal(isCustomerOnly(sales), false);
  assert.equal(isStaff(sales), true);
  assert.equal((requireCustomer(contextFor(null)) as Response).status, 401);
  assert.equal(isResponse(requireCustomer(contextFor(customer))), false);
  assert.equal((requireCustomer(contextFor(sales)) as Response).status, 403);
});

test("direct API permission guard returns 401, 403 or an actor", () => {
  assert.equal((requirePermission(contextFor(null), "product.edit") as Response).status, 401);
  assert.equal((requirePermission(contextFor(principal("customer")), "product.edit") as Response).status, 403);
  assert.equal((requirePermission(contextFor(principal("sales-staff")), "lead.assign") as Response).status, 403);
  assert.equal(isResponse(requirePermission(contextFor(principal("sales-staff")), "lead.edit")), false);
  assert.equal(isResponse(requirePermission(contextFor(principal("product-manager")), "product.publish")), false);
});

test("default role matrix matches business boundaries", () => {
  const expected: Record<string, { allow: typeof PERMISSIONS[number][]; deny: typeof PERMISSIONS[number][] }> = {
    customer: { allow: ["product.view", "document.view"], deny: ["product.edit", "quote.view", "user.view"] },
    "sales-staff": { allow: ["quote.view", "quote.edit", "lead.view", "lead.edit", "customer.edit"], deny: ["quote.assign", "lead.assign", "product.edit", "user.view"] },
    "sales-manager": { allow: ["quote.assign", "lead.assign", "customer.edit", "user.view", "analytics.view"], deny: ["user.manage", "role.manage", "product.edit"] },
    "product-manager": { allow: ["product.create", "product.edit", "product.publish", "category.manage", "brand.manage", "document.manage"], deny: ["lead.view", "quote.edit", "user.manage"] },
    "content-editor": { allow: ["article.view", "article.manage", "article.publish", "product.view"], deny: ["product.edit", "document.manage", "user.view"] },
    "technical-staff": { allow: ["product.edit", "document.manage", "project.edit", "inventory.view"], deny: ["product.publish", "inventory.manage", "user.manage"] },
    admin: { allow: ["product.delete", "quote.assign", "user.manage", "role.manage", "audit.view"], deny: ["settings.manage"] },
    "super-admin": { allow: [...PERMISSIONS], deny: [] },
  };
  for (const [roleId, checks] of Object.entries(expected)) {
    const actor = principal(roleId);
    for (const permission of checks.allow) assert.equal(can(actor, permission), true, `${roleId} should allow ${permission}`);
    for (const permission of checks.deny) assert.equal(can(actor, permission), false, `${roleId} should deny ${permission}`);
  }
});

test("immutable roles and Super Admin targets are protected", () => {
  const superAdmin = principal("super-admin");
  const admin = principal("admin");
  assert.equal(canModifyRole(superAdmin, { id: "super-admin", immutable: true }), false);
  assert.equal(canModifyRole(superAdmin, { id: "system-role", immutable: true }), false);
  assert.equal(canModifyRole(admin, { id: "custom-sales", immutable: false }), true);
  assert.equal(canManageTargetUser(admin, ["super-admin"]), false);
  assert.equal(canManageTargetUser(superAdmin, ["super-admin"]), true);
});

test("only known granular permission identifiers are accepted", () => {
  assert.equal(validatePermissionIds(["product.view", "quote.assign"], PERMISSIONS), true);
  assert.equal(validatePermissionIds(["product.view", "root.everything"], PERMISSIONS), false);
  assert.equal(validatePermissionIds("product.view", PERMISSIONS), false);
});
