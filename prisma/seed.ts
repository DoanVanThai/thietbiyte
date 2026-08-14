import "dotenv/config";
import { randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { defaultRoles, permissionCatalog } from "../src/server/auth/catalog";
import { hashPassword } from "../src/server/auth/crypto";
import { seedProductionData } from "./seed-production-data";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required to seed authentication data.");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const adminEmail = process.env.ADMIN_EMAIL?.trim().toLocaleLowerCase("en-US") || "superadmin@thienlocgroup.com";
const demoUsers = [
  ["u001", adminEmail, "Nguyễn Minh Anh", "super-admin"],
  ["u002", "admin@thienlocgroup.com", "Trần Quốc Huy", "admin"],
  ["u003", "sales.manager@thienlocgroup.com", "Lê Thanh Hà", "sales-manager"],
  ["u004", "product@thienlocgroup.com", "Phạm Gia Bảo", "product-manager"],
  ["u005", "content@thienlocgroup.com", "Vũ Khánh Linh", "content-editor"],
  ["u006", "technical@thienlocgroup.com", "Đỗ Hoàng Nam", "technical-staff"],
  ["u009", "sales@thienlocgroup.com", "Nguyễn Hoàng Sơn", "sales-staff"],
  ["u007", "customer@example.com", "BS. Nguyễn Hải Yến", "customer"],
] as const;

async function main() {
  for (const permission of permissionCatalog) await db.permission.upsert({ where: { id: permission.id }, update: permission, create: permission });
  for (const role of defaultRoles) {
    await db.role.upsert({
      where: { id: role.id },
      update: { name: role.name, description: role.description, protected: role.protected || false, immutable: role.immutable || false, isDefault: true },
      create: { id: role.id, name: role.name, description: role.description, protected: role.protected || false, immutable: role.immutable || false, isDefault: true },
    });
    await db.rolePermission.deleteMany({ where: { roleId: role.id } });
    await db.rolePermission.createMany({ data: role.permissions.map((permissionId) => ({ roleId: role.id, permissionId })) });
  }
  const generatedPassword = `${randomBytes(18).toString("base64url")}!8a`;
  for (const [id, email, name, roleId] of demoUsers) {
    const configuredPassword = roleId === "super-admin" ? process.env.ADMIN_PASSWORD || process.env.SEED_DEMO_PASSWORD : process.env.SEED_DEMO_PASSWORD;
    const passwordHash = await hashPassword(configuredPassword || generatedPassword);
    await db.user.upsert({
      where: { email },
      update: { name, status: "ACTIVE", emailVerifiedAt: new Date(), ...(configuredPassword ? { passwordHash, securityVersion: { increment: 1 } } : {}), roles: { deleteMany: {}, create: { roleId } } },
      create: { id, email, name, passwordHash, phone: "0902 137 158", organization: roleId === "customer" ? "Phòng khám Minh Tâm" : "THIÊN LỘC GROUP", organizationType: roleId === "customer" ? "Phòng khám" : "Nội bộ", customerType: roleId === "customer" ? "clinic" : null, province: "TP. Hồ Chí Minh", status: "ACTIVE", emailVerifiedAt: new Date(), roles: { create: { roleId } } },
    });
  }
  await seedProductionData(db);
  const customerUser = await db.user.findUnique({ where: { email: "customer@example.com" } });
  if (customerUser) {
    const organization = await db.organization.upsert({ where: { taxCode: "DEV-MINH-TAM" }, create: { name: "Phòng khám Minh Tâm", taxCode: "DEV-MINH-TAM", city: "TP. Hồ Chí Minh" }, update: {} });
    await db.customer.upsert({
      where: { userId: customerUser.id },
      create: { userId: customerUser.id, organizationId: organization.id, type: "CLINIC", name: customerUser.name, email: customerUser.email, phone: customerUser.phone || "0902 137 158", city: "TP. Hồ Chí Minh" },
      update: { organizationId: organization.id, name: customerUser.name, email: customerUser.email },
    });
  }
}

main().finally(() => db.$disconnect());
