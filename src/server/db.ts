import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalDatabase = globalThis as typeof globalThis & { thienLocDb?: PrismaClient };
export const databaseConfigured = Boolean(process.env.DATABASE_URL);

const createClient = () => {
  const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/thienlocmedical";
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
};

export const db = globalDatabase.thienLocDb || createClient();
if (process.env.NODE_ENV !== "production") globalDatabase.thienLocDb = db;
