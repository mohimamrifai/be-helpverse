import { Request, Response, NextFunction } from 'express';
import Event from '../models/Event';
import { IUser, ITicket } from '../types';

// Interface for request with user
interface AuthRequest extends Request {
  user?: IUser;
}

// @desc    Get available tickets for event
// @route   GET /api/events/:id/tickets
// @access  Public
export const getEventTickets = async (
  req: Request,
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

    // Check if event is published
    if (!event.published) {
      res.status(404).json({
        success: false,
        error: 'Event not found or not published yet',
      });
      return;
    }

    // Get tickets with price, availability, and other public info
    const tickets = event.tickets.map((ticket) => ({
      id: ticket._id,
      name: ticket.name,
      description: ticket.description,
      price: ticket.price,
      availableSeats: ticket.quantity - ticket.bookedSeats.length,
      status: ticket.status,
      startDate: ticket.startDate,
      endDate: ticket.endDate,
    }));

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get seat availability for a specific ticket
// @route   GET /api/events/:id/tickets/:ticketId/seats
// @access  Public
export const getTicketSeats = async (
  req: Request,
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

    // Check if event is published
    if (!event.published) {
      res.status(404).json({
        success: false,
        error: 'Event not found or not published yet',
      });
      return;
    }

    // Find the specific ticket
    const ticket = event.tickets.find(
      (ticket: any) => ticket._id.toString() === req.params.ticketId
    );

    if (!ticket) {
      res.status(404).json({
        success: false,
        error: 'Ticket not found',
      });
      return;
    }

    // Create a seat map
    const { rows, columns } = ticket.seatArrangement;
    const seatMap: Array<Array<{available: boolean, row: number, column: number}>> = [];

    // Initialize seatMap with all seats available
    for (let r = 0; r < rows; r++) {
      seatMap[r] = [];
      for (let c = 0; c < columns; c++) {
        seatMap[r][c] = {
          available: true,
          row: r + 1,
          column: c + 1
        };
      }
    }

    // Mark booked seats as unavailable
    for (const bookedSeat of ticket.bookedSeats) {
      const r = bookedSeat.row - 1;
      const c = bookedSeat.column - 1;
      if (r >= 0 && r < rows && c >= 0 && c < columns) {
        seatMap[r][c].available = false;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        ticketId: ticket._id,
        ticketName: ticket.name,
        totalSeats: rows * columns,
        availableSeats: ticket.quantity - ticket.bookedSeats.length,
        seatArrangement: {
          rows,
          columns,
        },
        seatMap,
      },
    });
  } catch (err) {
    next(err);
  }
}; 