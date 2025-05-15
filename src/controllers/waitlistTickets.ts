import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import WaitlistTicket from '../models/WaitlistTicket';
import Event from '../models/Event';
import { IUser, IWaitlistTicket } from '../types';
import notificationService from '../utils/notificationService';

// Interface for request with user
interface AuthRequest extends Request {
  user?: IUser;
}

// @desc    Create waitlist tickets for an event
// @route   POST /api/events/:id/waitlist-tickets
// @access  Private (Event Organizer)
export const createWaitlistTickets = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id: eventId } = req.params;
    const { waitlistTickets } = req.body;

    // Validasi input
    if (!waitlistTickets || !Array.isArray(waitlistTickets) || waitlistTickets.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Data tiket waitlist tidak valid',
      });
      return;
    }

    // Cek apakah event ada dan milik user saat ini (jika bukan admin)
    const event = await Event.findById(eventId);
    
    if (!event) {
      res.status(404).json({
        success: false,
        error: 'Event tidak ditemukan',
      });
      return;
    }

    // Cek apakah event milik user saat ini (jika bukan admin)
    if (
      req.user?.role !== 'admin' &&
      event.createdBy.toString() !== req.user?.id
    ) {
      res.status(403).json({
        success: false,
        error: 'Anda tidak memiliki akses untuk event ini',
      });
      return;
    }

    // Verifikasi bahwa semua tiket event sudah habis
    const isSoldOut = event.availableSeats === 0;
    if (!isSoldOut) {
      res.status(400).json({
        success: false,
        error: 'Tiket waitlist hanya dapat dibuat jika semua tiket reguler sudah habis',
      });
      return;
    }

    // Cari tiket-tiket yang ada untuk validasi
    const existingTicketNames = event.tickets.map((ticket: any) => ticket.name);

    // Hapus tiket waitlist yang sudah ada untuk event ini (untuk menghindari duplikasi)
    await WaitlistTicket.deleteMany({ event: eventId });

    // Buat tiket waitlist baru
    const waitlistTicketPromises = waitlistTickets.map(async (ticket: any) => {
      // Validasi bahwa originalTicketRef ada di tiket asli
      if (!existingTicketNames.includes(ticket.originalTicketRef)) {
        throw new Error(`Tiket asli dengan nama ${ticket.originalTicketRef} tidak ditemukan`);
      }

      // Temukan tiket asli untuk mendapatkan detail tambahan jika diperlukan
      const originalTicket = event.tickets.find(
        (t: any) => t.name === ticket.originalTicketRef
      );

      // Jika originalTicket tidak ditemukan, throw error
      if (!originalTicket) {
        throw new Error(`Tiket asli dengan nama ${ticket.originalTicketRef} tidak dapat diakses`);
      }

      return WaitlistTicket.create({
        name: ticket.name,
        description: ticket.description || originalTicket.description,
        price: ticket.price || originalTicket.price,
        quantity: ticket.quantity,
        originalTicketRef: ticket.originalTicketRef,
        event: eventId,
        createdBy: req.user?.id,
      });
    });

    const createdWaitlistTickets = await Promise.all(waitlistTicketPromises);

    // Kirim notifikasi ke semua user yang berada dalam waiting list untuk event ini
    const notificationResults = await Promise.all(
      createdWaitlistTickets.map(async (ticket) => {
        const message = `Tiket waitlist "${ticket.name}" untuk event "${event.name}" telah tersedia. Harga: ${ticket.price}. Segera pesan sebelum kehabisan!`;
        
        // Dapatkan ID ticket dari dokumen yang baru dibuat
        const ticketId = ticket._id ? ticket._id.toString() : '';
        
        return notificationService.notifyWaitlistUsers(
          eventId,
          ticketId,
          message
        );
      })
    );

    const totalNotified = notificationResults.reduce(
      (total, result) => total + (result.count || 0),
      0
    );

    res.status(201).json({
      success: true,
      count: createdWaitlistTickets.length,
      data: createdWaitlistTickets,
      message: `Tiket waitlist berhasil dibuat dan ${totalNotified} notifikasi terkirim ke user dalam waiting list`,
    });
  } catch (error) {
    console.error('Error in createWaitlistTickets:', error);
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    } else {
      next(error);
    }
  }
};

// @desc    Get waitlist tickets for an event
// @route   GET /api/events/:id/waitlist-tickets
// @access  Public
export const getWaitlistTickets = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id: eventId } = req.params;

    // Cek apakah event ada
    const event = await Event.findById(eventId);
    
    if (!event) {
      res.status(404).json({
        success: false,
        error: 'Event tidak ditemukan',
      });
      return;
    }

    // Cek apakah event telah dipublikasikan
    if (!event.published) {
      res.status(404).json({
        success: false,
        error: 'Event tidak ditemukan atau belum dipublikasikan',
      });
      return;
    }

    // Ambil semua tiket waitlist untuk event
    const waitlistTickets = await WaitlistTicket.find({ event: eventId });

    res.status(200).json({
      success: true,
      count: waitlistTickets.length,
      data: waitlistTickets,
    });
  } catch (error) {
    console.error('Error in getWaitlistTickets:', error);
    next(error);
  }
}; 