import { Request, Response, NextFunction } from 'express';
import Order from '../models/Order';
import Event from '../models/Event';
import { IUser, IDailyReport, IWeeklyReport, IMonthlyReport } from '../types';
import mongoose from 'mongoose';
import moment from 'moment';
import PDFDocument from 'pdfkit';

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
    // Jenis report (daily, weekly, monthly)
    const type = req.query.type || 'monthly';
    const date = req.query.date ? new Date(req.query.date as string) : new Date();
    
    let report: any;
    let reportTitle = '';
    let reportFilename = '';
    
    switch(type) {
      case 'daily':
        report = await getDailyReportData(req.user, date);
        reportTitle = `Daily Report - ${moment(date).locale('en').format('DD MMMM YYYY')}`;
        reportFilename = `daily-report-${moment(date).format('YYYY-MM-DD')}`;
        break;
      
      case 'weekly':
        report = await getWeeklyReportData(req.user);
        const startDate = moment().startOf('week').add(1, 'days');
        const endDate = moment().endOf('week').add(1, 'days');
        reportTitle = `Weekly Report - ${startDate.locale('en').format('DD MMM')} to ${endDate.locale('en').format('DD MMM YYYY')}`;
        reportFilename = `weekly-report-${startDate.format('YYYY-MM-DD')}-${endDate.format('YYYY-MM-DD')}`;
        break;
      
      case 'monthly':
      default:
        report = await getMonthlyReportData(req.user, date);
        reportTitle = `Monthly Report - ${moment(date).locale('en').format('MMMM YYYY')}`;
        reportFilename = `monthly-report-${moment(date).format('YYYY-MM')}`;
        break;
    }
    
    if (!report || (typeof report === 'object' && 'message' in report)) {
      res.status(200).json({
        message: "Insufficient data for the selected period."
      });
      return;
    }

    // Membuat dokumen PDF
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${reportFilename}.pdf`);

    // Pipe the PDF to the response
    doc.pipe(res);

    // Tambahkan konten ke PDF
    generatePdfReport(doc, report, reportTitle, type as string);

    // Finalize the PDF and end the stream
    doc.end();
  } catch (err) {
    next(err);
  }
};

/**
 * Generate PDF report
 */
const generatePdfReport = (doc: PDFKit.PDFDocument, report: any, title: string, type: string) => {
  // Add title
  doc.fontSize(20).text(title, { align: 'center' });
  doc.moveDown();

  // Add heading
  doc.fontSize(16).text('Summary:', { underline: true });
  doc.moveDown(0.5);

  // Add summary
  doc.fontSize(12);
  doc.text(`Tickets Sold: ${report.ticketsSold} tickets`);
  doc.text(`Revenue: RM ${report.revenue.toLocaleString('en-MY')}`);
  doc.text(`Occupancy Rate: ${report.occupancyPercentage.toFixed(2)}%`);
  doc.moveDown();

  // Tambahkan data berdasarkan tipe report
  if (type === 'daily') {
    // Data untuk laporan harian
    doc.fontSize(16).text('Sales Details by Hour:', { underline: true });
    doc.moveDown(0.5);

    // Tabel sederhana untuk data per jam
    const salesData = report.salesData;
    doc.fontSize(12);
    
    let y = doc.y;
    doc.text('Hour', 50, y);
    doc.text('Tickets Sold', 150, y);
    doc.text('Revenue (RM)', 250, y);
    
    // Garis tabel
    y += 15;
    doc.moveTo(50, y).lineTo(500, y).stroke();
    y += 10;

    // Hanya tampilkan jam dengan penjualan
    const filteredHours = salesData.filter((data: { count: number }) => data.count > 0);
    filteredHours.forEach((data: { hour: number; count: number }, index: number) => {
      const hour = data.hour;
      const count = data.count;
      const amount = report.revenueData[hour].amount;
      
      doc.text(`${hour}:00`, 50, y);
      doc.text(`${count}`, 150, y);
      doc.text(`${amount.toLocaleString('en-MY')}`, 250, y);
      
      y += 20;
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
    });
  }
  else if (type === 'weekly') {
    // Data untuk laporan mingguan
    doc.fontSize(16).text('Sales Details by Day:', { underline: true });
    doc.moveDown(0.5);

    // Tabel sederhana untuk data per hari
    const salesData = report.salesData;
    doc.fontSize(12);
    
    let y = doc.y;
    doc.text('Day', 50, y);
    doc.text('Tickets Sold', 150, y);
    doc.text('Revenue (RM)', 250, y);
    
    // Garis tabel
    y += 15;
    doc.moveTo(50, y).lineTo(500, y).stroke();
    y += 10;

    salesData.forEach((data: { day: string; count: number }, index: number) => {
      doc.text(`${data.day}`, 50, y);
      doc.text(`${data.count}`, 150, y);
      doc.text(`${report.revenueData[index].amount.toLocaleString('en-MY')}`, 250, y);
      
      y += 20;
    });
  }
  else if (type === 'monthly') {
    // Data untuk laporan bulanan
    doc.fontSize(16).text(`Sales Details - ${moment().month(report.month - 1).locale('en').format('MMMM')} ${report.year}:`, { underline: true });
    doc.moveDown(0.5);

    // Tabel sederhana untuk data per tanggal
    const salesData = report.salesData;
    doc.fontSize(12);
    
    let y = doc.y;
    doc.text('Date', 50, y);
    doc.text('Tickets Sold', 150, y);
    doc.text('Revenue (RM)', 250, y);
    
    // Garis tabel
    y += 15;
    doc.moveTo(50, y).lineTo(500, y).stroke();
    y += 10;

    // Hanya tampilkan tanggal dengan penjualan
    const filteredDays = salesData.filter((data: { count: number }) => data.count > 0);
    filteredDays.forEach((data: { day: number; count: number }, index: number) => {
      doc.text(`${data.day}`, 50, y);
      doc.text(`${data.count}`, 150, y);
      
      // Cari data pendapatan yang sesuai
      const revenueData = report.revenueData.find((r: { day: number }) => r.day === data.day);
      doc.text(`${revenueData ? revenueData.amount.toLocaleString('en-MY') : 0}`, 250, y);
      
      y += 20;
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
    });
  }

  // Tambahkan catatan kaki
  doc.fontSize(10);
  const now = new Date();
  doc.text(`Report generated on: ${moment(now).locale('en').format('DD MMMM YYYY HH:mm')}`, { align: 'right' });
  doc.text('HelpVerse Events Management System', { align: 'right' });

  return doc;
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