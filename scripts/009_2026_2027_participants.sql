-- La Gazzattak : participants 2026-2027 — Part 1.
-- Synchronise dans Git un état déjà appliqué manuellement en production.
-- Ce script n'est pas, à lui seul, un bootstrap complet d'une base vide :
-- il suppose le schéma actuel (dont managers.display_name), les deux saisons
-- et les 14 managers historiques. Les migrations 001–008 restent inchangées.
-- Un seul bloc atomique, sans table temporaire, UPDATE ni DELETE.

DO $$
DECLARE
  season_l1 CONSTANT uuid := '3c9a5b8c-7239-458b-8418-1de4a7defd9b';
  season_l2 CONSTANT uuid := '195a8fb5-a060-448c-9bd6-377daae0eb61';
  league_l2 uuid;
  target_season uuid;
  participant record;
  existing_count bigint;
  existing_name text;
BEGIN
  -- Sérialise les écritures : aucune contrainte UNIQUE métier sur teams requise.
  LOCK TABLE public.managers, public.teams IN SHARE ROW EXCLUSIVE MODE;
  LOCK TABLE public.leagues, public.seasons IN SHARE MODE;

  -- Vérifie UUID, libellé et division, sans imposer de statut is_current :
  -- la migration doit rester rejouable après la fin de cette saison.
  IF (
    SELECT count(*)
    FROM public.seasons s
    JOIN public.leagues l ON l.id = s.league_id
    WHERE s.name = 'Saison 2026-2027 — Part 1'
      AND (
        (s.id = season_l1 AND l.slug = 'jakattak_ligue1')
        OR (s.id = season_l2 AND l.slug = 'jakattak_ligue2')
      )
  ) <> 2 THEN
    RAISE EXCEPTION 'Saisons cibles absentes ou incohérentes';
  END IF;

  SELECT league_id INTO STRICT league_l2
  FROM public.seasons WHERE id = season_l2;

  FOR participant IN
    SELECT * FROM (VALUES
      ('L1', 'daf0dff7-fa70-4f93-b9ea-1141c6c68a9e'::uuid, 'Seb', 'Golden Roosters', false),
      ('L1', 'b94629a6-0add-4f9c-9f0a-7505f86c7bd7'::uuid, 'Xav', 'Jakattak', false),
      ('L1', '8d5edf3c-ecbe-4ea5-8980-eb245a0f6597'::uuid, 'Bendabz', 'Red Star', false),
      ('L1', '76fbb986-78d8-42c3-b1e9-1605472f1264'::uuid, 'Alex', 'FC Goudal', false),
      ('L1', '1d434ed8-be82-4c7a-95b6-47f9f5d902d8'::uuid, 'Thomas', 'OMT', false),
      ('L1', '0f4ab271-be8d-40d6-9ace-638d3df8d617'::uuid, 'Mat', 'Mat FC', false),
      ('L1', '9a92da54-02d5-44b9-a260-f92aef63aef1'::uuid, 'Mous', 'JPP', false),
      ('L1', '05bc3054-75e4-4c4f-b98b-5aa0376d9005'::uuid, 'FlyingDutch2', 'Filou FC', false),
      ('L2', '95a76ed1-37b6-4e20-8399-7399db88860c'::uuid, 'Mathieu A.', 'Olympik de Mars', false),
      ('L2', '052a4ebf-c646-4baf-8822-25e1a2173d6e'::uuid, 'Deepblue', 'Deepblue', false),
      ('L2', 'd1990315-3a1c-4e25-9403-56885fe8d9cc'::uuid, 'Entraineur bab', 'Entraineur_Bab', false),
      ('L2', '3fbed630-ee96-4a22-a879-55b4feb3f76c'::uuid, 'Madinviet', 'Madinviet', false),
      ('L2', 'b3eb3ecb-3a4b-47fe-88cc-483337d210d0'::uuid, 'ThiYapro', 'Souvlaki', false),
      ('L2', '738ee0db-b721-4065-875c-08eed63586cf'::uuid, 'Hbaman', 'Rocket team', false),
      ('L2', '56ef1e85-f000-4300-a18d-6973bd77bddb'::uuid, 'Nibouba', 'KDS', true),
      ('L2', '2fb78827-a691-4566-bcfd-e4a31e3861b0'::uuid, 'Sedy13', 'Sedy team', true)
    ) AS roster(division, manager_id, manager_name, team_name, allow_creation)
  LOOP
    target_season := CASE participant.division
      WHEN 'L1' THEN season_l1 ELSE season_l2 END;

    IF participant.allow_creation THEN
      -- Refuse un homonyme sous un autre UUID, même avec casse/espaces différents.
      IF EXISTS (
        SELECT 1 FROM public.managers m
        WHERE lower(btrim(m.name)) = lower(btrim(participant.manager_name))
          AND m.id <> participant.manager_id
      ) THEN
        RAISE EXCEPTION 'Manager % déjà présent sous un autre UUID',
          participant.manager_name;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM public.managers WHERE id = participant.manager_id
      ) THEN
        -- Initialise uniquement une nouvelle ligne avec son UUID de production.
        INSERT INTO public.managers (id, league_id, name, display_name)
        VALUES (participant.manager_id, league_l2,
                participant.manager_name, participant.manager_name);
      END IF;
    END IF;

    -- Vérifie aussi qu'un UUID attendu n'appartient pas à un autre pseudo.
    IF NOT EXISTS (
      SELECT 1 FROM public.managers m
      WHERE m.id = participant.manager_id AND m.name = participant.manager_name
    ) THEN
      RAISE EXCEPTION 'Manager absent ou pseudo incohérent : % (%)',
        participant.manager_name, participant.manager_id;
    END IF;

    -- La division dépend de teams.season_id, jamais de managers.league_id.
    IF EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.manager_id = participant.manager_id
        AND t.season_id IN (season_l1, season_l2)
        AND t.season_id <> target_season
    ) THEN
      RAISE EXCEPTION 'Manager inscrit dans la mauvaise division : %',
        participant.manager_name;
    END IF;

    -- Refuse aussi un club attribué à un autre manager dans la même saison.
    IF EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.season_id = target_season
        AND lower(btrim(t.name)) = lower(btrim(participant.team_name))
        AND t.manager_id <> participant.manager_id
    ) THEN
      RAISE EXCEPTION 'Nom d’équipe déjà attribué à un autre manager : %',
        participant.team_name;
    END IF;

    SELECT count(*), min(t.name) INTO existing_count, existing_name
    FROM public.teams t
    WHERE t.season_id = target_season AND t.manager_id = participant.manager_id;

    IF existing_count > 1 THEN
      RAISE EXCEPTION 'Participations dupliquées pour %', participant.manager_name;
    ELSIF existing_count = 1 THEN
      IF existing_name IS DISTINCT FROM participant.team_name THEN
        RAISE EXCEPTION 'Équipe incohérente pour % : %, attendu %',
          participant.manager_name, existing_name, participant.team_name;
      END IF;
      -- Conforme : conserve UUID, nom, classement et date de création.
    ELSE
      INSERT INTO public.teams (manager_id, season_id, name, current_rank)
      VALUES (participant.manager_id, target_season, participant.team_name, NULL);
    END IF;

    IF (
      SELECT count(*) FROM public.teams t
      WHERE t.season_id = target_season
        AND t.manager_id = participant.manager_id
        AND t.name = participant.team_name
    ) <> 1 THEN
      RAISE EXCEPTION 'Participation attendue absente ou incohérente pour %',
        participant.manager_name;
    END IF;
  END LOOP;

  -- Les 16 participations ont été contrôlées ; refuse tout participant en plus.
  IF (SELECT count(*) FROM public.teams WHERE season_id = season_l1) <> 8
     OR (SELECT count(*) FROM public.teams WHERE season_id = season_l2) <> 8
  THEN
    RAISE EXCEPTION 'Effectif incohérent : exactement 8 équipes par division requis';
  END IF;
END
$$;
