import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) => readFile(new URL(`../../${path}`, import.meta.url), "utf8");

test("login accepts existing passwords without applying the new-password policy", async () => {
  const [loginPage, passwordField] = await Promise.all([
    read("src/pages/dang-nhap.astro"),
    read("src/components/PasswordField.astro"),
  ]);

  assert.match(loginPage, /autocomplete="current-password" minLength=\{1\}/);
  assert.match(passwordField, /minLength = 10/);
  assert.match(passwordField, /minlength=\{minLength\}/);
});
