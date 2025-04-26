import express from 'express';
import {
  registerToWaitingList,
  getUserWaitingList,
  getWaitingList,
  getWaitingListById,
  updateWaitingListStatus,
  deleteWaitingList,
  deleteUserWaitingList
} from '../controllers/waitingList';
import { 
  validateWaitingList, 
  validateUpdateWaitingList,
  validateDeleteWaitingList 
} from '../validators/waitingList';
import { protect, authorize } from '../middlewares/auth';

const router = express.Router();

// Public routes
router.post('/', validateWaitingList, registerToWaitingList);
router.get('/', getUserWaitingList);
router.delete('/:id', validateDeleteWaitingList, deleteUserWaitingList);

// Admin routes
router
  .route('/admin')
  .get(protect, authorize('admin'), getWaitingList);

router
  .route('/admin/:id')
  .get(protect, authorize('admin'), getWaitingListById)
  .put(protect, authorize('admin'), validateUpdateWaitingList, updateWaitingListStatus)
  .delete(protect, authorize('admin'), deleteWaitingList);

export default router; 