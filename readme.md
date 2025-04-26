# HelpVerse API

HelpVerse API is a backend for an event ticketing platform that provides functionality for event management, ticket booking, user management, and waiting lists.

## System Requirements

- Node.js (v14 or higher)
- MongoDB
- pnpm (recommended) or npm

## Installation

1. **Clone repository**

```bash
git clone https://github.com/yourusername/helpverse-api.git
cd helpverse-api
```

2. **Install dependencies**

```bash
pnpm install
# or
npm install
```

3. **Configure environment variables**

Create a `.env` file in the project root with the following configuration:

```
PORT=5000
MONGO_URI=your_mongo_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
CLIENT_URL=http://localhost:5173,http://localhost:3000
```

Replace the following values according to your needs:
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT
- `CLIENT_URL`: Frontend URL allowed for CORS (separate with commas for multiple URLs)

4. **Build application**

```bash
pnpm build
# or
npm run build
```

5. **Seed database (optional)**

To populate the database with initial data:

```bash
pnpm seed
# or
npm run seed
```

## Running the Application

### Development Mode

```bash
pnpm dev
# or
npm run dev
```

The server will run at `http://localhost:5000` with hot-reload feature.

### Production Mode

```bash
pnpm start
# or
npm start
```

## API Structure

HelpVerse API provides the following endpoints:

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user data
- `POST /api/auth/logout` - User logout

### Events

- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get event details
- `POST /api/events` - Create a new event (admin)
- `PUT /api/events/:id` - Update an event (admin)
- `DELETE /api/events/:id` - Delete an event (admin)

### Orders

- `GET /api/orders` - Get all user orders
- `POST /api/orders` - Create a new order
- `GET /api/orders/:id` - Get order details

### Admin

- `GET /api/admin/users` - Get all users (admin)
- `GET /api/admin/orders` - Get all orders (admin)

### Uploads

- `POST /api/uploads` - Upload a file (image)
- `GET /uploads/:filename` - Access uploaded files

### Waiting List

- `POST /api/waiting-list` - Register to the waiting list
- `GET /api/waiting-list` - Get all waiting list members (admin)

## Security Features

- Rate limiting to prevent brute force attacks
- JWT for authentication and authorization
- Input validation with express-validator
- CORS protection

## File Storage

Uploaded files (such as event images) are stored in the `uploads/` folder and can be accessed through the `/uploads/:filename` endpoint.

## Development

This API was developed using:
- TypeScript
- Express.js
- MongoDB with Mongoose
- JWT for authentication

## Errors and Error Handling

The API provides JSON responses for errors with the following format:

```json
{
  "success": false,
  "error": "Error message"
}
```

In development mode, the response will also include a stack trace for debugging.
# be-helpverse
