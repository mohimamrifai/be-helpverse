import { Request, Response, NextFunction } from 'express';
import Order from '../models/Order';
import Event from '../models/Event';
import WaitlistTicket from '../models/WaitlistTicket';
import { IUser } from '../types';
import WaitingList from '../models/WaitingList';

// Interface for request with user
interface AuthRequest extends Request {
  user?: IUser;
}

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (
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

    const { eventId, tickets, paymentInfo, isWaitlist } = req.body;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({
        success: false,
        error: 'Event not found',
      });
      return;
    }

    // Check if tickets are valid
    if (!tickets || tickets.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Please add at least one ticket to the order',
      });
      return;
    }

    // Calculate total amount
    let totalAmount = 0;
    const processedTickets = [];
    
    for (const ticket of tickets) {
      let eventTicket;
      
      // Jika pemesanan untuk waitlist ticket
      if (isWaitlist) {
        // Cek apakah user sudah pernah memesan tiket waitlist untuk event ini
        const existingOrder = await Order.findOne({
          user: req.user.id,
          event: eventId,
          isWaitlist: true,
          status: { $ne: 'cancelled' } // Tidak termasuk pesanan yang dibatalkan
        });

        if (existingOrder) {
          res.status(400).json({
            success: false,
            error: 'Anda sudah pernah memesan tiket waitlist untuk event ini',
          });
          return;
        }

        // Cari tiket waitlist berdasarkan nama
        const waitlistTicket = await WaitlistTicket.findOne({
          event: eventId,
          name: ticket.ticketType
        });

        if (!waitlistTicket) {
          res.status(400).json({
            success: false,
            error: `Waitlist ticket type ${ticket.ticketType} not found`,
          });
          return;
        }

        // Buat eventTicket dari waitlistTicket
        eventTicket = {
          name: waitlistTicket.name,
          price: waitlistTicket.price,
          quantity: waitlistTicket.quantity,
          bookedSeats: [], // Waitlist tidak menyimpan booked seats
          seatArrangement: { 
            rows: 1, 
            columns: waitlistTicket.quantity 
          } // Sederhanakan untuk waitlist
        };
      } else {
        // Jika pemesanan untuk tiket reguler
        eventTicket = event.tickets.find(
          (t) => t.name === ticket.ticketType
        );

        if (!eventTicket) {
          res.status(400).json({
            success: false,
            error: `Ticket type ${ticket.ticketType} not found`,
          });
          return;
        }

        // Check if enough seats are available
        if (ticket.quantity > (eventTicket.quantity - eventTicket.bookedSeats.length)) {
          res.status(400).json({
            success: false,
            error: `Not enough seats available for ticket type ${ticket.ticketType}`,
          });
          return;
        }

        // Verify seat selection
        if (ticket.seats && ticket.seats.length !== ticket.quantity) {
          res.status(400).json({
            success: false,
            error: `Number of seats selected (${ticket.seats.length}) does not match quantity (${ticket.quantity})`,
          });
          return;
        }

        // Verify each seat is valid and not already booked
        if (ticket.seats) {
          for (const seat of ticket.seats) {
            // Check if seat is within range
            if (
              seat.row < 1 ||
              seat.row > eventTicket.seatArrangement.rows ||
              seat.column < 1 ||
              seat.column > eventTicket.seatArrangement.columns
            ) {
              res.status(400).json({
                success: false,
                error: `Seat (${seat.row}, ${seat.column}) is out of range`,
              });
              return;
            }

            // Check if seat is already booked
            const isBooked = eventTicket.bookedSeats.some(
              (bookedSeat) =>
                bookedSeat.row === seat.row && bookedSeat.column === seat.column
            );

            if (isBooked) {
              res.status(400).json({
                success: false,
                error: `Seat (${seat.row}, ${seat.column}) is already booked`,
              });
              return;
            }
          }
        }
      }

      // Add price from database to the ticket
      const processedTicket = {
        ...ticket,
        price: eventTicket.price,
        isWaitlist: isWaitlist ? true : false
      };
      processedTickets.push(processedTicket);
      
      totalAmount += eventTicket.price * ticket.quantity;
    }

    // Apply discount if promo code is provided
    let discount = 0;
    if (req.body.promoCode && !isWaitlist) { // Tidak menerapkan promo untuk pemesanan waitlist
      const offer = event.promotionalOffers.find(
        (o) => o.code === req.body.promoCode && o.active
      );

      if (offer) {
        // Check if the offer is still valid
        const now = new Date();
        if (now >= offer.validFrom && now <= offer.validUntil) {
          // Check if max uses is not exceeded
          if (offer.currentUses < offer.maxUses) {
            // Calculate discount
            if (offer.discountType === 'percentage') {
              discount = (totalAmount * offer.discountValue) / 100;
            } else {
              discount = offer.discountValue;
            }

            // Increment offer usage
            offer.currentUses += 1;
            await event.save();
          }
        }
      }
    }

    // Create order
    const orderData = {
      user: req.user.id,
      event: eventId,
      tickets: processedTickets,
      totalAmount: totalAmount - discount,
      discount,
      promoCode: req.body.promoCode,
      status: 'confirmed', // Assuming payment is made at time of order
      paymentInfo,
      isWaitlist: isWaitlist ? true : false
    };

    const order = await Order.create(orderData);

    // Update event's available seats and mark seats as booked (hanya untuk tiket reguler)
    if (!isWaitlist) {
      for (const ticket of tickets) {
        const eventTicket = event.tickets.find(
          (t: any) => t.name === ticket.ticketType
        );

        if (eventTicket && ticket.seats) {
          // Mark seats as booked
          for (const seat of ticket.seats) {
            eventTicket.bookedSeats.push({
              row: seat.row,
              column: seat.column,
              bookingId: order._id?.toString() || order.id,
            });
          }
        }
      }

      // Update event's available seats
      event.availableSeats -= tickets.reduce(
        (total: number, ticket: any) => total + ticket.quantity,
        0
      );

      await event.save();
    } else {
      // Untuk waitlist, update jumlah tiket waitlist yang sudah dibeli
      for (const ticket of tickets) {
        await WaitlistTicket.findOneAndUpdate(
          { event: eventId, name: ticket.ticketType },
          { $inc: { quantity: -ticket.quantity } }
        );
      }
      
      // Hapus user dari waiting list setelah berhasil memesan tiket waitlist
      await WaitingList.findOneAndUpdate(
        {
          event: eventId,
          email: req.user.email
        },
        { orderCompleted: true }
      );
    }

    res.status(201).json({
      success: true,
      data: order,
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

// @desc    Get user orders
// @route   GET /api/orders
// @access  Private
export const getUserOrders = async (
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

    const orders = await Order.find({ user: req.user.id })
      .populate({
        path: 'event',
        select: 'name date time location image',
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

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
export const getOrder = async (
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

    const order = await Order.findById(req.params.id).populate({
      path: 'event',
      select: 'name date time location image tickets',
      populate: {
        path: 'createdBy',
        select: 'username fullName organizerName',
      },
    });

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found',
      });
      return;
    }

    // Make sure user owns the order or is admin
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(401).json({
        success: false,
        error: 'Not authorized to access this order',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (
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

    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found',
      });
      return;
    }

    // Make sure user owns the order or is admin
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(401).json({
        success: false,
        error: 'Not authorized to access this order',
      });
      return;
    }

    // Check if order is already cancelled
    if (order.status === 'cancelled') {
      res.status(400).json({
        success: false,
        error: 'Order is already cancelled',
      });
      return;
    }

    // Update order status
    order.status = 'cancelled';
    await order.save();

    // Free up seats in the event
    const event = await Event.findById(order.event);

    if (event) {
      // Remove booked seats
      for (const orderTicket of order.tickets) {
        const eventTicket = event.tickets.find(
          (t: any) => t.name === orderTicket.ticketType
        );

        if (eventTicket) {
          // Remove booked seats for this order
          eventTicket.bookedSeats = eventTicket.bookedSeats.filter(
            (seat) => seat.bookingId !== (order._id?.toString() || order.id)
          );
        }
      }

      // Update available seats
      event.availableSeats += order.tickets.reduce(
        (total, ticket) => total + ticket.quantity,
        0
      );

      await event.save();
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
}; 