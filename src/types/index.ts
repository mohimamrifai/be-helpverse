import { Document, Types } from 'mongoose';

// User Interfaces
export interface IUser extends Document {
  id: string;
  username: string;
  email: string;
  password: string;
  fullName: string;
  phone: string;
  organizerName?: string;
  role: 'user' | 'eventOrganizer' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  matchPassword(enteredPassword: string): Promise<boolean>;
  getSignedJwtToken(): string;
}

// Ticket Interfaces
export interface ISeatArrangement {
  rows: number;
  columns: number;
}

export interface IBookedSeat {
  row: number;
  column: number;
  bookingId: string;
}

export interface ITicket extends Document {
  name: string;
  description: string;
  price: number;
  quantity: number;
  startDate: Date;
  endDate: Date;
  seatArrangement: ISeatArrangement;
  bookedSeats: IBookedSeat[];
  status: string;
}

// Offer Interfaces
export interface IOffer extends Document {
  name: string;
  description: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUses: number;
  currentUses: number;
  validFrom: Date;
  validUntil: Date;
  active: boolean;
}

// Event Interfaces
export interface IEvent extends Document {
  name: string;
  description: string;
  date: Date;
  time: string;
  location: string;
  image: string;
  tickets: Types.DocumentArray<ITicket>;
  totalSeats: number;
  availableSeats: number;
  published: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  promotionalOffers: Types.DocumentArray<IOffer>;
  tags: string[];
  createdBy: Types.ObjectId | IUser;
  createdAt: Date;
  updatedAt: Date;
}

// Order Interfaces
export interface IOrderTicket {
  ticketType: string;
  quantity: number;
  seats: { row: number; column: number }[];
  price: number;
}

export interface IPaymentInfo {
  method: string;
  transactionId: string;
  paidAt: Date;
}

export interface IOrder extends Document {
  user: Types.ObjectId | IUser;
  event: Types.ObjectId | IEvent;
  tickets: IOrderTicket[];
  totalAmount: number;
  discount: number;
  promoCode?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentInfo: IPaymentInfo;
  createdAt: Date;
  updatedAt: Date;
} 