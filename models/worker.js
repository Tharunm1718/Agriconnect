
const mongoose = require('mongoose');

// Worker Schema
const workerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  location: {
    village: String,
    district: String,
    state: String,
    pincode: String,
  },
  skills: [String], 
  availability: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const Worker = mongoose.model('Worker', workerSchema);
module.exports = Worker;

