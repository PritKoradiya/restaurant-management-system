# Frontend & Backend Integration Guide

## Setup Instructions

### 1. Run MongoDB
```bash
# Windows
mongod

# macOS (if installed via Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### 2. Install and Run Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Seed database with default data
node scripts/seedDatabase.js

# Start development server
npm run dev
```

The backend will run on **http://localhost:5000**

### 3. Run Frontend

```bash
cd "Restaurant Management System"

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

The frontend will run on **http://localhost:5173**

## Default Test Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Staff | staff1 | staff123 |
| Customer | customer1 | customer123 |

## Frontend-Backend Connection

The frontend expects the API at:
```
http://localhost:5000/api
```

Make sure your frontend API client is configured to use this URL.

## Frontend Components to Update

To connect the frontend to the backend API, update these key areas:

### 1. API Service File (Create if not exists)
Create a file `src/services/api.js`:

```javascript
const API_BASE = 'http://localhost:5000/api';

// Auth
export const authAPI = {
  login: (username, password, role) => 
    fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role })
    }).then(r => r.json()),
  
  register: (userData) =>
    fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    }).then(r => r.json()),
  
  getCurrentUser: (token) =>
    fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json())
};

// Menu
export const menuAPI = {
  getAll: (category) => {
    const url = new URL(`${API_BASE}/menu`);
    if (category) url.searchParams.set('category', category);
    return fetch(url).then(r => r.json());
  },
  getById: (id) =>
    fetch(`${API_BASE}/menu/${id}`).then(r => r.json()),
  create: (data, token) =>
    fetch(`${API_BASE}/menu`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    }).then(r => r.json())
};

// Orders
export const orderAPI = {
  create: (data, token) =>
    fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  getMyOrders: (token) =>
    fetch(`${API_BASE}/orders/my-orders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()),
  
  getAll: (token, filters = {}) => {
    const url = new URL(`${API_BASE}/orders`);
    Object.entries(filters).forEach(([key, val]) => {
      if (val) url.searchParams.set(key, val);
    });
    return fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json());
  }
};
```

### 2. Update Login Component
Replace localStorage simulation in `src/pages/Login.jsx` with:

```javascript
const handleLogin = async (e) => {
  e.preventDefault();
  if (!validateForm()) return;
  
  setIsLoading(true);
  try {
    const response = await authAPI.login(username, password, role);
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('role', role);
      localStorage.setItem('username', response.user.username);
      navigate(`/${role}`);
    } else {
      setErrors({ form: response.message });
    }
  } catch (error) {
    setErrors({ form: 'Login failed. Please try again.' });
  }
  setIsLoading(false);
};
```

### 3. Add API Interceptor
Create `src/services/apiClient.js` for automatic token injection:

```javascript
const API_BASE = 'http://localhost:5000/api';

export const apiClient = {
  request: async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });
    
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    
    return response.json();
  },
  
  get: (endpoint) => 
    apiClient.request(endpoint),
  
  post: (endpoint, data) =>
    apiClient.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  
  put: (endpoint, data) =>
    apiClient.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  
  patch: (endpoint, data) =>
    apiClient.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
  
  delete: (endpoint) =>
    apiClient.request(endpoint, { method: 'DELETE' })
};
```

## Common Issues & Solutions

### CORS Error
If you get CORS errors, ensure:
1. Backend is running on port 5000
2. Frontend is making requests to `http://localhost:5000/api`
3. The `.env` file has correct `CORS_ORIGIN`

### MongoDB Connection Error
Ensure MongoDB is running:
```bash
# Test connection
mongosh
```

### Token Expiration
Tokens expire after 24 hours. Users will need to login again after expiration.

## API Documentation

See `API_ENDPOINTS.json` for complete list of all available endpoints.

## Next Steps

1. ✅ Setup and run the backend
2. ✅ Seed the database
3. ✅ Connect frontend to backend APIs
4. ✅ Test with provided credentials
5. Update all page components to use real API calls instead of local state
6. Add error handling and loading states
7. Implement real-time updates (Socket.io - optional)

## Support

For issues or questions:
1. Check backend console for error messages
2. Verify MongoDB is running
3. Check browser Network tab for API request details
4. Review API response in Network tab for error messages
