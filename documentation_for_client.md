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
           - Query Parameters:
             - date: string (format: YYYY-MM-DD, default: hari ini)
             - eventId: string (opsional, ID event untuk memfilter data)
           - Header: Authorization: Bearer {token}
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
           - Query Parameters:
             - eventId: string (opsional, ID event untuk memfilter data)
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
           - Query Parameters:
             - date: string (format: YYYY-MM-DD, default: bulan berjalan)
             - eventId: string (opsional, ID event untuk memfilter data)
           - Header: Authorization: Bearer {token}
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
           - Query Parameters:
             - type: string (daily, weekly, monthly, all)
             - date: string (format: YYYY-MM-DD, tidak diperlukan untuk weekly dan all)
             - eventId: string (opsional, ID event untuk memfilter data)
           - Header: Authorization: Bearer {token}
           - Response:
             - Content-Type: application/pdf
             - Content-Disposition: attachment; filename=[tipe-laporan].pdf
           - Respons Error:
             - Status 200, Jika tidak ada data: `{ message: "Insufficient data for the selected period." }`
             - Status 500, Jika terjadi kesalahan: `{ message: "Error generating PDF report", error: "detail error" }`
           - Keterangan:
             - Laporan PDF akan berisi semua data penting, termasuk grafik dan tabel
             - Tipe 'daily' berisi data penjualan per jam
             - Tipe 'weekly' berisi data penjualan per hari dalam seminggu
             - Tipe 'monthly' berisi data penjualan per tanggal dalam sebulan
             - Tipe 'all' berisi data lengkap termasuk:
                * Ringkasan umum (total orders, confirmed orders, revenue, occupancy)
                * Sampel transaksi terbaru
                * Ringkasan per event (hingga 15 event teratas)
                * Data okupansi harian (20 hari terakhir)
                * Distribusi status order (confirmed, pending, cancelled)

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

        4. GET /api/admin/auditorium/download-report
           - Deskripsi: Mengunduh laporan auditorium dalam format PDF
           - Header: Authorization: Bearer {token}
           - Query Parameters:
             - type: string (schedule, events-held, utilization, all, default: all)
             - from: string (format: YYYY-MM-DD, default: 30 hari yang lalu)
             - to: string (format: YYYY-MM-DD, default: hari ini)
           - Response:
             - Content-Type: application/pdf
             - Content-Disposition: attachment; filename=auditorium-report-YYYY-MM-DD.pdf
           - Respons Error:
             - Status 200, Jika tidak ada data: `{ message: "Insufficient data for the selected period." }`
             - Status 500, Jika terjadi kesalahan: `{ error: "detail error" }`
           - Keterangan:
             - Laporan PDF berisi semua data penting, termasuk tabel dan ringkasan
             - Tipe 'schedule' berisi jadwal penggunaan auditorium
             - Tipe 'events-held' berisi data event yang sudah diselenggarakan
             - Tipe 'utilization' berisi data tingkat utilisasi auditorium
             - Tipe 'all' berisi laporan lengkap yang mencakup semua data di atas

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

### 8. IAllReports
    - totalOrders: number (jumlah total order)
    - confirmedOrders: number (jumlah order dengan status 'confirmed')
    - ticketsSold: number (jumlah tiket yang terjual)
    - revenue: number (total pendapatan)
    - occupancyPercentage: number (persentase kursi terisi)
    - ordersData: array (detail semua order dengan informasi berikut)
      - id: string
      - date: Date
      - eventId: string
      - eventName: string
      - totalAmount: number
      - ticketCount: number
      - status: string
      - customerName: string
      - customerEmail: string
    - ordersByDate: object (order dikelompokkan berdasarkan tanggal)
    - eventSummary: array (ringkasan per event dengan informasi berikut)
      - id: string
      - name: string
      - totalOrders: number
      - confirmedOrders: number
      - ticketsSold: number
      - revenue: number
      - occupancyPercentage: number
    - occupancyByDate: object (persentase okupansi per tanggal dalam format {YYYY-MM-DD: persentase})
    - message?: string (opsional, hanya muncul jika ada pesan khusus)

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
- **NEW!** Event Organizer dapat memfilter laporan berdasarkan event tertentu menggunakan parameter query `eventId`.
- Admin dapat melihat jadwal penggunaan auditorium dan tingkat utilisasi.
- Admin juga dapat memfilter laporan berdasarkan event tertentu.
- Semua endpoint laporan mendukung custom date range.
- Laporan dapat diunduh dalam format PDF melalui endpoint khusus untuk berbagi atau menyimpan laporan.
- PDF laporan menggunakan Bahasa Inggris dan format mata uang RM (Ringgit Malaysia)
- PDF berisi ringkasan lengkap serta tabel detail dengan informasi penjualan
- Sistem menghasilkan data occupancy antara 10-85% secara deterministik berdasarkan nama event dan tanggal jika data asli tidak tersedia
- Endpoint khusus `/api/reports/all` tersedia untuk mendapatkan seluruh data laporan tanpa filter periode waktu. Data ini dapat diolah di sisi client dengan melakukan filtering berdasarkan kebutuhan.
- **PENTING**: Endpoint `/api/reports/all` selalu mengembalikan struktur data lengkap, bahkan ketika tidak ada data order atau event yang ditemukan. Ini memudahkan pengembang frontend untuk menangani data secara konsisten.

