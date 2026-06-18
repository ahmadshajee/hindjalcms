const SECRET_KEY_STR = process.env.JWT_SECRET || "fallback-secret-key-at-least-32-chars-long";

function textEncode(str: string) {
  return new TextEncoder().encode(str);
}

export async function signSession(payload: Record<string, any>): Promise<string> {
  const dataStr = JSON.stringify(payload);
  const key = await crypto.subtle.importKey(
    "raw",
    textEncode(SECRET_KEY_STR),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, textEncode(dataStr));
  const signatureHex = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const base64Data = btoa(dataStr);
  return `${base64Data}.${signatureHex}`;
}

export async function verifySession(token: string): Promise<Record<string, any> | null> {
  try {
    const decodedToken = decodeURIComponent(token);
    const [base64Data, signature] = decodedToken.split(".");
    if (!base64Data || !signature) return null;
    const dataStr = atob(base64Data);
    const key = await crypto.subtle.importKey(
      "raw",
      textEncode(SECRET_KEY_STR),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign("HMAC", key, textEncode(dataStr));
    const expectedSignatureHex = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (signature !== expectedSignatureHex) return null;
    const payload = JSON.parse(dataStr);
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
