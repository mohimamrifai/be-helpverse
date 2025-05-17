import mongoose, { Schema } from 'mongoose';
import { IUtilization } from '../types';

const UtilizationSchema = new Schema<IUtilization>(
  {
    date: {
      type: Date,
      required: [true, 'Please add a date'],
      unique: true,
    },
    total_hours_used: {
      type: Number,
      default: 0,
    },
    total_hours_available: {
      type: Number,
      default: 24, // Default tersedia 24 jam per hari
    },
    events: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Event',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Add virtual field for utilization percentage
UtilizationSchema.virtual('utilization_percentage').get(function () {
  if (this.total_hours_available === 0) return 0;
  return (this.total_hours_used / this.total_hours_available) * 100;
});

const Utilization = mongoose.model<IUtilization>('Utilization', UtilizationSchema);

export default Utilization; 