### Endpoint Laporan yang Tersedia
1. GET /api/reports/daily
   - Deskripsi: Mendapatkan laporan penjualan harian
   - Query Parameters:
     - date: string (format: YYYY-MM-DD, default: hari ini)
     - eventId: string (opsional, ID event untuk memfilter data)
   - Header: Authorization: Bearer {token}
   - Response Body: Data laporan harian

2. GET /api/reports/weekly
   - Deskripsi: Mendapatkan laporan penjualan mingguan untuk minggu saat ini
   - Query Parameters:
     - eventId: string (opsional, ID event untuk memfilter data)
   - Header: Authorization: Bearer {token}
   - Response Body: Data laporan mingguan

3. GET /api/reports/monthly
   - Deskripsi: Mendapatkan laporan penjualan bulanan
   - Query Parameters:
     - date: string (format: YYYY-MM-DD, default: bulan ini)
     - eventId: string (opsional, ID event untuk memfilter data)
   - Header: Authorization: Bearer {token}
   - Response Body: Data laporan bulanan

4. GET /api/reports/all
   - Deskripsi: Mendapatkan seluruh data laporan tanpa filter periode waktu
   - Query Parameters:
     - eventId: string (opsional, ID event untuk memfilter data)
   - Header: Authorization: Bearer {token}
   - Response Body:
     - totalOrders: number (jumlah total order, termasuk semua status)
     - confirmedOrders: number (jumlah order dengan status 'confirmed')
     - ticketsSold: number (jumlah tiket terjual dari order confirmed)
     - revenue: number (total pendapatan dari order confirmed)
     - occupancyPercentage: number (persentase kursi terisi)
     - ordersData: array (detail semua order dengan struktur berikut):
       - id: string (ID order)
       - date: Date (tanggal pembuatan order)
       - eventId: string (ID event)
       - eventName: string (nama event)
       - totalAmount: number (jumlah total pembayaran)
       - ticketCount: number (jumlah tiket dalam order)
       - status: string (status order: 'pending', 'confirmed', 'cancelled')
       - customerName: string (nama customer)
       - customerEmail: string (email customer)
     - ordersByDate: object (order dikelompokkan berdasarkan tanggal dalam format YYYY-MM-DD)
     - eventSummary: array (ringkasan data per event):
       - id: string (ID event)
       - name: string (nama event)
       - totalOrders: number (jumlah total order untuk event ini)
       - confirmedOrders: number (jumlah order confirmed untuk event ini)
       - ticketsSold: number (jumlah tiket terjual untuk event ini)
       - revenue: number (total pendapatan untuk event ini)
       - occupancyPercentage: number (persentase kursi terisi untuk event ini)
     - occupancyByDate: object (persentase okupansi harian dalam format {YYYY-MM-DD: persentase})

5. GET /api/reports/download
   - Deskripsi: Mengunduh laporan dalam format PDF
   - Query Parameters:
     - type: string (daily, weekly, monthly, all)
     - date: string (format: YYYY-MM-DD, tidak diperlukan untuk weekly dan all)
     - eventId: string (opsional, ID event untuk memfilter data)
   - Header: Authorization: Bearer {token}
   - Response: File PDF

### Penanganan Kasus Tidak Ada Data

- Untuk endpoint `/api/reports/daily`, `/api/reports/weekly`, dan `/api/reports/monthly`:
  Jika tidak ada data yang ditemukan untuk periode waktu tertentu, API akan mengembalikan pesan: 
  ```json
  {
    "message": "Insufficient data for the selected period."
  }
  ```

- Untuk endpoint `/api/reports/all`:
  Bahkan jika tidak ada event atau order yang ditemukan, API akan selalu mengembalikan struktur data lengkap dengan nilai default (0 untuk angka, array kosong untuk koleksi), contoh:
  ```json
  {
    "totalOrders": 0,
    "confirmedOrders": 0,
    "ticketsSold": 0,
    "revenue": 0,
    "occupancyPercentage": 0,
    "ordersData": [],
    "ordersByDate": {},
    "eventSummary": [],
    "occupancyByDate": {}
  }
  ```

### Filter Berdasarkan Event

Semua endpoint reports sekarang mendukung parameter query `eventId` untuk memfilter data berdasarkan event tertentu:

1. **Cara Penggunaan**:
   - Tambahkan parameter `eventId` dengan nilai MongoDB ID dari event yang ingin difilter
   - Contoh: `/api/reports/all?eventId=64a7b3c55d4e21a8f9b2e7d1`
   - Untuk endpoint dengan parameter lain: `/api/reports/daily?date=2025-05-20&eventId=64a7b3c55d4e21a8f9b2e7d1`

