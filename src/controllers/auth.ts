import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { IUser } from '../types';

// Interface for request with user
interface AuthRequest extends Request {
  user?: IUser;
}

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, email, password, fullName, phone } = req.body;

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      fullName,
      phone,
      role: 'user',
    });

    // Send token response
    sendTokenResponse(user, 201, res);
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

// @desc    Register event organizer
// @route   POST /api/auth/register/event-organizer
// @access  Public
export const registerEventOrganizer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, email, password, fullName, phone, organizerName } = req.body;

    // Validate event organizer specific fields
    if (!organizerName) {
      res.status(400).json({
        success: false,
        error: 'Please provide an organizer name',
      });
      return;
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      fullName,
      phone,
      organizerName,
      role: 'eventOrganizer',
    });

    // Send token response
    sendTokenResponse(user, 201, res);
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

// @desc    Login user (with username or email)
// @route   POST /api/auth/login
// @access  Public
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { identifier, email, password } = req.body;
    
    // Gunakan identifier jika ada, jika tidak gunakan email (untuk kompatibilitas)
    const loginIdentifier = identifier || email;

    console.log(`Login attempt with identifier: ${loginIdentifier}`);

    // Validate identifier & password
    if (!loginIdentifier || !password) {
      res.status(400).json({
        success: false,
        error: 'Please provide a username/email and password',
      });
      return;
    }

    // Check for user by email or username
    const user = await User.findOne({ 
      $or: [
        { email: loginIdentifier },
        { username: loginIdentifier }
      ]
    }).select('+password');

    if (!user) {
      console.log(`User not found with identifier: ${loginIdentifier}`);
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
      return;
    }

    console.log(`User found: ${user.username}, comparing passwords`);

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    console.log(`Password match result: ${isMatch}`);

    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
      return;
    }

    // Send token response
    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error('Login error:', err);
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (
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

    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
export const logout = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // Expires in 10 seconds
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    data: {},
  });
};

// Get token from model, create cookie and send response
const sendTokenResponse = (
  user: IUser,
  statusCode: number,
  res: Response
): void => {
  // Create token
  const token = user.getSignedJwtToken();

  const cookieOptions = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRE ? 
        parseInt(process.env.JWT_COOKIE_EXPIRE) : 30) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
    });
};

// @desc    Change user password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (
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

    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: 'Please provide current password and new password',
      });
      return;
    }

    // Validate new password length
    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters',
      });
      return;
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Check if current password matches
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: 'Current password is incorrect',
      });
      return;
    }

    // Set new password
    user.password = newPassword;
    await user.save();

    // Send token response with new token
    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error('Change password error:', err);
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