import express from 'express';
import {
  getDailyReport,
  getWeeklyReport,
  getMonthlyReport,
  downloadReport,
  getAllReports
} from '../controllers/reports';
import { protect, authorize } from '../middlewares/auth';

const router = express.Router();

// Use protect and authorize middleware for all routes
router.use(protect, authorize('eventOrganizer', 'admin'));

// Report routes
router.route('/daily').get(getDailyReport);
router.route('/weekly').get(getWeeklyReport);
router.route('/monthly').get(getMonthlyReport);
router.route('/download').get(downloadReport);
router.route('/all').get(getAllReports);

export default router; 