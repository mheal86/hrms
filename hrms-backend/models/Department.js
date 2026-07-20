const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
  },
  { timestamps: true } // tự thêm createdAt, updatedAt
);

module.exports = mongoose.model('Department', departmentSchema);