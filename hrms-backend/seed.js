require('dotenv').config({ path: './environment/.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const Role = require('./models/Role');
const User = require('./models/User');

const seed = async () => {
  await connectDB();

  await Role.deleteMany();
  await User.deleteMany();

  const adminRole = await Role.create({ name: 'ADMIN' });
  await Role.create({ name: 'USER' });

  const hashedPassword = await bcrypt.hash('admin123', 10);

  await User.create({
    username: 'admin',
    password: hashedPassword,
    role: adminRole._id,
  });

  console.log('Seed data created: username=admin, password=admin123');
  mongoose.connection.close();
};

seed();