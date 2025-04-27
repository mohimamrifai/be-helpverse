# HelpVerse - Dokumentasi untuk Client-Side

## Ikhtisar Proyek
HelpVerse adalah platform ticketing event komprehensif yang memungkinkan event organizer untuk membuat dan mempublikasikan event, serta memungkinkan pengguna untuk membeli tiket event secara online. Platform ini dirancang untuk memberikan pengalaman pengguna yang lancar dalam mengelola dan menghadiri berbagai jenis event.

## Tech Stack

### Backend:
- Node.js dengan Express.js
- MongoDB dengan Mongoose
- TypeScript
- JWT Authentication

### Frontend (Rekomendasi):
- React.js / Next.js
- TypeScript
- State Management: Redux / Context API
- UI Library: Material UI / Tailwind CSS

## Fitur Utama

### 1. Manajemen Pengguna
- Registrasi dengan 3 role: User, Event Organizer, dan Admin
- Login/Logout dengan autentikasi JWT
- Profil pengguna dengan riwayat pembelian tiket

### 2. Manajemen Event
- Pencarian dan filter event berdasarkan tanggal, lokasi, dan tag
- Halaman detail event dengan informasi komprehensif
- Galeri gambar event

### 3. Sistem Tiket
- Berbagai tipe tiket dengan harga berbeda
- Pemilihan kursi berdasarkan denah venue
- Penerapan diskon dan kode promo

### 4. Proses Pemesanan
- Keranjang belanja untuk multi-tiket
- Checkout dengan berbagai opsi pembayaran
- Konfirmasi pemesanan dan e-tiket

### 5. Dashboard Event Organizer
- Pembuatan dan manajemen event
- Statistik penjualan tiket
- Pengelolaan tipe tiket dan promosi

### 6. Dashboard Admin
- Approval event baru
- Manajemen pengguna
- Statistik platform

```javascript
const createEventWithImageOneRequest = async (eventData, imageFile) => {
  try {
    // Buat FormData
    const formData = new FormData();
    
    // Tambahkan file gambar
    formData.append('image', imageFile);
    
    // Tambahkan semua field event ke formData
    Object.keys(eventData).forEach(key => {
      // Untuk array atau object, konversi ke JSON string
      if (typeof eventData[key] === 'object' && eventData[key] !== null) {
        formData.append(key, JSON.stringify(eventData[key]));
      } else {
        formData.append(key, eventData[key]);
      }
    });
    
    // Kirim request
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Failed to create event with image');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating event with image:', error);
    throw error;
  }
};
```

### Catatan Penting tentang Upload Gambar

1. **Struktur Folder**: Gambar yang diunggah akan disimpan di folder `uploads/images/` di root project (bukan di dalam folder src).

2. **URL Akses**: Gambar dapat diakses melalui URL: `http://[BASE_URL]/uploads/images/[nama-file]`.

3. **Nama File**: Nama file yang disimpan secara otomatis akan diubah menjadi format: `image-[timestamp].[ekstensi]` untuk mencegah konflik nama file.

4. **Tipe File**: Hanya file gambar (jpeg, jpg, png, gif) yang diperbolehkan.

5. **Batasan Ukuran**: Ukuran file maksimum adalah 5MB.

6. **Penggunaan di Frontend**: Untuk menampilkan gambar di frontend, gunakan URL lengkap:
   ```javascript
   // Contoh menampilkan gambar event
   const EventImage = ({ imageUrl }) => {
     const fullImageUrl = `${process.env.REACT_APP_API_URL}${imageUrl}`;
     return <img src={fullImageUrl} alt="Event" />;
   };
   ```

7. **Troubleshooting**: Jika gambar tidak tampil:
   - Pastikan URL lengkap sudah benar
   - Periksa apakah file gambar tersimpan di folder uploads/images/
   - Pastikan server Express sudah menyediakan static path untuk folder uploads

### Update Terbaru: Upload Gambar Terintegrasi

Sistem upload gambar telah terintegrasi langsung ke dalam endpoint pembuatan dan pembaruan event. Ini berarti:

1. **Tidak Ada Endpoint Upload Terpisah**:
   - Tidak perlu lagi mengupload gambar terlebih dahulu melalui endpoint terpisah
   - File gambar dikirim bersamaan dengan data event dalam satu request

2. **Endpoint Create dan Update Event**:
   - `POST /api/events` - Upload gambar dan buat event sekaligus
   - `PUT /api/events/:id` - Upload gambar baru dan update data event sekaligus

