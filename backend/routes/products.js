const express = require('express');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const router = express.Router();
const mongoose = require('mongoose'); // NEW: Need Mongoose for ID validation

// GET /api/product/ - Fetch ALL products (used by the shop page)
router.get('/', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/product/ - Original Admin/Auth creation route (MODIFIED)
// This route is now used primarily for admin/authorized users to add products.
// It is kept for compatibility, but the 'sellerId' must now be included in the body.
router.post('/', auth, async (req, res) => {
    // NOTE: For an admin panel, you might still need to supply a sellerId or a default one.
    // However, since the Mongoose model requires sellerId, it must be in the body.
    try {
        const { title, description, price, category, imageUrl, stock, sellerId } = req.body; // CHANGE 1: Added sellerId
        
        // Validation check for new required field
        if (!sellerId || !mongoose.Types.ObjectId.isValid(sellerId)) { // CHANGE 2: Validation check
            return res.status(400).json({ message: 'Missing or invalid sellerId is required for product creation.' });
        }

        const p = new Product({ 
            sellerId, // CHANGE 3: Include the required sellerId
            title, 
            description, 
            price, 
            category, 
            imageUrl, 
            stock 
        });
        await p.save();
        res.status(201).json(p);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});


// ... existing routes (/ and /) ...

// NEW ROUTE: POST /api/product/add - Dedicated route for the Seller Dashboard
router.post('/add', async (req, res) => {
    const { sellerId, productName, description, price, category } = req.body; 
    const numericPrice = parseFloat(price);

    // 1. Basic Validation
    if (!sellerId || !mongoose.Types.ObjectId.isValid(sellerId)) {
        return res.status(401).json({ message: 'Authentication required: Invalid Seller ID format.' });
    }
    if (!productName || !price || !category || isNaN(numericPrice) || numericPrice <= 0) {
        return res.status(400).json({ message: 'Missing or invalid product details (Name, Price, Category).' });
    }

    // 2. Price Range Validation (REQUIRED LOGIC)
    let minPrice, maxPrice;
    switch (category) {
        case 'saree':
            minPrice = 1000;
            maxPrice = 8000;
            break;
        case 'artifacts':
            minPrice = 200;
            maxPrice = 5000;
            break;
        case 'lifestyle':
            minPrice = 10;
            maxPrice = 1000;
            break;
        case 'other': // Handled by default, assuming other categories have no strict range
        default:
            minPrice = 0;
            maxPrice = Number.MAX_SAFE_INTEGER;
    }

    if (numericPrice < minPrice || numericPrice > maxPrice) {
        return res.status(400).json({ 
            message: `The price of ₹${numericPrice.toFixed(2)} is outside the allowed range (₹${minPrice}-₹${maxPrice}) for the "${category}" category.` 
        });
    }

    try {
        // 3. Create new product entry
        const newProduct = new Product({
            sellerId,
            title: productName, 
            description,
            price: numericPrice, 
            category
        });

        const savedProduct = await newProduct.save();

        res.status(201).json({ 
            message: `Product "${productName}" successfully added to the "${category}" collection!`, 
            product: savedProduct 
        });

    } catch (error) {
        console.error('Seller product addition error:', error);
        res.status(500).json({ message: 'Server error: Failed to add product listing.' });
    }
});


// PUT /api/product/:id - Update existing product
router.put('/:id', auth, async (req, res) => {
    try {
        const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/product/:id - Delete product
router.delete('/:id', auth, async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/product/add - Handles new product listings from the seller dashboard
router.post('/add', async (req, res) => {
    // In a real application, you'd perform proper authentication (e.g., check JWT token)
    // to verify the seller is logged in and their account is 'active'.
    
    const { sellerId, productName, description, price, category } = req.body;

    if (!sellerId || !productName || !description || !price || !category) {
        return res.status(400).json({ message: 'Missing required product fields.' });
    }

    try {
        // Create the new product object
        const newProduct = new Product({
            sellerId: sellerId,
            title: productName,
            description: description,
            price: parseFloat(price),
            category: category.toLowerCase(), // Ensure lowercase for enum match
            // NOTE: In a complete implementation, an image upload service would provide a real URL.
            imageUrl: `/assets/${category}-default.jpg`, 
            stock: 100 // Default stock
        });

        // Simulating the database save operation and getting a MongoDB ID
        const savedProduct = await newProduct.save();

        res.status(201).json({ 
            message: `Product "${productName}" added successfully to category "${category}".`,
            product: savedProduct
        });

    } catch (error) {
        console.error('Product Add Error:', error);
        res.status(500).json({ message: 'Internal server error during product listing. Check your database connection and schema constraints.' });
    }
});

module.exports = router;