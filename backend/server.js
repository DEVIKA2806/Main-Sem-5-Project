// Tells dotenv to look one directory up (in the main project root) for the .env file.
require('dotenv').config({ path: '../.env' });
const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

// 1. IMPORT ALL ROUTES
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products'); // Existing Product CRUD
const orderRoutes = require('./routes/orders');
const contactRoutes = require('./routes/contact');
const sellerRoutes = require('./routes/seller'); // <-- NEW: Seller Registration

const app = express();
const server = http.createServer(app); // Wrap app in an HTTP server
const PORT = process.env.PORT || 5000;
const io = new Server(server); // Attach Socket.IO to the server

// --- MIDDLEWARE ---
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
app.use('/api/seller', sellerRoutes); // Handles POST /api/seller/register

// Use a single base path for all product-related routes.
// This will handle GET /api/products, POST /api/products/add, etc.
app.use('/api/products', productRoutes);

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
        socket.to(roomId).emit('webrtc-offer', { offer, fromId: socket.id });
    });

    // Handle WebRTC answer
    socket.on('webrtc-answer', ({ answer, roomId }) => {
        console.log(`Broadcasting answer from ${socket.id} in room ${roomId}`);
        socket.to(roomId).emit('webrtc-answer', { answer, fromId: socket.id });
    });

    // Handle ICE candidates
    socket.on('webrtc-ice-candidate', ({ candidate, roomId }) => {
        console.log(`Broadcasting ICE candidate from ${socket.id} in room ${roomId}`);
        socket.to(roomId).emit('webrtc-ice-candidate', { candidate, fromId: socket.id });
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
        console.log('Signaling user disconnected:', socket.id);
    });
});

server.listen(PORT, () => { // Use server.listen instead of app.listen
    console.log(`🚀 Server running on port ${PORT}`);
});