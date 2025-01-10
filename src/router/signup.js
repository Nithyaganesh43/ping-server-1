// D:\projects\markethealers\markethealers\server-side\src\router\signup.js
const signup = require("express").Router();    
const passport = require("passport");   
const User = require("../models/user");  
const GoogleStrategy = require("passport-google-oauth20").Strategy; 
const {auth , tempAuth }= require("../middlewares/loginAuth");
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;  
const FRONT_END_URL = process.env.FRONT_END_URL;
 
const mail = require("../helper/mail");
const validateUserInfromations = require("../helper/validateUserInfromations");
const jwt = require("jsonwebtoken"); 

signup.use(passport.initialize()); 
   
   
 

//GoogleStrategy 
passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL:
        'https://server.markethealers.com/markethealers/auth/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      const userData = {
        fullName: `${profile.name.givenName} ${
          profile.name.familyName != undefined ? profile.name.familyName : ''
        }`,
        email: profile.emails[0].value,
        profileUrl: profile.photos[0].value,
        platform: 'google',
      };
      done(null, userData);
    }
  )
);

///auth/google
signup.get(
  "/markethealers/auth/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

//auth/google/callback
signup.get(
  "/markethealers/auth/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/markethealers/auth/", session: false }), 
   async (req, res) => {  
    try{
    const userData = req.user; 
    const user = await User.findOne({email:userData.email,platform:userData.platform});
   
if(user){   
  const token = await user.getJWT();
res.cookie('token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'None',
}); 
res.redirect(`/markethealers/auth/home`); 
}else{  
const newUser = new User(userData); 
await newUser.save();
  const token = await newUser.getJWT();
  res.cookie('token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
  });
res.redirect(`/markethealers/auth/newUserInfo?fullname=${userData.fullName}&email=${userData.email}&platform=${userData.platform}&profileUrl=${userData.profileUrl}`); 
}
 
  }catch(err){
    res.redirect(`/markethealers/auth/userAuth?error=${err}`);
  } 
}
);

//this is the api which is called to check the otp is correct we store the otp in client machine as jwt token and
// verify the otp provided by the user and the jwt is same. if both the otp are same we create a user in db 
//and send a temp-token for new user information page new user cannot created without giving user informations
signup.post("/markethealers/auth/auth/markethealers/verifyotp",async (req,res)=>{
try{
  let {token} = req.cookies;
  let {otp}=req.body;
   
    if(!otp){
      throw new Error("otp not found");
    }
    if(otp.length!=6)
    {
      throw new Error("Invalid otp")
    } 
  const bothAreSame = await jwt.verify(token,process.env.SECRET);
 
  if(bothAreSame.jwtOTP!=otp){
throw new Error("Invalid OTP");
  }
   
const userData = {
  email : bothAreSame.email,
  platform: "markethealers", 
  profileUrl : "https://res.cloudinary.com/dmini3yl9/image/upload/v1730714916/di75th4l9fqebilewtur.avif",

}
 
  const newUser = new User(userData);
   token = await newUser.getJWT();
   //console.log("token send"); 

res.cookie('token', token, { 
  httpOnly: true, 
  secure: true, 
  sameSite: 'None' 
});


  await newUser.save(); 
  res.send({status : " success" , message : "SignUp successfull"});
  }catch(err){
    res.status(400).send({ status: "failed", message: err.message });

  }
})   

//this is the api with takes email and imput and validats it and send a otp to that email and saves the otp in the clients machine 
//as jwt token for verification purpose seen in above api
//auth/markethealers
signup.post("/markethealers/auth/auth/markethealers",async (req,res)=>{
  try{ 
    let { email } = req.body;
    if(!email){
      throw new Error("Email not found"); 
    }
    if(!isEmail(email))
    {
      throw new Error("Invalid Email")
    }
      email=email.trim().toLowerCase();
  
  
    const user = await User.findOne({email:email,platform:"markethealers"});
    if(user){
       throw new Error("Email Already Registred");
    }

    function generateOTP() {
      return Math.floor(100000 + Math.random() * 900000);
  }

  let otp = generateOTP();
  await mail( otp,email);
  let jwtOTP = await jwt.sign({ jwtOTP: otp , email: email }, process.env.SECRET, { expiresIn: '10m' }); 
 
    res.cookie('token', jwtOTP, {
      httpOnly: true, 
      secure: true, 
      sameSite: 'None' 
    });
    res.send({  message : "otp send" });
 
  }catch(err){
    
    res.status(400).send({  message: err.message });
  }
}) 

