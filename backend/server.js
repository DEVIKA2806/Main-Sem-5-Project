// Tells dotenv to look one directory up (in the main project root) for the .env file.
require('dotenv').config({ path: '../.env' });
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

// 1. IMPORT ALL ROUTES (Existing and New)
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products'); // Renamed from products to product (see note)
const orderRoutes = require('./routes/orders');
const contactRoutes = require('./routes/contact');
const sellerRoutes = require('./routes/seller'); // <-- NEW: Seller Registration
const productAddRoutes = require('./routes/product'); // <-- NEW: Seller Product Add (Use a unique name here if productRoutes is for generic CRUD)

const app = express();
const PORT = process.env.PORT || 5000;

// --- MIDDLEWARE ---
// Use CORS middleware (your current setup is fine since it allows all origins for simplicity)
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
});

// --- API ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/contact', contactRoutes);

// Existing Product CRUD route (e.g., /api/products)
app.use('/api/products', productRoutes); 

// NEW SELLER ROUTES
app.use('/api/seller', sellerRoutes); // Handles POST /api/seller/register
app.use('/api/product', productAddRoutes); // Handles POST /api/product/add

// Serve static frontend files
const FRONTEND_DIR = path.join(__dirname, '../frontend');
app.use(express.static(FRONTEND_DIR));

// Serve assets (images, etc.)
const ASSETS_DIR = path.join(__dirname, '../assets');
app.use('/assets', express.static(ASSETS_DIR));


// Fallback: index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});