import mongoose, { Schema } from 'mongoose';
import { IEvent, ITicket, IOffer } from '../types';

// Ticket Schema
const TicketSchema = new Schema<ITicket>({
  name: {
    type: String,
    required: [true, 'Please add a ticket name'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please add a ticket description'],
  },
  price: {
    type: Number,
    required: [true, 'Please add a ticket price'],
    min: [0, 'Price cannot be negative'],
  },
  quantity: {
    type: Number,
    required: [true, 'Please add ticket quantity'],
    min: [1, 'Quantity must be at least 1'],
  },
  startDate: {
    type: Date,
    required: [true, 'Please add a start date for ticket sales'],
  },
  endDate: {
    type: Date,
    required: [true, 'Please add an end date for ticket sales'],
  },
  status: {
    type: String,
    enum: ['active', 'sold_out', 'expired', 'discontinued'],
    default: 'active',
  },
  seatArrangement: {
    rows: {
      type: Number,
      required: [true, 'Please specify number of rows'],
    },
    columns: {
      type: Number,
      required: [true, 'Please specify number of columns'],
    },
  },
  bookedSeats: [
    {
      row: {
        type: Number,
        required: true,
      },
      column: {
        type: Number,
        required: true,
      },
      bookingId: {
        type: String,
        required: true,
      },
    },
  ],
});

// Offer Schema
const OfferSchema = new Schema<IOffer>({
  name: {
    type: String,
    required: [true, 'Please add an offer name'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please add an offer description'],
  },
  code: {
    type: String,
    required: [true, 'Please add a promotional code'],
    unique: true,
    uppercase: true,
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: [true, 'Please specify discount type'],
  },
  discountValue: {
    type: Number,
    required: [true, 'Please add a discount value'],
    min: [0, 'Discount value cannot be negative'],
  },
  maxUses: {
    type: Number,
    required: [true, 'Please specify maximum number of uses'],
    default: 100,
  },
  currentUses: {
    type: Number,
    default: 0,
  },
  validFrom: {
    type: Date,
    required: [true, 'Please add a start date for the offer'],
  },
  validUntil: {
    type: Date,
    required: [true, 'Please add an end date for the offer'],
  },
  active: {
    type: Boolean,
    default: true,
  },
});

// Event Schema
const EventSchema = new Schema<IEvent>(
  {
    name: {
      type: String,
      required: [true, 'Please add an event name'],
      trim: true,
      maxlength: [100, 'Event name cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please add an event description'],
    },
    date: {
      type: Date,
      required: [true, 'Please add an event date'],
    },
    time: {
      type: String,
      required: [true, 'Please add an event time'],
    },
    location: {
      type: String,
      required: [true, 'Please add an event location'],
    },
    image: {
      type: String,
      required: [true, 'Please add an event image'],
    },
    tickets: [TicketSchema],
    totalSeats: {
      type: Number,
      required: [true, 'Please add total seats'],
    },
    availableSeats: {
      type: Number,
      required: [true, 'Please add available seats'],
    },
    published: {
      type: Boolean,
      default: false,
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    promotionalOffers: [OfferSchema],
    tags: [String],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add a virtual for checking if event is sold out
EventSchema.virtual('isSoldOut').get(function () {
  return this.availableSeats === 0;
});

// Add validation to check dates
EventSchema.pre('save', function (this: any, next) {
  // Check if event date is in the future
  if (this.date < new Date()) {
    throw new Error('Event date must be in the future');
  }

  // Validate tickets
  if (this.tickets.length === 0) {
    throw new Error('Event must have at least one ticket type');
  }

  // Check if promotional offers are valid
  this.promotionalOffers.forEach((offer: any) => {
    if (offer.validUntil < offer.validFrom) {
      throw new Error('Offer end date must be after start date');
    }
  });

  next();
});

const Event = mongoose.model<IEvent>('Event', EventSchema);

export default Event; 