//after the new user giving the information validation takes place then we are updating the user data
 
 
signup.post("/markethealers/auth/signupSuccessful", tempAuth, async (req, res) => { 
  try{     
    
    let {fullName, userName , password  ,platform , email}= req.body;
 const user = req.user; 
    if(!user){
      throw new Error("user  Not Found...");
    }  

    await validateUserInfromations(fullName , userName , password , platform , email );  
   

  if(user){
    if(user.fullName && user.passport && user.userName){
      throw new Error("Already registed the informations");
    }
 
    const updatedStatus = await User.findByIdAndUpdate(user._id,{fullName:fullName, userName:userName , password:password});
    if (!updatedStatus) {
      throw new Error("User not found or update failed.");
  }

    
    let token = await user.getJWT();
res.cookie("token",token, { 
  httpOnly: true, 
  secure: true, 
  sameSite: 'None' 
});
    res.send({message:"successfully user registred"   });
   
}
else{
  throw new Error("User not found ");
}
}catch(err){
  //console.log(err);
  res.status(400).send({message : err.message});
}}); 

//this api works for login is the user gives correct username and password it gives jwt else it say 404
signup.post("/markethealers/auth/userLogedIn", async (req, res) => { 
  try{ 
    let {userName,password}= req.body; 
    if(!userName){
      throw new Error("User Name Not found");
    }else if(!password){
      throw new Error("Password Not found");
    }else{
     
  const user = await User.findOne( {userName:userName} );
  if(user && password==user.password){

    let token = await user.getJWT();
    res.cookie("token",token, { 
      httpOnly: true, 
      secure: true, 
      sameSite: 'None' 
    });
    res.send({message:"successfully user registred"});
  }else{
     
    throw new Error("Login Failed");
  }
    }
   
}catch(err){
  
  res.status(404).send({message : err.message});
}
});

//forgotPasswordVerifyOtp-works only for markethealers authentication same as that markethealers/auth
signup.post("/markethealers/auth/forgotPasswordVerifyOtp",async (req,res)=>
  {
  try{
    let {token} = req.cookies;
    let {otp,email}=req.body; 
      if(!otp){
        throw new Error("otp not found");
      }
      if(otp.length!=6)
      {
        throw new Error("Invalid otp")
      } 
      
      email=email.trim().toLowerCase();
    const bothAreSame =  jwt.verify(token,process.env.SECRET);
   
    if(bothAreSame.jwtOTP!=otp){
  throw new Error("Invalid OTP");
    }
    const user = await User.findOne({email:email , platform :"markethealers"});
     
    if(!user){
      throw new Error("User Not found");
    }
     token = await user.getJWT();
     res.cookie("token",token, { 
      httpOnly: true, 
      secure: true, 
      sameSite: 'None' 
    });
    res.send({status : " success" , message : "SignUp successfull"});
    }catch(err){
      res.status(400).send({ status: "failed", message: err.message });
  
    }
  })    

