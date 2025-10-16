// Tells dotenv to look one directory up (in the main project root) for the .env file.
require('dotenv').config({ path: '../.env' });
const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const mongoose = require('mongoose');
const cors = require('cors');
// const bodyParser is removed. Using Express built-in middleware for consistency.

// 1. IMPORT ALL ROUTES
const authRoutes = require('./routes/auth');
const customerProductRoutes = require('./routes/products'); // Original, for basic read endpoints
const productCreationRoutes = require('./routes/products_new'); // <-- NEW: For seller actions
const orderRoutes = require('./routes/orders');
const contactRoutes = require('./routes/contact');
const sellerRoutes = require('./routes/seller'); 
const deliveryRoutes = require('./routes/delivery'); // <-- NEW: Delivery Routes Routes

const app = express();
const server = http.createServer(app); 
const PORT = process.env.PORT || 5000;
const io = new Server(server); 

// --- MIDDLEWARE ---
app.use(cors({ origin: 'https://main-sem-5-project.onrender.com', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
});

// --- API ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/seller', sellerRoutes);

// Existing product retrieval endpoint remains
app.use('/api/products', customerProductRoutes); 
// New, dedicated endpoint for seller/product logic
app.use('/api/product', productCreationRoutes); 

app.use('/api/delivery', deliveryRoutes); 

// Serve assets (images, etc.) - IMPORTANT for uploaded images
const ASSETS_DIR = path.join(__dirname, '../assets');

// CORRECTED LINE: This single line correctly maps the virtual URL '/assets' 
// to the physical directory where your images are saved.
app.use('/assets', express.static(ASSETS_DIR)); 

// Serve static frontend files
const FRONTEND_DIR = path.join(__dirname, '../frontend');
app.use(express.static(FRONTEND_DIR));

// Fallback: index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

// --- WEBRTC SIGNALING LOGIC ---
io.on('connection', (socket) => {
    console.log('A user connected for signaling:', socket.id);

    // Handle a user joining a room
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);
        // Notify other user in the room that a peer has joined
        socket.to(roomId).emit('peer-joined', { peerId: socket.id });
    });

    // Handle WebRTC offer
    socket.on('webrtc-offer', ({ offer, roomId }) => {
        console.log(`Broadcasting offer from ${socket.id} in room ${roomId}`);
        // Send to all others in the room
        socket.to(roomId).emit('webrtc-offer', { offer, fromId: socket.id });
    });

    // Handle WebRTC answer
    socket.on('webrtc-answer', ({ answer, roomId }) => {
        console.log(`Broadcasting answer from ${socket.id} in room ${roomId}`);
        // Send to all others in the room
        socket.to(roomId).emit('webrtc-answer', { answer, fromId: socket.id });
    });

    // Handle ICE candidates
    socket.on('webrtc-ice-candidate', ({ candidate, roomId }) => {
        console.log(`Broadcasting ICE candidate from ${socket.id} in room ${roomId}`);
        // Send to all others in the room
        socket.to(roomId).emit('webrtc-ice-candidate', { candidate, fromId: socket.id });
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
        console.log('Signaling user disconnected:', socket.id);
    });
});

server.listen(PORT, () => { // Use server.listen instead of app.listen
    console.log(`Server running on port ${PORT}`);
});