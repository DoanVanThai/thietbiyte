import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { solutionProfile, solutionSlug } from "../../src/lib/solutions";

test("solution links navigate to a real solution detail route", async () => {
  const homepage = await readFile(new URL("../../src/pages/index.astro", import.meta.url), "utf8");
  const specialty = await readFile(new URL("../../src/components/MedicalSpecialtyPage.astro", import.meta.url), "utf8");
  assert.match(homepage, /href={`\/giai-phap\/\$\{solutionSlug\(title\)\}`}/);
  assert.match(specialty, /href={`\/giai-phap\/\$\{solutionSlug\(title\)\}`}/);
  assert.doesNotMatch(homepage, /\?solution=.*#contact/);
});

test("Vietnamese solution names produce stable readable slugs", () => {
  assert.equal(solutionSlug("Phòng khám Sản phụ khoa"), "phong-kham-san-phu-khoa");
  assert.equal(solutionSlug("Bệnh viện thú y"), "benh-vien-thu-y");
});

test("solution profiles map to relevant product filters and consultation paths", () => {
  const laboratory = solutionProfile("Phòng xét nghiệm");
  const veterinary = solutionProfile("Bệnh viện thú y");
  assert.equal(laboratory.catalogHref, "/san-pham?category=xet-nghiem");
  assert.equal(veterinary.catalogHref, "/thu-y");
  assert.match(laboratory.overview, /công suất mẫu/i);
});
