# Kinaav Backend API

This is the backend API for the Kinaav e-commerce platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with:
```
MONGO_URI=mongodb://localhost:27017/kinaav
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

3. Start the server:
```bash
npm run dev
```

## API Endpoints

### Authentication & User Management
- `POST /api/auth/sync-user` - Sync Supabase user with MongoDB
- `GET /api/users/:supabaseId` - Get user data by Supabase ID
- `PUT /api/users/:supabaseId` - Update user profile
- `GET /api/users/:supabaseId/orders` - Get user orders

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Add new product

## Database Schemas

### User Schema
```javascript
{
  supabaseId: String (required, unique),
  email: String (required),
  name: String,
  phone: String,
  profilePicture: String,
  addresses: [{
    name: String,
    street: String,
    city: String,
    state: String,
    zip: String,
    isDefault: Boolean
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Order Schema
```javascript
{
  orderId: String (unique),
  userId: ObjectId (ref: 'User'),
  items: [{
    productId: ObjectId (ref: 'Product'),
    quantity: Number,
    price: Number,
    size: String,
    weight: String
  }],
  totalAmount: Number,
  discountAmount: Number,
  shippingAddress: {
    name: String,
    street: String,
    city: String,
    state: String,
    zip: String
  },
  status: String (enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']),
  paymentStatus: String (enum: ['Pending', 'Completed', 'Failed']),
  paymentMethod: String,
  orderDate: Date,
  estimatedDelivery: Date
}
```

## Hybrid Authentication Approach

This backend uses a hybrid approach:
1. **Supabase** handles authentication (login, signup, password reset)
2. **MongoDB** stores user profile data, orders, and other business data
3. **Sync API** automatically creates/updates user records in MongoDB when users authenticate via Supabase

## Environment Variables

- `MONGO_URI`: MongoDB connection string
- `PORT`: Server port (default: 5000)
- `JWT_SECRET`: Secret key for JWT tokens (for future use) 