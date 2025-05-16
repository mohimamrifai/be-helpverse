import dotenv from 'dotenv';
import connectDB from '../config/db';
import User from '../models/User';
import Event from '../models/Event';
import Order from '../models/Order';
import WaitingList from '../models/WaitingList';
import Notification from '../models/Notification';
import WaitlistTicket from '../models/WaitlistTicket';

// Load env vars
dotenv.config();

// Connect to DB
connectDB();

// Sample Data
// Admin user
const adminUser = {
  username: 'admin',
  email: 'admin@helpverse.com',
  password: 'admin123',
  fullName: 'Admin User',
  phone: '0123456789',
  role: 'admin',
};

// Event organizer
const eventOrganizer = {
  username: 'eventorganizer1',
  email: 'eventorganizer1@malaysiaevents.com',
  password: 'password123',
  fullName: 'Event Organizer 1',
  phone: '0123456790',
  organizerName: 'Malaysia Events Pro',
  role: 'eventOrganizer',
};

// Regular user
const regularUser = {
  username: 'user1',
  email: 'user1@example.com',
  password: 'password123',
  fullName: 'Regular User',
  phone: '0123456791',
  role: 'user',
};

// Sample event
const sampleEvent = {
  name: 'Tech Conference 2025',
  description: 'The premier tech event in Asia featuring talks from industry giants, workshops on emerging technologies, and networking opportunities. Topics include AI, blockchain, cloud computing, and digital transformation strategies.',
  date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
  time: '09:00:00',
  location: 'Kuala Lumpur Convention Centre, 50088 Kuala Lumpur',
  image: 'event-1.png',
  published: true,
  approvalStatus: 'approved',
  totalSeats: 230,
  availableSeats: 230,
  tags: ['tech', 'conference', 'networking'],
  tickets: [
    {
      name: 'VIP',
      description: 'VIP ticket for Tech Conference 2025',
      price: 100,
      quantity: 50,
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
      startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      status: 'active',
      seatArrangement: {
        rows: 5,
        columns: 10,
      },
      bookedSeats: [],
    },
    {
      name: 'Regular',
      description: 'Regular ticket for Tech Conference 2025', 
      price: 50,
      quantity: 80,
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
      startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      status: 'active',
      seatArrangement: {
        rows: 8,
        columns: 10,
      },
      bookedSeats: [],
    },
    {
      name: 'Economy',
      description: 'Economy ticket for Tech Conference 2025',
      price: 25,
      quantity: 100,
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
      startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      status: 'active',
      seatArrangement: {
        rows: 10,
        columns: 10,
      },
      bookedSeats: [],
    }
  ],
  promotionalOffers: [
    {
      name: 'Early Bird',
      description: 'Early Bird discount for Tech Conference 2025',
      code: 'EARLYBIRD',
      discountType: 'percentage',
      discountValue: 25,
      maxUses: 100,
      currentUses: 0,
      validFrom: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
      active: true,
    }
  ],
};

// Event with sold out tickets
const soldOutEvent = {
  name: 'K-Pop Concert 2024',
  description: 'The most anticipated K-Pop concert featuring top K-Pop groups and solo artists. Experience an unforgettable night of music, dance, and spectacular performances.',
  date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180), // 6 months from now
  time: '19:30:00',
  location: 'Axiata Arena, Bukit Jalil, 57000 Kuala Lumpur',
  image: 'event-2.png',
  published: true,
  approvalStatus: 'approved',
  totalSeats: 300,
  availableSeats: 0, // All seats are booked
  tags: ['music', 'concert', 'k-pop', 'entertainment'],
  tickets: [
    {
      name: 'Platinum',
      description: 'Front row seats with meet & greet session',
      price: 500,
      quantity: 50,
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 150),
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // Started a month ago
      status: 'sold_out',
      seatArrangement: {
        rows: 5,
        columns: 10,
      },
      bookedSeats: Array.from({ length: 50 }, (_, i) => ({
        row: Math.floor(i / 10) + 1,
        column: (i % 10) + 1,
        bookingId: `PLAT-${i+1000}`,
      })),
    },
    {
      name: 'Gold',
      description: 'Premium seats with exclusive merchandise',
      price: 300,
      quantity: 100,
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 150),
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
      status: 'sold_out',
      seatArrangement: {
        rows: 10,
        columns: 10,
      },
      bookedSeats: Array.from({ length: 100 }, (_, i) => ({
        row: Math.floor(i / 10) + 1,
        column: (i % 10) + 1,
        bookingId: `GOLD-${i+2000}`,
      })),
    },
    {
      name: 'Silver',
      description: 'Standard seating with good view',
      price: 150,
      quantity: 150,
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 150),
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
      status: 'sold_out',
      seatArrangement: {
        rows: 15,
        columns: 10,
      },
      bookedSeats: Array.from({ length: 150 }, (_, i) => ({
        row: Math.floor(i / 10) + 1,
        column: (i % 10) + 1,
        bookingId: `SILV-${i+3000}`,
      })),
    }
  ],
  promotionalOffers: [
    {
      name: 'Fan Club Discount',
      description: 'Special discount for fan club members',
      code: 'FANCLUB',
      discountType: 'percentage',
      discountValue: 15,
      maxUses: 200,
      currentUses: 200, // All uses consumed
      validFrom: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
      validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 120),
      active: false, // Disabled since all uses are consumed
    }
  ],
};

