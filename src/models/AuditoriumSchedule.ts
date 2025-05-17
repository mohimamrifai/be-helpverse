import mongoose, { Schema } from 'mongoose';
import { IAuditoriumSchedule } from '../types';

const AuditoriumScheduleSchema = new Schema<IAuditoriumSchedule>(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    startTime: {
      type: Date,
      required: [true, 'Please add a start time'],
    },
    endTime: {
      type: Date,
      required: [true, 'Please add an end time'],
    },
    booked_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add validation to check dates
AuditoriumScheduleSchema.pre('save', function (this: any, next) {
  // Check if start time is before end time
  if (this.startTime >= this.endTime) {
    throw new Error('Start time must be before end time');
  }

  // Check if event is on the same day
  const startDate = new Date(this.startTime);
  const endDate = new Date(this.endTime);
  
  if (
    startDate.getFullYear() !== endDate.getFullYear() ||
    startDate.getMonth() !== endDate.getMonth() ||
    startDate.getDate() !== endDate.getDate()
  ) {
    throw new Error('Event must start and end on the same day');
  }

  next();
});

const AuditoriumSchedule = mongoose.model<IAuditoriumSchedule>('AuditoriumSchedule', AuditoriumScheduleSchema);

export default AuditoriumSchedule; 