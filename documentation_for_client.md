# Dokumentasi HelpVerse API

## 1. Autentikasi:
    # Endpoint yang tersedia
        1. POST /api/auth/register
           - Deskripsi: Mendaftarkan pengguna baru
           - Request Body:
             - username: string (required, unique, max 30 karakter)
             - email: string (required, unique, format email valid)
             - password: string (required, min 6 karakter)
             - fullName: string (required)
             - phone: string (required)
           - Response Body:
             - success: boolean
             - token: string

        2. POST /api/auth/register/event-organizer
           - Deskripsi: Mendaftarkan pengguna sebagai event organizer
           - Request Body:
             - username: string (required, unique, max 30 karakter)
             - email: string (required, unique, format email valid)
             - password: string (required, min 6 karakter)
             - fullName: string (required)
             - phone: string (required)
             - organizerName: string (required)
           - Response Body:
             - success: boolean
             - token: string

        3. POST /api/auth/login
           - Deskripsi: Login pengguna
           - Request Body:
             - email: string (required)
             - password: string (required)
           - Response Body:
             - success: boolean
             - token: string

        4. GET /api/auth/me
           - Deskripsi: Mendapatkan informasi user yang sedang login
           - Header: Authorization: Bearer {token}
           - Response Body:
             - success: boolean
             - data: {
               id: string,
               username: string,
               email: string,
               fullName: string,
               phone: string,
               organizerName: string (jika role: eventOrganizer),
               role: string ('user', 'eventOrganizer', atau 'admin')
             }

        5. GET /api/auth/logout
           - Deskripsi: Logout pengguna
           - Header: Authorization: Bearer {token}
           - Response Body:
             - success: boolean
             - message: string

        6. PUT /api/auth/change-password
           - Deskripsi: Mengganti password pengguna
           - Header: Authorization: Bearer {token}
           - Request Body:
             - currentPassword: string (required)
             - newPassword: string (required, min 6 karakter)
           - Response Body:
             - success: boolean
             - message: string

## 2. Event:
    # Endpoint yang tersedia
        1. GET /api/events
           - Deskripsi: Mendapatkan daftar event yang dipublikasikan
           - Query Parameters:
             - search: string (pencarian berdasarkan nama, deskripsi, lokasi, tag)
             - select: string (memilih field tertentu, dipisahkan dengan koma)
             - sort: string (mengurutkan berdasarkan field tertentu)
             - page: number (halaman pagination)
             - limit: number (jumlah item per halaman)
           - Response Body:
             - success: boolean
             - count: number
             - pagination: {
               next: { page: number, limit: number },
               prev: { page: number, limit: number }
             }
             - data: array event

        2. GET /api/events/:id
           - Deskripsi: Mendapatkan detail event berdasarkan ID
           - Response Body:
             - success: boolean
             - data: {
               id: string,
               name: string,
               description: string,
               date: date,
               time: string,
               location: string,
               image: string,
               tickets: array,
               totalSeats: number,
               availableSeats: number,
               published: boolean,
               approvalStatus: string,
               promotionalOffers: array,
               tags: array,
               createdBy: object
             }

        3. POST /api/events
           - Deskripsi: Membuat event baru
           - Header: Authorization: Bearer {token}
           - Request Body (multipart/form-data):
             - name: string (required, max 100 karakter)
             - description: string (required)
             - date: date (required, harus di masa depan)
             - time: string (required)
             - location: string (required)
             - image: file (optional)
             - totalSeats: number (required)
             - availableSeats: number (required)
             - published: boolean (default: false)
             - tags: array of string
             - tickets: array (minimal 1 tiket) dalam format:
               [{
                 name: string,
                 description: string,
                 price: number,
                 quantity: number,
                 startDate: date,
                 endDate: date,
                 seatArrangement: {
                   rows: number,
                   columns: number
                 }
               }]
           - Response Body:
             - success: boolean
             - data: object (event yang dibuat)

        4. PUT /api/events/:id
           - Deskripsi: Memperbarui event berdasarkan ID
           - Header: Authorization: Bearer {token}
           - Request Body (multipart/form-data): (sama seperti POST /api/events)
           - Response Body:
             - success: boolean
             - data: object (event yang diperbarui)

        5. DELETE /api/events/:id
           - Deskripsi: Menghapus event berdasarkan ID
           - Header: Authorization: Bearer {token}
           - Response Body:
             - success: boolean
             - data: {}

        6. GET /api/events/my-events
           - Deskripsi: Mendapatkan daftar event milik event organizer yang login
           - Header: Authorization: Bearer {token}
           - Response Body:
             - success: boolean
             - count: number
             - data: array event

