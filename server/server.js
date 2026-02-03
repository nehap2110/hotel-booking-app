const express = require('express');
//import express from "express";

//import all routes at once using files system fs 
//const {readdirSync}= require('fs'); //by default present in node
require('dotenv').config();
const morgan  = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

//db connection
mongoose.connect(process.env.DATABASE)
.then(()=>console.log("DB connected"))
.catch((err)=>console.log("db connection error",err));

//middleware
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));



//all routes 
app.use('/api',require('./routes/auth'))
app.use('/api',require('./routes/hotel'));
app.use("/api", require('./routes/payment'));
app.use('/api',require('./routes/booking'));
app.use('/api',require('./routes/owner'));
app.use('/api',require('./routes/admin'));

//readdirSync('./routes').map((r)=>app.use('/api',require(`./routes/${r}`)));

//app is listen on port
app.listen(process.env.PORT || 8000,()=>{
    console.log(`server is running on port 8000`);
})