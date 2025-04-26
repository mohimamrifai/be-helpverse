import express from 'express';
import {
  createOrder,
  getUserOrders,
  getOrder,
  cancelOrder,
} from '../controllers/orders';
import { protect } from '../middlewares/auth';

const router = express.Router();

// Create order and get all user orders
router.route('/').post(protect, createOrder).get(protect, getUserOrders);

// Get single order
router.route('/:id').get(protect, getOrder);

// Cancel order
router.route('/:id/cancel').put(protect, cancelOrder);

export default router; 