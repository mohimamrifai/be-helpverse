import mongoose from 'mongoose';

/**
 * Menghapus indeks yang bermasalah pada koleksi events
 */
export const fixEventIndices = async (): Promise<void> => {
  try {
    // Coba mendapatkan koleksi events
    const eventsCollection = mongoose.connection.collection('events');
    
    // Dapatkan semua indeks
    const indices = await eventsCollection.indexes();
    console.log('Indeks yang ditemukan:', indices);
    
    // Cari indeks promotionalOffers.code_1
    const problematicIndex = indices.find(
      (index) => index.name === 'promotionalOffers.code_1'
    );
    
    // Jika indeks ditemukan, hapus
    if (problematicIndex) {
      console.log('Menghapus indeks bermasalah promotionalOffers.code_1');
      await eventsCollection.dropIndex('promotionalOffers.code_1');
      console.log('Indeks berhasil dihapus');
    } else {
      console.log('Indeks promotionalOffers.code_1 tidak ditemukan');
    }
  } catch (error) {
    console.error('Gagal memperbaiki indeks:', error);
  }
};

/**
 * Reset koleksi events - HATI-HATI: ini akan menghapus semua data events!
 * Gunakan hanya jika diperlukan dan anda yakin
 */
export const resetEventsCollection = async (): Promise<void> => {
  try {
    // Coba mendapatkan koleksi events
    const eventsCollection = mongoose.connection.collection('events');
    
    // Drop koleksi
    await eventsCollection.drop();
    console.log('Koleksi events berhasil di-reset');
  } catch (error) {
    console.error('Gagal me-reset koleksi events:', error);
  }
}; 