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
import upload from '../middlewares/upload';

const router = express.Router();

// Get all events and create new event
router
  .route('/')
  .get(getEvents)
  .post(protect, authorize('eventOrganizer', 'admin'), upload.single('image'), createEvent);

// Get, update and delete single event
router
  .route('/:id')
  .get(getEvent)
  .put(protect, upload.single('image'), updateEvent)
  .delete(protect, deleteEvent);

// Tickets routes
router.route('/:id/tickets').get(getEventTickets);
router.route('/:id/tickets/:ticketId/seats').get(getTicketSeats);

export default router;