3. **Implementasi di Frontend**:
   ```javascript
   const createEventWithImage = async (eventData, imageFile) => {
     try {
       // Buat FormData
       const formData = new FormData();
       
       // Tambahkan file gambar jika ada
       if (imageFile) {
         formData.append('image', imageFile);
       }
       
       // Tambahkan data event dasar
       Object.keys(eventData).forEach(key => {
         // Khusus untuk array dan objek, konversi ke JSON string
         if (key === 'tickets' || key === 'promotionalOffers' || key === 'tags') {
           formData.append(key, JSON.stringify(eventData[key]));
         } else {
           formData.append(key, eventData[key]);
         }
       });
       
       // Kirim request untuk membuat event
       const response = await fetch('/api/events', {
         method: 'POST',
         headers: {
           'Authorization': `Bearer ${localStorage.getItem('token')}`
         },
         body: formData
       });
       
       if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.error || 'Failed to create event');
       }
       
       return await response.json();
     } catch (error) {
       console.error('Error creating event:', error);
       throw error;
     }
   };
   
   // Contoh update event dengan gambar baru
   const updateEventWithImage = async (eventId, eventData, imageFile) => {
     try {
       const formData = new FormData();
       
       if (imageFile) {
         formData.append('image', imageFile);
       }
       
       Object.keys(eventData).forEach(key => {
         if (key === 'tickets' || key === 'promotionalOffers' || key === 'tags') {
           formData.append(key, JSON.stringify(eventData[key]));
         } else {
           formData.append(key, eventData[key]);
         }
       });
       
       const response = await fetch(`/api/events/${eventId}`, {
         method: 'PUT',
         headers: {
           'Authorization': `Bearer ${localStorage.getItem('token')}`
         },
         body: formData
       });
       
       if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.error || 'Failed to update event');
       }
       
       return await response.json();
     } catch (error) {
       console.error('Error updating event:', error);
       throw error;
     }
   };
   ```

4. **Catatan Penting**:
   - Saat update event, jika gambar baru diunggah, gambar lama akan otomatis dihapus
   - Jika tidak ingin mengubah gambar, cukup tidak sertakan field `image` dalam request
   - Server akan otomatis menangani parsing untuk data complex seperti tickets, promotionalOffers, dan tags

### Contoh Implementasi React Hooks:

```jsx
import { useState, useEffect } from 'react';

const EventForm = ({ existingEvent = null }) => {
  const [eventData, setEventData] = useState({
    name: '',
    description: '',
    date: '',
    time: '',
    location: '',
    totalSeats: 0,
    availableSeats: 0,
    tickets: [],
    promotionalOffers: [],
    tags: []
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Jika ini form edit, isi dengan data yang sudah ada
  useEffect(() => {
    if (existingEvent) {
      setEventData(existingEvent);
      if (existingEvent.image) {
        setImagePreview(`${process.env.REACT_APP_API_URL}${existingEvent.image}`);
      }
    }
  }, [existingEvent]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      let result;
      
      if (existingEvent) {
        // Update existing event
        result = await updateEventWithImage(existingEvent._id, eventData, imageFile);
      } else {
        // Create new event
        result = await createEventWithImage(eventData, imageFile);
      }
      
      console.log('Event saved successfully:', result);
      // Reset form or redirect
    } catch (error) {
      setError(error.message || 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="name">Event Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={eventData.name}
          onChange={handleChange}
          required
        />
      </div>
      
      {/* Other form fields */}
      
      <div className="form-group">
        <label htmlFor="image">Event Image</label>
        {imagePreview && (
          <div className="image-preview">
            <img src={imagePreview} alt="Preview" style={{ maxWidth: '200px' }} />
          </div>
        )}
        <input
          type="file"
          id="image"
          name="image"
          accept="image/*"
          onChange={handleImageChange}
        />
      </div>
      
      <button type="submit" disabled={loading}>
        {loading ? 'Saving...' : existingEvent ? 'Update Event' : 'Create Event'}
      </button>
    </form>
  );
};
```

## API Endpoints

### Autentikasi
- `POST /api/auth/register` - Registrasi pengguna baru
- `POST /api/auth/register/event-organizer` - Registrasi sebagai event organizer
- `POST /api/auth/login` - Login pengguna (menggunakan username atau email)
- `GET /api/auth/logout` - Logout pengguna
- `GET /api/auth/me` - Mendapatkan profil pengguna saat ini

