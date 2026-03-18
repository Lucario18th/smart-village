DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SecurityIncidentType') THEN
    CREATE TYPE "SecurityIncidentType" AS ENUM (
      'LOGIN_SUCCESS',
      'LOGIN_FAILED',
      'LOGIN_BLOCKED',
      'ADMIN_SESSION_BLOCKED',
      'SESSION_REJECTED',
      'LOGOUT'
    );
  END IF;
END $$;

ALTER TABLE "Account"
  ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lockUntil" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "activeAdminSessionId" TEXT,
  ADD COLUMN IF NOT EXISTS "activeAdminSessionExpiresAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "activeAdminSessionIp" TEXT;

CREATE TABLE IF NOT EXISTS "SecurityIncident" (
  "id" SERIAL NOT NULL,
  "accountId" INTEGER,
  "email" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "type" "SecurityIncidentType" NOT NULL,
  "success" BOOLEAN NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SecurityIncident_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'SecurityIncident_accountId_fkey'
  ) THEN
    ALTER TABLE "SecurityIncident"
      ADD CONSTRAINT "SecurityIncident_accountId_fkey"
      FOREIGN KEY ("accountId") REFERENCES "Account"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "SecurityIncident_accountId_createdAt_idx"
  ON "SecurityIncident"("accountId", "createdAt");

CREATE INDEX IF NOT EXISTS "SecurityIncident_email_createdAt_idx"
  ON "SecurityIncident"("email", "createdAt");

CREATE INDEX IF NOT EXISTS "SecurityIncident_type_createdAt_idx"
  ON "SecurityIncident"("type", "createdAt");
