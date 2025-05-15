import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateWaitlistTickets = [
  body('waitlistTickets')
    .isArray({ min: 1 })
    .withMessage('Data tiket waitlist tidak boleh kosong dan harus berbentuk array'),
  body('waitlistTickets.*.name')
    .notEmpty()
    .withMessage('Nama tiket waitlist tidak boleh kosong')
    .trim(),
  body('waitlistTickets.*.description')
    .optional()
    .trim(),
  body('waitlistTickets.*.price')
    .optional()
    .isNumeric()
    .withMessage('Harga harus berupa angka')
    .isFloat({ min: 0 })
    .withMessage('Harga tidak boleh negatif'),
  body('waitlistTickets.*.quantity')
    .notEmpty()
    .withMessage('Jumlah tiket waitlist tidak boleh kosong')
    .isInt({ min: 1 })
    .withMessage('Jumlah tiket minimal 1'),
  body('waitlistTickets.*.originalTicketRef')
    .notEmpty()
    .withMessage('Referensi ke tiket asli tidak boleh kosong')
    .trim(),
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