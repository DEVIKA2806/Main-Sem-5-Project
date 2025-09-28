const express = require('express');
const router = express.Router();
const Seller = require('../models/Seller'); // Import the new Seller Model

// POST /api/seller/register
router.post('/register', async (req, res) => {
    const { name, email, phone, business, products } = req.body;

    // 1. Basic validation
    if (!name || !email || !business) {
        return res.status(400).json({ message: 'Missing required fields.' });
    }

    try {
        // 2. Check for existing seller email
        const existingSeller = await Seller.findOne({ email });
        if (existingSeller) {
            return res.status(409).json({ message: 'This email is already registered as a seller.' });
        }

        // 3. Create new seller (status defaults to 'pending')
        const newSeller = new Seller({
            name, 
            email, 
            phone, 
            businessName: business, 
            productsDesc: products 
        });

        const savedSeller = await newSeller.save();
        
        // 4. Return success and the seller's new MongoDB ID
        res.status(201).json({ 
            message: 'Registration successful!', 
            seller: savedSeller // This object contains the crucial _id used by the frontend
        });

    } catch (error) {
        console.error('Seller registration error:', error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

module.exports = router;