// Import data
const importData = async () => {
  try {
    // Clear database
    await User.deleteMany({});
    await Event.deleteMany({});
    await Order.deleteMany({});
    await WaitingList.deleteMany({});
    await Notification.deleteMany({});
    await WaitlistTicket.deleteMany({});
    
    console.log('Data cleaned...');

    // Option 1: Gunakan .save() untuk user agar pre-save middleware bekerja
    // Untuk user admin
    const admin = new User({
      username: adminUser.username,
      email: adminUser.email,
      password: adminUser.password,
      fullName: adminUser.fullName,
      phone: adminUser.phone,
      role: adminUser.role
    });
    await admin.save();
    
    // Untuk user event organizer
    const organizer = new User({
      username: eventOrganizer.username,
      email: eventOrganizer.email,
      password: eventOrganizer.password,
      fullName: eventOrganizer.fullName,
      phone: eventOrganizer.phone,
      organizerName: eventOrganizer.organizerName,
      role: eventOrganizer.role
    });
    await organizer.save();
    
    // Untuk regular user
    const regular = new User({
      username: regularUser.username,
      email: regularUser.email,
      password: regularUser.password,
      fullName: regularUser.fullName,
      phone: regularUser.phone,
      role: regularUser.role
    });
    await regular.save();
    
    console.log('Users imported...');

    // Create event with the event organizer as creator
    const eventObj = { ...sampleEvent, createdBy: organizer._id };
    await Event.create(eventObj);
    
    // Create sold out event
    const soldOutEventObj = { ...soldOutEvent, createdBy: organizer._id };
    await Event.create(soldOutEventObj);
    
    console.log('Events imported...');
    console.log('Data imported successfully!');
    
    // Log sold out event information to console
    console.log('===============================================');
    console.log('SOLD OUT EVENT DETAILS:');
    console.log('===============================================');
    console.log(`Event Name: ${soldOutEvent.name}`);
    console.log(`Total Seats: ${soldOutEvent.totalSeats}`);
    console.log(`Available Seats: ${soldOutEvent.availableSeats}`);
    console.log('Tickets:');
    soldOutEvent.tickets.forEach(ticket => {
      console.log(`  - ${ticket.name}: ${ticket.quantity} tickets (Status: ${ticket.status})`);
    });
    console.log('===============================================');
    
    process.exit();
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Error: ${err.message}`);
    } else {
      console.error('Unknown error occurred while importing data');
    }
    process.exit(1);
  }
};

// Delete data
const deleteData = async () => {
  try {
    await User.deleteMany({});
    await Event.deleteMany({});
    await Order.deleteMany({});
    await WaitingList.deleteMany({});
    await Notification.deleteMany({});
    await WaitlistTicket.deleteMany({});

    console.log('Data destroyed successfully!');
    process.exit();
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Error: ${err.message}`);
    } else {
      console.error('Unknown error occurred while deleting data');
    }
    process.exit(1);
  }
};

// Determine action based on command line argument
if (process.argv[2] === '-d') {
  deleteData();
} else {
  importData();
}; 