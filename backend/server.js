/**
 * X Prescription Backend
 * Optimized for cPanel + CloudLinux + Node 16
 */

'use strict';

/* =======================
   ENV & CORE IMPORTS
======================= */
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const multer = require('multer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto').webcrypto || require('crypto'); // Added for forgot-password

/* =======================
   LOG FILE SETUP
======================= */
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const logFile = path.join(logDir, 'app.log');
const log = (message) => {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
};

/* =======================
   APP INIT
======================= */

/* =======================
   APP INIT
======================= */
const app = express();
const PORT = process.env.PORT || 3000;
const BASE_PATH = '/rx'; // base path for all routes

/* =======================
   MIDDLEWARE
======================= */
// CORS Configuration for Ionic/Angular
const allowedOrigins = [
  'http://localhost:8100',  // Ionic dev server
  'http://localhost:4200',  // Angular dev server
  'https://surgician.com',
  'https://www.surgician.com',
  'https://prescriptionpro.onrender.com'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `CORS policy denies access from origin: ${origin}`;
      log(`CORS blocked: ${origin}`);
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.options('*', cors());

app.use(express.json({ limit: '10mb' })); // Increased for base64 images
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  log(`${req.method} ${req.url}`);
  next();
});

/* =======================
   UPLOADS SETUP
======================= */
const uploadDir = path.join(__dirname, 'uploads/doctor_documents');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use(`${BASE_PATH}/uploads`, express.static(uploadDir));

// Configure multer for file uploads [citation:1][citation:7]
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create subdirectory for doctor documents
    const doctorDir = path.join(uploadDir, 'doctors');
    if (!fs.existsSync(doctorDir)) fs.mkdirSync(doctorDir, { recursive: true });
    cb(null, doctorDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'doctor-' + uniqueSuffix + ext);
  }
});

// File filter to validate file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only image files (JPEG, PNG) and PDFs are allowed'));
};

const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB limit [citation:7]
    files: 3 // Max 3 files per request
  },
  fileFilter: fileFilter
});


/* =======================
   DATABASE POOL
======================= */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'ratnakar',
  password: process.env.DB_PASSWORD || 'ratnakar26012022',
  database: process.env.DB_NAME || 'rx',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0
});

/* =======================
   JWT CONFIG
======================= */
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

/* =======================
   MAILER CONFIG
======================= */
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* =======================
   HELPER FUNCTIONS
======================= */

/**
 * Save base64 file to disk and return file path
 */
const saveBase64File = (base64String, filename, fieldName) => {
  try {
    // Extract content type and data from base64 string
    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 string format');
    }
    
    const contentType = matches[1];
    const data = matches[2];
    const buffer = Buffer.from(data, 'base64');
    
    // Determine file extension from content type
    let extension = '.bin';
    if (contentType.includes('jpeg') || contentType.includes('jpg')) {
      extension = '.jpg';
    } else if (contentType.includes('png')) {
      extension = '.png';
    } else if (contentType.includes('pdf')) {
      extension = '.pdf';
    }
    
    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const finalFilename = `${fieldName}-${uniqueSuffix}${extension}`;
    const filePath = path.join(uploadDir, 'doctors', finalFilename);
    
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Save file
    fs.writeFileSync(filePath, buffer);
    
    return filePath;
  } catch (error) {
    console.error('Error saving base64 file:', error);
    return null;
  }
};

/**
 * Clean up files if registration fails
 */
const cleanupFiles = (filePaths) => {
  filePaths.forEach(filePath => {
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error(`Failed to delete file ${filePath}:`, err);
      }
    }
  });
};

/* =======================
   AUTH MIDDLEWARE
======================= */
const authenticateToken = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Token required' });

  const token = auth.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    log(`Auth error: ${err.message}`);
    res.status(403).json({ error: 'Invalid token' });
  }
};

/* =======================
   BASE ROUTES
======================= */
app.get(`${BASE_PATH}`, (_, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send('<h2>X Prescription API</h2><p>Status: Running</p>');
});

app.get(`${BASE_PATH}/health`, (_, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime()
  });
});
app.get(`${BASE_PATH}/health/db`, async (_, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS test');
    res.json({ db: 'connected', test: rows[0].test });
  } catch (err) {
    log(`DB error: ${err.message}`);
    res.status(500).json({ db: 'error', error: err.message });
  }
});

