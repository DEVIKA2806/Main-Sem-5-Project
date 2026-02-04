const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
// Assuming you have a ResellItem model
// const ResellItem = require('../models/ResellItem'); 

// 1. Configure Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/resell/'); // Ensure this folder exists!
    },
    filename: (req, file, cb) => {
        // Creates a unique filename: Date + Original Name
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// 2. The POST Route
// 'image' matches the name attribute in your FormData or file input
router.post('/add', upload.single('image'), async (req, res) => {
    try {
        const { name, description, category, itemType, price } = req.body;
        
        // The path to the uploaded image
        const imageUrl = `/uploads/resell/${req.file.filename}`;

        // logic to save to your database (MongoDB/SQL)
        /* const newItem = new ResellItem({
            name,
            description,
            category,
            itemType,
            price: parseFloat(price),
            imageUrl,
            sellerId: req.user.id // From your auth middleware
        });
        await newItem.save();
        */

        res.status(200).json({ 
            success: true, 
            message: 'Item added successfully!',
            data: { name, imageUrl } 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;