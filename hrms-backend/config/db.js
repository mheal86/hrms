const mongoose = require('mongoose');
const dns = require('dns');

// Sử dụng Google DNS để phân giải bản ghi SRV của MongoDB Atlas trên các mạng chặn SRV
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  // Bỏ qua nếu môi trường không cho phép cấu hình DNS
}

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;