## 3. Ticket:
    # Endpoint yang tersedia
        1. GET /api/events/:id/tickets
           - Deskripsi: Mendapatkan daftar tiket untuk event tertentu
           - Response Body:
             - success: boolean
             - data: array tiket

        2. GET /api/events/:id/tickets/:ticketId/seats
           - Deskripsi: Mendapatkan informasi kursi untuk tiket tertentu
           - Response Body:
             - success: boolean
             - data: {
               seatArrangement: { rows: number, columns: number },
               bookedSeats: array { row: number, column: number, bookingId: string }
             }

## 4. Order:
    # Endpoint yang tersedia
        1. POST /api/orders
           - Deskripsi: Membuat pesanan baru
           - Header: Authorization: Bearer {token}
           - Request Body:
             - event: string (event ID)
             - tickets: array [{
               ticketType: string,
               quantity: number,
               seats: array [{ row: number, column: number }],
               price: number
             }]
             - totalAmount: number
             - discount: number (default: 0)
             - promoCode: string (optional)
             - paymentInfo: {
               method: string,
               transactionId: string
             }
           - Response Body:
             - success: boolean
             - data: object (pesanan yang dibuat)

        2. GET /api/orders
           - Deskripsi: Mendapatkan daftar pesanan pengguna yang login
           - Header: Authorization: Bearer {token}
           - Response Body:
             - success: boolean
             - count: number
             - data: array pesanan

        3. GET /api/orders/:id
           - Deskripsi: Mendapatkan detail pesanan berdasarkan ID
           - Header: Authorization: Bearer {token}
           - Response Body:
             - success: boolean
             - data: object pesanan

        4. PUT /api/orders/:id/cancel
           - Deskripsi: Membatalkan pesanan
           - Header: Authorization: Bearer {token}
           - Response Body:
             - success: boolean
             - data: object (pesanan yang dibatalkan)

## 5. Waitlist:
    # Endpoint yang tersedia
        1. GET /api/events/:id/waitlist-tickets
           - Deskripsi: Mendapatkan daftar tiket waitlist untuk event tertentu
           - Response Body:
             - success: boolean
             - data: array tiket waitlist

        2. POST /api/events/:id/waitlist-tickets
           - Deskripsi: Membuat tiket waitlist baru
           - Header: Authorization: Bearer {token}
           - Request Body:
             - name: string
             - description: string
             - price: number
             - quantity: number
             - originalTicketRef: string
           - Response Body:
             - success: boolean
             - data: object (tiket waitlist yang dibuat)

## 6. Admin:
    # Endpoint yang tersedia
        1. GET /api/admin/users
           - Deskripsi: Mendapatkan daftar pengguna (admin only)
           - Header: Authorization: Bearer {token}
           - Response Body:
             - success: boolean
             - count: number
             - data: array pengguna

        2. GET /api/admin/events
           - Deskripsi: Mendapatkan daftar semua event (admin only)
           - Header: Authorization: Bearer {token}
           - Response Body:
             - success: boolean
             - count: number
             - data: array event

        3. PUT /api/admin/events/:id/approval
           - Deskripsi: Memperbarui status persetujuan event (admin only)
           - Header: Authorization: Bearer {token}
           - Request Body:
             - approvalStatus: string ('approved' or 'rejected')
           - Response Body:
             - success: boolean
             - data: object event