### Event
- `GET /api/events` - Mendapatkan semua event yang sudah dipublikasikan dengan pagination & filtering
- `GET /api/events/:id` - Mendapatkan informasi detail event
- `POST /api/events` - Membuat event baru dengan upload gambar (Event Organizer/Admin)
- `PUT /api/events/:id` - Memperbarui event dan gambar (Owner/Admin)
- `DELETE /api/events/:id` - Menghapus event (Owner/Admin)

### Waiting List
- `POST /api/waiting-list` - Mendaftar ke waiting list event (Public)
- `GET /api/waiting-list` - Mendapatkan daftar waiting list user berdasarkan email (Public)
- `DELETE /api/waiting-list/:id` - Menghapus waiting list user berdasarkan ID (Public, dengan verifikasi email)
- `GET /api/waiting-list/admin` - Mendapatkan semua data waiting list (Admin)
- `GET /api/waiting-list/admin/:id` - Mendapatkan detail waiting list berdasarkan ID (Admin)
- `PUT /api/waiting-list/admin/:id` - Memperbarui status waiting list (Admin)
- `DELETE /api/waiting-list/admin/:id` - Menghapus entri waiting list (Admin)

### Tiket
- `GET /api/events/:id/tickets` - Mendapatkan tiket yang tersedia untuk event
- `GET /api/events/:id/tickets/:ticketId/seats` - Mendapatkan ketersediaan kursi

### Pemesanan
- `POST /api/orders` - Membuat pemesanan baru
- `GET /api/orders` - Mendapatkan pemesanan pengguna
- `GET /api/orders/:id` - Mendapatkan detail pemesanan
- `PUT /api/orders/:id/cancel` - Membatalkan pemesanan

#### Format Request Pemesanan
Untuk membuat pemesanan baru, gunakan format JSON berikut:

```javascript
const orderPayload = {
  "eventId": "60a1b2c3d4e5f6g7h8i9j0k1",  // ID event yang akan dipesan
  "tickets": [
    {
      "ticketType": "VIP",        // Nama jenis tiket yang tersedia di event
      "quantity": 2,              // Jumlah tiket yang dipesan
      "seats": [                  // Array kursi yang dipilih
        {
          "row": 1,               // Nomor baris kursi
          "column": 5             // Nomor kolom kursi
        },
        {
          "row": 1,               // Nomor baris kursi
          "column": 6             // Nomor kolom kursi
        }
      ]
    }
  ],
  "promoCode": "EARLYBIRD",       // Kode promo (opsional)
  "paymentInfo": {                // Informasi pembayaran (wajib)
    "method": "credit_card",      // Metode pembayaran
    "transactionId": "txn_12345"  // ID transaksi pembayaran
  }
};

// Contoh pemanggilan API pemesanan
const createOrder = async (orderData) => {
  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(orderData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create order');
    }
    
    const result = await response.json();
    return result.data; // Data pemesanan yang berhasil dibuat
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};
```

#### Catatan tentang harga tiket:
Server secara otomatis mengambil harga tiket dari database berdasarkan `ticketType` yang dikirimkan. Anda tidak perlu mengirim harga tiket dalam request. Ini memastikan bahwa harga yang digunakan adalah harga yang akurat dan terkini dari server.

#### Validasi yang dilakukan server:
1. Event harus ada dan valid
2. Tiket yang dipilih harus tersedia di event
3. Jumlah kursi yang dipilih harus sama dengan quantity
4. Kursi yang dipilih harus tersedia (belum dipesan)
5. Kode promo harus valid dan masih berlaku jika disertakan
6. Informasi pembayaran harus disertakan

#### Response Success (201 Created)
```json
{
  "success": true,
  "data": {
    "_id": "order_id_here",
    "user": "user_id_here",
    "event": {
      "_id": "event_id_here",
      "name": "Tech Conference 2025",
      // ...data event lainnya
    },
    "tickets": [
      {
        "ticketType": "VIP",
        "quantity": 2,
        "seats": [
          { "row": 1, "column": 5 },
          { "row": 1, "column": 6 }
        ],
        "price": 100
      }
    ],
    "totalAmount": 200,
    "discount": 50,
    "promoCode": "EARLYBIRD",
    "status": "confirmed",
    "paymentInfo": {
      "method": "credit_card",
      "transactionId": "txn_12345",
      "paidAt": "2023-05-15T08:30:00.000Z"
    },
    "createdAt": "2023-05-15T08:30:00.000Z",
    "updatedAt": "2023-05-15T08:30:00.000Z"
  }
}
```

