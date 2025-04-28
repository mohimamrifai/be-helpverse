import mongoose from 'mongoose';
import { resetEventsCollection } from './dbIndexFix';

/**
 * Script untuk me-reset database jika diperlukan
 * GUNAKAN DENGAN HATI-HATI: semua data akan hilang!
 */
const resetDatabase = async () => {
  try {
    // Koneksi ke database
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/helpverse';
    await mongoose.connect(mongoUri);
    console.log('Terhubung ke MongoDB');

    // Reset koleksi events
    await resetEventsCollection();

    console.log('Reset database selesai');
    process.exit(0);
  } catch (error) {
    console.error('Gagal me-reset database:', error);
    process.exit(1);
  }
};

// Jalankan reset database
resetDatabase(); 