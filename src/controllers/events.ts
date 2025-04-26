import { Request, Response, NextFunction } from 'express';
import Event from '../models/Event';
import { IEvent, IUser } from '../types';

// Interface for request with user
interface AuthRequest extends Request {
  user?: IUser;
}

// @desc    Get all published events
// @route   GET /api/events
// @access  Public
export const getEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Build query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit', 'search'];
    removeFields.forEach((param) => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);
    
    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(
      /\b(gt|gte|lt|lte|in)\b/g,
      (match) => `$${match}`
    );

    // Finding resource
    let query = Event.find(JSON.parse(queryStr)).where('published').equals(true);

    // Add search functionality
    if (req.query.search) {
      const searchTerm = req.query.search as string;
      // Only perform search if searchTerm is not empty
      if (searchTerm.trim() !== '') {
        query = query.or([
          { name: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { location: { $regex: searchTerm, $options: 'i' } },
          { tags: { $in: [new RegExp(searchTerm, 'i')] } }
        ]);
      }
    }

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
    
    // Count documents with the same filter
    const countQuery = Event.find(JSON.parse(queryStr)).where('published').equals(true);
    
    // Apply search filter to count query
    if (req.query.search) {
      const searchTerm = req.query.search as string;
      if (searchTerm.trim() !== '') {
        countQuery.or([
          { name: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { location: { $regex: searchTerm, $options: 'i' } },
          { tags: { $in: [new RegExp(searchTerm, 'i')] } }
        ]);
      }
    }
    
    const total = await countQuery.countDocuments();

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const events = await query.populate('createdBy', 'username fullName');

    // Format time to HH:MM
    const formattedEvents = events.map(event => {
      const eventObj = event.toObject();
      if (eventObj.time && eventObj.time.length > 5) {
        eventObj.time = eventObj.time.slice(0, 5);
      }
      return eventObj;
    });

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

    res.status(200).json({
      success: true,
      count: events.length,
      pagination,
      data: formattedEvents,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
export const getEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'username fullName organizerName')
      .populate('tickets')
      .populate('promotionalOffers');

    if (!event) {
      res.status(404).json({
        success: false,
        error: 'Event not found',
      });
      return;
    }

    // If event is not published, only allow creator or admin to view it
    if (!event.published) {
      if (
        !req.headers.authorization ||
        !req.headers.authorization.startsWith('Bearer')
      ) {
        res.status(404).json({
          success: false,
          error: 'Event not found',
        });
        return;
      }

      // Check if user is creator or admin
      // Note: This would require middleware to verify the token and add user to req
      // For now, we'll just return a 404
      res.status(404).json({
        success: false,
        error: 'Event not found',
      });
      return;
    }

    // Format time to HH:MM
    const eventObj = event.toObject();
    if (eventObj.time && eventObj.time.length > 5) {
      eventObj.time = eventObj.time.slice(0, 5);
    }

    res.status(200).json({
      success: true,
      data: eventObj,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new event
// @route   POST /api/events
// @access  Private (Event Organizer/Admin)
export const createEvent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Add user to req.body
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized to access this route',
      });
      return;
    }

    req.body.createdBy = req.user.id;

    // Format time to HH:MM if it contains seconds
    if (req.body.time && req.body.time.length > 5) {
      req.body.time = req.body.time.slice(0, 5);
    }

    // Create event
    const event = await Event.create(req.body);

    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (err) {
    if (err instanceof Error) {
      res.status(400).json({
        success: false,
        error: err.message,
      });
    } else {
      next(err);
    }
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Owner/Admin)
export const updateEvent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized to access this route',
      });
      return;
    }

    let event = await Event.findById(req.params.id);

    if (!event) {
      res.status(404).json({
        success: false,
        error: 'Event not found',
      });
      return;
    }

    // Make sure user is event owner or admin
    if (
      event.createdBy.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      res.status(401).json({
        success: false,
        error: 'Not authorized to update this event',
      });
      return;
    }

    // Format time to HH:MM if it contains seconds
    if (req.body.time && req.body.time.length > 5) {
      req.body.time = req.body.time.slice(0, 5);
    }

    // Update event
    event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (err) {
    if (err instanceof Error) {
      res.status(400).json({
        success: false,
        error: err.message,
      });
    } else {
      next(err);
    }
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Owner/Admin)
export const deleteEvent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized to access this route',
      });
      return;
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      res.status(404).json({
        success: false,
        error: 'Event not found',
      });
      return;
    }

    // Make sure user is event owner or admin
    if (
      event.createdBy.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      res.status(401).json({
        success: false,
        error: 'Not authorized to delete this event',
      });
      return;
    }

    await event.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
}; 