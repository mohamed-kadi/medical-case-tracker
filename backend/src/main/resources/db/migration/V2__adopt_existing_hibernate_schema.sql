CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    enabled BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS patients (
    id BIGSERIAL PRIMARY KEY,
    patient_number VARCHAR(32),
    registered_by_username VARCHAR(100),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    email VARCHAR(255),
    phone_number VARCHAR(255),
    medical_history TEXT,
    assigned_doctor_username VARCHAR(100),
    assigned_front_desk_username VARCHAR(100),
    status VARCHAR(255) NOT NULL,
    created_at TIMESTAMP(6),
    updated_at TIMESTAMP(6),
    version BIGINT
);

CREATE TABLE IF NOT EXISTS audit_events (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    action VARCHAR(50) NOT NULL,
    actor_username VARCHAR(100) NOT NULL,
    details TEXT,
    created_at TIMESTAMP(6) NOT NULL
);

CREATE TABLE IF NOT EXISTS medical_cases (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    treatment_plan TEXT,
    status VARCHAR(255) NOT NULL,
    created_at TIMESTAMP(6),
    updated_at TIMESTAMP(6),
    version BIGINT
);

CREATE TABLE IF NOT EXISTS appointments (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    scheduled_at TIMESTAMP(6) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    notes TEXT,
    status VARCHAR(255) NOT NULL,
    created_at TIMESTAMP(6),
    updated_at TIMESTAMP(6),
    version BIGINT
);

