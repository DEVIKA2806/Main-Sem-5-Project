const express = require('express');
const router = express.Router();
const Seller = require('../models/Seller'); // Import the new Seller Model
const User = require('../models/User'); // Import the User Model
const bcrypt = require('bcryptjs'); // For hashing the password

// POST /api/seller/register
router.post('/register', async (req, res) => {
    // Added 'password'
    const { name, email, phone, business, products, password } = req.body; 

    // 1. Basic validation
    if (!name || !email || !business || !password) {
        return res.status(400).json({ message: 'Missing required fields: Name, Email, Business Name, or Password.' });
    }

    try {
        // 2. Check for existing entries (User account first)
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            // This is crucial for the frontend logic to distinguish.
            const message = existingUser.role === 'seller' 
                ? 'This email is already registered as a seller. Please login.'
                : 'This email is already registered as a standard user. Please login to your standard account first.' 
            return res.status(409).json({ message });
        }
        
        // 3. Create NEW User Account with 'seller' role
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = new User({ name, email, passwordHash, role: 'seller' });
        await newUser.save();

        // 4. Create new Seller application (status defaults to 'pending')
        const newSeller = new Seller({
            name, 
            email, 
            phone, 
            businessName: business, 
            productsDesc: products 
        });

        const savedSeller = await newSeller.save();
        
        // 5. Return success and the user/seller IDs
        res.status(201).json({ 
            message: 'Seller application submitted successfully! Redirecting to dashboard.', 
            seller: savedSeller,
            userId: newUser._id
        });

    } catch (error) {
        console.error('Seller registration error:', error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

module.exports = router;