## 7. Notifications:
    # Endpoint yang tersedia
        1. GET /api/notifications
           - Deskripsi: Mendapatkan semua notifikasi untuk user yang sedang login
           - Header: Authorization: Bearer {token}
           - Response Body:
             - success: boolean
             - count: number
             - data: array notifikasi

        2. PUT /api/notifications/:id/read
           - Deskripsi: Menandai notifikasi tertentu sebagai telah dibaca
           - Header: Authorization: Bearer {token}
           - Response Body:
             - success: boolean
             - data: object notifikasi yang diperbarui

        3. DELETE /api/notifications/:id
           - Deskripsi: Menghapus notifikasi tertentu
           - Header: Authorization: Bearer {token}
           - Response Body:
             - success: boolean
             - message: string

## 8. Reports (Event Organizer):
    # Endpoint yang tersedia
        1. GET /api/reports/daily
           - Deskripsi: Mendapatkan laporan penjualan harian
           - Header: Authorization: Bearer {token}
           - Query Parameters:
             - date: string (format: YYYY-MM-DD, default: hari ini)
           - Response Body:
             - date: Date
             - ticketsSold: number
             - revenue: number
             - occupancyPercentage: number
             - salesData: array { hour: number, count: number }
             - revenueData: array { hour: number, amount: number }
           - Jika data tidak tersedia:
             - message: "Insufficient data for the selected period."

        2. GET /api/reports/weekly
           - Deskripsi: Mendapatkan laporan penjualan mingguan
           - Header: Authorization: Bearer {token}
           - Response Body:
             - startDate: Date
             - endDate: Date
             - ticketsSold: number
             - revenue: number
             - occupancyPercentage: number
             - salesData: array { day: string, count: number }
             - revenueData: array { day: string, amount: number }
           - Jika data tidak tersedia:
             - message: "Insufficient data for the selected period."

        3. GET /api/reports/monthly
           - Deskripsi: Mendapatkan laporan penjualan bulanan
           - Header: Authorization: Bearer {token}
           - Query Parameters:
             - date: string (format: YYYY-MM-DD, default: bulan berjalan)
           - Response Body:
             - month: number
             - year: number
             - ticketsSold: number
             - revenue: number
             - occupancyPercentage: number
             - salesData: array { day: number, count: number }
             - revenueData: array { day: number, amount: number }
           - Jika data tidak tersedia:
             - message: "Insufficient data for the selected period."

        4. GET /api/reports/download
           - Deskripsi: Mengunduh laporan dalam format PDF
           - Header: Authorization: Bearer {token}
           - Query Parameters:
             - type: string (enum: 'daily', 'weekly', 'monthly')
             - date: string (format: YYYY-MM-DD)
           - Response: File PDF yang berisi laporan sesuai dengan parameter
             - Laporan harian: Berisi ringkasan dan detail penjualan per jam
             - Laporan mingguan: Berisi ringkasan dan detail penjualan per hari dalam seminggu
             - Laporan bulanan: Berisi ringkasan dan detail penjualan per tanggal dalam sebulan
           - Jika data tidak tersedia:
             - message: "Insufficient data for the selected period."

## 9. Auditorium (Admin):
    # Endpoint yang tersedia
        1. GET /api/admin/auditorium/schedule
           - Deskripsi: Mendapatkan jadwal penggunaan auditorium
           - Header: Authorization: Bearer {token}
           - Query Parameters:
             - from: string (format: YYYY-MM-DD, default: hari ini)
             - to: string (format: YYYY-MM-DD, default: 30 hari ke depan)
           - Response Body:
             - success: boolean
             - count: number
             - data: array jadwal (event, startTime, endTime, booked_by)
           - Jika data tidak tersedia:
             - message: "Insufficient data for the selected period."

        2. GET /api/admin/auditorium/events-held
           - Deskripsi: Mendapatkan daftar event yang sudah dilaksanakan
           - Header: Authorization: Bearer {token}
           - Query Parameters:
             - from: string (format: YYYY-MM-DD, default: awal bulan berjalan)
             - to: string (format: YYYY-MM-DD, default: hari ini)
           - Response Body:
             - success: boolean
             - count: number
             - data: array event dengan statistik (id, name, date, time, organizer, totalSeats, availableSeats, occupancy, usageHours)
           - Jika data tidak tersedia:
             - message: "Insufficient data for the selected period."

        3. GET /api/admin/auditorium/utilization
           - Deskripsi: Mendapatkan data tingkat utilisasi auditorium
           - Header: Authorization: Bearer {token}
           - Query Parameters:
             - from: string (format: YYYY-MM-DD, default: 30 hari yang lalu)
             - to: string (format: YYYY-MM-DD, default: hari ini)
           - Response Body:
             - success: boolean
             - count: number
             - data: array utilization (date, total_hours_used, total_hours_available, events, utilization_percentage)
           - Jika data tidak tersedia:
             - message: "Insufficient data for the selected period."

