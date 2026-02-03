const Razorpay = require("razorpay");
const crypto = require("crypto");
const Booking = require("../models/booking.js");
const User = require('../models/user')
const Hotel = require("../models/hotel");
require('dotenv').config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET
});

//add for checking the availability of hotel beds on dat
const moment = require("moment");

function rangesOverlap(aFrom, aTo, bFrom, bTo) {
  return moment(aFrom).isBefore(bTo) && moment(bFrom).isBefore(aTo);
}

function getBookedBedsForRange(hotel, from, to) {
  let total = 0;

  hotel.bookedDates.forEach(b => {
    if (rangesOverlap(from, to, b.from, b.to)) {
      total += b.beds;
    }
  });

  return total;
}






// 1️⃣ Create order controller
  exports.createOrder = async (req, res) => {
  try {
    const { amount, hotel, from, to, beds } = req.body;

    const hotelDoc = await Hotel.findById(hotel);
    if (!hotelDoc) {
      return res.status(404).json({ error: "Hotel not found" });
    }

    // 🔒 Availability check
    const alreadyBooked = getBookedBedsForRange(hotelDoc, from, to);
    const availableBeds = hotelDoc.bed - alreadyBooked;

    if (availableBeds < beds) {
      return res.status(400).json({
        error: "Not enough beds available for selected dates"
      });
    }

    const PLATFORM_PERCENT = 10;
    const platformFee = Math.round((amount * PLATFORM_PERCENT) / 100);
    const ownerAmount = amount - platformFee;

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`
    });

    const booking = await Booking.create({
      hotel,
      bookedBy: req.user._id,
      from,
      to,
      beds,
      amount,
      platformFee,
      ownerAmount,
      status: "pending",
      razorpay_order_id: order.id
    });

    res.json({ order, bookingId: booking._id });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};


// 2️⃣ Verify Payment & Save Booking

exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId
    } = req.body;

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    const booking = await Booking.findById(bookingId).populate("hotel");
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.status === "confirmed") {
      return res.json({ success: true });
    }

    const hotel = await Hotel.findById(booking.hotel._id);

    // 🔒 Re-check availability (race condition safety)
    const alreadyBooked = getBookedBedsForRange(
      hotel,
      booking.from,
      booking.to
    );

    const availableBeds = hotel.bed - alreadyBooked;

    if (availableBeds < booking.beds) {
      booking.status = "cancelled";
      await booking.save();

      return res.status(409).json({
        error: "Beds sold out during payment. Refund required."
      });
    }

    // 1️⃣ Confirm booking
    booking.status = "confirmed";
    booking.razorpay_payment_id = razorpay_payment_id;
    await booking.save();

    // 2️⃣ Block beds in hotel
    hotel.bookedDates.push({
      from: booking.from,
      to: booking.to,
      beds: booking.beds
    });

    await hotel.save();

    // 3️⃣ Credit owner wallet
    await User.findByIdAndUpdate(
      hotel.postedBy,
      { $inc: { walletBalance: booking.ownerAmount } },
      { new: true }
    );

    res.json({ success: true });

  } catch (err) {
    console.error("VERIFY ERROR =>", err);
    res.status(500).json({ error: err.message });
  }
};
