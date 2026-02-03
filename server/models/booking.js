const mongoose = require("mongoose");

const bookingschema = new mongoose.Schema({
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hotel",
    required: true
  },
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  from: Date,
  to: Date,
  beds: Number,

  amount: {
    type: Number,
    required: true
  },

  platformFee: {
    type: Number,
    default: 0
  },

  ownerAmount: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled"],
    default: "pending"
  },

  razorpay_order_id: String,
  razorpay_payment_id: String

}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingschema);
