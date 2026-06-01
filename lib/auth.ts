// 単一ユーザー向けの軽量認証。HMAC 署名付き HTTP-only クッキー。
// Edge(middleware) と Node の両方で動くよう Web Crypto を使用する。

export const SESSION_COOKIE = "fe_session";
const SESSION_VERSION = "v1";

function secretKey(): string {
  return process.env.AUTH_SECRET || process.env.APP_PASSPHRASE || "";
}

/** APP_PASSPHRASE 未設定なら認証は無効（誰でもアクセス可）。初回デプロイの利便のため。 */
export function isAuthDisabled(): boolean {
  return !process.env.APP_PASSPHRASE;
}

export function checkPassphrase(input: string): boolean {
  const pass = process.env.APP_PASSPHRASE || "";
  if (!pass) return true;
  return timingSafeEqual(input, pass);
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secretKey()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return toBase64Url(new Uint8Array(sig));
}

/** ログイン成功時に発行するトークン。 */
export async function createSessionToken(): Promise<string> {
  const payload = `${SESSION_VERSION}.${Date.now()}`;
  const sig = await hmac(payload);
  return `${payload}.${sig}`;
}

/** クッキー値の検証。 */
export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (isAuthDisabled()) return true;
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [version, ts, sig] = parts;
  if (version !== SESSION_VERSION) return false;
  const expected = await hmac(`${version}.${ts}`);
  return timingSafeEqual(sig, expected);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
