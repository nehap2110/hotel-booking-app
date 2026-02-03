const express = require('express');

const Hotel = require('../models/hotel');
const fs = require('fs');


exports.createhotel =  async(req,res)=>{
  // console.log('hotel created')
  
  // console.log('req.files:',req.files);
  try {

    let  fields = req.fields;
    let files = req.files;
    console.log("files:",fields)

    let hotel = new Hotel(fields);
     hotel.postedBy =  req.user._id;
    if(files.image){
      hotel.image.data = fs.readFileSync(files.image.path);
      hotel.image.contentType = files.image.type;
    }

    //save the hotel to the db
   try {
  const result = await hotel.save();
  res.status(201).json(result);
} catch (err) {
  console.log("HOTEL SAVING ERROR =>", err);
  res.status(400).json({
    success: false,
    message: "Error in hotel saving",
  });
}

    
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      err:error.message ,
    })
    
  }
}

//get hotels
exports.gethotels = async(req,res)=>{
  try {
    const allhotels = await Hotel.find({}).limit(24).select('-image.data').populate('postedBy','_id name').exec();
     res.status(200).json({
      success:true,
      data:allhotels
     })
    
  } catch (error) {
    console.log("ERROR IN FETCHING ALL HOTELS:",error);
    res.status(400).json({
      err:error.message,
    })
    
  }
}

exports.getimage = async(req,res)=>{
  
    let hotel = await Hotel.findById(req.params.hotelId).exec();

    if(hotel && hotel.image.data!==null){
      res.set('Content-Type',hotel.image.contentType)
      return res.send(hotel.image.data);
    }
  
}

exports.sellerHotels = async(req,res)=>{
  try {
    let sellerhotels = await Hotel.find({postedBy:req.user._id})
    .select('-image.data')
    .populate('postedBy','_id name')
    .exec();

    res.json(sellerhotels)
    
  } catch (error) {
    console.log('ERROR IN FETCHING SELLER HOTEL,',error);
    return res.status(400).json({
      success:false,
      err:error.message,
    })
    
  }
}

exports.deletehotel = async (req, res) => {
  try {
     // 👈 FIX PARAM NAME

    const hotel = await Hotel.findById(req.params.hotelId);

    if (!hotel) {
      return res.status(404).json({ error: "Hotel not found" });
    }

    // 🔥 OWNERSHIP CHECK (MOST IMPORTANT)
    if (hotel.postedBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const del = await Hotel.findByIdAndDelete(req.params.hotelId)
      .select("-image.data")
      .exec();

    res.json({ success: true, hotel: del });
  } catch (error) {
    console.log("error in hotel delete::", error);
    return res.status(500).json({
      err: error.message,
    });
  }
};


exports.read = async(req,res)=>{
  try {
    let hotel = await Hotel.findById(req.params.hotelId)
    .select('-image.data').populate('postedBy','_id name')
    .exec();

    res.json(hotel);
    
  } catch (error) {
    console.log("hotel data fetching error:",error)
    return res.status(400).json({
      err:error.message,
    })
    
  }
}
exports.edithotel = async (req, res) => {
  try {
    const fields = req.fields;
    const files = req.files;

    let data = { ...fields };

    if (files.image) {
      data.image = {
        data: fs.readFileSync(files.image.path),
        contentType: files.image.type,
      };
    }

    const result = await Hotel.findByIdAndUpdate(
      req.params.hotelId,
      data,
      { new: true }
    ).select("-image.data");

    res.json(result);
  } catch (error) {
    console.log("ERROR IN UPDATING HOTEL =>", error);
    res.status(400).json({
      success: false,
      err: error.message,
    });
  }
};

exports.searchhotellist = async (req, res) => {
  try {
    const { location, date, bed } = req.body;

    const [checkIn, checkOut] = date.split(",");

    const hotels = await Hotel.find({
      location: location,
      bed: { $gte: bed },
      from: { $lte: new Date(checkIn) },
      to: { $gte: new Date(checkOut) }
    })
      .select("-image.data")
      .exec();

    res.json(hotels);
  } catch (error) {
    console.log("error in searching hotel ==>", error);
    res.status(400).json({
      success: false,
      message: "Hotel search failed"
    });
  }
};
