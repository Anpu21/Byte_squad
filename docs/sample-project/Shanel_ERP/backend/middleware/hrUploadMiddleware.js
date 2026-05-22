/**
 * HR DOCUMENT UPLOAD MIDDLEWARE:
 * Configures Multer for handling file uploads related to employee records (NIC, CV, Certs).
 * - Target: backend/uploads/hr-documents
 * - Validation: Restricts to Images, PDF, and Word docs.
 * - Limit: 15MB per file.
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const hrDocsDir = path.join(__dirname, '../uploads/hr-documents');
if (!fs.existsSync(hrDocsDir)) {
    fs.mkdirSync(hrDocsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, hrDocsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `hr-doc-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type for HR document.'), false);
    }
};

const uploadHrDocument = multer({
    storage,
    fileFilter,
    limits: { fileSize: 15 * 1024 * 1024 }
});

module.exports = { uploadHrDocument, hrDocsDir };