### Admin
- `GET /api/admin/events` - Mendapatkan semua event (termasuk yang belum dipublikasikan)
- `GET /api/admin/users` - Mendapatkan semua pengguna
- `GET /api/admin/orders` - Mendapatkan semua pemesanan

## Struktur Data

### User
```typescript
{
  username: string;         // Username unik
  email: string;            // Alamat email unik
  password: string;         // Password yang sudah di-hash
  fullName: string;         // Nama lengkap pengguna
  phone: string;            // Nomor kontak
  organizerName?: string;   // Wajib untuk event organizer
  role: "user" | "eventOrganizer" | "admin";
  createdAt: Date;
  updatedAt: Date;
}
```

### Event
```typescript
{
  name: string;             // Nama event
  description: string;      // Deskripsi detail event
  date: Date;               // Tanggal event
  time: string;             // Waktu mulai
  location: string;         // Lokasi fisik
  image: string;            // URL gambar cover event
  tickets: [Ticket];        // Array tipe tiket
  totalSeats: number;       // Kapasitas total
  availableSeats: number;   // Sisa kursi
  promotionalOffers: [Offer]; // Diskon spesial
  tags: [string];           // Tag event untuk pencarian
  createdBy: User;          // Referensi ke organizer
  createdAt: Date;
  updatedAt: Date;
}
```

### Tiket
```typescript
{
  name: string;             // Nama tipe tiket
  description: string;      // Deskripsi tiket
  price: number;            // Harga dalam mata uang
  quantity: number;         // Total tersedia
  startDate: Date;          // Tanggal mulai penjualan
  endDate: Date;            // Tanggal akhir penjualan
  seatArrangement: {
    rows: number;
    columns: number;
  };
  bookedSeats: [{           // Tracking kursi yang sudah dipesan
    row: number;
    column: number;
    bookingId: string;
  }];
}
```

### Pemesanan
```typescript
{
  user: User;               // Referensi ke pembeli
  event: Event;             // Referensi ke event
  tickets: [{
    ticketType: string;     // Referensi ke tipe tiket
    quantity: number;       // Jumlah tiket
    seats: [{row: number, column: number}]; // Kursi yang dipilih
    price: number;          // Harga saat pembelian
  }];
  totalAmount: number;      // Total jumlah yang dibayarkan
  discount: number;         // Diskon yang diterapkan jika ada
  promoCode?: string;       // Kode promo yang digunakan jika ada
  status: "confirmed";
  paymentInfo: {
    method: string;
    transactionId: string;
    paidAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

## Integrasi UI dengan API

### Contoh Fetching Event:
```javascript
// Fetching semua event
const fetchEvents = async (page = 1, filters = {}) => {
  try {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      ...filters
    });
    
    const response = await fetch(`/api/events?${queryParams}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch events');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

// Fetching detail event
const fetchEventDetails = async (eventId) => {
  try {
    const response = await fetch(`/api/events/${eventId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch event details');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching event details:', error);
    throw error;
  }
};
```

### Contoh Registrasi Waiting List:

#### Format Data Waiting List:
```json
{
  "name": "Nama Lengkap",
  "email": "email@example.com",
  "event": "60a1b2c3d4e5f6g7h8i9j0k1" // ID event yang ingin didaftarkan
}
```

#### Contoh Implementasi Pendaftaran Waiting List:
```javascript
// Mendaftar ke waiting list event
const registerToWaitingList = async (waitingListData) => {
  try {
    const response = await fetch('/api/waiting-list', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(waitingListData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Gagal mendaftar waiting list');
    }
    
    const result = await response.json();
    return result; // Mengembalikan data pendaftaran waiting list
  } catch (error) {
    console.error('Error registering to waiting list:', error);
    throw error;
  }
};

// Contoh penggunaan:
const handleWaitingListSubmit = async (event) => {
  event.preventDefault();
  try {
    const formData = {
      name: "Nama Lengkap User",
      email: "email@example.com",
      event: "60a1b2c3d4e5f6g7h8i9j0k1" // ID event
    };
    
    const result = await registerToWaitingList(formData);
    console.log('Berhasil mendaftar waiting list:', result);
    
    // Tampilkan pesan sukses ke pengguna
    alert('Pendaftaran berhasil! Anda telah terdaftar dalam waiting list.');
  } catch (error) {
    console.error('Gagal mendaftar waiting list:', error);
    
    // Tampilkan pesan error ke pengguna
    alert(`Gagal mendaftar: ${error.message}`);
  }
};
```

#### Response Success (201 Created):
```json
{
  "success": true,
  "data": {
    "_id": "waiting_list_id_here",
    "name": "Nama Lengkap",
    "email": "email@example.com",
    "event": "60a1b2c3d4e5f6g7h8i9j0k1",
    "status": "pending",
    "registeredAt": "2023-05-15T08:30:00.000Z",
    "phone": "-",
    "createdAt": "2023-05-15T08:30:00.000Z",
    "updatedAt": "2023-05-15T08:30:00.000Z"
  },
  "message": "Berhasil mendaftar dalam waiting list"
}
```

#### Untuk Admin - Mendapatkan Semua Data Waiting List:
```javascript
// Mendapatkan semua data waiting list (Admin)
const getWaitingList = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters);
    
    const response = await fetch(`/api/waiting-list/admin?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch waiting list data');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching waiting list data:', error);
    throw error;
  }
};

// Contoh penggunaan dengan filter:
const fetchWaitingList = async () => {
  try {
    // Filter berdasarkan event dan status
    const filters = {
      event: "60a1b2c3d4e5f6g7h8i9j0k1", // Opsional: Filter berdasarkan event ID
      status: "pending" // Opsional: Filter berdasarkan status (pending, approved, rejected)
    };
    
    const result = await getWaitingList(filters);
    console.log('Data waiting list:', result);
    
    // Lakukan sesuatu dengan data waiting list
    // displayWaitingListData(result.data);
  } catch (error) {
    console.error('Gagal mengambil data waiting list:', error);
  }
};
```

#### Untuk Admin - Memperbarui Status Waiting List:
```javascript
// Memperbarui status waiting list (Admin)
const updateWaitingListStatus = async (waitingListId, updateData) => {
  try {
    const response = await fetch(`/api/waiting-list/admin/${waitingListId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(updateData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Gagal memperbarui status waiting list');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating waiting list status:', error);
    throw error;
  }
};

