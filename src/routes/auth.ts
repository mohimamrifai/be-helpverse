import express from 'express';
import {
  register,
  registerEventOrganizer,
  login,
  getMe,
  logout,
  changePassword,
} from '../controllers/auth';
import { protect } from '../middlewares/auth';
import { validateChangePassword } from '../validators/auth';

const router = express.Router();

router.post('/register', register);
router.post('/register/event-organizer', registerEventOrganizer);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);
router.put('/change-password', protect, validateChangePassword, changePassword);

export default router; 