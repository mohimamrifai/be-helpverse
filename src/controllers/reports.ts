import { Request, Response, NextFunction } from 'express';
import Order from '../models/Order';
import Event from '../models/Event';
import { IUser, IDailyReport, IWeeklyReport, IMonthlyReport, IAllReports } from '../types';
import mongoose from 'mongoose';
import moment from 'moment';
import PDFDocument from 'pdfkit';
import { generatePdfReport } from '../utils/pdfGenerator';

// Interface for request with user
interface AuthRequest extends Request {
  user?: IUser;
}

/**
 * @desc    Get daily sales report
 * @route   GET /api/reports/daily
 * @access  Private (Event Organizer, Admin)
 */
export const getDailyReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Set no-cache headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const targetDate = req.query.date 
      ? new Date(req.query.date as string) 
      : new Date();
    
    // Start and end of day
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Get user's events if event organizer
    let eventIdsQuery = {};
    if (req.user?.role === 'eventOrganizer') {
      const userEvents = await Event.find({ createdBy: req.user._id });
      const eventIds = userEvents.map(event => event._id);
      
      if (eventIds.length === 0) {
        res.status(200).json({
          message: "Insufficient data for the selected period."
        });
        return;
      }
      
      eventIdsQuery = { event: { $in: eventIds } };
    }

    // Get all confirmed orders for the day
    const orders = await Order.find({
      ...eventIdsQuery,
      status: 'confirmed',
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).populate('event', 'name totalSeats availableSeats');

    if (orders.length === 0) {
      res.status(200).json({
        message: "Insufficient data for the selected period."
      });
      return;
    }

    // Calculate total tickets sold
    const ticketsSold = orders.reduce((total, order) => {
      return total + order.tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
    }, 0);

    // Calculate total revenue
    const revenue = orders.reduce((total, order) => total + order.totalAmount, 0);

    // Calculate seat occupancy
    let totalSeats = 0;
    let filledSeats = 0;

    orders.forEach(order => {
      if (order.event && typeof order.event === 'object' && 'totalSeats' in order.event) {
        totalSeats += order.event.totalSeats;
        filledSeats += order.event.totalSeats - order.event.availableSeats;
      }
    });

    const occupancyPercentage = totalSeats > 0 ? (filledSeats / totalSeats) * 100 : 0;

    // Prepare sales data by hour
    const salesByHour = Array(24).fill(0);
    const revenueByHour = Array(24).fill(0);

    orders.forEach(order => {
      const hour = new Date(order.createdAt).getHours();
      const ticketCount = order.tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
      
      salesByHour[hour] += ticketCount;
      revenueByHour[hour] += order.totalAmount;
    });

    // Format for response
    const salesData = salesByHour.map((count, hour) => ({ hour, count }));
    const revenueData = revenueByHour.map((amount, hour) => ({ hour, amount }));

    const report: IDailyReport = {
      date: targetDate,
      ticketsSold,
      revenue,
      occupancyPercentage,
      salesData,
      revenueData
    };

    res.status(200).json(report);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get weekly sales report
 * @route   GET /api/reports/weekly
 * @access  Private (Event Organizer, Admin)
 */
export const getWeeklyReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Set no-cache headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Get first day of the week (Monday)
    const today = new Date();
    const currentDay = today.getDay();
    const diff = currentDay === 0 ? 6 : currentDay - 1; // Adjust if Sunday (0)
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    // Get user's events if event organizer
    let eventIdsQuery = {};
    if (req.user?.role === 'eventOrganizer') {
      const userEvents = await Event.find({ createdBy: req.user._id });
      const eventIds = userEvents.map(event => event._id);
      
      if (eventIds.length === 0) {
        res.status(200).json({
          message: "Insufficient data for the selected period."
        });
        return;
      }
      
      eventIdsQuery = { event: { $in: eventIds } };
    }

    // Get all confirmed orders for the week
    const orders = await Order.find({
      ...eventIdsQuery,
      status: 'confirmed',
      createdAt: { $gte: startOfWeek, $lte: endOfWeek }
    }).populate('event', 'name totalSeats availableSeats');

    if (orders.length === 0) {
      res.status(200).json({
        message: "Insufficient data for the selected period."
      });
      return;
    }

    // Calculate total tickets sold
    const ticketsSold = orders.reduce((total, order) => {
      return total + order.tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
    }, 0);

    // Calculate total revenue
    const revenue = orders.reduce((total, order) => total + order.totalAmount, 0);

    // Calculate seat occupancy
    let totalSeats = 0;
    let filledSeats = 0;

    orders.forEach(order => {
      if (order.event && typeof order.event === 'object' && 'totalSeats' in order.event) {
        totalSeats += order.event.totalSeats;
        filledSeats += order.event.totalSeats - order.event.availableSeats;
      }
    });

    const occupancyPercentage = totalSeats > 0 ? (filledSeats / totalSeats) * 100 : 0;

    // Prepare sales data by day
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const salesByDay: Record<string, number> = {};
    const revenueByDay: Record<string, number> = {};
    
    days.forEach(day => {
      salesByDay[day] = 0;
      revenueByDay[day] = 0;
    });

    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const dayIndex = orderDate.getDay();
      const dayName = days[dayIndex === 0 ? 6 : dayIndex - 1]; // Convert Sunday (0) to be last
      const ticketCount = order.tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
      
      salesByDay[dayName] += ticketCount;
      revenueByDay[dayName] += order.totalAmount;
    });

    // Format for response
    const salesData = days.map(day => ({ day, count: salesByDay[day] }));
    const revenueData = days.map(day => ({ day, amount: revenueByDay[day] }));

    const report: IWeeklyReport = {
      startDate: startOfWeek,
      endDate: endOfWeek,
      ticketsSold,
      revenue,
      occupancyPercentage,
      salesData,
      revenueData
    };

    res.status(200).json(report);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get monthly sales report
 * @route   GET /api/reports/monthly
 * @access  Private (Event Organizer, Admin)
 */
