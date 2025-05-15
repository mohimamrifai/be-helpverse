import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from '../types';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId | IUser;
  title: string;
  message: string;
  type: 'waitlist_ticket' | 'event_update' | 'order_confirmation' | 'system';
  eventId?: mongoose.Types.ObjectId;
  ticketId?: mongoose.Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Penerima notifikasi harus ditentukan'],
    },
    title: {
      type: String,
      required: [true, 'Judul notifikasi harus diisi'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Pesan notifikasi harus diisi'],
    },
    type: {
      type: String,
      enum: ['waitlist_ticket', 'event_update', 'order_confirmation', 'system'],
      default: 'system',
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
    },
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WaitlistTicket',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<INotification>('Notification', NotificationSchema); 