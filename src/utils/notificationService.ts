import Notification from '../models/Notification';
import WaitingList from '../models/WaitingList';
import Event from '../models/Event';
import User from '../models/User';
import mongoose from 'mongoose';

/**
 * Service untuk mengelola notifikasi
 */
class NotificationService {
  /**
   * Membuat notifikasi baru untuk user terdaftar
   */
  async createNotification(data: {
    recipientId: mongoose.Types.ObjectId | string;
    title: string;
    message: string;
    type: 'waitlist_ticket' | 'event_update' | 'order_confirmation' | 'system';
    eventId?: mongoose.Types.ObjectId | string;
    ticketId?: mongoose.Types.ObjectId | string;
  }) {
    try {
      return await Notification.create({
        recipient: data.recipientId,
        title: data.title,
        message: data.message,
        type: data.type,
        eventId: data.eventId,
        ticketId: data.ticketId,
        isRead: false,
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Mendapatkan semua notifikasi user berdasarkan ID
   */
  async getUserNotifications(userId: mongoose.Types.ObjectId | string) {
    try {
      return await Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .populate('eventId', 'name date location')
        .populate('ticketId', 'name price');
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  /**
   * Menandai notifikasi sebagai telah dibaca
   */
  async markAsRead(notificationId: mongoose.Types.ObjectId | string) {
    try {
      return await Notification.findByIdAndUpdate(
        notificationId,
        { isRead: true },
        { new: true }
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mengirim notifikasi ke semua user yang terdaftar dalam waiting list untuk event tertentu
   */
  async notifyWaitlistUsers(eventId: mongoose.Types.ObjectId | string, ticketId: mongoose.Types.ObjectId | string, message: string) {
    try {
      // Dapatkan event untuk informasi yang lebih lengkap
      const event = await Event.findById(eventId);
      if (!event) {
        throw new Error('Event tidak ditemukan');
      }

      // Dapatkan semua user dalam waiting list untuk event ini yang belum memesan tiket
      const waitlistUsers = await WaitingList.find({ 
        event: eventId,
        orderCompleted: { $ne: true } // Hanya yang belum memesan
      });
      
      if (waitlistUsers.length === 0) {
        return { success: true, message: 'Tidak ada user dalam waiting list', count: 0 };
      }

      let notificationCount = 0;

      // Untuk setiap entri waitlist, cari user berdasarkan email dan kirim notifikasi
      for (const waitlistEntry of waitlistUsers) {
        // Cari user berdasarkan email
        const user = await User.findOne({ email: waitlistEntry.email });
        
        // Jika user ditemukan, kirim notifikasi
        if (user && user._id) {
          await this.createNotification({
            recipientId: user._id.toString(),
            title: `Tiket Waitlist Tersedia: ${event.name}`,
            message,
            type: 'waitlist_ticket',
            eventId,
            ticketId,
          });
          notificationCount++;
        }
      }

      return {
        success: true,
        message: `Notifikasi berhasil dikirim ke ${notificationCount} user dalam waiting list`,
        count: notificationCount
      };
    } catch (error) {
      console.error('Error notifying waitlist users:', error);
      throw error;
    }
  }

  /**
   * Menghapus notifikasi
   */
  async deleteNotification(notificationId: mongoose.Types.ObjectId | string) {
    try {
      return await Notification.findByIdAndDelete(notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
}

export default new NotificationService(); 