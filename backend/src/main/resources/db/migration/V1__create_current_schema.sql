CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    enabled BOOLEAN NOT NULL,
    CONSTRAINT uk_users_username UNIQUE (username),
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT users_role_check CHECK (role IN ('ADMIN', 'DOCTOR', 'FRONT_DESK', 'PATIENT'))
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
    version BIGINT,
    CONSTRAINT uk_patients_patient_number UNIQUE (patient_number),
    CONSTRAINT patients_status_check CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED'))
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
    version BIGINT,
    CONSTRAINT medical_cases_status_check CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    CONSTRAINT fk_medical_cases_patient FOREIGN KEY (patient_id) REFERENCES patients (id)
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
    version BIGINT,
    CONSTRAINT appointments_status_check CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
    CONSTRAINT fk_appointments_patient FOREIGN KEY (patient_id) REFERENCES patients (id)
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
    is_deleted BOOLEAN NOT NULL,
    CONSTRAINT medical_images_category_check CHECK (
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
    ),
    CONSTRAINT fk_medical_images_case FOREIGN KEY (case_id) REFERENCES medical_cases (id)
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
    CONSTRAINT patient_account_links_status_check CHECK (status IN ('PENDING', 'VERIFIED', 'REVOKED')),
    CONSTRAINT uk_patient_account_link_user_patient_status UNIQUE (user_id, patient_id, status),
    CONSTRAINT fk_patient_account_links_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_patient_account_links_patient FOREIGN KEY (patient_id) REFERENCES patients (id)
);

CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON audit_events (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON audit_events (created_at);
CREATE INDEX IF NOT EXISTS idx_medical_images_case_id ON medical_images (case_id);
CREATE INDEX IF NOT EXISTS idx_medical_images_case_category_deleted ON medical_images (case_id, image_category, is_deleted);
CREATE INDEX IF NOT EXISTS idx_patient_account_link_user_status ON patient_account_links (user_id, status);
CREATE INDEX IF NOT EXISTS idx_patient_account_link_patient_status ON patient_account_links (patient_id, status);
