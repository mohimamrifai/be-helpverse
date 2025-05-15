import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Notification from '../models/Notification';
import notificationService from '../utils/notificationService';
import { IUser } from '../types';

// Interface untuk request dengan user
interface AuthRequest extends Request {
  user?: IUser;
}

// @desc    Mendapatkan semua notifikasi untuk user yang sedang login
// @route   GET /api/notifications
// @access  Private
export const getUserNotifications = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User tidak terautentikasi',
      });
    }

    const notifications = await notificationService.getUserNotifications(
      new mongoose.Types.ObjectId(req.user.id)
    );

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    console.error('Error in getUserNotifications:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mendapatkan notifikasi',
    });
  }
};

// @desc    Menandai notifikasi sebagai telah dibaca
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markNotificationAsRead = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User tidak terautentikasi',
      });
    }

    const { id } = req.params;

    // Cek apakah notifikasi milik user ini
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notifikasi tidak ditemukan',
      });
    }

    if (notification.recipient && notification.recipient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Anda tidak memiliki akses untuk notifikasi ini',
      });
    }

    const updatedNotification = await notificationService.markAsRead(id);

    res.status(200).json({
      success: true,
      data: updatedNotification,
    });
  } catch (error) {
    console.error('Error in markNotificationAsRead:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal menandai notifikasi sebagai dibaca',
    });
  }
};

// @desc    Menghapus notifikasi
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User tidak terautentikasi',
      });
    }

    const { id } = req.params;

    // Cek apakah notifikasi milik user ini
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notifikasi tidak ditemukan',
      });
    }

    if (notification.recipient && notification.recipient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Anda tidak memiliki akses untuk notifikasi ini',
      });
    }

    await notificationService.deleteNotification(id);

    res.status(200).json({
      success: true,
      message: 'Notifikasi berhasil dihapus',
    });
  } catch (error) {
    console.error('Error in deleteNotification:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal menghapus notifikasi',
    });
  }
}; 