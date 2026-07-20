const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['ADMIN', 'USER'],
  },
});

module.exports = mongoose.model('Role', roleSchema);