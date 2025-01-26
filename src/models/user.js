const mongoose = require("mongoose");

const jwt = require("jsonwebtoken"); 

const userSchema = mongoose.Schema({
  platform: {
    type: String,
    required: [true, 'Platform is required.'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required.'],
    trim: true,
    lowercase: true,
    validate: {
      validator: isEmail,
      message: 'Invalid email format.',
    },
  },
  userName: {
    type: String,
    trim: true,
  },
  password: {
    type: String,
  },
  fullName: {
    type: String,
    trim: true,
  },
  profileUrl: {
    type: String,
    trim: true,
     
  },
});
 

userSchema.methods.getJWT = async function getJWT() { 
         
let token = await jwt.sign({_id : this._id},process.env.SECRET,{expiresIn : '12h'});
 
return token;
 } 



 function isEmail(str) {
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   return emailRegex.test(str);
 }
module.exports = mongoose.model(`user`,userSchema);