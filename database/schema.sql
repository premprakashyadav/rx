-- Create database
CREATE DATABASE IF NOT EXISTS rx;
USE rx;

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    user_type ENUM('doctor', 'admin') DEFAULT 'doctor',
    reset_token VARCHAR(255),
    reset_token_expiry DATETIME,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Doctors profile table
CREATE TABLE doctors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    qualification VARCHAR(255),
    specialization VARCHAR(255),
    registration_number VARCHAR(100) UNIQUE,
    clinic_name VARCHAR(255),
    clinic_address TEXT,
    clinic_phone VARCHAR(20),
    email VARCHAR(255),
    mobile VARCHAR(20),
    digital_signature_path VARCHAR(500),
    stamp_image_path VARCHAR(500),
    letterhead_image_path VARCHAR(500),
    consultation_fee DECIMAL(10,2),
    experience_years INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Medicines table
CREATE TABLE medicines (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    brand VARCHAR(255),
    strength VARCHAR(100),
    form VARCHAR(100),
    manufacturer VARCHAR(255),
    schedule VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Patients table
CREATE TABLE patients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id VARCHAR(50) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    age INT,
    sex ENUM('male', 'female', 'other'),
    mobile VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    blood_group VARCHAR(10),
    allergies TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Investigations table
CREATE TABLE investigations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prescriptions table
CREATE TABLE prescriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    prescription_id VARCHAR(50) UNIQUE,
    patient_id INT,
    doctor_id INT,
    chief_complaint TEXT,
    history_of_present_illness TEXT,
    past_medical_history TEXT,
    past_surgical_history TEXT,
    diagnosis TEXT,
    follow_up_date DATE,
    consultation_date DATE DEFAULT (CURDATE()),
    advice TEXT,
    consent_obtained BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

-- Prescription medicines table
CREATE TABLE prescription_medicines (
    id INT PRIMARY KEY AUTO_INCREMENT,
    prescription_id INT,
    medicine_id INT,
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    duration VARCHAR(100),
    instructions TEXT,
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id)
);

-- Prescription investigations table
CREATE TABLE prescription_investigations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    prescription_id INT,
    investigation_id INT,
    notes TEXT,
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (investigation_id) REFERENCES investigations(id)
);

-- Certificates table
CREATE TABLE certificates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    certificate_id VARCHAR(50) UNIQUE,
    patient_id INT,
    doctor_id INT,
    certificate_type ENUM('medical', 'fitness'),
    issue_date DATE DEFAULT (CURDATE()),
    valid_until DATE,
    content TEXT,
    diagnosis TEXT,
    recommendations TEXT,
    restrictions TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

-- Appointments/History table
CREATE TABLE patient_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT,
    doctor_id INT,
    visit_date DATE DEFAULT (CURDATE()),
    visit_type VARCHAR(100),
    symptoms TEXT,
    diagnosis TEXT,
    treatment TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

-- Insert sample investigations
INSERT INTO investigations (name, category) VALUES
('Complete Blood Count', 'Hematology'),
('Blood Sugar Fasting', 'Biochemistry'),
('Blood Sugar PP', 'Biochemistry'),
('HbA1c', 'Biochemistry'),
('Lipid Profile', 'Biochemistry'),
('Liver Function Test', 'Biochemistry'),
('Kidney Function Test', 'Biochemistry'),
('Thyroid Profile', 'Hormones'),
('ECG', 'Cardiology'),
('X-Ray Chest', 'Radiology'),
('Ultrasound Abdomen', 'Radiology'),
('MRI', 'Radiology'),
('CT Scan', 'Radiology'),
('Urine Routine', 'Pathology'),
('Stool Test', 'Pathology');