## Model Data

### 1. User
    - username: string (required, unique, max 30 karakter)
    - email: string (required, unique)
    - password: string (required, min 6 karakter)
    - fullName: string (required)
    - phone: string (required)
    - organizerName: string (required jika role adalah 'eventOrganizer')
    - role: string (enum: 'user', 'eventOrganizer', 'admin')

### 2. Event
    - name: string (required, max 100 karakter)
    - description: string (required)
    - date: Date (required)
    - time: string (required)
    - location: string (required)
    - image: string
    - tickets: array Ticket
    - totalSeats: number (required)
    - availableSeats: number (required)
    - published: boolean (default: false)
    - approvalStatus: string (enum: 'pending', 'approved', 'rejected')
    - promotionalOffers: array Offer
    - tags: array string
    - createdBy: User (required)

### 3. Ticket
    - name: string (required)
    - description: string (required)
    - price: number (required)
    - quantity: number (required)
    - startDate: Date (required)
    - endDate: Date (required)
    - status: string (enum: 'active', 'sold_out', 'expired', 'discontinued')
    - seatArrangement: object {
      rows: number,
      columns: number
    }
    - bookedSeats: array {
      row: number,
      column: number,
      bookingId: string
    }

### 4. Order
    - user: User (required)
    - event: Event (required)
    - tickets: array {
      ticketType: string,
      quantity: number,
      seats: array { row: number, column: number },
      price: number,
      isWaitlist: boolean
    }
    - totalAmount: number (required)
    - discount: number (default: 0)
    - promoCode: string
    - status: string (enum: 'pending', 'confirmed', 'cancelled')
    - paymentInfo: object {
      method: string,
      transactionId: string,
      paidAt: Date
    }
    - isWaitlist: boolean (default: false)

### 5. WaitlistTicket
    - name: string (required)
    - description: string (required)
    - price: number (required)
    - quantity: number (required)
    - originalTicketRef: string (required)
    - event: Event (required)
    - createdBy: User (required)

### 6. Notification
    - recipient: User (required)
    - title: string (required)
    - message: string (required)
    - type: string (enum: 'waitlist_ticket', 'event_update', 'order_confirmation', 'system')
    - eventId: Event (optional)
    - ticketId: WaitlistTicket (optional)
    - isRead: boolean (default: false)
    - createdAt: Date
    - updatedAt: Date

### 7. AuditoriumSchedule
    - event: Event (required)
    - startTime: Date (required)
    - endTime: Date (required)
    - booked_by: User (required)
    - createdAt: Date
    - updatedAt: Date

### 8. Utilization
    - date: Date (required, unique)
    - total_hours_used: number (default: 0)
    - total_hours_available: number (default: 24)
    - events: array Event
    - createdAt: Date
    - updatedAt: Date
    - utilization_percentage: number (virtual, calculated)

## Autentikasi dan Otorisasi
Aplikasi ini menggunakan JSON Web Token (JWT) untuk autentikasi. Token harus disertakan dalam header Authorization dengan format "Bearer {token}" untuk endpoint yang memerlukan autentikasi. 

## Upload File
Aplikasi ini mendukung upload file menggunakan multer. Endpoint yang mendukung upload file memerlukan format multipart/form-data.

