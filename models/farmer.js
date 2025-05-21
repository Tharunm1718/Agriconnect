const mongoose = require('mongoose');


// Farmer Schema
const farmerSchema = new mongoose.Schema({
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
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const Farmer = mongoose.model('Farmer', farmerSchema);
module.exports = Farmer;