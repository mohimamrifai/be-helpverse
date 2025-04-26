import express from 'express';
import {
  getAllEvents,
  getUsers,
  updateUserRole,
  getAllOrders,
  getStats,
} from '../controllers/admin';
import { protect, authorize } from '../middlewares/auth';

const router = express.Router();

// Use protect and authorize middleware for all routes
router.use(protect, authorize('admin'));

// Admin routes
router.route('/events').get(getAllEvents);
router.route('/users').get(getUsers);
router.route('/users/:id/role').put(updateUserRole);
router.route('/orders').get(getAllOrders);
router.route('/stats').get(getStats);

export default router; 