import dotenv from 'dotenv';
import connectDB from '../config/db';
import User from '../models/User';
import Event from '../models/Event';
import Order from '../models/Order';
import WaitingList from '../models/WaitingList';
import Notification from '../models/Notification';
import WaitlistTicket from '../models/WaitlistTicket';
import AuditoriumSchedule from '../models/AuditoriumSchedule';
import Utilization from '../models/Utilization';
import mongoose from 'mongoose';

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

// Utility function to generate deterministic occupancy based on event name and date
function generateDeterministicOccupancy(eventName: string, date: Date): number {
  // Use string hash function for deterministic value
  const hashString = `${eventName}-${date.toISOString().split('T')[0]}`;
  let hash = 0;
  for (let i = 0; i < hashString.length; i++) {
    const char = hashString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Generate occupancy between 10% and 85%
  const minOccupancy = 10;
  const maxOccupancy = 85;
  const normalizedHash = Math.abs(hash) / 2147483647; // Normalize between 0 and 1
  return minOccupancy + (normalizedHash * (maxOccupancy - minOccupancy));
}

// Utility function to generate deterministic utilization based on date
function generateDeterministicUtilization(date: Date): number {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const dateNum = date.getDate();
  
  // Base utilization - higher on weekends, variable on weekdays
  let baseUtilization = isWeekend ? 60 : 40;
  
  // Add variation based on date of month (higher toward end of month)
  const dateVariation = (dateNum / 31) * 15;
  
  // Add some deterministic randomness based on full date
  const hashString = date.toISOString().split('T')[0];
  let hash = 0;
  for (let i = 0; i < hashString.length; i++) {
    const char = hashString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const randomFactor = (Math.abs(hash) % 1000) / 1000 * 10; // ±10% variation
  
  // Combine factors and ensure within range 30-79%
  const utilization = Math.max(30, Math.min(79, baseUtilization + dateVariation + randomFactor - 5));
  return utilization;
}

// Import data
const importData = async (shouldExit = true) => {
  try {
    // Clear database
    await User.deleteMany({});
    await Event.deleteMany({});
    await Order.deleteMany({});
    await WaitingList.deleteMany({});
    await Notification.deleteMany({});
    await WaitlistTicket.deleteMany({});
    await AuditoriumSchedule.deleteMany({});
    await Utilization.deleteMany({});
    
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

    // Tambahkan event ke database
    const techEvent = new Event({
      ...sampleEvent,
      createdBy: organizer._id
    });
    await techEvent.save();
    
    const kpopEvent = new Event({
      ...soldOutEvent,
      createdBy: organizer._id
    });
    await kpopEvent.save();
    
    console.log('Events imported...');

    // Buat beberapa event tambahan untuk data demo
    const events = [
      {
        name: 'Business Seminar 2024',
        description: 'Join industry leaders to discuss the future of business in the digital age. Learn from experts about emerging trends, leadership strategies, and digital transformation.',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90), // 3 months from now
        time: '10:00:00',
        location: 'Kuala Lumpur Convention Centre, 50088 Kuala Lumpur',
        totalSeats: 150,
        availableSeats: 50,
        published: true,
        approvalStatus: 'approved',
        createdBy: organizer._id,
        tickets: [
          {
            name: 'Standard',
            description: 'Standard ticket for Business Seminar 2024',
            price: 75,
            quantity: 100,
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 89),
            startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10),
            status: 'active',
            seatArrangement: {
              rows: 10,
              columns: 15,
            },
            bookedSeats: [],
          },
          {
            name: 'VIP',
            description: 'VIP ticket with networking session for Business Seminar 2024',
            price: 150,
            quantity: 50,
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 89),
            startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10),
            status: 'active',
            seatArrangement: {
              rows: 5,
              columns: 10,
            },
            bookedSeats: [],
          }
        ]
      },
      {
        name: 'Art Exhibition 2024',
        description: 'Explore the works of renowned artists from across Asia. This exhibition features paintings, sculptures, and digital art that showcase cultural diversity and artistic innovation.',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45), // 45 days from now
        time: '14:00:00',
        location: 'National Art Gallery, 50480 Kuala Lumpur',
        totalSeats: 200,
        availableSeats: 100,
        published: true,
        approvalStatus: 'approved',
        createdBy: organizer._id,
        tickets: [
          {
            name: 'General',
            description: 'General admission ticket for Art Exhibition 2024',
            price: 35,
            quantity: 150,
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 44),
            startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
            status: 'active',
            seatArrangement: {
              rows: 10,
              columns: 20,
            },
            bookedSeats: [],
          },
          {
            name: 'Premium',
            description: 'Premium ticket with guided tour for Art Exhibition 2024',
            price: 80,
            quantity: 50,
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 44),
            startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
            status: 'active',
            seatArrangement: {
              rows: 5,
              columns: 10,
            },
            bookedSeats: [],
          }
        ]
      },
      {
        name: 'Food Festival 2024',
        description: 'Experience the best of Malaysian cuisine and international dishes. This culinary event features cooking demonstrations, tasting sessions, and food competitions.',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60), // 2 months from now
        time: '11:00:00',
        location: 'MITEC, 50480 Kuala Lumpur',
        totalSeats: 500,
        availableSeats: 300,
        published: true,
        approvalStatus: 'approved',
        createdBy: organizer._id,
        tickets: [
          {
            name: 'Food Lover',
            description: 'Standard access ticket for Food Festival 2024',
            price: 65,
            quantity: 400,
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 59),
            startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15),
            status: 'active',
            seatArrangement: {
              rows: 20,
              columns: 25,
            },
            bookedSeats: [],
          },
          {
            name: 'Gourmet',
            description: 'Premium access with tasting sessions for Food Festival 2024',
            price: 120,
            quantity: 100,
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 59),
            startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15),
            status: 'active',
            seatArrangement: {
              rows: 10,
              columns: 10,
            },
            bookedSeats: [],
          }
        ]
      }
    ];

    for (const event of events) {
      const newEvent = new Event(event);
      await newEvent.save();
    }

    // Create Auditorium Schedule for each event
    const allEvents = await Event.find();
    
    for (const event of allEvents) {
      const eventDate = new Date(event.date);
      const [hours, minutes, seconds] = event.time.split(':').map(Number);
      
      // Create start time
      const startTime = new Date(eventDate);
      startTime.setHours(hours, minutes, seconds);
      
      // Create end time (assuming event is 3 hours)
      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + 3);
      
      const schedule = new AuditoriumSchedule({
        event: event._id,
        startTime,
        endTime,
        booked_by: event.createdBy
      });
      
      await schedule.save();
      
      // Update the event with realistic occupancy values
      const occupancyPercentage = generateDeterministicOccupancy(event.name, eventDate);
      const occupiedSeats = Math.round((event.totalSeats * occupancyPercentage) / 100);
      event.availableSeats = event.totalSeats - occupiedSeats;
      await event.save();
      
      // Create utilization record for this date with realistic values
      const dateKey = eventDate.toISOString().split('T')[0];
      let utilization = await Utilization.findOne({ 
        date: { 
          $gte: new Date(dateKey), 
          $lt: new Date(new Date(dateKey).getTime() + 24 * 60 * 60 * 1000) 
        } 
      });
      
      if (!utilization) {
        const utilizationPercentage = generateDeterministicUtilization(eventDate);
        const totalHoursAvailable = 24;
        const totalHoursUsed = Math.round((utilizationPercentage / 100) * totalHoursAvailable * 10) / 10;
        
        utilization = new Utilization({
          date: eventDate,
          total_hours_used: totalHoursUsed,
          total_hours_available: totalHoursAvailable,
          events: [event._id]
        });
      } else {
        // For multiple events on the same day, just add the event to the list
        // but keep the existing utilization percentage
        utilization.events.push(event._id);
      }
      
      await utilization.save();
    }
    
    console.log('Auditorium schedules and utilization data imported...');
    
    // Create future events and auditorium schedules (for testing the auditorium management feature)
    const createFutureEvents = async () => {
      console.log('Creating future events and schedules...');
      
      // Define event templates
      const eventTemplates = [
        {
          name: 'Tech Summit 2025',
          description: 'A tech conference focusing on AI, blockchain, and emerging technologies. Features renowned speakers, workshops, and networking opportunities.',
          time: '09:00:00',
          location: 'Kuala Lumpur Convention Centre, Main Hall',
          totalSeats: 400,
          availableSeats: 400,
          published: true,
          approvalStatus: 'approved'
        },
        {
          name: 'Classical Music Concert',
          description: 'An evening of classical music featuring works by Mozart, Beethoven, and Bach performed by the Malaysian Philharmonic Orchestra.',
          time: '19:30:00',
          location: 'Kuala Lumpur Convention Centre, Auditorium',
          totalSeats: 350,
          availableSeats: 350,
          published: true,
          approvalStatus: 'approved'
        },
        {
          name: 'Business Leadership Forum',
          description: 'A gathering of business leaders to discuss economic trends, leadership strategies, and business transformation in the digital age.',
          time: '10:00:00',
          location: 'Kuala Lumpur Convention Centre, Conference Room',
          totalSeats: 250,
          availableSeats: 250,
          published: true,
          approvalStatus: 'approved'
        },
        {
          name: 'Startup Pitch Competition',
          description: 'An exciting competition where startups pitch their business ideas to a panel of investors and industry experts.',
          time: '14:00:00',
          location: 'Kuala Lumpur Convention Centre, Exhibition Hall',
          totalSeats: 200,
          availableSeats: 200,
          published: true,
          approvalStatus: 'approved'
        },
        {
          name: 'Cultural Festival',
          description: 'A celebration of Malaysian culture featuring traditional dance, music, food, and crafts from various ethnic groups.',
          time: '11:00:00',
          location: 'Kuala Lumpur Convention Centre, Grand Ballroom',
          totalSeats: 500,
          availableSeats: 500,
          published: true,
          approvalStatus: 'approved'
        }
      ];
      
      // Menggunakan pendekatan langsung ke database untuk bypass validasi model
      const futureEvents = [];
      const futureSchedules = [];
      const futureUtilizations: Record<string, any> = {};
      
      // Create events for Apr-May 2025 (the requested period)
      const startDate = new Date('2025-04-17');
      const endDate = new Date('2025-05-17');
      
      // Generate dates within range
      const dates = [];
      let currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        // Skip some dates randomly to create gaps
        if (Math.random() > 0.7) { // 30% chance to add an event on a given day
          dates.push(new Date(currentDate));
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Create events for each selected date
      for (const date of dates) {
        // Pick a random event template
        const template = eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
        
        // Prepare event document
        const eventId = new mongoose.Types.ObjectId();
        const eventDate = new Date(date);
        const eventName = `${template.name} - ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        
        // Create tickets
        const standardTicket = {
          name: 'Standard',
          description: `Standard ticket for ${template.name}`,
          price: 75,
          quantity: Math.floor(template.totalSeats * 0.7),
          endDate: new Date(date.getTime() - 24 * 60 * 60 * 1000), // One day before event
          startDate: new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days before event
          status: 'active',
          seatArrangement: {
            rows: 20,
            columns: Math.ceil(template.totalSeats * 0.7 / 20),
          },
          bookedSeats: [],
        };
        
        const vipTicket = {
          name: 'VIP',
          description: `VIP ticket for ${template.name}`,
          price: 150,
          quantity: Math.floor(template.totalSeats * 0.3),
          endDate: new Date(date.getTime() - 24 * 60 * 60 * 1000), // One day before event
          startDate: new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days before event
          status: 'active',
          seatArrangement: {
            rows: 10,
            columns: Math.ceil(template.totalSeats * 0.3 / 10),
          },
          bookedSeats: [],
        };
        
        // Create event document directly without Mongoose
        const eventDoc = {
          _id: eventId,
          name: eventName,
          description: template.description,
          date: eventDate,
          time: template.time,
          location: template.location,
          totalSeats: template.totalSeats,
          availableSeats: Math.round(template.totalSeats * (1 - generateDeterministicOccupancy(eventName, eventDate) / 100)),
          published: template.published,
          approvalStatus: template.approvalStatus,
          createdBy: organizer._id,
          tickets: [standardTicket, vipTicket],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        futureEvents.push(eventDoc);
        
        // Parse the time
        const [hours, minutes, seconds] = template.time.split(':').map(Number);
        
        // Create start time
        const startTime = new Date(date);
        startTime.setHours(hours, minutes, seconds);
        
        // Create end time (assuming event is 3 hours)
        const endTime = new Date(startTime);
        endTime.setHours(startTime.getHours() + 3);
        
        // Create schedule document
        const scheduleDoc = {
          _id: new mongoose.Types.ObjectId(),
          event: eventId,
          startTime,
          endTime,
          booked_by: organizer._id,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        futureSchedules.push(scheduleDoc);
        
        // Create utilization record for this date
        const dateKey = date.toISOString().split('T')[0];
        
        if (!futureUtilizations[dateKey]) {
          const utilizationPercentage = generateDeterministicUtilization(date);
          const totalHoursAvailable = 24;
          const totalHoursUsed = Math.round((utilizationPercentage / 100) * totalHoursAvailable * 10) / 10; // Round to 1 decimal
          
          futureUtilizations[dateKey] = {
            _id: new mongoose.Types.ObjectId(),
            date: date,
            total_hours_used: totalHoursUsed, // Based on generated utilization
            total_hours_available: totalHoursAvailable,
            events: [eventId],
            createdAt: new Date(),
            updatedAt: new Date()
          };
        } else {
          // For multiple events on the same day, just add the event to the list
          // but keep the existing utilization (which is already deterministic)
          futureUtilizations[dateKey].events.push(eventId);
        }
      }
      
      // Insert data directly to collections
      if (futureEvents.length > 0) {
        await mongoose.connection.collection('events').insertMany(futureEvents);
        console.log(`Created ${futureEvents.length} future events`);
      }
      
      if (futureSchedules.length > 0) {
        await mongoose.connection.collection('auditoriumschedules').insertMany(futureSchedules);
        console.log(`Created ${futureSchedules.length} future schedules`);
      }
      
      if (Object.keys(futureUtilizations).length > 0) {
        await mongoose.connection.collection('utilizations').insertMany(Object.values(futureUtilizations));
        console.log(`Created ${Object.keys(futureUtilizations).length} future utilization records`);
      }
      
      console.log('Future events and schedules created successfully!');
    };
    
    // Create future events
    await createFutureEvents();
    
    // Create some sample orders for reporting
    const users = [admin._id, regular._id];
    const orderStatuses = ['pending', 'confirmed', 'cancelled'];
    
    // Create orders for the last 90 days to ensure we have data for daily, weekly, and monthly reports
    // Membuat pesanan acak untuk 90 hari terakhir
    const createOrdersForPastDays = async (days: number) => {
      const allTicketTypes = ['Regular', 'VIP', 'Premium', 'Standard', 'Economy', 'Food Lover', 'Gourmet'];
      
      // Create past date orders
      for (let day = 0; day < days; day++) {
        const orderDate = new Date();
        orderDate.setDate(orderDate.getDate() - day);
        
        // Create more orders for recent days (more realistic distribution)
        const ordersToCreate = Math.max(2, Math.floor(12 * Math.exp(-day/30)));
        
        for (let i = 0; i < ordersToCreate; i++) {
          const randomEvent = allEvents[Math.floor(Math.random() * allEvents.length)];
          const randomUser = users[Math.floor(Math.random() * users.length)];
          const randomStatus = Math.random() < 0.85 ? 'confirmed' : orderStatuses[Math.floor(Math.random() * 3)]; // 85% confirmed orders
          const randomQuantity = Math.floor(Math.random() * 5) + 1;
          const randomPrice = Math.floor(Math.random() * 100) + 50;
          const randomTicketType = allTicketTypes[Math.floor(Math.random() * allTicketTypes.length)];
          
          // Random hour of the day (business hours)
          const randomHour = 9 + Math.floor(Math.random() * 12); // 9 AM to 8 PM
          orderDate.setHours(randomHour, Math.floor(Math.random() * 60), 0, 0);
          
          const order = new Order({
            user: randomUser,
            event: randomEvent._id,
            tickets: [{
              ticketType: randomTicketType,
              quantity: randomQuantity,
              seats: [],
              price: randomPrice
            }],
            totalAmount: randomPrice * randomQuantity,
            status: randomStatus,
            paymentInfo: {
              method: Math.random() > 0.5 ? 'Credit Card' : 'Online Banking',
              transactionId: `TR-${Math.floor(Math.random() * 1000000)}`,
              paidAt: new Date(orderDate)
            },
            createdAt: new Date(orderDate),
            updatedAt: new Date(orderDate)
          });
          
          await order.save();
        }
      }
    };
    
    // Create random distribution of orders for past 90 days
    await createOrdersForPastDays(90);
    
    // Ensure every event organizer has at least some confirmed orders
    console.log("Ensuring every event organizer has confirmed orders...");
    
    const eventOrganizers = await User.find({ role: 'eventOrganizer' });
    for (const organizer of eventOrganizers) {
      // Get events created by this organizer
      const organizerEvents = await Event.find({ createdBy: organizer._id });
      
      if (organizerEvents.length > 0) {
        console.log(`Creating confirmed orders for organizer: ${organizer.username}`);
        
        // Check if organizer already has confirmed orders
        const existingOrders = await Order.find({
          event: { $in: organizerEvents.map(event => event._id) },
          status: 'confirmed'
        });
        
        if (existingOrders.length < 5) {
          // Create at least 5 confirmed orders for each event organizer
          const ordersToCreate = 15 - existingOrders.length;
          
          for (let i = 0; i < ordersToCreate; i++) {
            // Pick a random event from this organizer
            const event = organizerEvents[Math.floor(Math.random() * organizerEvents.length)];
            
            // Create order for a random date in the past 30 days
            const orderDate = new Date();
            const randomDaysAgo = Math.floor(Math.random() * 30);
            orderDate.setDate(orderDate.getDate() - randomDaysAgo);
            orderDate.setHours(10 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60), 0, 0);
            
            const randomQuantity = Math.floor(Math.random() * 3) + 1;
            const randomPrice = Math.floor(Math.random() * 100) + 50;
            
            const order = new Order({
              user: users[Math.floor(Math.random() * users.length)],
              event: event._id,
              tickets: [{
                ticketType: 'VIP',
                quantity: randomQuantity,
                seats: [],
                price: randomPrice
              }],
              totalAmount: randomPrice * randomQuantity,
              status: 'confirmed',
              paymentInfo: {
                method: 'Credit Card',
                transactionId: `TR-ORG-${Math.floor(Math.random() * 1000000)}`,
                paidAt: new Date(orderDate)
              },
              createdAt: new Date(orderDate),
              updatedAt: new Date(orderDate)
            });
            
            await order.save();
          }
        }
      }
    }
    
    // Create special distribution for testing specific scenarios
    
    // 1. Create a spike in orders for a specific date (for testing daily reports)
    const spikeDate = new Date();
    spikeDate.setDate(spikeDate.getDate() - 7); // 7 days ago
    spikeDate.setHours(10, 0, 0, 0);
    
    for (let i = 0; i < 15; i++) {
      const randomEvent = allEvents[Math.floor(Math.random() * allEvents.length)];
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomQuantity = Math.floor(Math.random() * 3) + 2; // 2-4 tickets
      const randomPrice = Math.floor(Math.random() * 50) + 100; // Higher price
      
      // Distribute orders over different hours of the spike day
      const orderHour = spikeDate.getHours() + Math.floor(Math.random() * 8);
      const orderDate = new Date(spikeDate);
      orderDate.setHours(orderHour, Math.floor(Math.random() * 60), 0, 0);
      
      const order = new Order({
        user: randomUser,
        event: randomEvent._id,
        tickets: [{
          ticketType: 'VIP',
          quantity: randomQuantity,
          seats: [],
          price: randomPrice
        }],
        totalAmount: randomPrice * randomQuantity,
        status: 'confirmed',
        paymentInfo: {
          method: 'Credit Card',
          transactionId: `TR-SPIKE-${Math.floor(Math.random() * 10000)}`,
          paidAt: new Date(orderDate)
        },
        createdAt: new Date(orderDate),
        updatedAt: new Date(orderDate)
      });
      
      await order.save();
    }
    
    // 2. Create a pattern for weekly data (more orders on weekends)
    const today = new Date();
    for (let weekAgo = 1; weekAgo <= 4; weekAgo++) {
      // Create weekend spike for past 4 weeks
      const fridayDate = new Date(today);
      fridayDate.setDate(today.getDate() - (weekAgo * 7) + (5 - today.getDay())); // Friday of the week
      
      const saturdayDate = new Date(fridayDate);
      saturdayDate.setDate(fridayDate.getDate() + 1); // Saturday
      
      const sundayDate = new Date(fridayDate);
      sundayDate.setDate(fridayDate.getDate() + 2); // Sunday
      
      const weekendDates = [fridayDate, saturdayDate, sundayDate];
      
      for (const weekendDate of weekendDates) {
        // More orders on weekends
        const ordersCount = 5 + Math.floor(Math.random() * 5); // 5-9 orders
        
        for (let i = 0; i < ordersCount; i++) {
          const randomEvent = allEvents[Math.floor(Math.random() * allEvents.length)];
          const randomUser = users[Math.floor(Math.random() * users.length)];
          const randomQuantity = Math.floor(Math.random() * 3) + 1;
          const randomPrice = Math.floor(Math.random() * 70) + 80;
          
          // Distribute orders over different hours
          const orderHour = 12 + Math.floor(Math.random() * 10); // 12 PM to 10 PM
          const orderDate = new Date(weekendDate);
          orderDate.setHours(orderHour, Math.floor(Math.random() * 60), 0, 0);
          
          const order = new Order({
            user: randomUser,
            event: randomEvent._id,
            tickets: [{
              ticketType: Math.random() > 0.5 ? 'Premium' : 'VIP',
              quantity: randomQuantity,
              seats: [],
              price: randomPrice
            }],
            totalAmount: randomPrice * randomQuantity,
            status: 'confirmed',
            paymentInfo: {
              method: Math.random() > 0.7 ? 'Credit Card' : 'Online Banking',
              transactionId: `TR-WEEKEND-${Math.floor(Math.random() * 10000)}`,
              paidAt: new Date(orderDate)
            },
            createdAt: new Date(orderDate),
            updatedAt: new Date(orderDate)
          });
          
          await order.save();
        }
      }
    }
    
    // 3. Create monthly pattern (more orders at beginning and end of month)
    const thisMonth = new Date();
    const lastMonth = new Date(thisMonth);
    lastMonth.setMonth(thisMonth.getMonth() - 1);
    
    const months = [thisMonth, lastMonth];
    
    for (const month of months) {
      const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
      const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      
      // Beginning of month (days 1-5)
      for (let day = 1; day <= 5; day++) {
        const orderDate = new Date(startOfMonth);
        orderDate.setDate(day);
        
        const ordersCount = 3 + Math.floor(Math.random() * 4); // 3-6 orders
        
        for (let i = 0; i < ordersCount; i++) {
          const randomEvent = allEvents[Math.floor(Math.random() * allEvents.length)];
          const randomUser = users[Math.floor(Math.random() * users.length)];
          const randomQuantity = Math.floor(Math.random() * 4) + 1;
          const randomPrice = Math.floor(Math.random() * 60) + 70;
          
          // Business hours
          const orderHour = 9 + Math.floor(Math.random() * 9); // 9 AM to 6 PM
          orderDate.setHours(orderHour, Math.floor(Math.random() * 60), 0, 0);
          
          const order = new Order({
            user: randomUser,
            event: randomEvent._id,
            tickets: [{
              ticketType: 'Standard',
              quantity: randomQuantity,
              seats: [],
              price: randomPrice
            }],
            totalAmount: randomPrice * randomQuantity,
            status: 'confirmed',
            paymentInfo: {
              method: 'Credit Card',
              transactionId: `TR-BOM-${Math.floor(Math.random() * 10000)}`,
              paidAt: new Date(orderDate)
            },
            createdAt: new Date(orderDate),
            updatedAt: new Date(orderDate)
          });
          
          await order.save();
        }
      }
      
      // End of month (last 5 days)
      const daysInMonth = endOfMonth.getDate();
      
      for (let day = daysInMonth - 4; day <= daysInMonth; day++) {
        const orderDate = new Date(startOfMonth);
        orderDate.setDate(day);
        
        const ordersCount = 4 + Math.floor(Math.random() * 5); // 4-8 orders
        
        for (let i = 0; i < ordersCount; i++) {
          const randomEvent = allEvents[Math.floor(Math.random() * allEvents.length)];
          const randomUser = users[Math.floor(Math.random() * users.length)];
          const randomQuantity = Math.floor(Math.random() * 3) + 1;
          const randomPrice = Math.floor(Math.random() * 80) + 60;
          
          // Business hours
          const orderHour = 10 + Math.floor(Math.random() * 10); // 10 AM to 8 PM
          orderDate.setHours(orderHour, Math.floor(Math.random() * 60), 0, 0);
          
          const order = new Order({
            user: randomUser,
            event: randomEvent._id,
            tickets: [{
              ticketType: Math.random() > 0.5 ? 'Economy' : 'Regular',
              quantity: randomQuantity,
              seats: [],
              price: randomPrice
            }],
            totalAmount: randomPrice * randomQuantity,
            status: 'confirmed',
            paymentInfo: {
              method: Math.random() > 0.6 ? 'Credit Card' : 'Online Banking',
              transactionId: `TR-EOM-${Math.floor(Math.random() * 10000)}`,
              paidAt: new Date(orderDate)
            },
            createdAt: new Date(orderDate),
            updatedAt: new Date(orderDate)
          });
          
          await order.save();
        }
      }
    }
    
    console.log('Orders imported...');
    console.log('All data imported successfully!');
    
    if (shouldExit) {
      process.exit();
    }
    
  } catch (error) {
    console.error(`Error importing data: ${error}`);
    process.exit(1);
  }
};

// Delete data
const deleteData = async (shouldExit = true) => {
  try {
    await User.deleteMany({});
    await Event.deleteMany({});
    await Order.deleteMany({});
    await WaitingList.deleteMany({});
    await Notification.deleteMany({});
    await WaitlistTicket.deleteMany({});
    await AuditoriumSchedule.deleteMany({});
    await Utilization.deleteMany({});

    console.log('All data destroyed!');
    
    if (shouldExit) {
      process.exit();
    }
  } catch (error) {
    console.error(`Error deleting data: ${error}`);
    process.exit(1);
  }
};

// Run command
if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
} else {
  // Default behavior: delete then import
  (async () => {
    try {
      console.log('Starting complete seeding process: delete -> import');
      await deleteData(false);
      await importData(true);
    } catch (error) {
      console.error(`Error in seeding process: ${error}`);
      process.exit(1);
    }
  })();
} 