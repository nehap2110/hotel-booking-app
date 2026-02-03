const express = require('express');
const { createhotel, gethotels ,getimage,sellerHotels,deletehotel,read,edithotel,searchhotellist} = require('../controllers/hotelcontroller');
const router = express.Router();
const formidableMiddleware = require('express-formidable');
const {loggedin,isOwner} = require('../middleware/authmiddleware');



router.post('/create-hotel',loggedin,isOwner,formidableMiddleware(),createhotel)

router.get('/get-hotels',gethotels);

router.get('/hotel/image/:hotelId',getimage)

router.get('/seller-hotels',loggedin,sellerHotels)

router.delete('/delete-hotel/:hotelId',loggedin,isOwner,deletehotel);

router.get('/hotel/:hotelId',read)

router.put('/update-hotel/:hotelId',loggedin,isOwner,formidableMiddleware(),edithotel);

router.post('/search-listing',searchhotellist);




module.exports = router;