//forgotPasswordGetOtp- same as markethealers/auth/verifyotp api
signup.post("/markethealers/auth/forgotPasswordGetOtp",async (req,res)=>{
    try{ 
      let { email } = req.body;
      if(!email){
        throw new Error("Email not found");
      }
      if(!isEmail(email))
      {
        throw new Error("Invalid Email")
      } 
      
      email=email.trim().toLowerCase();
      const user = await User.findOne({email:email,platform:"markethealers"});
      
    if(!user){
      throw new Error(`${email} ${user} not found`);
    }
  
      function generateOTP() {
        return Math.floor(100000 + Math.random() * 900000);
    }
  
    let otp = generateOTP();
    await mail( otp,email);
    let jwtOTP = await jwt.sign({ jwtOTP: otp , email: email }, process.env.SECRET, { expiresIn: '10m' }); 
   
      res.cookie('token', jwtOTP, {
        httpOnly: true, 
        secure: true, 
        sameSite: 'None' 
      });
      res.send({  message : "otp send" });
   
    }
catch(err){
      
      res.status(400).send({  message: err.message });
    }
})
  
// on successfully validated the forgotpasswored api this api used to reset the password by updating it 
signup.post("/markethealers/auth/resetPassword",auth, async (req, res) => { 
  
  try{ 
    let { password}= req.body;
     if(!password){
      throw new Error("Password Not found");
    }else{
       
  const user = req.user;
 
  if(user){ 
    const updatedStatus = await User.findByIdAndUpdate(user._id,{ password:password} , {runValidators : true});
    if (!updatedStatus) {
      throw new Error("User not found or update failed.");
  }

     
    res.send({message:"successfully user password reseted"});
  }else{
    throw new Error("User Not found");
  }
    }
   
}catch(err){
  
  res.status(400).send({message : err.message});
}
});

                                    
  
signup.get(`/markethealers/auth/logout`, async (req, res) => { 
  res.cookie('token',"", { 
    httpOnly: true, 
    secure: true, 
    sameSite: 'None' 
  });
  res.send("logout");
});

//api which is called by client for  authentication it just redirects the user to auth page
signup.get("/markethealers/auth/userAuth",(req,res)=>{
  res.setHeader('Access-Control-Allow-Origin', `${FRONT_END_URL}`);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
 
  res.redirect(`${FRONT_END_URL}/src/AuthPage/authIndex.html`); 
  
})

//is the user is a new user he/she must give the information about them to create a new account here and 
//user need to be authorized to use this api
signup.get("/markethealers/auth/newUserInfo",tempAuth,async (req, res) => {
  const { fullname, email, platform, profileUrl } = req.query;  
  const jwt =await req.user.getJWT();
  
res.cookie('token',jwt, {
  httpOnly: true, 
  secure: true, 
  sameSite: 'None' 
  }); 

  if(req.user.password && req.user.userName){
    res.redirect(`/markethealers/auth/home`);
  }

  res.redirect(`${FRONT_END_URL}/src/AuthPage/newUserInfo.html?fullname=${fullname}&email=${email}&platform=${platform}&profileUrl=${profileUrl}`);
});

//redirect user to login page
signup.get("/markethealers/auth/login", (req, res) => {
  res.redirect(`${FRONT_END_URL}/src/AuthPage/login.html`); 
   
});

//redirect user to signup page
signup.get("/markethealers/auth/signup", (req, res) => {
  res.redirect(`${FRONT_END_URL}/src/AuthPage/signup.html`); 
    
});
//redirect user to forgotpassword page
signup.get("/markethealers/auth/forgotPassword", (req, res) => { 
   res.redirect(`${FRONT_END_URL}/src/AuthPage/forgotPassword.html`); 
     
});
  
 
//redirect user to home oage if and only the user is authorized
signup.get('/markethealers/auth/home', auth, async (req, res) => { 
  
  res.redirect(`${FRONT_END_URL}/src/homePage/home.html?id=${req.user._id}`);
});

   

signup.get('/markethealers/auth/getUserInfo', async (req, res) => {
  try {
    const id = req.query.id;  

    if (!isValidObjectId(id)) {
      throw new Error('Invalid User ID');
    }

    const user = await User.findById(id);
    if (!user) {
      throw new Error('User Not Found');
    }

    res.send(user);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});
signup.get('/markethealers/auth', auth, (req, res) => {
  res.redirect('/markethealers/auth/home');
});

function isEmail(str) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(str);
}
 
module.exports = signup;