/* =======================
   FILE UPLOAD ENDPOINT
======================= */
app.post(`${BASE_PATH}/api/upload`, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded',
        details: 'Please select a file to upload'
      });
    }
    
    // Generate public URL for the file
    const fileUrl = `${BASE_PATH}/uploads/doctors/${req.file.filename}`;
    
    res.json({ 
      message: 'File uploaded successfully',
      filePath: req.file.path,
      fileName: req.file.filename,
      fileUrl: fileUrl,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('File upload error:', error);
    
    // Handle specific multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        error: 'File too large',
        details: 'Maximum file size is 5MB'
      });
    }
    
    if (error.message.includes('file type')) {
      return res.status(400).json({ 
        error: 'Invalid file type',
        details: 'Only JPG, PNG, and PDF files are allowed'
      });
    }
    
    res.status(500).json({ 
      error: 'File upload failed',
      details: error.message 
    });
  }
});

/* =======================
   AUTH ROUTES
======================= */
app.post(`${BASE_PATH}/api/auth/register`, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    console.log('=== REGISTRATION REQUEST START ===');
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Doctor data keys:', req.body.doctorData ? Object.keys(req.body.doctorData) : 'No doctorData');
    
    await connection.beginTransaction();
    
    const { email, password, user_type, doctorData } = req.body;
    
    // Validate required fields
    if (!email || !password || !user_type) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Email, password, and user_type are required'
      });
    }
    
    // Check if user exists
    const [existingUser] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const [userResult] = await connection.query(
      'INSERT INTO users (email, password, user_type) VALUES (?, ?, ?)',
      [email, hashedPassword, user_type]
    );
    
    const userId = userResult.insertId;
    console.log('User created with ID:', userId);
    
    // Create doctor profile if doctor
    if (user_type === 'doctor' && doctorData) {
      console.log('Creating doctor profile for user:', userId);
      
      // Validate required doctor fields
      const requiredFields = ['full_name', 'qualification', 'specialization', 'registration_number'];
      const missingFields = requiredFields.filter(field => !doctorData[field]);
      
      if (missingFields.length > 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          error: 'Missing required doctor fields',
          missing: missingFields
        });
      }
      
      // Handle file uploads - IGNORE Base64 for now to fix insertion
      let digitalSignaturePath = null;
      let stampImagePath = null;
      let letterheadImagePath = null;
      
      // TEMPORARY: Ignore Base64 files to fix insertion
      if (doctorData.digital_signature_path && doctorData.digital_signature_path.startsWith('data:')) {
        console.log('Ignoring digital signature Base64 (temporary)');
        digitalSignaturePath = null;
      }
      
      if (doctorData.stamp_image_path && doctorData.stamp_image_path.startsWith('data:')) {
        console.log('Ignoring stamp image Base64 (temporary)');
        stampImagePath = null;
      }
      
      if (doctorData.letterhead_image_path && doctorData.letterhead_image_path.startsWith('data:')) {
        console.log('Ignoring letterhead Base64 (temporary)');
        letterheadImagePath = null;
      }
      
      try {
        // CORRECTED INSERT with proper column order
        const insertParams = [
          userId,
          doctorData.full_name,
          doctorData.qualification || null,
          doctorData.specialization || null,
          doctorData.registration_number,
          doctorData.clinic_name || null,
          doctorData.clinic_address || null,
          doctorData.clinic_phone || null,
          doctorData.email || email,
          doctorData.mobile || null,
          doctorData.experience_years || null,
          doctorData.consultation_fee || null,
          digitalSignaturePath,
          stampImagePath,
          letterheadImagePath
        ];
        
        console.log('Inserting doctor with params:', insertParams);
        
        const [doctorResult] = await connection.query(
          `INSERT INTO doctors (
            user_id, full_name, qualification, specialization, 
            registration_number, clinic_name, clinic_address, 
            clinic_phone, email, mobile, experience_years, 
            consultation_fee, digital_signature_path, 
            stamp_image_path, letterhead_image_path
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          insertParams
        );
        
        console.log('Doctor profile created successfully, ID:', doctorResult.insertId);
        
      } catch (dbError) {
        console.error('Doctor profile creation error:', dbError);
        console.error('SQL Error code:', dbError.code);
        console.error('SQL Error message:', dbError.message);
        
        // Rollback user creation
        await connection.query('DELETE FROM users WHERE id = ?', [userId]);
        await connection.rollback();
        connection.release();
        
        return res.status(500).json({
          error: 'Failed to create doctor profile',
          details: dbError.message,
          code: dbError.code
        });
      }
    }
    
    await connection.commit();
    connection.release();
    
    console.log('Registration completed successfully');
    
    res.status(201).json({ 
      message: 'User registered successfully',
      userId: userId,
      user_type: user_type
    });
    
  } catch (error) {
    console.error('Registration overall error:', error);
    
    if (connection) {
      try {
        await connection.rollback();
        connection.release();
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError);
      }
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      code: error.code
    });
  }
});


app.post(`${BASE_PATH}/api/auth/login`, async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Get user
        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = users[0];
        
        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Get doctor profile if exists
        let doctorProfile = null;
        if (user.user_type === 'doctor') {
            const [doctors] = await pool.query(
                'SELECT * FROM doctors WHERE user_id = ?',
                [user.id]
            );
            doctorProfile = doctors[0];
        }
        
        // Generate token
        const token = jwt.sign(
            { id: user.id, email: user.email, user_type: user.user_type },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                user_type: user.user_type
            },
            profile: doctorProfile
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post(`${BASE_PATH}/api/auth/forgot-password`, async (req, res) => {
    try {
        const { email } = req.body;
        
        const [users] = await pool.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const user = users[0];
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
        
        await pool.query(
            'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
            [resetToken, resetTokenExpiry, user.id]
        );
        
        // Send email
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Request',
            html: `
                <h2>Password Reset Request</h2>
                <p>Click the link below to reset your password:</p>
                <a href="${resetLink}">Reset Password</a>
                <p>This link will expire in 1 hour.</p>
            `
        };
        
        await transporter.sendMail(mailOptions);
        
        res.json({ message: 'Password reset link sent to email' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post(`${BASE_PATH}/api/auth/reset-password`, async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        const [users] = await pool.query(
            'SELECT id FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()',
            [token]
        );
        
        if (users.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }
        
        const user = users[0];
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        await pool.query(
            'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
            [hashedPassword, user.id]
        );
        
        res.json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 2. Doctor Profile Routes
app.get(`${BASE_PATH}/api/doctor/profile`, authenticateToken, async (req, res) => {
    try {
        const [doctors] = await pool.query(
            'SELECT * FROM doctors WHERE user_id = ?',
            [req.user.id]
        );
        
        if (doctors.length === 0) {
            return res.status(404).json({ error: 'Doctor profile not found' });
        }
        
        res.json(doctors[0]);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put(`${BASE_PATH}/api/doctor/profile`, authenticateToken, upload.fields([
    { name: 'digital_signature', maxCount: 1 },
    { name: 'stamp_image', maxCount: 1 },
    { name: 'letterhead_image', maxCount: 1 }
]), async (req, res) => {
    try {
        const updateData = req.body;
        const files = req.files;
        
        // Handle file uploads
        if (files) {
            if (files.digital_signature) {
                updateData.digital_signature_path = files.digital_signature[0].path;
            }
            if (files.stamp_image) {
                updateData.stamp_image_path = files.stamp_image[0].path;
            }
            if (files.letterhead_image) {
                updateData.letterhead_image_path = files.letterhead_image[0].path;
            }
        }
        
        // Build update query
        const updateFields = [];
        const updateValues = [];
        
        Object.keys(updateData).forEach(key => {
            if (key !== 'id' && key !== 'user_id') {
                updateFields.push(`${key} = ?`);
                updateValues.push(updateData[key]);
            }
        });
        
        updateValues.push(req.user.id);
        
        const query = `
            UPDATE doctors 
            SET ${updateFields.join(', ')}
            WHERE user_id = ?
        `;
        
        await pool.query(query, updateValues);
        
        // Get updated profile
        const [doctors] = await pool.query(
            'SELECT * FROM doctors WHERE user_id = ?',
            [req.user.id]
        );
        
        res.json(doctors[0]);
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 3. Medicine Routes
app.get(`${BASE_PATH}/api/medicines`, authenticateToken, async (req, res) => {
    try {
        const { search } = req.query;
        let query = 'SELECT * FROM medicines WHERE is_active = true';
        const params = [];
        
        if (search) {
            query += ' AND (name LIKE ? OR generic_name LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        
        query += ' ORDER BY name LIMIT 50';
        
        const [medicines] = await pool.query(query, params);
        res.json(medicines);
    } catch (error) {
        console.error('Get medicines error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// External medicine API integration
app.get(`${BASE_PATH}/api/medicines/external`, authenticateToken, async (req, res) => {
    try {
        const { search } = req.query;
        
        // Using OpenFDA API as an example
        const response = await axios.get(
            `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${search}"&limit=10`
        );
        
        const medicines = response.data.results.map(drug => ({
            name: drug.openfda?.brand_name?.[0] || 'Unknown',
            generic_name: drug.openfda?.generic_name?.[0] || '',
            brand: drug.openfda?.manufacturer_name?.[0] || '',
            strength: drug.openfda?.strength?.[0] || '',
            form: drug.openfda?.dosage_form?.[0] || '',
            manufacturer: drug.openfda?.manufacturer_name?.[0] || ''
        }));
        
        res.json(medicines);
    } catch (error) {
        console.error('External medicine API error:', error);
        // Fallback to local database
        const { search } = req.query;
        const [medicines] = await pool.query(
            'SELECT * FROM medicines WHERE name LIKE ? LIMIT 10',
            [`%${search}%`]
        );
        res.json(medicines);
    }
});

