import { z } from "zod";

export const publicSiteSettingsInput = z.object({
  companyName: z.string().trim().min(2).max(200),
  hotline: z.string().trim().min(6).max(40),
  email: z.email(),
  address: z.string().trim().min(5).max(500),
  zalo: z.string().trim().max(2048).optional(),
  facebook: z.string().trim().max(2048).optional(),
  logo: z.string().trim().max(2048).optional(),
});

export type PublicSiteSettings = z.infer<typeof publicSiteSettingsInput>;

const imagePath = z.string().trim().min(1).max(2048);
export const adminSiteContentBundleInput = z.object({
  settings: z.object({
    company: z.string().trim().min(2).max(200), logo: imagePath,
    hotline: z.string().trim().min(6).max(40), email: z.email(), address: z.string().trim().max(500),
    zalo: z.string().trim().max(2048), facebook: z.string().trim().max(2048),
  }),
  content: z.object({
    "homepage.hero": z.object({
      eyebrow: z.string().trim().max(120), title: z.string().trim().min(2).max(240), description: z.string().trim().min(2).max(600), image: imagePath,
      primaryCta: z.object({ label: z.string().trim().min(1).max(80), href: z.string().trim().min(1).max(500) }),
      secondaryCta: z.object({ label: z.string().trim().min(1).max(80), href: z.string().trim().min(1).max(500) }),
    }),
    "homepage.solutions": z.array(z.tuple([z.string().trim().min(1).max(100), z.string().trim().min(1).max(220), imagePath])).max(12),
    "homepage.projects": z.array(z.object({ title: z.string().trim().min(1).max(160), location: z.string().trim().max(160), equipment: z.string().trim().max(240), time: z.string().trim().max(160), image: imagePath })).max(20),
    "homepage.trust": z.array(z.tuple([z.string().trim().min(1).max(80), z.string().trim().min(1).max(160)])).max(20),
    "homepage.reasons": z.array(z.tuple([z.string().trim().min(1).max(160), z.string().trim().min(1).max(360)])).max(20),
  }),
});

export type AdminSiteContentBundle = z.infer<typeof adminSiteContentBundleInput>;
