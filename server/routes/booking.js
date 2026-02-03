
const express = require('express');
const router = express.Router();
const {getBookingById,getUserBookings} = require('../controllers/bookingcontroller');
const { loggedin } = require('../middleware/authmiddleware');

router.get("/booking/my", loggedin, getUserBookings);
router.get("/booking/:id", getBookingById);


module.exports = router;