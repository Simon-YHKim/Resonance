-- 0000_users.down.sql — 롤백
DROP INDEX IF EXISTS idx_users_created;
DROP INDEX IF EXISTS idx_users_email;
DROP TABLE IF EXISTS users;
