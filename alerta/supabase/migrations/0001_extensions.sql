-- Alerta — Extensions
-- pgcrypto gives us gen_random_bytes() for invite codes.
-- gen_random_uuid() is built into Postgres 13+ core, no extension required.
create extension if not exists pgcrypto;
