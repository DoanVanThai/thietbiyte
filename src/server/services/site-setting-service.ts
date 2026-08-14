import { getSettings, saveSettings } from "@/lib/content-repository";
import { publicSiteSettingsInput } from "@/server/validation/settings";

export class SiteSettingService {
  async publicValues() {
    const settings = getSettings();
    return { companyName: settings.company, hotline: settings.hotline, email: settings.email, address: settings.address, zalo: settings.zalo, facebook: settings.facebook || "", logo: settings.logo };
  }

  async replacePublic(raw: unknown) {
    const values = publicSiteSettingsInput.parse(raw);
    return saveSettings({ company: values.companyName, hotline: values.hotline, email: values.email, address: values.address, zalo: values.zalo || "", facebook: values.facebook || "", logo: values.logo || "" });
  }
}

export const siteSettingService = new SiteSettingService();
