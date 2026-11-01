-- Wrong-PIN lockout (spec §4.6): after 5 wrong PINs a user is locked for a minute.
-- Kept in the database so restarting the app does not reset the counter.
ALTER TABLE users ADD COLUMN failed_pin_attempts INTEGER NOT NULL DEFAULT 0 CHECK (failed_pin_attempts >= 0);
ALTER TABLE users ADD COLUMN pin_locked_until TEXT;

-- Names are compared case-insensitively ("amina" and "Amina" are the same cashier).
CREATE UNIQUE INDEX users_name_nocase ON users (lower(name));
