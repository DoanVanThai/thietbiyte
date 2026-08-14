import type { AuthPrincipal, Permission } from "./permissions";
import { isSuperAdmin } from "./permissions";

export const canModifyRole = (_actor: AuthPrincipal, role: { id: string; immutable: boolean }) => role.id !== "super-admin" && !role.immutable;
export const canManageTargetUser = (actor: AuthPrincipal, targetRoleIds: string[]) => !targetRoleIds.includes("super-admin") || isSuperAdmin(actor);
export const validatePermissionIds = (values: unknown, allowed: readonly Permission[]) => Array.isArray(values) && values.every((value) => typeof value === "string" && allowed.includes(value as Permission));
