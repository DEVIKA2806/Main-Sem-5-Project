const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Seller = require('../models/Seller'); 
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password || !name) return res.status(400).json({ message: 'Missing fields' });

    const existing = await User.findOne({ email });
    if (existing) {
        let message = 'User already exists';
        if (existing.role === 'seller' || existing.role === 'admin') {
            message = 'This email is already registered as a seller or admin. Please use the appropriate login portal.';
        }
        return res.status(409).json({ message });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Default role for standard registration is 'user'
    const user = new User({ name, email, passwordHash, role: 'user' });
    await user.save();

    // Ensures role is included in the token and user object for client-side storage (Fixes role: undefined on registration)
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } }); 
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 1. STANDARD USER LOGIN (Restricted to 'user' role)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    // Enforces separation: blocks non-'user' roles from this endpoint
    if (user.role !== 'user') return res.status(401).json({ message: 'Invalid credentials or incorrect login portal. Please use the seller login if applicable.' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    // Ensures role is consistently returned (Fixes role: undefined on older login accounts)
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 2. DEDICATED SELLER LOGIN (Used by the seller portal)
router.post('/seller-login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        // Ensure the user has the 'seller' or 'admin' role
        if (user.role !== 'seller' && user.role !== 'admin') {
            return res.status(401).json({ message: 'Invalid credentials or you are not registered as a seller.' });
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return res.status(401).json({ message: 'Invalid credentials' });
        
        // After user authentication, check seller application status
        const sellerInfo = await Seller.findOne({ email });
        
        // Deny login if the application isn't 'active'
        if (!sellerInfo || sellerInfo.status !== 'active') {
            return res.status(403).json({ 
                message: `Seller access pending review. Current status: ${sellerInfo ? sellerInfo.status : 'Pending Registration Completion.'}`,
                sellerInfo: sellerInfo || { _id: user._id } 
            });
        }
        
        // All good: generate token and return user/seller data
        const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, sellerId: sellerInfo._id } });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;