// Contoh penggunaan:
const approveWaitingList = async (waitingListId) => {
  try {
    const updateData = {
      status: "approved", // bisa berupa: "pending", "approved", "rejected"
      notes: "Diterima dengan syarat membayar DP dalam 3 hari" // Opsional
    };
    
    const result = await updateWaitingListStatus(waitingListId, updateData);
    console.log('Status waiting list berhasil diperbarui:', result);
    
    // Refresh data waiting list
    // fetchWaitingList();
  } catch (error) {
    console.error('Gagal memperbarui status waiting list:', error);
  }
};
```

### Contoh Pembentukan Pemesanan:
```javascript
// Membuat pemesanan baru
const createOrder = async (orderData) => {
  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(orderData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create order');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};
```

## Autentikasi & Keamanan

### Format Data Login:
#### Format Baru (Menggunakan identifier - username atau email):
```json
{
  "identifier": "username_atau_email@example.com",
  "password": "password123"
}
```

#### Format Lama (Menggunakan email - tetap didukung untuk kompatibilitas):
```json
{
  "email": "email@example.com",
  "password": "password123"
}
```

#### Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Contoh Implementasi Login:
```javascript
// Login dengan identifier (username atau email)
const loginWithIdentifier = async (identifier, password) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        identifier,
        password
      })
    });
    
    if (!response.ok) {
      throw new Error('Gagal login');
    }
    
    const data = await response.json();
    
    // Simpan token di localStorage
    localStorage.setItem('token', data.token);
    
    return data;
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
};

// Login dengan email (untuk kompatibilitas)
const loginWithEmail = async (email, password) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password
      })
    });
    
    if (!response.ok) {
      throw new Error('Gagal login');
    }
    
    const data = await response.json();
    
    // Simpan token di localStorage
    localStorage.setItem('token', data.token);
    
    return data;
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
};
```

### Contoh Implementasi Mengubah Password:
```javascript
// Mengubah password pengguna
const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await fetch('/api/auth/change-password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Gagal mengubah password');
    }
    
    const data = await response.json();
    
    // Update token jika ada token baru yang diberikan
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    
    return data;
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};

