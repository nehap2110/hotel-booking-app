const mongoose = require('mongoose');


const userschema = new mongoose.Schema({
    name:{
        type:String,
        trim:true,
        required:true
    },
    email:{
        type:String,
        trim:true,
        required:'email is required',
        unique:true
    },
    password:{
        type:String,
        required:true,
        min:6,
        max:50,
    },

     razorpay_customer_id: {
      type: String,
      default: "",
    },

    walletBalance: {
    type: Number,
     default: 0
      },
   
    role: {
    type: String,
    enum: ["superadmin", "owner", "user"],   // 👈 three roles
    default: "user"
  },
},{timestamps:true})



module.exports =  mongoose.model('User',userschema)