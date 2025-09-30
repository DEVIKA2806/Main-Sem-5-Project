// backend/routes/delivery.js (New File for Issue #2)

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
// Assume Order Model exists in '../models/Order' for context
// const Order = require('../models/Order'); 

// Middleware to restrict access to only 'admin' or 'delivery' roles (if new role is implemented)
function deliveryAuth(req, res, next) {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'delivery')) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Only authorized delivery personnel/admins can access this panel.' });
    }
}

// GET /api/delivery/orders/pending - Get new orders 
router.get('/orders/pending', auth, deliveryAuth, async (req, res) => {
    try {
        // NOTE: Replace 'Order' with the actual imported model name
        // This is mock logic assuming an Order model with a 'status' field.
        const mockOrders = [
            { _id: 'ORDER-001', items: [{ name: 'Saree', qty: 1 }], status: 'pending', deliveryAddress: { name: 'J. Doe', fullAddress: '123 Main St.' } },
            { _id: 'ORDER-002', items: [{ name: 'Artifact', qty: 2 }], status: 'shipped', deliveryAddress: { name: 'A. Smith', fullAddress: '456 Oak Ave.' } }
        ];

        // const pendingOrders = await Order.find({ status: { $in: ['pending', 'accepted', 'shipped'] } }).sort({ createdAt: 1 }).lean();
        
        res.json(mockOrders); // Replace with pendingOrders after implementing Order model
    } catch (error) {
        console.error('Error fetching pending orders:', error);
        res.status(500).json({ message: 'Server error fetching orders.' });
    }
});

// POST /api/delivery/orders/:orderId/updateStatus - Update order status
router.post('/orders/:orderId/updateStatus', auth, deliveryAuth, async (req, res) => {
    const { orderId } = req.params;
    const { newStatus } = req.body;
    
    if (!['accepted', 'shipped', 'delivered', 'cancelled'].includes(newStatus)) {
        return res.status(400).json({ message: 'Invalid new status.' });
    }

    try {
        // NOTE: Replace 'Order' with the actual imported model name
        // const order = await Order.findByIdAndUpdate(orderId, { $set: { status: newStatus } }, { new: true });

        // MOCK LOGIC: Assuming successful update
        const mockOrder = { _id: orderId, status: newStatus };

        res.json({ message: `Order ${orderId} status updated to ${newStatus}.`, order: mockOrder });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Server error updating order status.' });
    }
});

module.exports = router;