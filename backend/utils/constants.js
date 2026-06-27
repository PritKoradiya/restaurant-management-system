// API Constants
export const ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
  CUSTOMER: 'customer'
};

export const ORDER_STATUS = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  READY: 'Ready',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled'
};

export const ORDER_TYPE = {
  DINE_IN: 'Dine-In',
  TAKEAWAY: 'Takeaway',
  DELIVERY: 'Delivery'
};

export const PAYMENT_STATUS = {
  PENDING: 'Pending',
  PAID: 'Paid',
  FAILED: 'Failed',
  REFUNDED: 'Refunded'
};

export const PAYMENT_METHOD = {
  CASH: 'Cash',
  CARD: 'Card',
  UPI: 'UPI',
  WALLET: 'Wallet'
};

export const MENU_CATEGORIES = [
  'Main Course',
  'Bread',
  'South Indian',
  'Starter',
  'Side Dish',
  'Beverage',
  'Dessert',
  'Thali'
];

export const SPICY_LEVELS = {
  MILD: 1,
  MEDIUM: 2,
  MEDIUM_HOT: 3,
  HOT: 4,
  VERY_HOT: 5
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500
};

// Tax percentage
export const TAX_PERCENTAGE = 5;

// Token expiration
export const TOKEN_EXPIRY = '24h';
