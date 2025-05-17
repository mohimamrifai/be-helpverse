import express from 'express';
import {
  getAuditoriumSchedule,
  getEventsHeld,
  getAuditoriumUtilization
} from '../../controllers/admin/auditorium';
import { protect, authorize } from '../../middlewares/auth';

const router = express.Router();

// Use protect and authorize middleware for all routes
router.use(protect, authorize('admin'));

// Admin auditorium routes
router.route('/schedule').get(getAuditoriumSchedule);
router.route('/events-held').get(getEventsHeld);
router.route('/utilization').get(getAuditoriumUtilization);

export default router; 