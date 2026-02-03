const Booking = require('../models/booking')

exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("hotel", "title location")
      .populate("bookedBy", "name email");

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // 🔒 If booking has no bookedBy (old bad data)
    if (!booking.bookedBy) {
      console.warn("⚠️ Booking has no bookedBy field:", booking._id);
      return res.status(500).json({
        error: "Booking data corrupted. Please contact support."
      });
    }

    // 🔒 Authorization check (safe)
    if (booking.bookedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    res.json(booking);

  } catch (err) {
    console.error("GET BOOKING ERROR =>", err);
    res.status(500).json({ error: err.message });
  }
};
exports.getUserBookings = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const bookings = await Booking.find({
      bookedBy: req.user._id, // ✅ FIXED
    })
      .populate("hotel", "title location price")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.error("Get bookings error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};