CREATE TABLE IF NOT EXISTS medical_images (
    id BIGSERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(255) NOT NULL,
    path VARCHAR(255) NOT NULL,
    description TEXT,
    image_category VARCHAR(255) NOT NULL,
    mime_type VARCHAR(255) NOT NULL,
    size BIGINT NOT NULL,
    case_id BIGINT NOT NULL,
    created_at TIMESTAMP(6),
    updated_at TIMESTAMP(6),
    uploaded_by VARCHAR(255) NOT NULL,
    is_deleted BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS patient_account_links (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    verification_method VARCHAR(60),
    verified_by_username VARCHAR(100),
    verified_at TIMESTAMP(6),
    created_at TIMESTAMP(6),
    updated_at TIMESTAMP(6),
    version BIGINT,
    CONSTRAINT uk_patient_account_link_user_patient_status UNIQUE (user_id, patient_id, status),
    CONSTRAINT fk_patient_account_links_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_patient_account_links_patient FOREIGN KEY (patient_id) REFERENCES patients (id)
);

ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS username VARCHAR(100);
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS password VARCHAR(255);
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS role VARCHAR(20);
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS enabled BOOLEAN;
UPDATE users SET role = 'FRONT_DESK' WHERE role = 'STAFF';
UPDATE users SET role = 'PATIENT' WHERE role IS NULL;
UPDATE users SET enabled = TRUE WHERE enabled IS NULL;
ALTER TABLE IF EXISTS users ALTER COLUMN username TYPE VARCHAR(100);
ALTER TABLE IF EXISTS users ALTER COLUMN role TYPE VARCHAR(20);
ALTER TABLE IF EXISTS users ALTER COLUMN username SET NOT NULL;
ALTER TABLE IF EXISTS users ALTER COLUMN password SET NOT NULL;
ALTER TABLE IF EXISTS users ALTER COLUMN email SET NOT NULL;
ALTER TABLE IF EXISTS users ALTER COLUMN role SET NOT NULL;
ALTER TABLE IF EXISTS users ALTER COLUMN enabled SET NOT NULL;
ALTER TABLE IF EXISTS users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE IF EXISTS users
    ADD CONSTRAINT users_role_check CHECK (role IN ('ADMIN', 'DOCTOR', 'FRONT_DESK', 'PATIENT'));

ALTER TABLE IF EXISTS patients ADD COLUMN IF NOT EXISTS patient_number VARCHAR(32);
ALTER TABLE IF EXISTS patients ADD COLUMN IF NOT EXISTS registered_by_username VARCHAR(100);
ALTER TABLE IF EXISTS patients ADD COLUMN IF NOT EXISTS assigned_doctor_username VARCHAR(100);
ALTER TABLE IF EXISTS patients ADD COLUMN IF NOT EXISTS assigned_front_desk_username VARCHAR(100);
ALTER TABLE IF EXISTS patients ADD COLUMN IF NOT EXISTS status VARCHAR(255);
ALTER TABLE IF EXISTS patients ADD COLUMN IF NOT EXISTS created_at TIMESTAMP(6);
ALTER TABLE IF EXISTS patients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(6);
ALTER TABLE IF EXISTS patients ADD COLUMN IF NOT EXISTS version BIGINT;
UPDATE patients SET status = 'ACTIVE' WHERE status IS NULL;
ALTER TABLE IF EXISTS patients ALTER COLUMN patient_number TYPE VARCHAR(32);
ALTER TABLE IF EXISTS patients ALTER COLUMN registered_by_username TYPE VARCHAR(100);
ALTER TABLE IF EXISTS patients ALTER COLUMN assigned_doctor_username TYPE VARCHAR(100);
ALTER TABLE IF EXISTS patients ALTER COLUMN assigned_front_desk_username TYPE VARCHAR(100);
ALTER TABLE IF EXISTS patients ALTER COLUMN status SET NOT NULL;
ALTER TABLE IF EXISTS patients DROP CONSTRAINT IF EXISTS patients_status_check;
ALTER TABLE IF EXISTS patients
    ADD CONSTRAINT patients_status_check CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED'));

ALTER TABLE IF EXISTS medical_cases ADD COLUMN IF NOT EXISTS version BIGINT;
ALTER TABLE IF EXISTS medical_cases ADD COLUMN IF NOT EXISTS status VARCHAR(255);
UPDATE medical_cases SET status = 'OPEN' WHERE status IS NULL;
ALTER TABLE IF EXISTS medical_cases ALTER COLUMN status SET NOT NULL;
ALTER TABLE IF EXISTS medical_cases DROP CONSTRAINT IF EXISTS medical_cases_status_check;
ALTER TABLE IF EXISTS medical_cases
    ADD CONSTRAINT medical_cases_status_check CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'));

ALTER TABLE IF EXISTS appointments ADD COLUMN IF NOT EXISTS version BIGINT;
ALTER TABLE IF EXISTS appointments ADD COLUMN IF NOT EXISTS status VARCHAR(255);
UPDATE appointments SET status = 'SCHEDULED' WHERE status IS NULL;
ALTER TABLE IF EXISTS appointments ALTER COLUMN status SET NOT NULL;
ALTER TABLE IF EXISTS appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE IF EXISTS appointments
    ADD CONSTRAINT appointments_status_check CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'));

ALTER TABLE IF EXISTS medical_images ADD COLUMN IF NOT EXISTS image_category VARCHAR(255);
ALTER TABLE IF EXISTS medical_images ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN;
UPDATE medical_images SET image_category = 'OTHER' WHERE image_category IS NULL;
UPDATE medical_images SET is_deleted = FALSE WHERE is_deleted IS NULL;
ALTER TABLE IF EXISTS medical_images ALTER COLUMN image_category SET NOT NULL;
ALTER TABLE IF EXISTS medical_images ALTER COLUMN is_deleted SET NOT NULL;
ALTER TABLE IF EXISTS medical_images DROP CONSTRAINT IF EXISTS medical_images_category_check;
ALTER TABLE IF EXISTS medical_images
    ADD CONSTRAINT medical_images_category_check CHECK (
        image_category IN (
            'BEFORE_TREATMENT',
            'DURING_TREATMENT',
            'AFTER_TREATMENT',
            'X_RAY',
            'MRI',
            'CT_SCAN',
            'ULTRASOUND',
            'OTHER'
        )
    );

ALTER TABLE IF EXISTS patient_account_links ADD COLUMN IF NOT EXISTS status VARCHAR(20);
ALTER TABLE IF EXISTS patient_account_links ADD COLUMN IF NOT EXISTS verification_method VARCHAR(60);
ALTER TABLE IF EXISTS patient_account_links ADD COLUMN IF NOT EXISTS verified_by_username VARCHAR(100);
ALTER TABLE IF EXISTS patient_account_links ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP(6);
ALTER TABLE IF EXISTS patient_account_links ADD COLUMN IF NOT EXISTS created_at TIMESTAMP(6);
ALTER TABLE IF EXISTS patient_account_links ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(6);
ALTER TABLE IF EXISTS patient_account_links ADD COLUMN IF NOT EXISTS version BIGINT;
UPDATE patient_account_links SET status = 'PENDING' WHERE status IS NULL;
ALTER TABLE IF EXISTS patient_account_links ALTER COLUMN status TYPE VARCHAR(20);
ALTER TABLE IF EXISTS patient_account_links ALTER COLUMN verification_method TYPE VARCHAR(60);
ALTER TABLE IF EXISTS patient_account_links ALTER COLUMN verified_by_username TYPE VARCHAR(100);
ALTER TABLE IF EXISTS patient_account_links ALTER COLUMN status SET NOT NULL;
ALTER TABLE IF EXISTS patient_account_links DROP CONSTRAINT IF EXISTS patient_account_links_status_check;
ALTER TABLE IF EXISTS patient_account_links
    ADD CONSTRAINT patient_account_links_status_check CHECK (status IN ('PENDING', 'VERIFIED', 'REVOKED'));

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'uk_users_username'
          AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users ADD CONSTRAINT uk_users_username UNIQUE (username);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'uk_users_email'
          AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users ADD CONSTRAINT uk_users_email UNIQUE (email);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'uk_patients_patient_number'
          AND conrelid = 'public.patients'::regclass
    ) THEN
        ALTER TABLE public.patients ADD CONSTRAINT uk_patients_patient_number UNIQUE (patient_number);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'uk_patient_account_link_user_patient_status'
          AND conrelid = 'public.patient_account_links'::regclass
    ) THEN
        ALTER TABLE public.patient_account_links
            ADD CONSTRAINT uk_patient_account_link_user_patient_status UNIQUE (user_id, patient_id, status);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON audit_events (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON audit_events (created_at);
CREATE INDEX IF NOT EXISTS idx_medical_images_case_id ON medical_images (case_id);
CREATE INDEX IF NOT EXISTS idx_medical_images_case_category_deleted ON medical_images (case_id, image_category, is_deleted);
CREATE INDEX IF NOT EXISTS idx_patient_account_link_user_status ON patient_account_links (user_id, status);
CREATE INDEX IF NOT EXISTS idx_patient_account_link_patient_status ON patient_account_links (patient_id, status);
