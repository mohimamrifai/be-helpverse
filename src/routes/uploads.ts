import express from 'express';
import { Request, Response, NextFunction } from 'express';
import upload from '../middlewares/upload';
import { protect, authorize } from '../middlewares/auth';
import { deleteFile } from '../utils/fileHelper';

const router = express.Router();

// @route   POST /api/uploads/image
// @desc    Upload an image
// @access  Private (requires authentication)
router.post(
  '/image',
  protect,
  upload.single('image'),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Please upload a file',
        });
      }

      // Return file info with path
      res.status(200).json({
        success: true,
        data: {
          fileName: req.file.filename,
          filePath: `/uploads/images/${req.file.filename}`,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// @route   DELETE /api/uploads/image
// @desc    Delete an image
// @access  Private (requires authentication)
router.delete(
  '/image',
  protect,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { filePath } = req.body;

      if (!filePath) {
        return res.status(400).json({
          success: false,
          error: 'Harap berikan path file yang akan dihapus',
        });
      }

      const deleted = await deleteFile(filePath);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'File tidak ditemukan',
        });
      }

      res.status(200).json({
        success: true,
        data: {},
        message: 'File berhasil dihapus',
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router; 