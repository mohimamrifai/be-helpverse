import fs from 'fs';
import path from 'path';

/**
 * Menghapus file dari sistem
 * @param filePath Path relatif dari file (misal /src/uploads/images/image-1234.jpg)
 * @returns Promise<boolean> true jika berhasil dihapus
 */
export const deleteFile = async (filePath: string): Promise<boolean> => {
  try {
    let fullPath;
    
    // Cek apakah path dimulai dengan /src atau src
    if (filePath.startsWith('/src/') || filePath.startsWith('src/')) {
      fullPath = path.join(__dirname, '../..', filePath.replace(/^\/?src\//, ''));
    } else {
      fullPath = path.join(__dirname, '../../', filePath.replace(/^\//, ''));
    }
    
    console.log('Attempting to delete file at:', fullPath);
    
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