require('dotenv').config({ path: './environment/.env' });
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Đăng ký model để Mongoose biết schema tồn tại (dùng cho populate)
require('./models/Role');
require('./models/User');
require('./models/DepartmentHistory');
require('./models/AuditLog');

const departmentRoutes = require('./routes/departmentRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const profileRoutes = require('./routes/profileRoutes');
const auditRoutes = require('./routes/auditRoutes');

const app = express();

connectDB();

app.use(
  cors({
    origin: [
      'http://localhost:4200',
      'http://localhost:4201',
      'http://127.0.0.1:4200',
      'http://127.0.0.1:4201',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json()); // phải đặt TRƯỚC mọi route để req.body đọc được
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

app.use('/api/departments', departmentRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/audit-logs', auditRoutes);

app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