## Sistem Notifikasi
Aplikasi ini menyediakan sistem notifikasi untuk memberitahu pengguna tentang peristiwa penting:
- Notifikasi Waitlist Ticket: Saat Event Organizer menambahkan tiket waitlist baru untuk event tertentu, pengguna yang telah terdaftar dalam waiting list event tersebut akan menerima notifikasi secara otomatis.
- Notifikasi dapat diakses melalui endpoint GET /api/notifications.
- Notifikasi dapat ditandai sebagai telah dibaca melalui endpoint PUT /api/notifications/:id/read.
- Notifikasi dapat dihapus melalui endpoint DELETE /api/notifications/:id.

## Sistem Waitlist
- Pengguna dapat mendaftar ke waiting list untuk event yang sudah habis tiketnya.
- Ketika Event Organizer menambahkan tiket waitlist, pengguna yang terdaftar dalam waiting list akan menerima notifikasi.
- Setelah pengguna berhasil memesan tiket waitlist, mereka akan otomatis ditandai sebagai "orderCompleted" dalam sistem waiting list.
- Pengguna dengan status "orderCompleted" tidak akan menerima notifikasi tiket waitlist baru untuk event yang sama.
- Pengguna tidak dapat memesan tiket waitlist lebih dari satu kali untuk event yang sama.

## Sistem Laporan
- Event Organizer dapat melihat laporan penjualan tiket dan occupancy untuk event mereka.
- Laporan tersedia dalam bentuk harian, mingguan, dan bulanan.
- Setiap laporan berisi informasi jumlah tiket terjual, pendapatan (dalam RM), persentase kursi terisi, dan grafik penjualan/pendapatan.
- Admin dapat melihat jadwal penggunaan auditorium dan tingkat utilisasi.
- Semua endpoint laporan mendukung custom date range.
- Laporan dapat diunduh dalam format PDF melalui endpoint khusus untuk berbagi atau menyimpan laporan.
- PDF laporan menggunakan Bahasa Inggris dan format mata uang RM (Ringgit Malaysia)
- PDF berisi ringkasan lengkap serta tabel detail dengan informasi penjualan
- Sistem menghasilkan data occupancy antara 10-85% secara deterministik berdasarkan nama event dan tanggal jika data asli tidak tersedia

## Auditorium Management (Admin)
- Dashboard khusus admin untuk memantau dan mengelola penggunaan auditorium
- Tampilan jadwal lengkap untuk rentang tanggal yang dipilih
- Analisis statistik event yang telah diselenggarakan (occupancy rate, jam penggunaan)
- Grafik utilisasi auditorium untuk evaluasi efisiensi penggunaan ruang
- Pemantauan untuk perencanaan event di masa depan hingga jangka panjang
- Filtering data berdasarkan rentang waktu kustom (dari-sampai tanggal tertentu)
- Dukungan data analitik untuk periode masa lalu, sekarang, dan masa depan
- Sistem menghasilkan data utilisasi antara 30-79% secara deterministik berdasarkan hari dan tanggal jika data asli tidak tersedia (utilisasi lebih tinggi di akhir pekan)

## Catatan Penting
- Semua data tanggal menggunakan format ISO (YYYY-MM-DD)
- Semua waktu menggunakan format 24 jam (HH:MM)
- Pagination tersedia untuk beberapa endpoint (lihat parameter query)
- Pencarian full-text tersedia untuk endpoint GET /api/events
- Event hanya dapat dijadwalkan pada hari yang sama (tidak boleh melewati tengah malam)
- Setiap event diasumsikan memiliki durasi rata-rata 3 jam
- Rentang tanggal pada API auditorium dapat meliputi masa depan hingga beberapa tahun

## System Utilities
- Perintah Seeder: `pnpm run seed` akan otomatis menghapus data lama dan mengimpor data baru
- Data yang di-generate meliputi:
  - User (admin, event organizer, dan regular user)
  - Event (dengan jenis tiket dan harga yang bervariasi)
  - Orders (dengan pola distribusi realistis untuk harian, mingguan, dan bulanan)
  - Jadwal penggunaan auditorium (termasuk data masa lalu dan masa depan)
  - Data utilisasi dan occupancy dengan nilai realistis
- Data demo mencakup rentang waktu yang luas untuk memungkinkan pengujian semua fitur laporan
- Dataset khusus untuk April-Mei 2025 tersedia untuk pengujian fitur auditorium management