// Contoh penggunaan:
const handleChangePassword = async (currentPassword, newPassword) => {
  try {
    const result = await changePassword(currentPassword, newPassword);
    
    if (result.success) {
      console.log('Password berhasil diubah');
      // Tampilkan pesan sukses ke pengguna
    }
  } catch (error) {
    console.error('Gagal mengubah password:', error);
    // Tampilkan pesan error ke pengguna
  }
};
```

#### Format Request:
```json
{
  "currentPassword": "password_lama",
  "newPassword": "password_baru"
}
```

#### Response Success (200 OK):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Kemungkinan Error Response:
1. **Current password salah (401 Unauthorized)**:
   ```json
   {
     "success": false,
     "error": "Current password is incorrect"
   }
   ```

2. **Password baru terlalu pendek (400 Bad Request)**:
   ```json
   {
     "success": false,
     "error": "New password must be at least 6 characters"
   }
   ```

3. **Input tidak lengkap (400 Bad Request)**:
   ```json
   {
     "success": false,
     "error": "Please provide current password and new password"
   }
   ```

4. **User tidak ditemukan (404 Not Found)**:
   ```json
   {
     "success": false,
     "error": "User not found"
   }
   ```

5. **Kesalahan validasi (400 Bad Request)**:
   ```json
   {
     "success": false,
     "error": ["Password saat ini tidak boleh kosong", "Password baru harus minimal 6 karakter"]
   }
   ```

#### Implementasi Form Ubah Password:
```jsx
import { useState } from 'react';

const ChangePasswordForm = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!currentPassword) {
      setError('Password saat ini tidak boleh kosong');
      return false;
    }
    if (!newPassword) {
      setError('Password baru tidak boleh kosong');
      return false;
    }
    if (newPassword.length < 6) {
      setError('Password baru harus minimal 6 karakter');
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError('Password baru dan konfirmasi password tidak sama');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      const result = await changePassword(currentPassword, newPassword);
      
      if (result.success) {
        setSuccess('Password berhasil diubah');
        // Reset form fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      setError(error.message || 'Gagal mengubah password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Ubah Password</h2>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <div className="form-group">
        <label htmlFor="currentPassword">Password Saat Ini</label>
        <input
          type="password"
          id="currentPassword"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          disabled={loading}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="newPassword">Password Baru</label>
        <input
          type="password"
          id="newPassword"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={loading}
          required
          minLength={6}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="confirmPassword">Konfirmasi Password Baru</label>
        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading}
          required
        />
      </div>
      
      <button type="submit" disabled={loading}>
        {loading ? 'Memproses...' : 'Ubah Password'}
      </button>
    </form>
  );
};

