import type { PrismaClient } from "@/generated/prisma/client";
import { db } from "@/server/db";

export class SiteSettingRepository {
  constructor(private readonly client: PrismaClient = db) {}

  async publicValues() {
    const rows = await this.client.siteSetting.findMany({ where: { isPublic: true } });
    return Object.fromEntries(rows.map((row) => [row.key, row.value]));
  }

  async replacePublic(values: Record<string, unknown>) {
    return this.client.$transaction(Object.entries(values).map(([key, value]) => this.client.siteSetting.upsert({
      where: { key }, create: { key, value: value as never, isPublic: true }, update: { value: value as never, isPublic: true },
    })));
  }
}
