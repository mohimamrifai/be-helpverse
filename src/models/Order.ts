import mongoose, { Schema } from 'mongoose';
import { IOrder } from '../types';

const OrderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    tickets: [
      {
        ticketType: {
          type: String,
          required: [true, 'Please add a ticket type'],
        },
        quantity: {
          type: Number,
          required: [true, 'Please add the quantity'],
          min: [1, 'Quantity must be at least 1'],
        },
        seats: [
          {
            row: {
              type: Number,
              required: true,
            },
            column: {
              type: Number,
              required: true,
            },
          },
        ],
        price: {
          type: Number,
          required: [true, 'Please add the price at purchase time'],
        },
        isWaitlist: {
          type: Boolean,
          default: false,
        }
      },
    ],
    totalAmount: {
      type: Number,
      required: [true, 'Please add the total amount'],
    },
    discount: {
      type: Number,
      default: 0,
    },
    promoCode: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending',
    },
    paymentInfo: {
      method: {
        type: String,
        required: [true, 'Please add payment method'],
      },
      transactionId: {
        type: String,
        required: [true, 'Please add transaction ID'],
      },
      paidAt: {
        type: Date,
        default: Date.now,
      },
    },
    isWaitlist: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Add pre-save hook to validate the order
OrderSchema.pre('save', async function (this: any, next) {
  // If status is being updated to 'confirmed', we need to update the event's available seats
  if (this.isModified('status') && this.status === 'confirmed') {
    try {
      // We could update the event's available seats here
      // But that's better handled in the controller with proper error handling
    } catch (error) {
      throw error;
    }
  }
  next();
});

// Create a compound index on user and event for faster queries
OrderSchema.index({ user: 1, event: 1 });

const Order = mongoose.model<IOrder>('Order', OrderSchema);

export default Order; 