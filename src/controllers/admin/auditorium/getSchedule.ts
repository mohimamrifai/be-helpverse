import { Request, Response, NextFunction } from 'express';
import AuditoriumSchedule from '../../../models/AuditoriumSchedule';
import { IUser } from '../../../types';

// Interface untuk request dengan user
interface AuthRequest extends Request {
  user?: IUser;
}

/**
 * @desc    Get auditorium schedule
 * @route   GET /api/admin/schedule
 * @access  Private (Admin)
 */
export const getAuditoriumSchedule = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { from, to } = req.query;
    
    let startDate: Date;
    const endDate = to ? new Date(to as string) : new Date();
    
    // If no 'from' date specified, use very old date (all time)
    if (from) {
      startDate = new Date(from as string);
    } else {
      // Default to all time - get earliest possible date
      startDate = new Date(2000, 0, 1); // January 1, 2000 as a safe default
    }
    
    // Set hours to get full days
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    const schedules = await AuditoriumSchedule.find({
      startTime: { $gte: startDate },
      endTime: { $lte: endDate }
    }).populate({
      path: 'event',
      select: 'name date time location',
    }).populate({
      path: 'booked_by',
      select: 'username fullName organizerName'
    }).sort('startTime');
    
    if (schedules.length === 0) {
      res.status(200).json({
        message: "Insufficient data for the selected period."
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      count: schedules.length,
      data: schedules,
    });
  } catch (err) {
    next(err);
  }
};

// Helper function to get schedule data for reports
export async function getScheduleData(startDate: Date, endDate: Date) {
  const schedules = await AuditoriumSchedule.find({
    startTime: { $gte: startDate },
    endTime: { $lte: endDate }
  }).populate({
    path: 'event',
    select: 'name date time location'
  }).populate({
    path: 'booked_by',
    select: 'username fullName organizerName'
  }).sort('startTime');
  
  return schedules;
} 