-- Sign-in now requires a confirmed email. Accounts created before confirmation existed never got
-- the chance, so they count as confirmed instead of being locked out.
UPDATE "user" SET "email_verified" = true WHERE "email_verified" = false;
