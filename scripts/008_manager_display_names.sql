-- La Gazzattak : noms éditoriaux des entraîneurs.
-- Aucun changement de name, identity_label, league_id, équipes ou saisons.
BEGIN;

ALTER TABLE public.managers
  ADD COLUMN IF NOT EXISTS display_name text;

DO $$
DECLARE
  entry record;
BEGIN
  FOR entry IN
    SELECT * FROM (VALUES
      ('daf0dff7-fa70-4f93-b9ea-1141c6c68a9e'::uuid, 'Seb', 'Seb'),
      ('b94629a6-0add-4f9c-9f0a-7505f86c7bd7'::uuid, 'Xav', 'Xav'),
      ('8d5edf3c-ecbe-4ea5-8980-eb245a0f6597'::uuid, 'Bendabz', 'Ben'),
      ('76fbb986-78d8-42c3-b1e9-1605472f1264'::uuid, 'Alex', 'Alex'),
      ('1d434ed8-be82-4c7a-95b6-47f9f5d902d8'::uuid, 'Thomas', 'Thomas'),
      ('0f4ab271-be8d-40d6-9ace-638d3df8d617'::uuid, 'Mat', 'Mathieu'),
      ('9a92da54-02d5-44b9-a260-f92aef63aef1'::uuid, 'Mous', 'Mous'),
      ('05bc3054-75e4-4c4f-b98b-5aa0376d9005'::uuid, 'FlyingDutch2', 'FlyingDutch2'),
      ('95a76ed1-37b6-4e20-8399-7399db88860c'::uuid, 'Mathieu A.', 'Mathieu'),
      ('052a4ebf-c646-4baf-8822-25e1a2173d6e'::uuid, 'Deepblue', 'Djé'),
      ('d1990315-3a1c-4e25-9403-56885fe8d9cc'::uuid, 'Entraineur bab', 'Bab'),
      ('3fbed630-ee96-4a22-a879-55b4feb3f76c'::uuid, 'Madinviet', 'Jean-phi'),
      ('b3eb3ecb-3a4b-47fe-88cc-483337d210d0'::uuid, 'ThiYapro', 'Yannick'),
      ('738ee0db-b721-4065-875c-08eed63586cf'::uuid, 'Hbaman', 'Hbaman'),
      ('56ef1e85-f000-4300-a18d-6973bd77bddb'::uuid, 'Nibouba', 'Nibouba'),
      ('2fb78827-a691-4566-bcfd-e4a31e3861b0'::uuid, 'Sedy13', 'Sedy13')
    ) AS mapping(id, historical_name, editorial_name)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.managers m
      WHERE m.id = entry.id AND m.name = entry.historical_name
    ) THEN
      RAISE EXCEPTION 'Manager absent ou pseudo différent : % (%)',
        entry.historical_name, entry.id;
    END IF;

    UPDATE public.managers m
    SET display_name = entry.editorial_name
    WHERE m.id = entry.id
      AND m.display_name IS DISTINCT FROM entry.editorial_name;

    IF NOT EXISTS (
      SELECT 1 FROM public.managers m
      WHERE m.id = entry.id AND m.display_name = entry.editorial_name
    ) THEN
      RAISE EXCEPTION 'Échec du renseignement de display_name pour %', entry.id;
    END IF;
  END LOOP;
END
$$;

COMMIT;
