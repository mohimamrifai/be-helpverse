import fs from 'fs';
import path from 'path';

/**
 * Menghapus file dari sistem
 * @param filePath Path relatif dari file (misal /uploads/images/image-1234.jpg)
 * @returns Promise<boolean> true jika berhasil dihapus
 */
export const deleteFile = async (filePath: string): Promise<boolean> => {
  try {
    const fullPath = path.join(__dirname, '../../', filePath.replace(/^\//, ''));
    
    // Periksa apakah file ada
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}; 