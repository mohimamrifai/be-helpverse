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
  req: AuthRequest & { file?: Express.Multer.File },
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

    const eventData = { ...req.body };
    eventData.createdBy = req.user.id;

    // Format time to HH:MM if it contains seconds
    if (eventData.time && eventData.time.length > 5) {
      eventData.time = eventData.time.slice(0, 5);
    }

    // Handle image upload if a file is provided
    if (req.file) {
      console.log('File uploaded:', req.file);
      // Gunakan path relative untuk akses via browser
      eventData.image = `/uploads/images/${req.file.filename}`;
      console.log('Image path saved:', eventData.image);
    } else if (eventData.image && typeof eventData.image === 'object') {
      // Jika image adalah objek kosong, hapus agar default di model digunakan
      console.log('Image is empty object, removing it');
      delete eventData.image;
    }

    // Parse tickets dan promotionalOffers jika dikirim sebagai string
    if (eventData.tickets && typeof eventData.tickets === 'string') {
      try {
        eventData.tickets = JSON.parse(eventData.tickets);
        console.log('Parsed tickets JSON successfully');
      } catch (error) {
        console.error('Error parsing tickets:', error);
        // Jika tidak bisa di-parse, hapus saja
        delete eventData.tickets;
      }
    }

    if (eventData.promotionalOffers && typeof eventData.promotionalOffers === 'string') {
      try {
        eventData.promotionalOffers = JSON.parse(eventData.promotionalOffers);
        console.log('Parsed promotionalOffers JSON successfully');
      } catch (error) {
        console.error('Error parsing promotionalOffers:', error);
        // Jika tidak bisa di-parse, hapus saja
        delete eventData.promotionalOffers;
      }
    }

    // Hapus promotionalOffers jika array kosong atau tidak valid
    if (eventData.promotionalOffers) {
      if (Array.isArray(eventData.promotionalOffers) && eventData.promotionalOffers.length === 0) {
        console.log('Removing empty promotionalOffers array');
        delete eventData.promotionalOffers;
      } else if (typeof eventData.promotionalOffers === 'object' && Object.keys(eventData.promotionalOffers).length === 0) {
        console.log('Removing empty promotionalOffers object');
        delete eventData.promotionalOffers;
      }
    }

    if (eventData.tags && typeof eventData.tags === 'string') {
      try {
        eventData.tags = JSON.parse(eventData.tags);
        console.log('Parsed tags JSON successfully');
      } catch (error) {
        console.error('Error parsing tags:', error);
        // Jika string tunggal, konversi ke array dengan 1 item
        if (eventData.tags.trim() !== '') {
          eventData.tags = [eventData.tags];
        } else {
          delete eventData.tags;
        }
      }
    }

    console.log('Creating event with data:', JSON.stringify(eventData, null, 2));
    // Create event
    const event = await Event.create(eventData);
    console.log('Event created successfully:', event._id);

    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (err) {
    console.error('Error creating event:', err);
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
  req: AuthRequest & { file?: Express.Multer.File },
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

    const updateData = { ...req.body };

    // Format time to HH:MM if it contains seconds
    if (updateData.time && updateData.time.length > 5) {
      updateData.time = updateData.time.slice(0, 5);
    }

    // Handle image upload if a file is provided
    if (req.file) {
      console.log('New file uploaded:', req.file);
      
      // Delete old image if it exists
      if (event.image) {
        try {
          const { deleteFile } = require('../utils/fileHelper');
          await deleteFile(event.image);
          console.log('Old image deleted:', event.image);
        } catch (error) {
          console.error('Failed to delete old image:', error);
          // Continue even if delete fails
        }
      }
      
      // Set new image path
      updateData.image = `/uploads/images/${req.file.filename}`;
      console.log('New image path saved:', updateData.image);
    } else if (updateData.image && typeof updateData.image === 'object') {
      // Jika image adalah objek kosong, hapus dari data update
      console.log('Image is empty object, removing from update data');
      delete updateData.image;
    }

    // Parse tickets dan promotionalOffers jika dikirim sebagai string
    if (updateData.tickets && typeof updateData.tickets === 'string') {
      try {
        updateData.tickets = JSON.parse(updateData.tickets);
        console.log('Parsed tickets JSON successfully');
      } catch (error) {
        console.error('Error parsing tickets:', error);
        delete updateData.tickets;
      }
    }

    if (updateData.promotionalOffers && typeof updateData.promotionalOffers === 'string') {
      try {
        updateData.promotionalOffers = JSON.parse(updateData.promotionalOffers);
        console.log('Parsed promotionalOffers JSON successfully');
      } catch (error) {
        console.error('Error parsing promotionalOffers:', error);
        delete updateData.promotionalOffers;
      }
    }

    // Hapus promotionalOffers jika array kosong atau tidak valid
    if (updateData.promotionalOffers) {
      if (Array.isArray(updateData.promotionalOffers) && updateData.promotionalOffers.length === 0) {
        console.log('Removing empty promotionalOffers array');
        delete updateData.promotionalOffers;
      } else if (typeof updateData.promotionalOffers === 'object' && Object.keys(updateData.promotionalOffers).length === 0) {
        console.log('Removing empty promotionalOffers object');
        delete updateData.promotionalOffers;
      }
    }

    if (updateData.tags && typeof updateData.tags === 'string') {
      try {
        updateData.tags = JSON.parse(updateData.tags);
        console.log('Parsed tags JSON successfully');
      } catch (error) {
        console.error('Error parsing tags:', error);
        if (updateData.tags.trim() !== '') {
          updateData.tags = [updateData.tags];
        } else {
          delete updateData.tags;
        }
      }
    }

    console.log('Updating event with data:', JSON.stringify(updateData, null, 2));
    // Update event
    event = await Event.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });
    
    console.log('Event updated successfully:', event?._id);

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (err) {
    console.error('Error updating event:', err);
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
// @access  Private
export const deleteEvent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      res.status(404).json({
        success: false,
        error: 'Event not found',
      });
      return;
    }

    // Ensure user is event creator or admin
    if (
      !req.user ||
      (event.createdBy.toString() !== req.user.id &&
        req.user.role !== 'admin')
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

// @desc    Get all events created by the logged-in event organizer
// @route   GET /api/events/my-events
// @access  Private (Event Organizer, Admin)
export const getMyEvents = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Set no-cache headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized to access this route',
      });
      return;
    }

    // Build query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit', 'search'];
    removeFields.forEach((param) => delete reqQuery[param]);

    // Add createdBy filter to get only events created by the logged-in user
    const query = { ...JSON.parse(JSON.stringify(reqQuery)), createdBy: req.user.id };

    // Create query string
    let queryStr = JSON.stringify(query);
    
    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(
      /\b(gt|gte|lt|lte|in)\b/g,
      (match) => `$${match}`
    );

    // Finding resource
    let findQuery = Event.find(JSON.parse(queryStr));

    // Add search functionality
    if (req.query.search) {
      const searchTerm = req.query.search as string;
      // Only perform search if searchTerm is not empty
      if (searchTerm.trim() !== '') {
        findQuery = findQuery.or([
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
      findQuery = findQuery.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = (req.query.sort as string).split(',').join(' ');
      findQuery = findQuery.sort(sortBy);
    } else {
      findQuery = findQuery.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    // Count total documents with the same filter
    const total = await Event.countDocuments(JSON.parse(queryStr));

    findQuery = findQuery.skip(startIndex).limit(limit);

    // Populate with event organizer details
    findQuery = findQuery.populate('createdBy', 'username fullName organizerName');

    // Executing query
    const events = await findQuery;

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