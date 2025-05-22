import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Event from '../models/Event';
import Order from '../models/Order';
import AuditoriumSchedule from '../models/AuditoriumSchedule';
import { IUser } from '../types';

// Interface for request with user
interface AuthRequest extends Request {
  user?: IUser;
}

// Helper function to get hours difference between two dates
function getHoursDifference(startDate: Date, endDate: Date): number {
  const diffMs = endDate.getTime() - startDate.getTime();
  return parseFloat((diffMs / (1000 * 60 * 60)).toFixed(1)); // Convert ms to hours with 1 decimal place
}

// @desc    Get all events (including unpublished)
// @route   GET /api/admin/events
// @access  Private (Admin)
export const getAllEvents = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Build query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach((param) => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);
    
    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(
      /\b(gt|gte|lt|lte|in)\b/g,
      (match) => `$${match}`
    );

    // Finding resource
    let query = Event.find(JSON.parse(queryStr));

    // Select fields
    if (req.query.select) {
      const fields = (req.query.select as string).split(',').join(' ');
      // @ts-ignore
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = (req.query.sort as string).split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Event.countDocuments();

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const events = await query.populate('createdBy', 'username fullName organizerName');

    // Pagination result
    const pagination: any = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }

    // Get auditorium schedules for all events to include usage hours
    const eventIds = events.map(event => event._id);
    const schedules = await AuditoriumSchedule.find({
      event: { $in: eventIds }
    });

    // Map schedules to events by event ID
    const scheduleMap = schedules.reduce((map, schedule) => {
      map[schedule.event.toString()] = schedule;
      return map;
    }, {} as Record<string, typeof schedules[0]>);

    // Enhance events with duration/usage hours
    const enhancedEvents = events.map(event => {
      const eventObj = event.toObject();
      const schedule = scheduleMap[(event as any)._id.toString()];
      
      if (schedule) {
        // Calculate usage hours from schedule
        eventObj.usageHours = getHoursDifference(schedule.startTime, schedule.endTime);
        eventObj.duration = eventObj.usageHours; // Add duration field as well for compatibility
      } else {
        // Default to 3 hours if no schedule found (common event duration)
        eventObj.usageHours = 3.0;
        eventObj.duration = 3.0;
      }
      
      // Check if event is in the future
      const now = new Date();
      const eventDate = new Date(event.date);
      eventObj.isUpcoming = eventDate > now;
      
      return eventObj;
    });

    res.status(200).json({
      success: true,
      count: enhancedEvents.length,
      pagination,
      data: enhancedEvents,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
export const getUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await User.find();

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin)
export const updateUserRole = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { role } = req.body;

    // Check if role is valid
    if (!['user', 'eventOrganizer', 'admin'].includes(role)) {
      res.status(400).json({
        success: false,
        error: 'Invalid role',
      });
      return;
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Update user role
    user.role = role;
    
    // If promoting to event organizer, check if organizerName is provided
    if (role === 'eventOrganizer' && !user.organizerName && !req.body.organizerName) {
      res.status(400).json({
        success: false,
        error: 'Organizer name is required for event organizer role',
      });
      return;
    }

    // If organizerName is provided, update it
    if (req.body.organizerName) {
      user.organizerName = req.body.organizerName;
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private (Admin)
export const getAllOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orders = await Order.find()
      .populate({
        path: 'user',
        select: 'username fullName email',
      })
      .populate({
        path: 'event',
        select: 'name date time location',
      })
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get platform statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
export const getStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get total users
    const totalUsers = await User.countDocuments();
    const totalEventOrganizers = await User.countDocuments({ role: 'eventOrganizer' });
    
    // Get total events
    const totalEvents = await Event.countDocuments();
    const publishedEvents = await Event.countDocuments({ published: true });
    const pendingEvents = await Event.countDocuments({ approvalStatus: 'pending' });
    
    // Get total orders
    const totalOrders = await Order.countDocuments();
    const confirmedOrders = await Order.countDocuments({ status: 'confirmed' });
    const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });
    
    // Get total revenue
    const revenue = await Order.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    
    const totalRevenue = revenue.length > 0 ? revenue[0].total : 0;
    
    // Get top events by sales
    const topEvents = await Order.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: '$event', totalSales: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      { $sort: { totalSales: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'events',
          localField: '_id',
          foreignField: '_id',
          as: 'eventDetails',
        },
      },
      {
        $project: {
          _id: 1,
          totalSales: 1,
          count: 1,
          event: { $arrayElemAt: ['$eventDetails', 0] },
        },
      },
      {
        $project: {
          _id: 1,
          totalSales: 1,
          count: 1,
          'event.name': 1,
          'event.date': 1,
        },
      },
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          eventOrganizers: totalEventOrganizers,
        },
        events: {
          total: totalEvents,
          published: publishedEvents,
          pending: pendingEvents,
        },
        orders: {
          total: totalOrders,
          confirmed: confirmedOrders,
          cancelled: cancelledOrders,
        },
        revenue: {
          total: totalRevenue,
        },
        topEvents,
      },
    });
  } catch (err) {
    next(err);
  }
}; 