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

## Catatan Penting
- Semua data tanggal menggunakan format ISO (YYYY-MM-DD)
- Semua waktu menggunakan format 24 jam (HH:MM)
- Pagination tersedia untuk beberapa endpoint (lihat parameter query)
- Pencarian full-text tersedia untuk endpoint GET /api/events


<!-- task -->
saat ini ketika user yang mendaftar join tiket waitlits dan mendapatkan notifikasi ketersediaan tiket setelah tiket di tambahkan oleh EVENT ORGANIZER maka user bisa melakukan order untuk tiket waitlist tersebut, apakah sudah benar ? kemudian setelah order tiket waitlist tersebut berhasil, user tersebut masih terdaftar ke join waitlist ? apakah benar saat ini seperti itu ?