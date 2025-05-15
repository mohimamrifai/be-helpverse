import express, { Application, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import morgan from 'morgan';
import path from 'path';
import multer from 'multer';

import connectDB from './config/db';
import { fixEventIndices } from './utils/dbIndexFix';

// Load env vars
dotenv.config();

// Connect to database
connectDB().then(async () => {
  console.log('MongoDB Connected');
  // Fix event indices setelah database terhubung
  await fixEventIndices();
});

// Import routes
import authRoutes from './routes/auth';
import eventRoutes from './routes/events';
import orderRoutes from './routes/orders';
import adminRoutes from './routes/admin';
import waitingListRoutes from './routes/waitingList';
import notificationRoutes from './routes/notifications';

const app: Application = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Handle URL-encoded form data

// Cookie parser
app.use(cookieParser());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  limit: 100, // Limit each IP to 100 requests per window
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

// Apply rate limiting to all requests
app.use(limiter);

// CORS setup
const allowedOrigins = process.env.CLIENT_URL?.split(',') || ['http://localhost:5173'];
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Set static folder
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/waiting-list', waitingListRoutes);
app.use('/api/notifications', notificationRoutes);

// Base route
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to HelpVerse API',
  });
});

// Multer error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File terlalu besar, ukuran maksimum adalah 5MB',
      });
    }
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }
  
  // For other errors, pass to the next error handler
  next(err);
});

// General error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : {},
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: any) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  process.exit(1);
});

export default app; 