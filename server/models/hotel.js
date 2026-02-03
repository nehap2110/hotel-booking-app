const mongoose  = require('mongoose');

const hotelschema = new mongoose.Schema({
    title:{
        type:String,
        required:'title is required',
    },
    content:{
        type:String,
        required:'content is required',
        maxlength : 10000,
    },
    location:{
        type:String
    },
    image:{
        data:Buffer,
        contentType:String
    },
    postedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    price:{
        type:Number,
        required:true
    },
    from:{
        type:Date
    },
    to:{
        type:Date
    },
    bed:{
        type:Number,
        required:true
    },
    
    bookedDates: [
    {
      from: Date,
      to: Date,
      beds: Number
    }
  ]
},{timestamps:true});

module.exports =  mongoose.model('Hotel',hotelschema)

