-- CreateAccount for testing
INSERT INTO "Account" (email, "passwordHash", "createdAt")
VALUES ('test@test.de', '$2b$10$q4P.5.F9k1HGpPGc1hzWwOcQdpg9WDEa0RP6oGqfHZJl8zDvKi4Ya', NOW())
ON CONFLICT (email) DO NOTHING;

-- CreateVillage for test user
INSERT INTO "Village" ("accountId", "name", "locationName")
SELECT id, 'Test Village', 'Test Location'
FROM "Account"
WHERE email = 'test@test.de'
ON CONFLICT DO NOTHING;
