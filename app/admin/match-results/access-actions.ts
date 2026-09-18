"use server"

import { hasAdminAccess, unlockAdminAccess } from "@/lib/admin-access"

export async function checkAdminAccess() {
  return hasAdminAccess()
}

export async function unlockAdmin(input: string) {
  return unlockAdminAccess(input)
}
