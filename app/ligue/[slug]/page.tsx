import { notFound } from "next/navigation"
import { getDashboardData } from "@/lib/queries"
import { DashboardClient } from "@/components/DashboardClient"
import { PreviousArticles } from "@/components/articles/PreviousArticles"

type PageProps = {
  params: Promise<{ slug: string }>
}

export default async function LeagueBySlugPage({ params }: PageProps) {
  const { slug } = await params
  const data = await getDashboardData({ leagueSlug: slug })

  if (!data.league) {
    notFound()
  }

  return <DashboardClient data={data} previousArticles={<PreviousArticles leagueSlug={data.league.slug} />} />
}
