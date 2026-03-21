DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'PostalCode'
      AND column_name = 'lat'
  ) THEN
    ALTER TABLE "PostalCode" ADD COLUMN "lat" DOUBLE PRECISION;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'PostalCode'
      AND column_name = 'lng'
  ) THEN
    ALTER TABLE "PostalCode" ADD COLUMN "lng" DOUBLE PRECISION;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'PostalCode'
      AND column_name = 'latitude'
  ) THEN
    EXECUTE 'UPDATE "PostalCode" SET "lat" = "latitude" WHERE "lat" IS NULL';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'PostalCode'
      AND column_name = 'longitude'
  ) THEN
    EXECUTE 'UPDATE "PostalCode" SET "lng" = "longitude" WHERE "lng" IS NULL';
  END IF;
END $$;