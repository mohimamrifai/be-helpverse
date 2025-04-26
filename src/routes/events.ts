import express from 'express';
import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../controllers/events';
import {
  getEventTickets,
  getTicketSeats,
} from '../controllers/tickets';
import { protect, authorize } from '../middlewares/auth';

const router = express.Router();

// Get all events and create new event
router
  .route('/')
  .get(getEvents)
  .post(protect, authorize('eventOrganizer', 'admin'), createEvent);

// Get, update and delete single event
router
  .route('/:id')
  .get(getEvent)
  .put(protect, updateEvent)
  .delete(protect, deleteEvent);

// Tickets routes
router.route('/:id/tickets').get(getEventTickets);
router.route('/:id/tickets/:ticketId/seats').get(getTicketSeats);

export default router;