2. **Perilaku Filter**:
   - Event Organizer hanya dapat memfilter event yang mereka buat
   - Admin dapat memfilter berdasarkan event manapun
   - Jika event ID tidak ditemukan atau pengguna tidak memiliki akses ke event tersebut, API akan mengembalikan:
     ```json
     {
       "message": "Event not found or you don't have permission to access it."
     }
     ```
   
3. **Data yang Difilter**:
   - Laporan hanya akan menampilkan data terkait event tersebut:
     - Jumlah tiket terjual untuk event tersebut
     - Pendapatan dari event tersebut
     - Occupancy rate untuk event tersebut
     - Orders yang terkait dengan event tersebut
   - Jika tidak ada orders untuk event tersebut, API akan mengembalikan pesan "Insufficient data for the selected period"

4. **Manfaat Menggunakan Filter**:
   - Analisis performa event tertentu dengan lebih detail
   - Membandingkan data antar event dengan lebih mudah
   - Pembuatan laporan yang lebih spesifik untuk event tertentu
   - Download PDF laporan untuk event individual

### Penanganan Parameter pada Endpoint Download

Endpoint `/api/reports/download` memiliki mekanisme fallback untuk memastikan API tetap beroperasi bahkan dengan parameter yang tidak lengkap atau tidak valid:

1. **Parameter `type`**:
   - Nilai valid: 'daily', 'weekly', 'monthly', 'all'
   - Jika tidak disediakan atau tidak valid: menggunakan 'monthly' sebagai default
   - Contoh valid: `?type=daily` atau `?type=all`

2. **Parameter `date`**:
   - Format valid: YYYY-MM-DD
   - Jika tidak disediakan: menggunakan tanggal hari ini
   - Jika format tidak valid: menggunakan tanggal hari ini sebagai fallback
   - Contoh valid: `?date=2025-05-20`

3. **Kombinasi Parameter**:
   - Mengunduh laporan harian untuk 20 Mei 2025: `?type=daily&date=2025-05-20`
   - Mengunduh laporan bulanan untuk Mei 2025: `?type=monthly&date=2025-05-01` (tanggal berapa saja di bulan tersebut)
   - Mengunduh laporan mingguan untuk minggu saat ini: `?type=weekly` (parameter date diabaikan)
   - Mengunduh laporan lengkap semua waktu: `?type=all` (parameter date diabaikan)

4. **Jika tidak ada parameter**:
   - Contoh: `/api/reports/download`
   - Secara default akan menghasilkan laporan bulanan untuk bulan berjalan

### Format PDF

Laporan PDF yang dihasilkan memiliki format yang berbeda tergantung jenis laporan:

1. **Laporan Harian** (type=daily):
   - Ringkasan: jumlah tiket terjual, pendapatan, dan okupansi
   - Tabel penjualan per jam dengan jumlah tiket dan pendapatan

2. **Laporan Mingguan** (type=weekly):
   - Ringkasan: jumlah tiket terjual, pendapatan, dan okupansi
   - Tabel penjualan per hari dengan jumlah tiket dan pendapatan

3. **Laporan Bulanan** (type=monthly):
   - Ringkasan: jumlah tiket terjual, pendapatan, dan okupansi
   - Tabel penjualan per tanggal dengan jumlah tiket dan pendapatan

4. **Laporan Lengkap** (type=all):
   - Ringkasan: total orders, confirmed orders, jumlah tiket terjual, pendapatan, dan okupansi
   - Sampel 10 transaksi terbaru dengan status
   - Tabel ringkasan event (15 event teratas berdasarkan pendapatan)
   - Tabel data okupansi harian untuk 20 hari terakhir (dari occupancyByDate)
   - Analisis distribusi status order (confirmed, pending, cancelled)

### Praktik Terbaik Penggunaan Endpoint Reports

1. Gunakan endpoint `/api/reports/all` untuk mendapatkan data lengkap yang dapat difilter pada sisi client
2. Jika hanya membutuhkan data untuk periode tertentu, gunakan endpoint spesifik (daily/weekly/monthly)
3. Untuk analisis performa event tertentu, gunakan parameter `eventId` pada endpoint yang sesuai
4. Ketika menampilkan dashboard untuk Event Organizer dengan multiple events, sediakan dropdown filter untuk memilih event tertentu
5. Selalu periksa keberadaan data sebelum mengakses properti dalam respons
6. Untuk visualisasi data:
   - Gunakan `ordersByDate` untuk grafik tren waktu
   - Gunakan `eventSummary` untuk perbandingan antar event
   - Gunakan `ordersData` untuk tabel detail atau analisis per order
   - Gunakan `occupancyByDate` untuk menampilkan grafik okupansi harian
7. Saat membuat laporan PDF untuk event tertentu, selalu sertakan parameter `eventId` pada endpoint download

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

