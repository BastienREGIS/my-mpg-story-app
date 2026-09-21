import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getArticlesForLeague, type EditorialArticle } from "@/lib/articles"

type Props = { leagueSlug: string; currentArticleSlug?: string }

function ArticleLinks({ articles, leagueSlug }: { articles: EditorialArticle[]; leagueSlug: string }) {
  return (
    <ul className="divide-y divide-border/60">
      {articles.map((article) => (
        <li key={article.slug}>
          <Link
            href={`/ligue/${encodeURIComponent(leagueSlug)}/articles/${encodeURIComponent(article.slug)}`}
            className="group flex min-h-16 items-center gap-4 py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[0.65rem] uppercase text-muted-foreground">{article.category}</p>
              <p className="mt-1 break-words text-sm font-semibold leading-relaxed text-foreground transition-colors group-hover:text-primary sm:text-base">{article.title}</p>
              {article.publishedAt ? (
                <time dateTime={article.publishedAt} className="mt-1 block text-xs text-muted-foreground">
                  {new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(article.publishedAt))}
                </time>
              ) : null}
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function PreviousArticles({ leagueSlug, currentArticleSlug }: Props) {
  const articles = getArticlesForLeague(leagueSlug).filter((article) => article.slug !== currentArticleSlug)
  if (!articles.length) return null

  return (
    <section className="border-t border-border pt-6" aria-labelledby="previous-articles-heading">
      <h2 id="previous-articles-heading" className="font-display text-xl font-bold uppercase text-muted-foreground">
        LES ARTICLES PRÉCÉDENTS
      </h2>
      <ArticleLinks articles={articles.slice(0, 4)} leagueSlug={leagueSlug} />
      {articles.length > 4 ? (
        <details className="border-t border-border/60">
          <summary className="cursor-pointer py-4 text-xs font-semibold uppercase text-muted-foreground hover:text-primary">
            Plus d’articles ({articles.length - 4})
          </summary>
          <ArticleLinks articles={articles.slice(4)} leagueSlug={leagueSlug} />
        </details>
      ) : null}
    </section>
  )
}
