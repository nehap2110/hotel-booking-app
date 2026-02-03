const express = require("express");
const { createOrder, verifyPayment } = require("../controllers/paymentcontroller.js");
const {loggedin} = require('../middleware/authmiddleware')

const router = express.Router();

router.post("/create-order",loggedin, createOrder);
router.post("/verify-payment", loggedin, verifyPayment);

module.exports = router
