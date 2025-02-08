const jwt = require('jsonwebtoken');

const User = require('../models/user');
async function auth(req, res, next) {
  try {
    const tokenByUser = req.cookies?.token;
    if (!tokenByUser) {
      throw new Error('Token Not Found');
    }
    const userid = await jwt.verify(tokenByUser, process.env.SECRET);
    const user = await User.findById(userid);
    if (!user) {
      throw new Error('login with google');
    } else if (!user.userName) {
      const token = await user.getJWT();
      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'None', 
  maxAge: 365 * 24 * 60 * 60 * 1000, 
      });
      res.redirect(
        `/markethealers/auth/newUserInfo?fullname=${user.fullName}&email=${user.email}&platform=${user.platform}&profileUrl=${user.profileUrl}`
      );
    } else {
      req.user = user;
      const token = await user.getJWT();
      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'None', 
  maxAge: 365 * 24 * 60 * 60 * 1000, 
      });
      next();
    }
  } catch (err) {
    res.redirect(`/markethealers/auth/userAuth`);
  }
}

async function tempAuth(req, res, next) {
  try {
    const tokenByUser = req.cookies?.token;

    if (!tokenByUser) {
      throw new Error('Token Not Found');
    }
    const userid = await jwt.verify(
      tokenByUser,
      process.env.SECRET,
      (err, decoded) => {
        if (err) {
          throw new Error('Token verification failed');
        }
        return decoded;
      }
    );

    const user = await User.findById(userid);

    if (!user) {
      throw new Error('Login with  Google');
    }

    req.user = user;
    req.user = user;
    const token = await user.getJWT();
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'None', 
  maxAge: 365 * 24 * 60 * 60 * 1000, 
    });
    next();
  } catch (err) {
    return res.redirect(`/markethealers/auth/userAuth`);
  }
}

module.exports = { auth, tempAuth };
