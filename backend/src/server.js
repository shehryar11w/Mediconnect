require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./config');
const errorHandler = require('./middleware/errorHandler');
const ApiResponse = require('./utils/response');
const http = require('http');
const WebSocketService = require('./services/WebSocketService');

// Import routes
const authRoute = require('./routes/AuthRoutes');
const dashboardRoute = require('./routes/DashboardRoutes');
const analyticsRoute = require('./routes/AnalyticsRoutes');
const appointmentRoute = require('./routes/AppointmentRoutes');
const feedbackRoute = require('./routes/FeedbackRoutes');
const prescriptionRoute = require('./routes/PrescriptionRoutes');
const detailsRoute = require('./routes/DetailsRoutes');
const notesRoute = require('./routes/NotesRoutes');
const reportRoute = require('./routes/ReportRoutes');
const chatsRoute = require('./routes/ChatsRoutes');

const app = express();
const server = http.createServer(app);

// Initialize WebSocket
WebSocketService.initialize(server);

const PORT = config.PORT || 5000;

// Middleware
app.use(cors({
  origin: "http://localhost:8081",
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(config.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  autoIndex: process.env.NODE_ENV !== 'production',
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

// Database connection monitoring
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Routes
app.use('/api/auth', authRoute);
app.use('/api/dashboard', dashboardRoute);
app.use('/api/analytics', analyticsRoute);
app.use('/api/appointments', appointmentRoute);
app.use('/api/feedback', feedbackRoute);
app.use('/api/prescriptions', prescriptionRoute);
app.use('/api/details', detailsRoute);
app.use('/api/notes', notesRoute);
app.use('/api/reports', reportRoute);
app.use('/api/chats', chatsRoute);
// Basic route
app.get('/', (req, res) => {
  ApiResponse.success(res, null, 'Medi-Connect Backend is running!');
});

// 404 handler
app.use((req, res) => {
  ApiResponse.error(res, 'Route not found', 404);
});

// Error handler
app.use(errorHandler);

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 