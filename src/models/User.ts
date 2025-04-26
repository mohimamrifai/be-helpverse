import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IUser } from '../types';

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Please add a username'],
      unique: true,
      trim: true,
      maxlength: [30, 'Username cannot be more than 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    fullName: {
      type: String,
      required: [true, 'Please add a full name'],
    },
    phone: {
      type: String,
      required: [true, 'Please add a phone number'],
    },
    organizerName: {
      type: String,
      required: function(this: any) {
        return this.role === 'eventOrganizer';
      },
    },
    role: {
      type: String,
      enum: ['user', 'eventOrganizer', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt password using bcrypt
UserSchema.pre('save', async function (this: any, next: any) {
  if (!this.isModified('password')) {
    next();
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function (this: any): string {
  const jwtSecret = process.env.JWT_SECRET || 'defaultsecret';
  const jwtExpire = process.env.JWT_EXPIRE || '30d';
  
  // @ts-ignore - Ignoring type issues with jwt.sign
  return jwt.sign(
    { id: this._id },
    jwtSecret,
    {
      expiresIn: jwtExpire,
    }
  );
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (this: any, enteredPassword: string): Promise<boolean> {
  try {
    console.log(`Attempting to match password for user: ${this.username}`);
    console.log(`Stored hashed password length: ${this.password?.length || 'undefined'}`);
    
    // Pastikan password ada sebelum membandingkan
    if (!this.password) {
      console.log('No password stored for user');
      return false;
    }
    
    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    console.log(`Password match result: ${isMatch}`);
    return isMatch;
  } catch (error) {
    console.error('Error in matchPassword:', error);
    return false;
  }
};

const User = mongoose.model<IUser>('User', UserSchema);

export default User; 