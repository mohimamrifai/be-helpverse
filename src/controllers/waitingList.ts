import { Request, Response } from 'express';
import WaitingList from '../models/WaitingList';
import Event from '../models/Event';
import mongoose from 'mongoose';

// @desc    Register to waiting list
// @route   POST /api/waiting-list
// @access  Public
export const registerToWaitingList = async (req: Request, res: Response) => {
  try {
    const { name, email, event } = req.body;

    // Check if event exists
    const eventExists = await Event.findById(event);
    if (!eventExists) {
      return res.status(404).json({
        success: false,
        error: 'Event tidak ditemukan',
      });
    }

    // Check if user already in waiting list for this event
    const existingRegistration = await WaitingList.findOne({
      email,
      event,
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        error: 'Anda sudah terdaftar dalam waiting list untuk event ini',
      });
    }

    // Create new waiting list entry
    const waitingList = await WaitingList.create({
      name,
      email,
      phone: '-', // Default value karena tidak ada input dari frontend
      event,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      data: waitingList,
      message: 'Berhasil mendaftar dalam waiting list',
    });
  } catch (error) {
    console.error('Error in registerToWaitingList:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mendaftar dalam waiting list',
    });
  }
};

// @desc    Get user's waiting list entries
// @route   GET /api/waiting-list
// @access  Public
export const getUserWaitingList = async (req: Request, res: Response) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email diperlukan untuk mencari waiting list',
      });
    }
    
    // Ubah email ke lowercase untuk konsistensi
    const emailLowerCase = (email as string).toLowerCase();
    
    // Cek apakah ada data waiting list dengan email ini (case-insensitive search)
    const waitingList = await WaitingList.find({ 
      email: { $regex: new RegExp('^' + emailLowerCase + '$', 'i') } 
    })
      .populate('event') // Populate semua data event
      .sort({ registeredAt: -1 });
    
    res.status(200).json({
      success: true,
      count: waitingList.length,
      data: waitingList,
    });
  } catch (error) {
    console.error('Error in getUserWaitingList:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data waiting list user',
    });
  }
};

// @desc    Delete user's waiting list entry
// @route   DELETE /api/waiting-list/:id
// @access  Public (with email verification)
export const deleteUserWaitingList = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email diperlukan untuk verifikasi',
      });
    }

    // Ubah email ke lowercase untuk konsistensi
    const emailLowerCase = email.toLowerCase();

    // Cari waiting list dengan ID dan email yang sesuai
    const waitingList = await WaitingList.findOne({
      _id: id,
      email: { $regex: new RegExp('^' + emailLowerCase + '$', 'i') }
    });

    if (!waitingList) {
      return res.status(404).json({
        success: false,
        error: 'Data waiting list tidak ditemukan atau email tidak sesuai',
      });
    }

    await waitingList.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Data waiting list berhasil dihapus',
    });
  } catch (error) {
    console.error('Error in deleteUserWaitingList:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal menghapus data waiting list',
    });
  }
}; 