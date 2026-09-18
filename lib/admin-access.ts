import "server-only"

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"

const COOKIE_NAME = "admin_match_session"
const SESSION_SECONDS = 8 * 60 * 60

function equal(a: string, b: string) {
  return timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest())
}

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(`admin-match-session:${payload}`).digest("hex")
}

export async function hasAdminAccess(): Promise<boolean> {
  const secret = process.env.ADMIN_MATCH_ENTRY_SECRET
  if (!secret) return false
  const token = (await cookies()).get(COOKIE_NAME)?.value
  if (!token) return false
  const parts = token.split(".")
  if (parts.length !== 3) return false
  const [expires, nonce, signed] = parts
  if (!/^\d+$/.test(expires) || !/^[a-f0-9]{32}$/.test(nonce) || !/^[a-f0-9]{64}$/.test(signed)) return false
  if (Number(expires) <= Math.floor(Date.now() / 1000)) return false
  return equal(signed, signature(`${expires}.${nonce}`, secret))
}

export async function unlockAdminAccess(input: string): Promise<boolean> {
  const secret = process.env.ADMIN_MATCH_ENTRY_SECRET
  if (!secret || typeof input !== "string" || input.length > 1024 || !equal(input, secret)) return false
  const payload = `${Math.floor(Date.now() / 1000) + SESSION_SECONDS}.${randomBytes(16).toString("hex")}`
  const cookieStore = await cookies()
  // Le cookie contient une preuve signée et expirante, jamais le code d'accès.
  cookieStore.set(COOKIE_NAME, `${payload}.${signature(payload, secret)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: SESSION_SECONDS,
  })
  return true
}
