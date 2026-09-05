ALTER TABLE IF EXISTS appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE IF EXISTS appointments
    ADD CONSTRAINT appointments_status_check
    CHECK (status IN ('SCHEDULED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW'));
