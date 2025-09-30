// backend/routes/products_new.js (New File)

const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Price range definitions for server-side validation (Issue #6)
const PRICE_RANGES = {
    saree: { min: 1000, max: 8000 },
    artifacts: { min: 200, max: 5000 },
    lifestyle: { min: 10, max: 1000 }
};

// Define disk storage for multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Destination directory: Assumes 'backend' is next to 'assets'
        const dir = path.join(__dirname, '../../assets/products');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Use sellerId + timestamp + original extension for unique filename
        const ext = path.extname(file.originalname);
        cb(null, req.body.sellerId + '-' + Date.now() + ext);
    }
});

// Configure multer to handle single image file upload (Issue #7)
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed!'), false);
        }
    }
});

// POST /api/product/add - Add New Product (Protected)
router.post('/add', auth, (req, res, next) => {
    // Use multer middleware for image upload
    upload.single('productImage')(req, res, async (err) => {
        const { sellerId, productName, description, price, category } = req.body;
        
        // Handle multer errors
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: 'File upload error: ' + err.message });
        } else if (err) {
            return res.status(500).json({ message: err.message });
        }

        // Check if image file exists
        if (!req.file) {
            return res.status(400).json({ message: 'Product image is required.' });
        }
        
        // 1. Validate required fields
        if (!sellerId || !productName || !description || !price || !category) {
            if (req.file) fs.unlinkSync(req.file.path); // Delete file on validation failure
            return res.status(400).json({ message: 'Missing required product fields.' });
        }
        
        // 2. Validate Price Range (Issue #6)
        const numericPrice = parseFloat(price);
        const range = PRICE_RANGES[category];
        
        if (!range || numericPrice < range.min || numericPrice > range.max) {
            if (req.file) fs.unlinkSync(req.file.path); // Delete file on price validation failure
            return res.status(400).json({ 
                message: `Price (₹${numericPrice}) is outside the acceptable range for ${category}: ₹${range.min}-₹${range.max}.` 
            });
        }
        
        // 3. Create new Product
        try {
            const newProduct = new Product({
                sellerId: sellerId,
                title: productName,
                description: description,
                price: numericPrice,
                category: category,
                // Store the relative URL for frontend use
                imageUrl: '/assets/products/' + req.file.filename, 
            });

            const savedProduct = await newProduct.save();

            // Success response (Issue #1, #8)
            res.status(201).json({
                message: 'Item added successfully! Redirecting to the ' + category + ' page.',
                product: savedProduct
            });

        } catch (error) {
            console.error('Product addition error:', error);
            if (req.file) fs.unlinkSync(req.file.path); // Delete file on DB error
            res.status(500).json({ message: 'Server error during product listing.' });
        }
    });
});

// GET /api/product/:category - Get products by category (for dynamic rendering - Issue #8)
router.get('/:category', async (req, res) => {
    try {
        const category = req.params.category.toLowerCase();
        
        const validCategories = ['saree', 'artifacts', 'lifestyle'];
        if (!validCategories.includes(category)) {
            return res.status(404).json({ message: 'Invalid category specified.' });
        }
        
        // Fetches all products of the given category
        const products = await Product.find({ category: category }).sort({ createdAt: -1 });

        res.json({ products });
    } catch (error) {
        console.error('Fetch products error:', error);
        res.status(500).json({ message: 'Server error retrieving products.' });
    }
});

module.exports = router;