"use client"

import { useEffect, useState } from "react"
import { checkAdminAccess, unlockAdmin } from "@/app/admin/match-results/access-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function AccessGate({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [secretInput, setSecretInput] = useState("")
  const [error, setError] = useState("")
  const [mounted, setMounted] = useState(false)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    let active = true
    checkAdminAccess()
      .then((allowed) => { if (active) setIsUnlocked(allowed) })
      .catch(() => { if (active) setIsUnlocked(false) })
      .finally(() => { if (active) setMounted(true) })
    return () => { active = false }
  }, [])

  if (!mounted) return null
  if (isUnlocked) return <>{children}</>

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pending) return
    setPending(true)
    setError("")
    try {
      if (await unlockAdmin(secretInput)) {
        setSecretInput("")
        setIsUnlocked(true)
      } else {
        setError("Code incorrect ou accès non configuré.")
      }
    } catch {
      setError("Connexion impossible. Réessayez.")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1 pb-4">
          <p className="text-lg font-semibold text-foreground">Accès saisie résultats</p>
          <p className="text-sm text-muted-foreground">Entrez le code d'accès pour continuer</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="access-secret">Code d'accès</Label>
              <Input
                id="access-secret"
                type="password"
                placeholder="Code d'accès"
                value={secretInput}
                onChange={(e) => {
                  setSecretInput(e.target.value)
                  setError("")
                }}
                autoComplete="off"
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={pending || !secretInput}>
              {pending ? "Vérification…" : "Accéder"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
