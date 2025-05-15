import express from 'express';
import {
  registerToWaitingList,
  getUserWaitingList,
  deleteUserWaitingList
} from '../controllers/waitingList';
import { 
  validateWaitingList, 
  validateDeleteWaitingList 
} from '../validators/waitingList';

const router = express.Router();

// Public routes
router.post('/', validateWaitingList, registerToWaitingList);
router.get('/', getUserWaitingList);
router.delete('/:id', validateDeleteWaitingList, deleteUserWaitingList);

export default router; 