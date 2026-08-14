export const resolveCsrfOrigin = (
  requestUrl: URL,
  site: URL | undefined,
  headers?: Pick<Headers, "get">,
  production = process.env.NODE_ENV === "production",
) => {
  const forwardedProto = headers?.get("x-forwarded-proto")?.split(",", 1)[0]?.trim().toLowerCase();
  const forwardedHost = headers?.get("x-forwarded-host")?.split(",", 1)[0]?.trim() || headers?.get("host")?.trim();

  if ((forwardedProto === "http" || forwardedProto === "https") && forwardedHost && !/[\\/]/.test(forwardedHost)) {
    try {
      return new URL(`${forwardedProto}://${forwardedHost}`).origin;
    } catch {
      // Fall through to the configured site or direct request origin.
    }
  }

  return production ? site?.origin ?? requestUrl.origin : requestUrl.origin;
};