app.post(`${BASE_PATH}/api/medicines`, authenticateToken, async (req, res) => {
    try {
        const medicine = req.body;
        
        const [result] = await pool.query(
            `INSERT INTO medicines 
            (name, generic_name, brand, strength, form, manufacturer, schedule, created_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                medicine.name,
                medicine.generic_name,
                medicine.brand,
                medicine.strength,
                medicine.form,
                medicine.manufacturer,
                medicine.schedule,
                req.user.id
            ]
        );
        
        res.status(201).json({ id: result.insertId, ...medicine });
    } catch (error) {
        console.error('Add medicine error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 4. Patient Routes
app.get(`${BASE_PATH}/api/patients`, authenticateToken, async (req, res) => {
    try {
        const { search } = req.query;
        let query = `
            SELECT p.*, 
                   COUNT(pr.id) as prescription_count,
                   MAX(pr.created_at) as last_visit
            FROM patients p
            LEFT JOIN prescriptions pr ON p.id = pr.patient_id
            WHERE p.created_by = ?
        `;
        const params = [req.user.id];
        
        if (search) {
            query += ' AND (p.full_name LIKE ? OR p.mobile LIKE ? OR p.patient_id LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        query += ' GROUP BY p.id ORDER BY p.created_at DESC';
        
        const [patients] = await pool.query(query, params);
        res.json(patients);
    } catch (error) {
        console.error('Get patients error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post(`${BASE_PATH}/api/patients`, authenticateToken, async (req, res) => {
    try {
        const patient = req.body;
        
        // Generate patient ID
        const patientId = 'PAT' + Date.now().toString().slice(-8);
        
        const [result] = await pool.query(
            `INSERT INTO patients 
            (patient_id, full_name, age, sex, mobile, email, address, blood_group, allergies, created_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                patientId,
                patient.full_name,
                patient.age,
                patient.sex,
                patient.mobile,
                patient.email,
                patient.address,
                patient.blood_group,
                patient.allergies,
                req.user.id
            ]
        );
        
        res.status(201).json({ id: result.insertId, patient_id: patientId, ...patient });
    } catch (error) {
        console.error('Add patient error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 5. Prescription Routes
app.post(`${BASE_PATH}/api/prescriptions`, authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const {
            patient_id,
            patient_info,
            chief_complaint,
            history_of_present_illness,
            past_medical_history,
            past_surgical_history,
            diagnosis,
            follow_up_date,
            advice,
            consent_obtained,
            medicines,
            investigations
        } = req.body;
        
        let finalPatientId = patient_id;
        
        // Create new patient if no patient_id provided
        if (!patient_id && patient_info) {
            const patientId = 'PAT' + Date.now().toString().slice(-8);
            const [patientResult] = await connection.query(
                `INSERT INTO patients 
                (patient_id, full_name, age, sex, mobile, email, created_by) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    patientId,
                    patient_info.full_name,
                    patient_info.age,
                    patient_info.sex,
                    patient_info.mobile,
                    patient_info.email,
                    req.user.id
                ]
            );
            finalPatientId = patientResult.insertId;
        }
        
        // Get doctor info
        const [doctors] = await connection.query(
            'SELECT * FROM doctors WHERE user_id = ?',
            [req.user.id]
        );
        
        if (doctors.length === 0) {
            throw new Error('Doctor profile not found');
        }
        
        const doctor = doctors[0];
        
        // Generate prescription ID
        const prescriptionId = 'RX' + Date.now().toString().slice(-8);
        
        // Create prescription
        const [prescriptionResult] = await connection.query(
            `INSERT INTO prescriptions 
            (prescription_id, patient_id, doctor_id, chief_complaint, 
             history_of_present_illness, past_medical_history, past_surgical_history,
             diagnosis, follow_up_date, advice, consent_obtained) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                prescriptionId,
                finalPatientId,
                doctor.id,
                chief_complaint,
                history_of_present_illness,
                past_medical_history,
                past_surgical_history,
                diagnosis,
                follow_up_date,
                advice,
                consent_obtained || false
            ]
        );
        
        const prescriptionIdDb = prescriptionResult.insertId;
        
        // Add medicines
        if (medicines && medicines.length > 0) {
            for (const medicine of medicines) {
                await connection.query(
                    `INSERT INTO prescription_medicines 
                    (prescription_id, medicine_id, dosage, frequency, duration, instructions) 
                    VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        prescriptionIdDb,
                        medicine.medicine_id,
                        medicine.dosage,
                        medicine.frequency,
                        medicine.duration,
                        medicine.instructions
                    ]
                );
            }
        }
        
        // Add investigations
        if (investigations && investigations.length > 0) {
            for (const investigation of investigations) {
                await connection.query(
                    `INSERT INTO prescription_investigations 
                    (prescription_id, investigation_id, notes) 
                    VALUES (?, ?, ?)`,
                    [
                        prescriptionIdDb,
                        investigation.investigation_id,
                        investigation.notes
                    ]
                );
            }
        }
        
        // Add to patient history
        await connection.query(
            `INSERT INTO patient_history 
            (patient_id, doctor_id, visit_date, symptoms, diagnosis, treatment) 
            VALUES (?, ?, CURDATE(), ?, ?, ?)`,
            [
                finalPatientId,
                doctor.id,
                chief_complaint,
                diagnosis,
                JSON.stringify(medicines)
            ]
        );
        
        await connection.commit();
        
        res.status(201).json({
            prescription_id: prescriptionId,
            id: prescriptionIdDb,
            message: 'Prescription created successfully'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Create prescription error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        connection.release();
    }
});

app.get(`${BASE_PATH}/api/prescriptions/:id/pdf`, authenticateToken, async (req, res) => {
    try {
        const prescriptionId = req.params.id;
        
        // Get prescription with details
        const [prescriptions] = await pool.query(`
            SELECT p.*, 
                   pt.full_name as patient_name, pt.age, pt.sex, pt.mobile,
                   d.full_name as doctor_name, d.qualification, d.specialization,
                   d.registration_number, d.clinic_name, d.clinic_address, 
                   d.clinic_phone, d.digital_signature_path, d.stamp_image_path,
                   d.letterhead_image_path
            FROM prescriptions p
            JOIN patients pt ON p.patient_id = pt.id
            JOIN doctors d ON p.doctor_id = d.id
            WHERE p.id = ? AND d.user_id = ?
        `, [prescriptionId, req.user.id]);
        
        if (prescriptions.length === 0) {
            return res.status(404).json({ error: 'Prescription not found' });
        }
        
        const prescription = prescriptions[0];
        
        // Get medicines
        const [medicines] = await pool.query(`
            SELECT m.name, m.generic_name, m.strength, m.form,
                   pm.dosage, pm.frequency, pm.duration, pm.instructions
            FROM prescription_medicines pm
            JOIN medicines m ON pm.medicine_id = m.id
            WHERE pm.prescription_id = ?
        `, [prescriptionId]);
        
        // Get investigations
        const [investigations] = await pool.query(`
            SELECT i.name, i.category, pi.notes
            FROM prescription_investigations pi
            JOIN investigations i ON pi.investigation_id = i.id
            WHERE pi.prescription_id = ?
        `, [prescriptionId]);
        
        // Create PDF
        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=prescription-${prescription.prescription_id}.pdf`);
        
        doc.pipe(res);
        
        // Letterhead
        if (prescription.letterhead_image_path && fs.existsSync(prescription.letterhead_image_path)) {
            doc.image(prescription.letterhead_image_path, 50, 45, { width: 500 });
        } else {
            // Default header
            doc.fontSize(20).text('X PRESCRIPTION', { align: 'center' });
            doc.fontSize(12).text(prescription.clinic_name || 'Medical Clinic', { align: 'center' });
            doc.text(prescription.clinic_address || '', { align: 'center' });
            doc.text(`Phone: ${prescription.clinic_phone || ''}`, { align: 'center' });
        }
        
        doc.moveDown(2);
        
        // Patient Information
        doc.fontSize(14).text('PRESCRIPTION', { underline: true });
        doc.moveDown();
        
        doc.fontSize(10);
        doc.text(`Patient Name: ${prescription.patient_name}`);
        doc.text(`Age: ${prescription.age} | Sex: ${prescription.sex}`);
        doc.text(`Mobile: ${prescription.mobile || 'Not provided'}`);
        doc.text(`Date: ${new Date(prescription.created_at).toLocaleDateString()}`);
        doc.text(`Prescription ID: ${prescription.prescription_id}`);
        
        doc.moveDown();
        
        // Chief Complaint
        if (prescription.chief_complaint) {
            doc.text(`Chief Complaint: ${prescription.chief_complaint}`);
        }
        
        // History
        if (prescription.history_of_present_illness) {
            doc.text(`History: ${prescription.history_of_present_illness}`);
        }
        
        if (prescription.past_medical_history) {
            doc.text(`Past Medical History: ${prescription.past_medical_history}`);
        }
        
        if (prescription.past_surgical_history) {
            doc.text(`Past Surgical History: ${prescription.past_surgical_history}`);
        }
        
        // Diagnosis
        if (prescription.diagnosis) {
            doc.moveDown();
            doc.text(`Diagnosis: ${prescription.diagnosis}`);
        }
        
        // Medicines
        if (medicines.length > 0) {
            doc.moveDown();
            doc.fontSize(12).text('Medications:', { underline: true });
            doc.moveDown(0.5);
            
            medicines.forEach((med, index) => {
                doc.text(`${index + 1}. ${med.name} (${med.strength})`);
                doc.text(`   Dosage: ${med.dosage}, Frequency: ${med.frequency}, Duration: ${med.duration}`);
                if (med.instructions) {
                    doc.text(`   Instructions: ${med.instructions}`);
                }
                doc.moveDown(0.5);
            });
        }
        
        // Investigations
        if (investigations.length > 0) {
            doc.moveDown();
            doc.fontSize(12).text('Investigations Advised:', { underline: true });
            doc.moveDown(0.5);
            
            investigations.forEach((inv, index) => {
                doc.text(`${index + 1}. ${inv.name}`);
                if (inv.notes) {
                    doc.text(`   Notes: ${inv.notes}`);
                }
            });
        }
        
        // Advice
        if (prescription.advice) {
            doc.moveDown();
            doc.text(`Advice: ${prescription.advice}`);
        }
        
        // Follow-up
        if (prescription.follow_up_date) {
            doc.moveDown();
            doc.text(`Follow-up Date: ${new Date(prescription.follow_up_date).toLocaleDateString()}`);
        }
        
        // Consent
        if (prescription.consent_obtained) {
            doc.moveDown();
            doc.text('Consent: The patient was informed about complete treatment and prognosis of the illness.');
            doc.text('In case the complaint aggravates in absence of the doctor, please admit the patient.');
        }
        
        // Doctor's signature
        doc.moveDown(4);
        doc.text('________________________________');
        doc.text(`Dr. ${prescription.doctor_name}`);
        doc.text(prescription.qualification);
        doc.text(`Reg. No: ${prescription.registration_number}`);
        
        // Add digital signature if available
        if (prescription.digital_signature_path && fs.existsSync(prescription.digital_signature_path)) {
            doc.image(prescription.digital_signature_path, 400, doc.y - 100, { width: 100 });
        }
        
        // Add stamp if available
        if (prescription.stamp_image_path && fs.existsSync(prescription.stamp_image_path)) {
            doc.image(prescription.stamp_image_path, 400, doc.y + 20, { width: 80 });
        }
        
        doc.end();
    } catch (error) {
        console.error('Generate PDF error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 6. Certificate Routes
app.post(`${BASE_PATH}/api/certificates`, authenticateToken, async (req, res) => {
    try {
        const {
            patient_id,
            certificate_type,
            valid_until,
            content,
            diagnosis,
            recommendations,
            restrictions
        } = req.body;
        
        // Get doctor info
        const [doctors] = await pool.query(
            'SELECT id FROM doctors WHERE user_id = ?',
            [req.user.id]
        );
        
        if (doctors.length === 0) {
            return res.status(404).json({ error: 'Doctor profile not found' });
        }
        
        const doctor = doctors[0];
        const certificateId = 'CERT' + Date.now().toString().slice(-8);
        
        const [result] = await pool.query(
            `INSERT INTO certificates 
            (certificate_id, patient_id, doctor_id, certificate_type, 
             issue_date, valid_until, content, diagnosis, recommendations, restrictions) 
            VALUES (?, ?, ?, ?, CURDATE(), ?, ?, ?, ?, ?)`,
            [
                certificateId,
                patient_id,
                doctor.id,
                certificate_type,
                valid_until,
                content,
                diagnosis,
                recommendations,
                restrictions
            ]
        );
        
        res.status(201).json({
            id: result.insertId,
            certificate_id: certificateId,
            message: 'Certificate created successfully'
        });
    } catch (error) {
        console.error('Create certificate error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get(`${BASE_PATH}/api/certificates/:id/:type`, authenticateToken, async (req, res) => {
    try {
        const { id, type } = req.params;
        
        // type can be 'pdf' or 'json'
        
        const [certificates] = await pool.query(`
            SELECT c.*, 
                   p.full_name as patient_name, p.age, p.sex,
                   d.full_name as doctor_name, d.qualification, d.specialization,
                   d.registration_number, d.clinic_name, d.clinic_address,
                   d.digital_signature_path, d.stamp_image_path
            FROM certificates c
            JOIN patients p ON c.patient_id = p.id
            JOIN doctors d ON c.doctor_id = d.id
            WHERE c.id = ? AND d.user_id = ?
        `, [id, req.user.id]);
        
        if (certificates.length === 0) {
            return res.status(404).json({ error: 'Certificate not found' });
        }
        
        const certificate = certificates[0];
        
        if (type === 'pdf') {
            // Generate PDF certificate
            const doc = new PDFDocument({ margin: 50 });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=certificate-${certificate.certificate_id}.pdf`);
            
            doc.pipe(res);
            
            // Certificate Header
            doc.fontSize(20).text('MEDICAL CERTIFICATE', { align: 'center' });
            doc.moveDown();
            
            doc.fontSize(14).text('This is to certify that:', { align: 'center' });
            doc.moveDown(2);
            
            // Patient Details
            doc.fontSize(12);
            doc.text(`Name: ${certificate.patient_name}`);
            doc.text(`Age: ${certificate.age} | Sex: ${certificate.sex}`);
            doc.moveDown();
            
            // Certificate Content
            if (certificate.diagnosis) {
                doc.text(`Diagnosis: ${certificate.diagnosis}`);
            }
            
            if (certificate.content) {
                doc.moveDown();
                doc.text(certificate.content);
            }
            
            if (certificate.recommendations) {
                doc.moveDown();
                doc.text(`Recommendations: ${certificate.recommendations}`);
            }
            
            if (certificate.restrictions) {
                doc.moveDown();
                doc.text(`Restrictions: ${certificate.restrictions}`);
            }
            
            // Validity
            if (certificate.valid_until) {
                doc.moveDown();
                doc.text(`Valid Until: ${new Date(certificate.valid_until).toLocaleDateString()}`);
            }
            
            doc.text(`Issue Date: ${new Date(certificate.issue_date).toLocaleDateString()}`);
            
            // Doctor's signature
            doc.moveDown(4);
            doc.text('________________________________');
            doc.text(`Dr. ${certificate.doctor_name}`);
            doc.text(certificate.qualification);
            doc.text(`Reg. No: ${certificate.registration_number}`);
            doc.text(certificate.clinic_name);
            doc.text(certificate.clinic_address);
            
            doc.end();
        } else {
            res.json(certificate);
        }
    } catch (error) {
        console.error('Get certificate error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 7. Patient History
app.get(`${BASE_PATH}/api/patient-history/:patientId`, authenticateToken, async (req, res) => {
    try {
        const { patientId } = req.params;
        
        const [history] = await pool.query(`
            SELECT h.*, d.full_name as doctor_name
            FROM patient_history h
            JOIN doctors d ON h.doctor_id = d.id
            WHERE h.patient_id = ? AND d.user_id = ?
            ORDER BY h.visit_date DESC
        `, [patientId, req.user.id]);
        
        res.json(history);
    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 8. Investigations
app.get(`${BASE_PATH}/api/investigations`, authenticateToken, async (req, res) => {
    try {
        const [investigations] = await pool.query(
            'SELECT * FROM investigations WHERE is_active = true ORDER BY category, name'
        );
        res.json(investigations);
    } catch (error) {
        console.error('Get investigations error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 9. Share via Email
app.post(`${BASE_PATH}/api/share/email`, authenticateToken, async (req, res) => {
    try {
        const { to, subject, content, attachment } = req.body;
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: to,
            subject: subject,
            text: content,
            html: `<div>${content.replace(/\n/g, '<br>')}</div>`
        };
        
        // In a real implementation, you would attach the PDF file
        await transporter.sendMail(mailOptions);
        
        res.json({ message: 'Email sent successfully' });
    } catch (error) {
        console.error('Send email error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add temporary file storage for download links
const tempUploadDir = path.join(__dirname, 'temp_uploads');
if (!fs.existsSync(tempUploadDir)) fs.mkdirSync(tempUploadDir, { recursive: true });

// Cleanup old temp files every hour
setInterval(() => {
  const now = Date.now();
  fs.readdirSync(tempUploadDir).forEach(file => {
    const filePath = path.join(tempUploadDir, file);
    const stat = fs.statSync(filePath);
    // Delete files older than 24 hours
    if (now - stat.mtimeMs > 24 * 60 * 60 * 1000) {
      fs.unlinkSync(filePath);
    }
  });
}, 60 * 60 * 1000);

// Generate temporary download link
app.post(`${BASE_PATH}/api/prescriptions/temp-link`, authenticateToken, async (req, res) => {
  try {
    const { prescriptionId, base64Data } = req.body;
    
    // Generate unique ID
    const tempId = crypto.randomBytes(16).toString('hex');
    const fileName = `prescription-${prescriptionId}-${tempId}.pdf`;
    const filePath = path.join(tempUploadDir, fileName);
    
    // Save PDF
    const base64 = base64Data.replace(/^data:application\/pdf;base64,/, '');
    fs.writeFileSync(filePath, base64, 'base64');
    
    // Generate URL
    const downloadUrl = `${req.protocol}://${req.get('host')}${BASE_PATH}/temp/${fileName}`;
    
    res.json({ 
      url: downloadUrl,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
    
  } catch (error) {
    console.error('Temp link error:', error);
    res.status(500).json({ error: 'Failed to generate download link' });
  }
});

// Serve temp files
app.use(`${BASE_PATH}/temp`, express.static(tempUploadDir));

/* =======================
   START SERVER
======================= */
app.listen(PORT, () => {
  log(`Server started on port ${PORT}`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Base path: ${BASE_PATH}`);
  console.log(`Upload directory: ${uploadDir}`);
  console.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
});
