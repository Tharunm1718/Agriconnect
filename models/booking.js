const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer' },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
  workType: String,
  location: String,
  date: Date,
  status: { type: String, default: 'Pending' },
  completed: { type: String, default: 'No' },
});

const Booking= mongoose.model('Booking', bookingSchema);
module.exports = Booking;