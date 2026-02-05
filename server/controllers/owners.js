// controllers/owner.js
const Booking = require("../models/booking");
const Hotel = require("../models/hotel");
const User = require('../models/user')


exports.ownerEarnings = async (req, res) => {
  try {
    console.log("OWNER:", req.user._id);

    const hotels = await Hotel.find({ postedBy: req.user._id }).select("_id");
    console.log("HOTELS:", hotels);

    const hotelIds = hotels.map(h => h._id);

    const bookings = await Booking.find({
      hotel: { $in: hotelIds },
      status: "confirmed",
      razorpay_payment_id: { $exists: true }
    })
      .populate("hotel", "title postedBy")
      .populate("bookedBy", "name email")
      .sort({ createdAt: -1 });

    console.log("BOOKINGS FOUND:", bookings.length);

    const totalEarnings = bookings.reduce(
      (sum, b) => sum + Number(b.ownerAmount || 0),
      0
    );

    res.json({
      totalEarnings,
      totalBookings: bookings.length,
      pendingPayout: 0,
      bookings
    });

  } catch (err) {
    console.error("OWNER EARNINGS ERROR =>", err);
    res.status(500).json({ error: err.message });
  }
};



// controllers/owner.js
exports.ownerBookings = async (req, res) => {
  try {
    const hotels = await Hotel.find({ postedBy: req.user._id }).select("_id");
    if (!hotels.length) {
     return res.json([]);
    }

    const hotelIds = hotels.map(h => h._id);

    
const bookings = await Booking.find({
  hotel: { $in: hotelIds }
})
.select("from to beds amount status createdAt")
.populate("hotel", "title")
.populate("bookedBy", "name email")
.sort({ createdAt: -1 });


    res.json(bookings);

  } catch (err) {
    console.error("OWNER BOOKINGS ERROR =>", err);
    res.status(500).json({ error: err.message });
  }
};




// controllers/owner.js


exports.ownerPayments = async (req, res) => {
  try {
    const hotels = await Hotel.find({ postedBy: req.user._id }).select("_id");
    const hotelIds = hotels.map(h => h._id);

    const payments = await Booking.find({
      hotel: { $in: hotelIds }
    })
      .populate("hotel", "title")
      .populate("bookedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ payments });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};


// controllers/owner.js
const Withdrawal = require("../models/withdrawal");

exports.ownerBalance = async (req, res) => {
  try {
    const hotels = await Hotel.find({ postedBy: req.user._id }).select("_id");
    const hotelIds = hotels.map(h => h._id);

   const totalEarnings = await Booking.aggregate([
  { $match: { hotel: { $in: hotelIds }, status: "confirmed" } },
  { $group: { _id: null, total: { $sum: "$amount" } } }
   ]);

  const withdrawn = await Withdrawal.aggregate([
  { $match: { owner: req.user._id, status: "approved" } },
  { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);


    const balance =
      (totalEarnings[0]?.total || 0) - (withdrawn[0]?.total || 0);

    res.json({ balance });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// controllers/owner.js
exports.ownerWithdraw = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const owner = await User.findById(req.user._id);

    if (amount > owner.walletBalance) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    const withdrawal = await Withdrawal.create({
      owner: req.user._id,
      amount,
      status: "pending"
    });

    // 🔥 LOCK FUNDS (deduct immediately)
    owner.walletBalance -= amount;
    await owner.save();

    res.json({ success: true, withdrawal });

  } catch (err) {
    console.error("WITHDRAW ERROR =>", err);
    res.status(500).json({ error: err.message });
  }
};