export default ChangePasswordForm;
```

### Flow Autentikasi:
1. Pengguna melakukan login melalui `/api/auth/login` dengan username atau email
2. Backend memvalidasi kredensial dan mengembalikan token JWT
3. Client menyimpan token di localStorage/cookies
4. Token disertakan di header untuk request terautentikasi
5. Implementasi refresh token untuk pembaruan otomatis

### Keamanan:
- Semua request sensitif harus menggunakan header Authorization
- Validasi input di sisi client sebelum dikirim ke API
- Penanganan error yang baik untuk feedback pengguna
- HTTPS untuk semua komunikasi API

## Rekomendasi Deployment

## Kesimpulan
Dokumen ini berfungsi sebagai panduan komprehensif untuk pengembangan client-side HelpVerse. Implementasi yang tepat dari spesifikasi ini akan menghasilkan platform ticketing event yang kuat, skalabel, dan user-friendly yang memenuhi kebutuhan pengguna akhir, event organizer, dan administrator.

Untuk informasi lebih lanjut atau klarifikasi tentang API, silakan merujuk ke dokumentasi API lengkap atau menghubungi tim backend.

#### Untuk User - Melihat Daftar Waiting List:
```javascript
// Mendapatkan daftar waiting list berdasarkan email user
const getUserWaitingList = async (email) => {
  try {
    const response = await fetch(`/api/waiting-list?email=${encodeURIComponent(email)}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch user waiting list data');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user waiting list data:', error);
    throw error;
  }
};

// Contoh penggunaan:
const fetchUserWaitingList = async () => {
  try {
    const email = "email@example.com"; // Email user
    const result = await getUserWaitingList(email);
    
    console.log('Data waiting list user:', result);
    
    // Tampilkan data waiting list user
    if (result.count > 0) {
      // Tampilkan data ke pengguna
      // displayUserWaitingListData(result.data);
    } else {
      console.log('Anda belum terdaftar dalam waiting list event apapun');
    }
  } catch (error) {
    console.error('Gagal mengambil data waiting list user:', error);
  }
};
```

#### Response Success (200 OK):
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "waiting_list_id_1",
      "name": "Nama Lengkap",
      "email": "email@example.com",
      "event": {
        "_id": "event_id_1",
        "title": "Tech Conference 2025",
        "description": "Konferensi teknologi tahunan yang membahas tren terbaru dalam pengembangan perangkat lunak dan hardware",
        "date": "2025-03-15T00:00:00.000Z",
        "time": "09:00 - 17:00",
        "location": "Jakarta Convention Center",
        "image": "/uploads/events/tech-conference-2025.jpg",
        "availableSeats": 500,
        "totalSeats": 1000,
        "createdAt": "2023-05-10T08:30:00.000Z",
        "updatedAt": "2023-05-15T09:20:00.000Z",
        "tickets": [
          {
            "_id": "ticket_id_1",
            "name": "Regular",
            "price": 250000,
            "quantity": 800
          },
          {
            "_id": "ticket_id_2",
            "name": "VIP",
            "price": 500000,
            "quantity": 200
          }
        ]
      },
      "status": "pending",
      "registeredAt": "2023-05-15T08:30:00.000Z",
      "phone": "-",
      "createdAt": "2023-05-15T08:30:00.000Z",
      "updatedAt": "2023-05-15T08:30:00.000Z"
    },
    {
      "_id": "waiting_list_id_2",
      "name": "Nama Lengkap",
      "email": "email@example.com",
      "event": {
        "_id": "event_id_2",
        "title": "Music Festival 2025",
        "description": "Festival musik terbesar di Indonesia dengan menampilkan artis-artis ternama",
        "date": "2025-04-20T00:00:00.000Z",
        "time": "14:00 - 23:00",
        "location": "Gelora Bung Karno",
        "image": "/uploads/events/music-festival-2025.jpg",
        "availableSeats": 2000,
        "totalSeats": 5000,
        "createdAt": "2023-05-12T10:00:00.000Z",
        "updatedAt": "2023-05-14T11:45:00.000Z",
        "tickets": [
          {
            "_id": "ticket_id_3",
            "name": "Standard",
            "price": 350000,
            "quantity": 4000
          },
          {
            "_id": "ticket_id_4",
            "name": "Premium",
            "price": 750000,
            "quantity": 1000
          }
        ]
      },
      "status": "approved",
      "registeredAt": "2023-05-16T10:15:00.000Z",
      "phone": "-",
      "createdAt": "2023-05-16T10:15:00.000Z",
      "updatedAt": "2023-05-17T14:30:00.000Z"
    }
  ]
}
```

#### Untuk User - Menghapus Entry Waiting List:
```javascript
// Menghapus waiting list user
const deleteUserWaitingList = async (waitingListId, email) => {
  try {
    const response = await fetch(`/api/waiting-list/${waitingListId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Gagal menghapus data waiting list');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting waiting list:', error);
    throw error;
  }
};

// Contoh penggunaan:
const handleDeleteWaitingList = async (waitingListId) => {
  try {
    const email = "email@example.com"; // Email yang digunakan saat mendaftar
    
    const result = await deleteUserWaitingList(waitingListId, email);
    console.log('Waiting list berhasil dihapus:', result);
    
    // Tampilkan pesan sukses ke pengguna
    alert('Pendaftaran waiting list berhasil dibatalkan!');
    
    // Refresh data waiting list
    // fetchUserWaitingList();
  } catch (error) {
    console.error('Gagal menghapus waiting list:', error);
    
    // Tampilkan pesan error ke pengguna
    alert(`Gagal membatalkan pendaftaran: ${error.message}`);
  }
};

#### Request Format:
```json
{
  "email": "email@example.com"
}
```

#### Response Success (200 OK):
```json
{
  "success": true,
  "message": "Data waiting list berhasil dihapus"
}
```

### Penjelasan Detail DELETE /api/waiting-list/:id

Endpoint ini memungkinkan pengguna biasa untuk menghapus entri waiting list mereka sendiri dari sistem. Untuk alasan keamanan, pengguna perlu memverifikasi diri mereka dengan menyertakan email yang sama dengan yang digunakan saat mendaftar ke waiting list.

#### Cara Kerja:

1. Pengguna mengirimkan permintaan DELETE ke URL `/api/waiting-list/:id` dimana `:id` adalah ID dari waiting list yang ingin dihapus.
2. Pengguna harus menyertakan email mereka dalam body request untuk memverifikasi bahwa mereka adalah pemilik dari waiting list tersebut.
3. Sistem akan memeriksa apakah ada waiting list dengan ID tersebut dan email yang sesuai.
4. Jika ditemukan, waiting list akan dihapus dan sistem mengembalikan respons sukses.
5. Jika tidak ditemukan atau email tidak sesuai, sistem akan mengembalikan pesan error.

#### Contoh Request Alternatif:

##### Menggunakan cURL:
```bash
curl -X DELETE http://localhost:5000/api/waiting-list/60a1b2c3d4e5f6g7h8i9j0k1 \
  -H "Content-Type: application/json" \
  -d '{"email": "user1@example.com"}'
```

##### Menggunakan Axios:
```javascript
import axios from 'axios';

const deleteWaitingList = async () => {
  try {
    const waitingListId = '60a1b2c3d4e5f6g7h8i9j0k1';
    const email = 'user1@example.com';
    
    const response = await axios.delete(`/api/waiting-list/${waitingListId}`, {
      data: { email }  // Axios menggunakan property 'data' untuk body pada request DELETE
    });
    
    console.log('Waiting list berhasil dihapus:', response.data);
    
    // Lakukan sesuatu setelah berhasil menghapus
    alert('Pendaftaran waiting list berhasil dibatalkan!');
  } catch (error) {
    console.error('Error:', error.response?.data?.error || error.message);
    alert(`Gagal membatalkan pendaftaran: ${error.response?.data?.error || error.message}`);
  }
};
```

#### Respons Error:

1. **Waiting list tidak ditemukan atau email tidak sesuai (404 Not Found)**:
   ```json
   {
     "success": false,
     "error": "Data waiting list tidak ditemukan atau email tidak sesuai"
   }
   ```

2. **Email tidak disertakan (400 Bad Request)**:
   ```json
   {
     "success": false,
     "error": "Email diperlukan untuk verifikasi"
   }
   ```

3. **Format email tidak valid (400 Bad Request)**:
   ```json
   {
     "success": false,
     "error": ["Email tidak valid"]
   }
   ```

### Mendapatkan Semua Event (dengan filter, pencarian, dll)

```
GET /api/events
```

Mendapatkan daftar semua event yang telah dipublikasikan.

**Parameter Query (opsional):**
- `search`: string - mencari berdasarkan nama, deskripsi, lokasi, atau tag
- `select`: string - memilih field yang akan dikembalikan, dipisahkan dengan koma
- `sort`: string - mengurutkan berdasarkan field tertentu, dipisahkan dengan koma
- `page`: number - nomor halaman untuk pagination
- `limit`: number - jumlah data per halaman

**Response:**

```json
{
  "success": true,
  "count": 2,
  "pagination": {
    "next": {
      "page": 2,
      "limit": 10
    }
  },
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "Tech Conference 2023",
      "description": "Conference tahunan membahas teknologi terbaru",
      "date": "2023-08-15T00:00:00.000Z",
      "time": "09:00",
      "location": "Kuala Lumpur Convention Center",
      "price": 100.00,
      // ...fields lainnya
    }
  ]
}
```

### Mendapatkan Event Milik Event Organizer yang Login

```
GET /api/events/my-events
```

Mendapatkan daftar semua event yang dibuat oleh event organizer yang sedang login.

**Header:**
- `Authorization`: Bearer [token]

**Parameter Query (opsional):**
- `search`: string - mencari berdasarkan nama, deskripsi, lokasi, atau tag
- `select`: string - memilih field yang akan dikembalikan, dipisahkan dengan koma
- `sort`: string - mengurutkan berdasarkan field tertentu, dipisahkan dengan koma
- `page`: number - nomor halaman untuk pagination
- `limit`: number - jumlah data per halaman
- Filter lain seperti `published=true`, `approvalStatus=approved`, dll.

**Response:**

```json
{
  "success": true,
  "count": 2,
  "pagination": {
    "next": {
      "page": 2,
      "limit": 10
    }
  },
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "Tech Conference 2023",
      "description": "Conference tahunan membahas teknologi terbaru",
      "date": "2023-08-15T00:00:00.000Z",
      "time": "09:00",
      "location": "Kuala Lumpur Convention Center",
      "published": true,
      "approvalStatus": "approved",
      "createdBy": {
        "_id": "60d0fe4667d0d8992e610c80",
        "username": "organizer1",
        "fullName": "Organizer One",
        "organizerName": "Premier Events"
      },
      // ...fields lainnya
    }
  ]
}
```

### Mendapatkan Detail Event

```
GET /api/events/:id
```
