// routes/admin.js
const express = require('express');
const router = express.Router();

const {loggedin,isSuperAdmin} = require('../middleware/authmiddleware');
const User = require('../models/user');
const Booking = require('../models/booking');
const Hotel = require('../models/hotel')
const Withdrawal = require('../models/withdrawal')

//controller to check status

router.get("/admin/stats", loggedin, isSuperAdmin, async (req, res) => {
  try {
    const users = await User.countDocuments({ role: "user" });
    const owners = await User.countDocuments({ role: "owner" });
    const hotels = await Hotel.countDocuments();

    const bookings = await Booking.aggregate([
      { $match: { status: "confirmed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const withdrawals = await Withdrawal.countDocuments({ status: "pending" });

    const platformPercent = 10; // change to 15 if needed
    const totalEarnings = bookings[0]?.total || 0;
    const platformEarnings = (totalEarnings * platformPercent) / 100;

    res.json({
      users,
      owners,
      hotels,
      totalEarnings,
      platformEarnings,
      pendingWithdrawals: withdrawals
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// routes to update user
router.get("/admin/users", loggedin, isSuperAdmin, async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});

router.put("/admin/update-role/:id", loggedin, isSuperAdmin, async (req, res) => {
  const { role } = req.body;

  if (!["user", "owner"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true }
  );

  res.json(user);
});

//route to delete user
router.delete("/admin/delete-user/:id", loggedin, isSuperAdmin, async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user.role === "superadmin") {
    return res.status(403).json({ error: "Cannot delete superadmin" });
  }

  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

//route of admin earning// routes/admin.js
router.get("/admin/earnings", loggedin, isSuperAdmin, async (req, res) => {
  const bookings = await Booking.find({ status: "confirmed" })
  .populate({ path: "hotel", select: "title", strictPopulate: false })
  .populate({ path: "user", select: "name email", strictPopulate: false })
  .sort({ createdAt: -1 });

  const platformPercent = 10;

  const totalEarnings = bookings.reduce((s, b) => s + b.amount, 0);
  const platformEarnings = bookings.reduce((s, b) => s + b.platformFee, 0);

  res.json({
    totalBookings: bookings.length,
    totalEarnings,
    platformEarnings,
    platformPercent,
    bookings
  });
});

//route for withdrawing 
router.get("/admin/withdrawals", loggedin, isSuperAdmin, async (req, res) => {
  const withdrawals = await Withdrawal.find()
    .populate("owner", "name email walletBalance")
    .sort({ createdAt: -1 });

  res.json(withdrawals);
});

//
router.put("/admin/withdrawals/:id", loggedin, isSuperAdmin, async (req, res) => {
  const { status } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const withdrawal = await Withdrawal.findById(req.params.id).populate("owner");

  if (!withdrawal) {
    return res.status(404).json({ error: "Not found" });
  }

  // 💥 Refund wallet if rejected
  if (status === "rejected" && withdrawal.status === "pending") {
    await User.findByIdAndUpdate(
      withdrawal.owner._id,
      { $inc: { walletBalance: withdrawal.amount } }
    );
  }

  withdrawal.status = status;
  await withdrawal.save();

  res.json({ success: true, withdrawal });
});



module.exports = router;