export const getMonthlyReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Set no-cache headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const targetDate = req.query.date 
      ? new Date(req.query.date as string) 
      : new Date();
      
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    
    // Start and end of month
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
    
    // Get user's events if event organizer
    let eventIdsQuery = {};
    if (req.user?.role === 'eventOrganizer') {
      const userEvents = await Event.find({ createdBy: req.user._id });
      const eventIds = userEvents.map(event => event._id);
      
      if (eventIds.length === 0) {
        res.status(200).json({
          message: "Insufficient data for the selected period."
        });
        return;
      }
      
      eventIdsQuery = { event: { $in: eventIds } };
    }

    // Get all confirmed orders for the month
    const orders = await Order.find({
      ...eventIdsQuery,
      status: 'confirmed',
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    }).populate('event', 'name totalSeats availableSeats');

    if (orders.length === 0) {
      res.status(200).json({
        message: "Insufficient data for the selected period."
      });
      return;
    }

    // Calculate total tickets sold
    const ticketsSold = orders.reduce((total, order) => {
      return total + order.tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
    }, 0);

    // Calculate total revenue
    const revenue = orders.reduce((total, order) => total + order.totalAmount, 0);

    // Calculate seat occupancy
    let totalSeats = 0;
    let filledSeats = 0;

    orders.forEach(order => {
      if (order.event && typeof order.event === 'object' && 'totalSeats' in order.event) {
        totalSeats += order.event.totalSeats;
        filledSeats += order.event.totalSeats - order.event.availableSeats;
      }
    });

    const occupancyPercentage = totalSeats > 0 ? (filledSeats / totalSeats) * 100 : 0;

    // Prepare sales data by day of month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const salesByDay: Record<number, number> = {};
    const revenueByDay: Record<number, number> = {};
    
    for (let i = 1; i <= daysInMonth; i++) {
      salesByDay[i] = 0;
      revenueByDay[i] = 0;
    }

    orders.forEach(order => {
      const day = new Date(order.createdAt).getDate();
      const ticketCount = order.tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
      
      salesByDay[day] += ticketCount;
      revenueByDay[day] += order.totalAmount;
    });

    // Format for response
    const salesData = Object.entries(salesByDay).map(([day, count]) => ({ 
      day: parseInt(day), 
      count 
    }));
    
    const revenueData = Object.entries(revenueByDay).map(([day, amount]) => ({ 
      day: parseInt(day), 
      amount 
    }));

    const report: IMonthlyReport = {
      month: month + 1, // Month is 0-indexed in JS
      year,
      ticketsSold,
      revenue,
      occupancyPercentage,
      salesData,
      revenueData
    };

    res.status(200).json(report);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Download report as PDF
 * @route   GET /api/reports/download
 * @access  Private (Event Organizer, Admin)
 */
