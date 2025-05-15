import mongoose, { Document, Schema } from 'mongoose';

export interface IWaitingList extends Document {
  name: string;
  email: string;
  phone: string;
  event: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  registeredAt: Date;
  notes?: string;
  orderCompleted?: boolean;
}

const WaitingListSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Nama harus diisi'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email harus diisi'],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Harap berikan email yang valid',
      ],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Nomor telepon harus diisi'],
      trim: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event harus ditentukan'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
    },
    orderCompleted: {
      type: Boolean,
      default: false
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IWaitingList>('WaitingList', WaitingListSchema); 