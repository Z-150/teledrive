-- Migration: Add tg_session column to users table
-- Run this on the server with:
--   sqlite3 /path/to/data.db < add_tg_session.sql
-- Or use the npm script below.

ALTER TABLE users ADD COLUMN tg_session TEXT;
