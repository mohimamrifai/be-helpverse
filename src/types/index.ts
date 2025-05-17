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
  isWaitlist?: boolean;
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
  isWaitlist?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Waitlist Ticket Interfaces
export interface IWaitlistTicket extends Document {
  name: string;
  description: string;
  price: number;
  quantity: number;
  originalTicketRef: string; // Referensi ke jenis tiket asli
  event: Types.ObjectId | IEvent;
  createdBy: Types.ObjectId | IUser;
  createdAt: Date;
  updatedAt: Date;
}

// Notification Interface
export interface INotification extends Document {
  recipient?: Types.ObjectId | IUser;
  email?: string;
  title: string;
  message: string;
  type: 'waitlist_ticket' | 'event_update' | 'order_confirmation' | 'system';
  eventId?: Types.ObjectId | IEvent;
  ticketId?: Types.ObjectId | IWaitlistTicket;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// AuditoriumSchedule Interface
export interface IAuditoriumSchedule extends Document {
  event: Types.ObjectId | IEvent;
  startTime: Date;
  endTime: Date;
  booked_by: Types.ObjectId | IUser;
  createdAt: Date;
  updatedAt: Date;
}

// Utilization Interface
export interface IUtilization extends Document {
  date: Date;
  total_hours_used: number;
  total_hours_available: number;
  events: Types.Array<Types.ObjectId | IEvent>;
  createdAt: Date;
  updatedAt: Date;
  utilization_percentage?: number;
}

// Report Interfaces
export interface IDailyReport {
  date: Date;
  ticketsSold: number;
  revenue: number;
  occupancyPercentage: number;
  salesData: {
    hour: number;
    count: number;
  }[];
  revenueData: {
    hour: number;
    amount: number;
  }[];
}

export interface IWeeklyReport {
  startDate: Date;
  endDate: Date;
  ticketsSold: number;
  revenue: number;
  occupancyPercentage: number;
  salesData: {
    day: string;
    count: number;
  }[];
  revenueData: {
    day: string;
    amount: number;
  }[];
}

export interface IMonthlyReport {
  month: number;
  year: number;
  ticketsSold: number;
  revenue: number;
  occupancyPercentage: number;
  salesData: {
    day: number;
    count: number;
  }[];
  revenueData: {
    day: number;
    amount: number;
  }[];
} 