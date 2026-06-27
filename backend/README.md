# Restaurant Management System - Backend

A comprehensive backend API for a restaurant management system built with Node.js, Express, and MongoDB.

## Features

- **User Authentication**: JWT-based authentication with role-based access control (Admin, Staff, Customer)
- **Menu Management**: Complete CRUD operations for menu items with categories
- **Order Management**: Create, update, and track orders with multiple statuses
- **Billing System**: Automated billing with tax calculation and payment tracking
- **User Management**: User profiles, password management, and user deactivation

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **CORS**: Cross-Origin Resource Sharing enabled

## Installation

1. **Clone or navigate to the backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a .env file** (copy from .env.example)
   ```bash
   cp .env.example .env
   ```

4. **Update .env with your configuration**
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/restaurant-management
   JWT_SECRET=your_secure_jwt_secret_here
   CORS_ORIGIN=http://localhost:5173
   ```

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/logout` - Logout user

### Menu Items
- `GET /api/menu` - Get all menu items
- `GET /api/menu/:id` - Get single menu item
- `POST /api/menu` - Create menu item (Admin only)
- `PUT /api/menu/:id` - Update menu item (Admin only)
- `DELETE /api/menu/:id` - Delete menu item (Admin only)
- `GET /api/menu/categories/all` - Get all categories

### Orders
- `POST /api/orders` - Create order (Customer)
- `GET /api/orders/my-orders` - Get user's orders (Customer)
- `GET /api/orders` - Get all orders (Admin/Staff)
- `GET /api/orders/:id` - Get single order
- `PATCH /api/orders/:id/status` - Update order status (Admin/Staff)
- `PATCH /api/orders/:id/payment-status` - Update payment status (Admin)
- `PATCH /api/orders/:id/assign-staff` - Assign staff (Admin)
- `PATCH /api/orders/:id/cancel` - Cancel order
- `GET /api/orders/stats/daily` - Get order statistics (Admin/Staff)

### Users
- `GET /api/users` - Get all users (Admin)
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `POST /api/users/:id/change-password` - Change password
- `PATCH /api/users/:id/deactivate` - Deactivate user (Admin)
- `PATCH /api/users/:id/activate` - Activate user (Admin)
- `GET /api/users/role/staff` - Get staff list (Admin)

### Billing
- `POST /api/billing` - Create billing
- `GET /api/billing/order/:orderId` - Get billing for order
- `GET /api/billing` - Get all billings (Admin)
- `PATCH /api/billing/:id/payment-status` - Update payment status (Admin)
- `GET /api/billing/stats/revenue` - Get revenue statistics (Admin)

## Database Models

### User
```javascript
{
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  role: 'admin' | 'staff' | 'customer',
  firstName: String,
  lastName: String,
  phone: String,
  address: String,
  isActive: Boolean,
  timestamps: true
}
```

### MenuItem
```javascript
{
  name: String,
  description: String,
  price: Number,
  category: String,
  emoji: String,
  isAvailable: Boolean,
  preparationTime: Number,
  isVegetarian: Boolean,
  spicyLevel: Number (0-5),
  timestamps: true
}
```

### Order
```javascript
{
  orderNumber: String (auto-generated),
  customerId: ObjectId (ref: User),
  items: [{
    menuItemId: ObjectId,
    name: String,
    price: Number,
    quantity: Number,
    specialInstructions: String
  }],
  totalAmount: Number,
  status: 'Pending' | 'Confirmed' | 'Preparing' | 'Ready' | 'Delivered' | 'Cancelled',
  orderType: 'Dine-In' | 'Takeaway' | 'Delivery',
  tableNumber: String,
  deliveryAddress: String,
  paymentStatus: 'Pending' | 'Paid' | 'Failed',
  paymentMethod: 'Cash' | 'Card' | 'UPI' | 'Wallet',
  staffAssigned: ObjectId (ref: User),
  timestamps: true
}
```

### Billing
```javascript
{
  orderId: ObjectId (ref: Order, unique),
  customerId: ObjectId (ref: User),
  subtotal: Number,
  tax: Number,
  discount: Number,
  deliveryCharges: Number,
  totalAmount: Number,
  paymentMethod: String,
  paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded',
  transactionId: String,
  invoiceNumber: String (auto-generated),
  paymentDate: Date,
  timestamps: true
}
```

## Default Test Credentials

After registration, you can use these credentials for testing:

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | admin |
| staff | staff123 | staff |
| customer | customer123 | customer |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/restaurant-management |
| JWT_SECRET | Secret key for JWT tokens | your_jwt_secret_key |
| CORS_ORIGIN | CORS allowed origin | http://localhost:5173 |

## Error Handling

All API responses follow a consistent format:

### Success Response
```json
{
  "message": "Success message",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "message": "Error message",
  "errors": [ /* additional error details */ ]
}
```

## Development Notes

- Ensure MongoDB is running before starting the server
- JWT tokens expire after 24 hours
- Passwords are hashed using bcryptjs with 10 salt rounds
- All dates are stored as UTC ISO strings

## Future Enhancements

- Email notifications
- Real-time order updates with Socket.io
- Payment gateway integration
- Analytics dashboard
- Inventory management
- Table reservations
- Customer loyalty program
