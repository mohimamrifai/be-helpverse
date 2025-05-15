import express from 'express';
import {
  getUserNotifications,
  markNotificationAsRead,
  deleteNotification
} from '../controllers/notifications';
import { protect } from '../middlewares/auth';

const router = express.Router();

// Protected routes (require authentication)
router.get('/', protect, getUserNotifications);
router.put('/:id/read', protect, markNotificationAsRead);
router.delete('/:id', protect, deleteNotification);

export default router; 