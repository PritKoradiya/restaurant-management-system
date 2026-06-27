# Backend Project Structure

```
backend/
├── config/
│   └── database.js          # Database connection configuration
├── models/
│   ├── User.js              # User schema and model
│   ├── MenuItem.js          # Menu item schema and model
│   ├── Order.js             # Order schema and model
│   └── Billing.js           # Billing schema and model
├── middleware/
│   ├── auth.js              # Authentication and authorization middleware
│   └── errorHandler.js      # Global error handling middleware
├── routes/
│   ├── authRoutes.js        # Authentication endpoints
│   ├── menuRoutes.js        # Menu management endpoints
│   ├── orderRoutes.js       # Order management endpoints
│   ├── userRoutes.js        # User management endpoints
│   └── billingRoutes.js     # Billing endpoints
├── utils/
│   ├── constants.js         # API constants
│   ├── validators.js        # Validation utilities
│   └── helpers.js           # Helper functions
├── scripts/
│   └── seedDatabase.js      # Database seeding script
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore file
├── server.js                # Main server file
├── package.json             # Project dependencies
└── README.md                # Documentation
```

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

3. Start MongoDB:
   ```bash
   # Windows
   mongod
   
   # macOS (if installed via Homebrew)
   brew services start mongodb-community
   ```

4. Seed the database:
   ```bash
   node scripts/seedDatabase.js
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000`

## Testing with cURL or Postman

### Register a new user
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "role": "customer",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123",
    "role": "admin"
  }'
```

### Get all menu items
```bash
curl http://localhost:5000/api/menu
```

### Create an order (requires token)
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "items": [
      {
        "menuItemId": "ITEM_ID",
        "price": 250,
        "quantity": 2
      }
    ],
    "orderType": "Dine-In",
    "tableNumber": "5",
    "paymentMethod": "Cash"
  }'
```

## Key Features Implemented

### Authentication & Authorization
- User registration and login with JWT
- Role-based access control (RBAC)
- Password hashing with bcryptjs
- Token-based API security

### Menu Management
- CRUD operations for menu items
- Category-based filtering
- Item availability tracking

### Order Management
- Create and manage orders
- Order status tracking
- Payment status management
- Staff assignment
- Order statistics

### Billing System
- Automatic billing creation
- Tax calculation
- Payment tracking
- Revenue statistics

### User Management
- User profiles
- Password management
- Role management
- User activation/deactivation

## API Response Format

All API responses follow this format:

### Success
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

### Error
```json
{
  "success": false,
  "message": "Error description"
}
```

## Notes

- Make sure MongoDB is running before starting the server
- Modify `.env` file with your actual settings
- Update JWT_SECRET to a secure value in production
- The seed script creates default test users and menu items
