import assert from "node:assert/strict";
import test from "node:test";
import { resolveCsrfOrigin } from "../../src/server/auth/csrf";

test("production CSRF checks use forwarded HTTPS and host behind a reverse proxy", () => {
  const internalRequestUrl = new URL("http://thienloc.haynuoitoi.online/api/auth/login");
  const publicSite = new URL("https://thienloc.haynuoitoi.online");
  const proxyHeaders = new Headers({
    host: "thienloc.haynuoitoi.online",
    "x-forwarded-proto": "https",
  });

  assert.equal(resolveCsrfOrigin(internalRequestUrl, publicSite, proxyHeaders, true), publicSite.origin);
});

test("development CSRF checks keep using the current local request origin", () => {
  const localRequestUrl = new URL("http://localhost:4321/api/auth/login");
  const publicSite = new URL("https://thienloc.haynuoitoi.online");

  assert.equal(resolveCsrfOrigin(localRequestUrl, publicSite, undefined, false), localRequestUrl.origin);
});

test("production CSRF checks fall back to the request origin when site is absent", () => {
  const requestUrl = new URL("http://localhost:4321/api/auth/login");

  assert.equal(resolveCsrfOrigin(requestUrl, undefined, undefined, true), requestUrl.origin);
});

test("CSRF origin ignores malformed forwarded hosts", () => {
  const requestUrl = new URL("http://localhost:4321/api/auth/login");
  const publicSite = new URL("https://thienloc.haynuoitoi.online");
  const malformedHeaders = new Headers({
    host: "example.com/path",
    "x-forwarded-proto": "https",
  });

  assert.equal(resolveCsrfOrigin(requestUrl, publicSite, malformedHeaders, true), publicSite.origin);
});