export const downloadReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Set no-cache headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Log request parameters
    console.log('Download report requested with params:', req.query);
    
    // Validasi jenis report (daily, weekly, monthly, all) dengan default 'monthly'
    const validTypes = ['daily', 'weekly', 'monthly', 'all'];
    const type = req.query.type && validTypes.includes(req.query.type as string) 
      ? req.query.type as string 
      : 'monthly';
    
    console.log(`Report type selected: ${type}`);
    
    // Validasi parameter date
    let date: Date;
    
    if (req.query.date) {
      // Coba parse date dari query parameter
      try {
        date = new Date(req.query.date as string);
        
        // Periksa apakah date valid
        if (isNaN(date.getTime())) {
          console.warn(`Invalid date parameter provided: ${req.query.date}, using current date`);
          date = new Date();
        } else {
          console.log(`Using provided date: ${date.toISOString().split('T')[0]}`);
        }
      } catch (error) {
        console.warn(`Error parsing date parameter: ${req.query.date}, using current date`);
        date = new Date();
      }
    } else {
      // Jika tidak ada parameter date, gunakan tanggal hari ini
      date = new Date();
      console.log(`No date parameter provided, using current date: ${date.toISOString().split('T')[0]}`);
    }
    
    let report: any;
    let reportTitle = '';
    let reportFilename = '';
    
    // Dapatkan data berdasarkan tipe report
    try {
      switch(type) {
        case 'daily':
          console.log(`Generating daily report for date: ${date.toISOString().split('T')[0]}`);
          report = await getDailyReportData(req.user, date);
          reportTitle = `Daily Report - ${moment(date).locale('en').format('DD MMMM YYYY')}`;
          reportFilename = `daily-report-${moment(date).format('YYYY-MM-DD')}`;
          break;
        
        case 'weekly':
          console.log('Generating weekly report for current week');
          report = await getWeeklyReportData(req.user);
          const startDate = moment().startOf('week').add(1, 'days');
          const endDate = moment().endOf('week').add(1, 'days');
          reportTitle = `Weekly Report - ${startDate.locale('en').format('DD MMM')} to ${endDate.locale('en').format('DD MMM YYYY')}`;
          reportFilename = `weekly-report-${startDate.format('YYYY-MM-DD')}-${endDate.format('YYYY-MM-DD')}`;
          break;
        
        case 'all':
          console.log('Generating all-time report');
          report = await getAllReportsData(req.user);
          reportTitle = `All Time Report - As of ${moment().locale('en').format('DD MMMM YYYY')}`;
          reportFilename = `all-time-report-${moment().format('YYYY-MM-DD')}`;
          break;
        
        case 'monthly':
        default:
          console.log(`Generating monthly report for: ${date.toISOString().split('T')[0].substring(0, 7)}`);
          report = await getMonthlyReportData(req.user, date);
          reportTitle = `Monthly Report - ${moment(date).locale('en').format('MMMM YYYY')}`;
          reportFilename = `monthly-report-${moment(date).format('YYYY-MM')}`;
          break;
      }
    } catch (error) {
      console.error("Error retrieving report data:", error);
      return next(new Error("Failed to retrieve report data"));
    }
    
    if (!report) {
      console.warn("Report data is null or undefined");
      res.status(200).json({
        message: "Insufficient data for the selected period."
      });
      return;
    }
    
    if (typeof report === 'object' && 'message' in report) {
      console.log(`Returning message to client: ${report.message}`);
      res.status(200).json({
        message: report.message
      });
      return;
    }

    // Buat PDF
    try {
      console.log(`Generating PDF for ${type} report with title: ${reportTitle}`);

      // Membuat dokumen PDF
      const doc = new PDFDocument({ 
        margin: 40, 
        bufferPages: true,
        size: 'A4',
        info: {
          Title: reportTitle,
          Author: 'HelpVerse',
          CreationDate: new Date()
        }
      });
      
      // Hapus handler lain yang mungkin mengintervensi
      req.on('close', () => {
        // Hentikan pembuatan PDF jika koneksi ditutup
        try {
          doc.end();
          console.log('Connection closed by client, PDF generation stopped');
        } catch (e) {
          console.error("Error ending PDF document on connection close:", e);
        }
      });

      // Set headers sebelum mengirim data
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${reportFilename}.pdf`);

      // Gunakan buffer memori untuk menyimpan PDF, bukan pipe langsung
      const chunks: Buffer[] = [];
      
      doc.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      
      doc.on('end', () => {
        if (!res.headersSent) {
          // Gabungkan semua chunk dan kirim sebagai satu respons
          const result = Buffer.concat(chunks);
          console.log(`PDF generated successfully, size: ${result.length} bytes`);
          res.send(result);
        } else {
          console.warn('Headers already sent, cannot send PDF data');
        }
      });

      // Tambahkan konten ke PDF dengan fungsi terpisah
      generatePdfReport(doc, report, reportTitle, type);
      
      // Finalisasi dokumen
      doc.end();
      console.log('PDF document finalized, waiting for all chunks...');
    } catch (error) {
      console.error("Error generating PDF:", error);
      if (!res.headersSent) {
        res.status(500).json({ 
          message: "Error generating PDF report",
          error: error instanceof Error ? error.message : String(error)
        });
      } else {
        console.error('Headers already sent, cannot send error response');
      }
    }
  } catch (err) {
    console.error("Unexpected error in downloadReport:", err);
    next(err);
  }
};

// Helper functions untuk mengambil data report tanpa mengirim response

/**
 * Get daily report data without sending response
 */
const getDailyReportData = async (user: IUser | undefined, targetDate: Date) => {
  // Start and end of day
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);
  
  // Get user's events if event organizer
  let eventIdsQuery = {};
  if (user?.role === 'eventOrganizer') {
    const userEvents = await Event.find({ createdBy: user._id });
    const eventIds = userEvents.map(event => event._id);
    
    if (eventIds.length === 0) {
      return { message: "Insufficient data for the selected period." };
    }
    
    eventIdsQuery = { event: { $in: eventIds } };
  }

  // Get all confirmed orders for the day
  const orders = await Order.find({
    ...eventIdsQuery,
    status: 'confirmed',
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  }).populate('event', 'name totalSeats availableSeats');

  if (orders.length === 0) {
    return { message: "Insufficient data for the selected period." };
  }

  // Calculate total tickets sold
  const ticketsSold = orders.reduce((total, order) => {
    return total + order.tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
  }, 0);

  // Calculate total revenue
  const revenue = orders.reduce((total, order) => total + order.totalAmount, 0);

  // Calculate seat occupancy
  let totalSeats = 0;
  let filledSeats = 0;

  orders.forEach(order => {
    if (order.event && typeof order.event === 'object' && 'totalSeats' in order.event) {
      totalSeats += order.event.totalSeats;
      filledSeats += order.event.totalSeats - order.event.availableSeats;
    }
  });

  const occupancyPercentage = totalSeats > 0 ? (filledSeats / totalSeats) * 100 : 0;

  // Prepare sales data by hour
  const salesByHour = Array(24).fill(0);
  const revenueByHour = Array(24).fill(0);

  orders.forEach(order => {
    const hour = new Date(order.createdAt).getHours();
    const ticketCount = order.tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
    
    salesByHour[hour] += ticketCount;
    revenueByHour[hour] += order.totalAmount;
  });

  // Format for response
  const salesData = salesByHour.map((count, hour) => ({ hour, count }));
  const revenueData = revenueByHour.map((amount, hour) => ({ hour, amount }));

  const report: IDailyReport = {
    date: targetDate,
    ticketsSold,
    revenue,
    occupancyPercentage,
    salesData,
    revenueData
  };

  return report;
};

/**
 * Get weekly report data without sending response
 */
const getWeeklyReportData = async (user: IUser | undefined) => {
  // Get first day of the week (Monday)
  const today = new Date();
  const currentDay = today.getDay();
  const diff = currentDay === 0 ? 6 : currentDay - 1; // Adjust if Sunday (0)
  
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - diff);
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  // Get user's events if event organizer
  let eventIdsQuery = {};
  if (user?.role === 'eventOrganizer') {
    const userEvents = await Event.find({ createdBy: user._id });
    const eventIds = userEvents.map(event => event._id);
    
    if (eventIds.length === 0) {
      return { message: "Insufficient data for the selected period." };
    }
    
    eventIdsQuery = { event: { $in: eventIds } };
  }

  // Get all confirmed orders for the week
  const orders = await Order.find({
    ...eventIdsQuery,
    status: 'confirmed',
    createdAt: { $gte: startOfWeek, $lte: endOfWeek }
  }).populate('event', 'name totalSeats availableSeats');

  if (orders.length === 0) {
    return { message: "Insufficient data for the selected period." };
  }

  // Calculate total tickets sold
  const ticketsSold = orders.reduce((total, order) => {
    return total + order.tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
  }, 0);

  // Calculate total revenue
  const revenue = orders.reduce((total, order) => total + order.totalAmount, 0);

  // Calculate seat occupancy
  let totalSeats = 0;
  let filledSeats = 0;

  orders.forEach(order => {
    if (order.event && typeof order.event === 'object' && 'totalSeats' in order.event) {
      totalSeats += order.event.totalSeats;
      filledSeats += order.event.totalSeats - order.event.availableSeats;
    }
  });

  const occupancyPercentage = totalSeats > 0 ? (filledSeats / totalSeats) * 100 : 0;

  // Prepare sales data by day
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const salesByDay: Record<string, number> = {};
  const revenueByDay: Record<string, number> = {};
  
  days.forEach(day => {
    salesByDay[day] = 0;
    revenueByDay[day] = 0;
  });

  orders.forEach(order => {
    const orderDate = new Date(order.createdAt);
    const dayIndex = orderDate.getDay();
    const dayName = days[dayIndex === 0 ? 6 : dayIndex - 1]; // Convert Sunday (0) to be last
    const ticketCount = order.tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
    
    salesByDay[dayName] += ticketCount;
    revenueByDay[dayName] += order.totalAmount;
  });

  // Format for response
  const salesData = days.map(day => ({ day, count: salesByDay[day] }));
  const revenueData = days.map(day => ({ day, amount: revenueByDay[day] }));

  const report: IWeeklyReport = {
    startDate: startOfWeek,
    endDate: endOfWeek,
    ticketsSold,
    revenue,
    occupancyPercentage,
    salesData,
    revenueData
  };

  return report;
};

/**
 * Get monthly report data without sending response
 */
const getMonthlyReportData = async (user: IUser | undefined, targetDate: Date) => {
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  
  // Start and end of month
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
  
  // Get user's events if event organizer
  let eventIdsQuery = {};
  if (user?.role === 'eventOrganizer') {
    const userEvents = await Event.find({ createdBy: user._id });
    const eventIds = userEvents.map(event => event._id);
    
    if (eventIds.length === 0) {
      return { message: "Insufficient data for the selected period." };
    }
    
    eventIdsQuery = { event: { $in: eventIds } };
  }

  // Get all confirmed orders for the month
  const orders = await Order.find({
    ...eventIdsQuery,
    status: 'confirmed',
    createdAt: { $gte: startOfMonth, $lte: endOfMonth }
  }).populate('event', 'name totalSeats availableSeats');

  if (orders.length === 0) {
    return { message: "Insufficient data for the selected period." };
  }

  // Calculate total tickets sold
  const ticketsSold = orders.reduce((total, order) => {
    return total + order.tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
  }, 0);

  // Calculate total revenue
  const revenue = orders.reduce((total, order) => total + order.totalAmount, 0);

  // Calculate seat occupancy
  let totalSeats = 0;
  let filledSeats = 0;

  orders.forEach(order => {
    if (order.event && typeof order.event === 'object' && 'totalSeats' in order.event) {
      totalSeats += order.event.totalSeats;
      filledSeats += order.event.totalSeats - order.event.availableSeats;
    }
  });

  const occupancyPercentage = totalSeats > 0 ? (filledSeats / totalSeats) * 100 : 0;

  // Prepare sales data by day of month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const salesByDay: Record<number, number> = {};
  const revenueByDay: Record<number, number> = {};
  
  for (let i = 1; i <= daysInMonth; i++) {
    salesByDay[i] = 0;
    revenueByDay[i] = 0;
  }

  orders.forEach(order => {
    const day = new Date(order.createdAt).getDate();
    const ticketCount = order.tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
    
    salesByDay[day] += ticketCount;
    revenueByDay[day] += order.totalAmount;
  });

  // Format for response
  const salesData = Object.entries(salesByDay).map(([day, count]) => ({ 
    day: parseInt(day), 
    count 
  }));
  
  const revenueData = Object.entries(revenueByDay).map(([day, amount]) => ({ 
    day: parseInt(day), 
    amount 
  }));

  const report: IMonthlyReport = {
    month: month + 1, // Month is 0-indexed in JS
    year,
    ticketsSold,
    revenue,
    occupancyPercentage,
    salesData,
    revenueData
  };

  return report;
};

/**
 * Get all reports data without sending response
 */
const getAllReportsData = async (user: IUser | undefined) => {
  console.log('getAllReportsData called for user:', user?.username || 'Unknown');
  
  // Get user's events if event organizer
  let eventIdsQuery = {};
  let events = [];
  
  if (user?.role === 'eventOrganizer') {
    console.log('User is event organizer, finding their events');
    const userEvents = await Event.find({ createdBy: user._id });
    console.log('Found', userEvents.length, 'events for this organizer');
    
    events = userEvents;
    const eventIds = userEvents.map(event => event._id);
    
    if (eventIds.length === 0) {
      console.log('No events found for this organizer');
      return { 
        message: "No events found for this organizer.",
        totalOrders: 0,
        confirmedOrders: 0,
        ticketsSold: 0,
        revenue: 0,
        occupancyPercentage: 0,
        ordersData: [],
        ordersByDate: {},
        eventSummary: [],
        occupancyByDate: {}
      };
    }
    
    eventIdsQuery = { event: { $in: eventIds } };
  } else {
    console.log('User is admin, will fetch all events');
    events = await Event.find({});
  }

  // Get all orders without status filter first
  console.log('Finding orders with query:', JSON.stringify(eventIdsQuery));
  const allOrders = await Order.find({
    ...eventIdsQuery
  }).populate('event', 'name totalSeats availableSeats');

  console.log('Found', allOrders.length, 'total orders');
  
  // Filter confirmed orders
  const confirmedOrders = allOrders.filter(order => order.status === 'confirmed');
  console.log('Of which', confirmedOrders.length, 'are confirmed orders');
  
  // If no orders at all, return empty data structure instead of message
  if (allOrders.length === 0) {
    console.log('No orders found at all, returning empty data structure');
    return {
      totalOrders: 0,
      confirmedOrders: 0,
      ticketsSold: 0,
      revenue: 0,
      occupancyPercentage: 0,
      ordersData: [],
      ordersByDate: {},
      eventSummary: [],
      occupancyByDate: {}
    };
  }

  // Calculate total tickets sold (from confirmed orders only)
  const ticketsSold = confirmedOrders.reduce((total, order) => {
    return total + order.tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
  }, 0);
  console.log('Total tickets sold (from confirmed orders):', ticketsSold);

  // Calculate total revenue (from confirmed orders only)
  const revenue = confirmedOrders.reduce((total, order) => total + order.totalAmount, 0);
  console.log('Total revenue (from confirmed orders):', revenue);

  // Calculate seat occupancy based on events
  let totalSeats = 0;
  let filledSeats = 0;

  events.forEach(event => {
    if (event.totalSeats) {
      totalSeats += event.totalSeats;
      filledSeats += (event.totalSeats - event.availableSeats);
    }
  });

  const occupancyPercentage = totalSeats > 0 ? (filledSeats / totalSeats) * 100 : 0;
  console.log('Total seats:', totalSeats, 'Filled seats:', filledSeats);
  console.log('Occupancy percentage:', occupancyPercentage.toFixed(2) + '%');

  // Prepare order data with essential details (all orders)
  console.log('Preparing ordersData from all orders');
  const ordersData = allOrders.map(order => {
    const eventObj = order.event as any;
    return {
      id: (order as any)._id.toString(),
      date: order.createdAt,
      eventId: eventObj?._id ? eventObj._id.toString() : '',
      eventName: eventObj?.name || 'Unknown Event',
      totalAmount: order.totalAmount,
      ticketCount: order.tickets.reduce((sum, ticket) => sum + ticket.quantity, 0),
      status: order.status,
      customerName: (order as any).customerName || '',
      customerEmail: (order as any).customerEmail || ''
    };
  });
  console.log('Generated ordersData with', ordersData.length, 'entries');

  // Group data by date for easy client-side processing
  console.log('Grouping orders by date');
  const ordersByDate: Record<string, any[]> = {};
  
  allOrders.forEach(order => {
    const dateStr = new Date(order.createdAt).toISOString().split('T')[0];
    if (!ordersByDate[dateStr]) {
      ordersByDate[dateStr] = [];
    }
    
    const eventObj = order.event as any;
    ordersByDate[dateStr].push({
      id: (order as any)._id.toString(),
      eventId: eventObj?._id ? eventObj._id.toString() : '',
      eventName: eventObj?.name || 'Unknown Event',
      totalAmount: order.totalAmount,
      status: order.status,
      ticketCount: order.tickets.reduce((sum, ticket) => sum + ticket.quantity, 0),
    });
  });
  console.log('Grouped orders by', Object.keys(ordersByDate).length, 'different dates');

  // Group by event for summary
  const eventSummary = events.map(event => {
    const eventOrders = allOrders.filter(order => 
      order.event && typeof order.event === 'object' && 
      'id' in order.event && order.event.id === event.id
    );
    
    const confirmedEventOrders = eventOrders.filter(order => order.status === 'confirmed');
    
    const ticketsSold = confirmedEventOrders.reduce((total, order) => {
      return total + order.tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
    }, 0);
    
    const revenue = confirmedEventOrders.reduce((total, order) => total + order.totalAmount, 0);
    
    return {
      id: event.id,
      name: event.name,
      totalOrders: eventOrders.length,
      confirmedOrders: confirmedEventOrders.length,
      ticketsSold,
      revenue,
      occupancyPercentage: (eventOrders.length === 0 || ticketsSold === 0) 
        ? 0 // Jika belum ada pesanan atau tiket terjual, occupancy adalah 0%
        : (event.totalSeats > 0 
          ? ((event.totalSeats - event.availableSeats) / event.totalSeats) * 100 
          : 0)
    };
  });

  // Calculate occupancy by date
  console.log('Calculating occupancy by date');
  const occupancyByDate: Record<string, number> = {};
  
  // Get all unique dates from orders
  const orderDates = [...new Set(allOrders.map(order => 
    new Date(order.createdAt).toISOString().split('T')[0]
  ))];
  
  // For each date, calculate occupancy
  orderDates.forEach(dateStr => {
    // Get confirmed orders for this date
    const confirmedOrdersOnDate = allOrders.filter(order => {
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
      return orderDate === dateStr && order.status === 'confirmed';
    });
    
    // If no confirmed orders on this date, set occupancy to 0%
    if (confirmedOrdersOnDate.length === 0) {
      occupancyByDate[dateStr] = 0;
      return;
    }
    
    // Get all events that had orders on this date
    const eventsOnDate = new Set<string>();
    
    // Collect all event IDs from confirmed orders
    confirmedOrdersOnDate.forEach(order => {
      if (order.event && typeof order.event === 'object' && 'id' in order.event) {
        eventsOnDate.add(order.event.id);
      }
    });
    
    // Calculate occupancy for this date
    let dailyTotalSeats = 0;
    let dailyFilledSeats = 0;
    
    eventsOnDate.forEach(eventId => {
      const event = events.find(e => e.id === eventId);
      if (event && event.totalSeats) {
        dailyTotalSeats += event.totalSeats;
        dailyFilledSeats += (event.totalSeats - event.availableSeats);
      }
    });
    
    // If no events with seats on this date, set occupancy to 0%
    if (dailyTotalSeats === 0) {
      occupancyByDate[dateStr] = 0;
    } else {
      occupancyByDate[dateStr] = (dailyFilledSeats / dailyTotalSeats) * 100;
    }
  });
  
  console.log('Generated occupancyByDate for', Object.keys(occupancyByDate).length, 'dates');

  const report: IAllReports = {
    totalOrders: allOrders.length,
    confirmedOrders: confirmedOrders.length,
    ticketsSold,
    revenue,
    occupancyPercentage,
    ordersData,
    ordersByDate,
    eventSummary,
    occupancyByDate
  };

  console.log('Report generated successfully');
  return report;
};

/**
 * @desc    Get all reports data (no date filter)
 * @route   GET /api/reports/all
 * @access  Private (Event Organizer, Admin)
 */
export const getAllReports = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Set no-cache headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    console.log('GET /api/reports/all requested by user:', req.user?.username || 'Unknown');
    
    const report = await getAllReportsData(req.user);
    
    console.log('Report data generated:');
    console.log('- Total Orders:', report && 'totalOrders' in report ? report.totalOrders : 'N/A');
    console.log('- Tickets Sold:', report && 'ticketsSold' in report ? report.ticketsSold : 'N/A');
    console.log('- Revenue:', report && 'revenue' in report ? report.revenue : 'N/A');
    console.log('- Orders data length:', report && 'ordersData' in report ? (report.ordersData as any[]).length : 'N/A');
    console.log('- OrdersByDate keys:', report && 'ordersByDate' in report ? Object.keys(report.ordersByDate || {}).length : 'N/A');
    
    if (report && 'message' in report) {
      console.log('No data available message:', report.message);
      res.status(200).json({
        message: report.message
      });
      return;
    }
    
    // Check if report contains all required fields
    const requiredFields = ['totalOrders', 'ticketsSold', 'revenue', 'occupancyPercentage', 'ordersData', 'ordersByDate'];
    const missingFields = requiredFields.filter(field => !(field in report));
    
    if (missingFields.length > 0) {
      console.warn('Warning: Report is missing some required fields:', missingFields);
    }
    
    // Print report structure (without full data)
    console.log('Report structure:', JSON.stringify({
      ...report,
      ordersData: report.ordersData ? '[array with ' + report.ordersData.length + ' items]' : null,
      ordersByDate: report.ordersByDate ? '{object with ' + Object.keys(report.ordersByDate).length + ' keys}' : null
    }, null, 2));
    
    console.log('Sending complete report response');
    res.status(200).json(report);
  } catch (err) {
    console.error('Error in getAllReports:', err);
    next(err);
  }
}; 