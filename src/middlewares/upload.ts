import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import fs from 'fs';

// Pastikan direktori upload ada dengan path relatif terhadap root project
const uploadDir = path.join(process.cwd(), 'uploads/images');
console.log('Upload directory path (absolute):', uploadDir);

try {
  if (!fs.existsSync(uploadDir)) {
    console.log('Creating upload directory...');
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Upload directory created successfully at:', uploadDir);
  } else {
    console.log('Upload directory already exists at:', uploadDir);
  }
  
  // Periksa akses ke direktori
  try {
    fs.accessSync(uploadDir, fs.constants.R_OK | fs.constants.W_OK);
    console.log('Directory is accessible with read/write permissions');
  } catch (err) {
    console.error('Directory is not accessible with read/write permissions:', err);
  }
  
  // Write a test file to verify permissions
  const testFile = path.join(uploadDir, 'test.txt');
  try {
    fs.writeFileSync(testFile, 'Test file to verify write permissions');
    console.log('Successfully wrote test file at:', testFile);
    // Clean up test file
    fs.unlinkSync(testFile);
    console.log('Successfully deleted test file');
  } catch (err) {
    console.error('Failed to write test file:', err);
  }
} catch (error) {
  console.error('Error creating upload directory:', error);
}

// Set storage engine
const storage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb) {
    // Menggunakan 'uploads/images' (relatif terhadap root project)
    console.log('Storing file in directory (relative path): uploads/images');
    cb(null, 'uploads/images');
  },
  filename: function (req: Request, file: Express.Multer.File, cb) {
    const filename = `image-${Date.now()}${path.extname(file.originalname)}`;
    console.log('Generated filename:', filename);
    cb(null, filename);
  },
});

// Initialize upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // 5MB limit
  fileFilter: function (req: Request, file: Express.Multer.File, cb) {
    console.log('Received file:', file.originalname, 'Mimetype:', file.mimetype);
    checkFileType(file, cb);
  },
});

// Check file type
function checkFileType(
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  // Allowed file extensions
  const filetypes = /jpeg|jpg|png|gif/;
  // Check extension
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime type
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    console.log('File type check passed');
    return cb(null, true);
  } else {
    console.error('File type check failed. Only images are allowed.');
    cb(new Error('Error: Images Only! (jpeg, jpg, png, gif)'));
  }
}

export default upload; 