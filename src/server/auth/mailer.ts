type AuthMail = { to: string; type: "verify" | "reset"; url: string };

export async function sendAuthMail(message: AuthMail) {
  const endpoint = process.env.EMAIL_DELIVERY_WEBHOOK_URL;
  if (!endpoint) {
    if (process.env.NODE_ENV === "production") throw new Error("EMAIL_DELIVERY_WEBHOOK_URL is required in production.");
    return false;
  }
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", ...(process.env.EMAIL_DELIVERY_WEBHOOK_SECRET ? { authorization: `Bearer ${process.env.EMAIL_DELIVERY_WEBHOOK_SECRET}` } : {}) },
    body: JSON.stringify(message),
  });
  if (!response.ok) throw new Error(`Email delivery failed with status ${response.status}.`);
  return true;
}

