import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateWaitingList = [
  body('name')
    .notEmpty()
    .withMessage('Nama lengkap tidak boleh kosong')
    .trim(),
  body('email')
    .notEmpty()
    .withMessage('Email tidak boleh kosong')
    .isEmail()
    .withMessage('Email tidak valid')
    .normalizeEmail(),
  body('event')
    .notEmpty()
    .withMessage('Event tidak boleh kosong')
    .isMongoId()
    .withMessage('Format event ID tidak valid'),
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

export const validateDeleteWaitingList = [
  body('email')
    .notEmpty()
    .withMessage('Email tidak boleh kosong')
    .isEmail()
    .withMessage('Email tidak valid')
    .normalizeEmail(),
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