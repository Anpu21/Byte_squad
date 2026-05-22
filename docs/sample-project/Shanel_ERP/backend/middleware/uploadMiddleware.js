const multer = require('multer');    //Used for handling file uploads.
const path = require('path');        //Helps work with file paths safely
const fs = require('fs');            //File System module → used to create/check upload folders.

// ─── ENSURE UPLOADS DIRECTORY EXISTS ────────────────────────────────────────
//Creates the full path to the uploads folder.  __dirname is the current folder location
const uploadsDir = path.join(__dirname, '../uploads');  

//Checks if the folder already exists. If not, it creates the folder.
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });      //Creates the folder automatically.
    console.log('✓ Uploads directory created');
}

// ─── CONFIGURE STORAGE (save location) ────────────────────────────────────────────────────────
//this tells multer where to save files and what filename to use
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    // Create unique filename: product-timestamp-randomnumber.ext
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${name}-${uniqueSuffix}${ext}`);
    }
});

// ─── FILE FILTER (only allow images) ───────────────────────────────────────────
//this check file type before upload
const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);          //upload accepted
    } else {
        cb(new Error(`Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.`), false);
    }
};

// ─── CONFIGURE MULTER ────────────────────────────────────────────────────────
//create multer instance (upload middleware)
const upload = multer({
    storage: storage,           //use storage setting we created 
    fileFilter: fileFilter,      //use image validation
    limits: {
        fileSize: 5 * 1024 * 1024   // 5MB max -  if bigger file too larger error occurs
    }
});

module.exports = upload;
