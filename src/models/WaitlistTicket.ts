import mongoose, { Schema } from 'mongoose';
import { IWaitlistTicket } from '../types';

const WaitlistTicketSchema = new Schema<IWaitlistTicket>(
  {
    name: {
      type: String,
      required: [true, 'Nama tiket waitlist harus diisi'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Deskripsi tiket waitlist harus diisi'],
    },
    price: {
      type: Number,
      required: [true, 'Harga tiket waitlist harus diisi'],
      min: [0, 'Harga tidak boleh negatif'],
    },
    quantity: {
      type: Number,
      required: [true, 'Jumlah tiket waitlist harus diisi'],
      min: [1, 'Jumlah minimal 1'],
    },
    originalTicketRef: {
      type: String,
      required: [true, 'Referensi tiket asli harus diisi'],
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event harus ditentukan'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Pembuat tiket waitlist harus ditentukan'],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IWaitlistTicket>('WaitlistTicket', WaitlistTicketSchema); 