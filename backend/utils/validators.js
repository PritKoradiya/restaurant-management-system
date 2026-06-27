// Validation utilities
export const validateEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  return password && password.length >= 6;
};

export const validateUsername = (username) => {
  return username && username.length >= 3 && username.length <= 30;
};

export const validatePhoneNumber = (phone) => {
  const phoneRegex = /^[\d\s\-\+\(\)]{7,}$/;
  return phoneRegex.test(phone);
};

export const validatePrice = (price) => {
  return !isNaN(price) && price > 0;
};

export const validateQuantity = (quantity) => {
  return Number.isInteger(quantity) && quantity > 0;
};

export const validateOrderItems = (items) => {
  return Array.isArray(items) && items.length > 0 && items.every(item => 
    item.menuItemId && validateQuantity(item.quantity)
  );
};

export const validatePaginationParams = (page, limit) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  return {
    page: Math.max(1, pageNum),
    limit: Math.min(100, Math.max(1, limitNum))
  };
};

export const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : user;
  delete userObj.password;
  return userObj;
};

export const calculateTotal = (items, discount = 0) => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  return Math.max(0, subtotal - discount);
};
