import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Password saat ini tidak boleh kosong'),
  body('newPassword')
    .notEmpty()
    .withMessage('Password baru tidak boleh kosong')
    .isLength({ min: 6 })
    .withMessage('Password baru harus minimal 6 karakter'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array().map(err => err.msg),
      });
    }
    next();
  }
]; 