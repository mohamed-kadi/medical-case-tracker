CREATE TABLE IF NOT EXISTS prescriptions (
    id BIGSERIAL PRIMARY KEY,
    case_id BIGINT NOT NULL,
    prescription_number VARCHAR(40),
    type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    prescriber_name VARCHAR(200) NOT NULL,
    prescriber_title VARCHAR(120) NOT NULL,
    professional_id VARCHAR(100),
    practice_name VARCHAR(200),
    practice_address TEXT NOT NULL,
    practice_phone VARCHAR(80),
    general_instructions TEXT,
    patient_name_snapshot VARCHAR(300) NOT NULL,
    patient_number_snapshot VARCHAR(32),
    patient_dob_snapshot DATE,
    created_by VARCHAR(100) NOT NULL,
    issued_at TIMESTAMP(6),
    voided_at TIMESTAMP(6),
    void_reason TEXT,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    version BIGINT,
    CONSTRAINT uk_prescriptions_number UNIQUE (prescription_number),
    CONSTRAINT prescriptions_type_check CHECK (
        type IN ('MEDICATION', 'LABORATORY', 'IMAGING', 'DEVICE', 'PARAMEDICAL')
    ),
    CONSTRAINT prescriptions_status_check CHECK (status IN ('DRAFT', 'ISSUED', 'VOIDED')),
    CONSTRAINT fk_prescriptions_case FOREIGN KEY (case_id) REFERENCES medical_cases (id)
);

CREATE TABLE IF NOT EXISTS prescription_items (
    id BIGSERIAL PRIMARY KEY,
    prescription_id BIGINT NOT NULL,
    position INTEGER NOT NULL,
    medication_name VARCHAR(255) NOT NULL,
    strength VARCHAR(120),
    pharmaceutical_form VARCHAR(120),
    dose VARCHAR(120),
    route VARCHAR(120),
    frequency VARCHAR(160),
    duration VARCHAR(120),
    quantity VARCHAR(120),
    instructions TEXT,
    CONSTRAINT fk_prescription_items_prescription
        FOREIGN KEY (prescription_id) REFERENCES prescriptions (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_case_created ON prescriptions (case_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prescription_items_prescription ON prescription_items (prescription_id, position);
