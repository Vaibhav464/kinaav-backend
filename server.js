const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: ['http://localhost:3000', 'https://kinaav.in', 'https://www.kinaav.in'],
  credentials: true
}));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Define how products look in the database
const productSchema = new mongoose.Schema({
  id: Number,
  name: String,
  description: String,
  price: Number,
  discountedPrice: Number,
  image: String,
  category: String,
  size: [String],
});

// User Schema for syncing with Supabase
const userSchema = new mongoose.Schema({
  supabaseId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  name: String,
  phone: String,
  profilePicture: String,
  addresses: [{
    name: String,
    street: String,
    city: String,
    state: String,
    zip: String,
    isDefault: { type: Boolean, default: false }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Order Schema
const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
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
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed'],
    default: 'Pending'
  },
  paymentMethod: String,
  orderDate: { type: Date, default: Date.now },
  estimatedDelivery: Date
});

// Create models
const Product = mongoose.model('Product', productSchema);
const User = mongoose.model('User', userSchema);
const Order = mongoose.model('Order', orderSchema);

// API to get all products
app.get('/api/products', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// API to add a new product
app.post('/api/products', async (req, res) => {
  const newProduct = new Product(req.body);
  await newProduct.save();
  res.json(newProduct);
});

// API to sync user data from Supabase
app.post('/api/auth/sync-user', async (req, res) => {
  try {
    const { supabaseId, email, name, profilePicture } = req.body;
    
    // Check if user already exists
    let user = await User.findOne({ supabaseId });
    
    if (user) {
      // Update existing user
      user.email = email;
      user.name = name || user.name;
      user.profilePicture = profilePicture || user.profilePicture;
      user.updatedAt = new Date();
      await user.save();
    } else {
      // Create new user
      user = new User({
        supabaseId,
        email,
        name,
        profilePicture
      });
      await user.save();
    }
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API to get user data by Supabase ID
app.get('/api/users/:supabaseId', async (req, res) => {
  try {
    const user = await User.findOne({ supabaseId: req.params.supabaseId });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API to update user profile
app.put('/api/users/:supabaseId', async (req, res) => {
  try {
    const { name, phone, addresses } = req.body;
    const user = await User.findOne({ supabaseId: req.params.supabaseId });
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (addresses) user.addresses = addresses;
    user.updatedAt = new Date();
    
    await user.save();
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API to get user orders
app.get('/api/users/:supabaseId/orders', async (req, res) => {
  try {
    const user = await User.findOne({ supabaseId: req.params.supabaseId });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const orders = await Order.find({ userId: user._id }).sort({ orderDate: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    console.error('Error getting user orders:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start the server
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
