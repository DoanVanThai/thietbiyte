import { getEntities, getEntity, type TaxonomyEntity } from "@/lib/content-repository";

export type TaxonomyKind = "category" | "brand" | "specialty";

export class TaxonomyService {
  async list(kind: TaxonomyKind): Promise<TaxonomyEntity[]> {
    return getEntities(kind);
  }

  async get(kind: TaxonomyKind, slug: string) {
    return (await this.list(kind)).find((item) => item.slug === slug) ?? getEntity(kind, slug);
  }
}

export const taxonomyService = new TaxonomyService();
