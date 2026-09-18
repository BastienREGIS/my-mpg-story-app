import type { MatchResult } from "@/lib/types"

export type SeasonLaunchStory = {
  category: string
  title: string
  text: string
  href?: string
  cta?: string
}

export type SeasonLaunchMovement = {
  label: string
  teams: string[]
  text: string
}

export type SeasonLaunchArticle = {
  category: string
  title: string
  excerpt: string
  href: string | null
  ctaLabel: string
}

export type SeasonLaunchEditorial = {
  j1Launch: SeasonLaunchArticle
  mercatoArticle: SeasonLaunchArticle
  championInterview?: SeasonLaunchStory
  heroAside: {
    eyebrow: string
    title: string
    text: string
  }
  stories: SeasonLaunchStory[]
  movements: SeasonLaunchMovement[]
}

export const seasonLaunchEditorial: Record<string, SeasonLaunchEditorial> = {
  jakattak_ligue1: {
    j1Launch: {
      category: "JOURNÉE 1 · AVANT-MATCH",
      title: "LE CHAMPION REMET SON TITRE EN JEU",
      excerpt: "Golden Roosters entame la défense de son titre face à un Mat FC revanchard, tandis que les entraîneurs Mous et Filou découvrent la Ligue 1 avec leurs clubs respectifs.",
      href: "/ligue/jakattak_ligue1/articles/j1-ligue-1-avant-match",
      ctaLabel: "Lire l’avant-match de la J1",
    },
    mercatoArticle: {
      category: "MERCATO",
      title: "JPP A TOUT TENTÉ. LES AUTRES ONT TOUT SIGNÉ.",
      excerpt: "Jakattak, Mat FC et Golden Roosters ont sorti les millions, FC Goudal a multiplié les signatures, tandis que JPP a vu les dossiers lui échapper les uns après les autres. Le promu a surtout collectionné les refus.",
      href: "/ligue/jakattak_ligue1/articles/mercato-ligue-1-les-millions-ont-vole",
      ctaLabel: "LIRE L’ARTICLE",
    },
    heroAside: {
      eyebrow: "CHAMPION À BATTRE",
      title: "GOLDEN ROOSTERS",
      text: "La couronne est remise en jeu.",
    },
    championInterview: {
      category: "À LA UNE",
      title: "Dans la tête du champion",
      text:
        "Six titres, quelques ennemis et aucune envie de faire profil bas. L'entraîneur Seb ouvre les portes de son règne à La Gazzattak.",
      href: "/ligue/jakattak_ligue1/articles/dans-la-tete-du-champion",
      cta: "LIRE L'INTERVIEW",
    },
    stories: [
      {
        category: "RIVALITÉ",
        title: "Affaire de famille",
        text:
          "Chez les Rolando, le championnat se joue aussi en famille. Cette saison devra encore déterminer lequel des frères prendra l'ascendant sur l'autre.",
      },
    ],
    movements: [
      {
        label: "↑ BIENVENUE DANS L'ÉLITE",
        teams: ["JPP", "Filou FC"],
        text: "Ils ont gagné leur ticket. Reste maintenant à survivre à l'étage supérieur.",
      },
    ],
  },
  jakattak_ligue2: {
    j1Launch: {
      category: "JOURNÉE 1 · AVANT-MATCH",
      title: "LA COURSE À LA MONTÉE EST OUVERTE",
      excerpt: "Relégué de Ligue 1, Olympik de Mars entame son opération remontée, tandis que l’entraîneur Bab repart pour une nouvelle saison avec le même objectif : ramener son club parmi l’élite.",
      href: "/ligue/jakattak_ligue2/articles/j1-ligue-2-avant-match",
      ctaLabel: "Lire l’avant-match de la J1",
    },
    mercatoArticle: {
      category: "MERCATO",
      title: "LA LIGUE 2 A DÉJÀ PERDU LA TÊTE.",
      excerpt: "Rocket Team claque 100 M€ sur Lepaul, Bab Olympique répond à coups de millions, Deepblue gagne les batailles les plus chaudes et Sedy Team termine… seul au 11e tour. Le mercato a déjà laissé des traces.",
      href: "/ligue/jakattak_ligue2/articles/mercato-ligue-2-100-millions-sur-lepaul",
      ctaLabel: "LIRE L’ARTICLE",
    },
    heroAside: {
      eyebrow: "OBJECTIF",
      title: "LIGUE 1",
      text: "Deux places. Beaucoup trop de candidats.",
    },
    stories: [
      {
        category: "À SUIVRE",
        title: "Bab peut-il encore retrouver l'élite ?",
        text:
          "Les saisons passent et la Ligue 1 reste hors de portée. L'entraîneur Bab peut-il encore espérer retrouver l'élite ? #AJamaisLePremier",
      },
    ],
    movements: [
      {
        label: "↓ RETOUR À L'ÉTAGE INFÉRIEUR",
        teams: ["Olympique 2 Marseille", "Celtic Gossbo"],
        text: "La Ligue 1 est derrière eux. Il faut maintenant trouver le chemin du retour.",
      },
    ],
  },
}

export function getSeasonLaunchEditorial(leagueSlug: string): SeasonLaunchEditorial {
  return seasonLaunchEditorial[leagueSlug] ?? seasonLaunchEditorial.jakattak_ligue1
}

export function matchHasCompleteScore(match: Pick<MatchResult, "home_score" | "away_score">): boolean {
  return match.home_score != null && match.away_score != null
}
