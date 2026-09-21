import { dansLaTeteDuChampion } from "@/content/articles/dans-la-tete-du-champion"
import { mercatoLigue2 } from "@/content/articles/mercato-ligue-2"
import { mercatoLigue1 } from "@/content/articles/mercato-ligue-1"
import { j1Ligue1 } from "@/content/articles/j1-ligue-1"
import { j1Ligue2 } from "@/content/articles/j1-ligue-2"

export type EditorialTextSegment = {
  text: string
  strong?: boolean
  emphasis?: boolean
}

export type EditorialArticleBlock =
  | {
      type: "paragraph"
      content: EditorialTextSegment[]
    }
  | {
      type: "heading"
      text: string
    }
  | {
      type: "quote"
      text: string
      variant?: "lead" | "standard"
    }

export type EditorialArticle = {
  slug: string
  leagueSlug: string
  leagues?: string[]
  category: string
  eyebrow: string
  kicker?: string
  title: string
  excerpt: string
  excerptSegments?: EditorialTextSegment[]
  publishedAt?: string
  author?: string
  heroImage?: string
  content: EditorialArticleBlock[]
}

// À date égale, cet ordre départage les publications, de la plus récente à la plus ancienne.
const articles = [j1Ligue1, j1Ligue2, mercatoLigue1, mercatoLigue2, dansLaTeteDuChampion] satisfies EditorialArticle[]

export function getArticle(leagueSlug: string, articleSlug: string): EditorialArticle | null {
  return articles.find((article) => isArticleForLeague(article, leagueSlug) && article.slug === articleSlug) ?? null
}

export function isArticleForLeague(article: EditorialArticle, leagueSlug: string): boolean {
  return (article.leagues ?? [article.leagueSlug]).includes(leagueSlug)
}

export function getArticlesForLeague(leagueSlug: string): EditorialArticle[] {
  return articles.filter((article) => isArticleForLeague(article, leagueSlug))
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
}
