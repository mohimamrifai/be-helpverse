import express from 'express';
import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getMyEvents,
} from '../controllers/events';
import {
  getEventTickets,
  getTicketSeats,
} from '../controllers/tickets';
import {
  createWaitlistTickets,
  getWaitlistTickets,
} from '../controllers/waitlistTickets';
import { validateWaitlistTickets } from '../validators/waitlistTickets';
import { protect, authorize } from '../middlewares/auth';
import upload from '../middlewares/upload';

const router = express.Router();

// Get all events and create new event
router
  .route('/')
  .get(getEvents)
  .post(protect, authorize('eventOrganizer', 'admin'), upload.single('image'), createEvent);

// Get events for logged-in event organizer
router.route('/my-events').get(protect, authorize('eventOrganizer', 'admin'), getMyEvents);

// Get, update and delete single event
router
  .route('/:id')
  .get(getEvent)
  .put(protect, upload.single('image'), updateEvent)
  .delete(protect, deleteEvent);

// Tickets routes
router.route('/:id/tickets').get(getEventTickets);
router.route('/:id/tickets/:ticketId/seats').get(getTicketSeats);

// Waitlist tickets routes
router
  .route('/:id/waitlist-tickets')
  .get(getWaitlistTickets) // Public access for GET
  .post(protect, authorize('eventOrganizer', 'admin'), validateWaitlistTickets, createWaitlistTickets);

export default router;