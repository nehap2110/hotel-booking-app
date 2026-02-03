 const express = require('express');
 const router = express.Router();

const {ownerBalance,ownerEarnings,ownerPayments,ownerWithdraw,ownerBookings} = require('../controllers/owners')
const {loggedin,isOwner} = require('../middleware/authmiddleware')

// routes/owner.js
router.get("/owner/earnings", loggedin, isOwner, ownerEarnings);
// routes/owner.js
router.get("/owner/payments", loggedin, isOwner, ownerPayments);
// routes/owner.js
router.get("/owner/balance", loggedin, isOwner, ownerBalance);

router.post("/owner/withdraw", loggedin, isOwner, ownerWithdraw);

// routes/owner.js
router.get("/owner/bookings", loggedin, isOwner, ownerBookings);


module.exports = router;




