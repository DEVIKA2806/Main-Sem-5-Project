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

// NEW ROUTE: POST /api/product/add - Dedicated route for the Seller Dashboard
// This is cleaner for the public facing seller flow, which might not use the standard 'auth' middleware
// that your admin uses, although it SHOULD still validate the seller's identity.
router.post('/add', async (req, res) => {
    // Data extraction from the frontend form submission
    const { sellerId, productName, description, price, category } = req.body; 

    // 1. Basic Validation
    if (!sellerId || !mongoose.Types.ObjectId.isValid(sellerId)) {
        return res.status(401).json({ message: 'Authentication required: Invalid Seller ID format.' });
    }
    if (!productName || !price || !category) {
        return res.status(400).json({ message: 'Missing product details (Name, Price, Category).' });
    }

    try {
        // 2. Create new product entry
        const newProduct = new Product({
            sellerId,
            title: productName, // Map frontend field to MongoDB field
            description,
            price,
            category
            // imageUrl and stock are optional here, as they are not in the seller form
        });

        const savedProduct = await newProduct.save();

        res.status(201).json({ 
            message: `Product "${productName}" successfully added!`, 
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

module.exports = router;