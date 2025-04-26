# HelpVerse API

HelpVerse API adalah backend untuk platform ticketing event yang menyediakan fungsionalitas pengelolaan event, pemesanan tiket, manajemen pengguna, dan daftar tunggu.

## Persyaratan Sistem

- Node.js (v14 atau lebih tinggi)
- MongoDB
- pnpm (disarankan) atau npm

## Instalasi

1. **Clone repository**

```bash
git clone https://github.com/yourusername/helpverse-api.git
cd helpverse-api
```

2. **Instalasi dependensi**

```bash
pnpm install
# atau
npm install
```

3. **Konfigurasi environment variables**

Buat file `.env` di root project dengan konfigurasi berikut:

```
PORT=5000
MONGO_URI=your_mongo_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
CLIENT_URL=http://localhost:5173,http://localhost:3000
```

Ganti nilai-nilai berikut sesuai dengan kebutuhan Anda:
- `MONGO_URI`: String koneksi MongoDB
- `JWT_SECRET`: Secret key untuk JWT
- `CLIENT_URL`: URL frontend yang diizinkan untuk CORS (pisahkan dengan koma untuk multiple URL)

4. **Build aplikasi**

```bash
pnpm build
# atau
npm run build
```

5. **Seed database (opsional)**

Untuk mengisi database dengan data awal:

```bash
pnpm seed
# atau
npm run seed
```

## Menjalankan Aplikasi

### Mode Development

```bash
pnpm dev
# atau
npm run dev
```

Server akan berjalan di `http://localhost:5000` dengan fitur hot-reload.

### Mode Production

```bash
pnpm start
# atau
npm start
```

## Struktur API

HelpVerse API menyediakan endpoint-endpoint berikut:

### Autentikasi

- `POST /api/auth/register` - Registrasi pengguna baru
- `POST /api/auth/login` - Login pengguna
- `GET /api/auth/me` - Mendapatkan data pengguna saat ini
- `POST /api/auth/logout` - Logout pengguna

### Events

- `GET /api/events` - Mendapatkan semua event
- `GET /api/events/:id` - Mendapatkan detail event
- `POST /api/events` - Membuat event baru (admin)
- `PUT /api/events/:id` - Mengupdate event (admin)
- `DELETE /api/events/:id` - Menghapus event (admin)

### Orders

- `GET /api/orders` - Mendapatkan semua pesanan pengguna
- `POST /api/orders` - Membuat pesanan baru
- `GET /api/orders/:id` - Mendapatkan detail pesanan

### Admin

- `GET /api/admin/users` - Mendapatkan semua pengguna (admin)
- `GET /api/admin/orders` - Mendapatkan semua pesanan (admin)

### Uploads

- `POST /api/uploads` - Upload file (gambar)
- `GET /uploads/:filename` - Akses file yang telah diupload

### Waiting List

- `POST /api/waiting-list` - Mendaftar ke waiting list
- `GET /api/waiting-list` - Mendapatkan semua anggota waiting list (admin)

## Fitur Keamanan

- Rate limiting untuk mencegah serangan brute force
- JWT untuk autentikasi dan otorisasi
- Validasi input dengan express-validator
- CORS protection

## Penyimpanan File

File yang diupload (seperti gambar event) disimpan di folder `uploads/` dan dapat diakses melalui endpoint `/uploads/:filename`.

## Pengembangan

API ini dikembangkan menggunakan:
- TypeScript
- Express.js
- MongoDB dengan Mongoose
- JWT untuk autentikasi

## Kesalahan dan Penanganan Error

API menyediakan respons JSON untuk error dengan format berikut:

```json
{
  "success": false,
  "error": "Pesan error"
}
```

Pada mode development, response juga akan menyertakan stack trace untuk debugging.
# be-helpverse
