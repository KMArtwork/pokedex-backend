'use strict';

const base64 = require('base-64');
const bcrypt = require('bcrypt');
const User = require('../models/users');
const jwt = require('jsonwebtoken')
const SECRET = process.env.SECRET;

module.exports = async (req, res, next) => {
  if (!req.cookies.pokeToken) {
    console.log('BEARER AUTH REQUEST: ', req)
    next('No token found');
  } else {
    let token = req.cookies.pokeToken;
    try{
      const parsedToken = jwt.verify(token, SECRET);
      const foundUser = await User.findOne({username: parsedToken.username});
      if(foundUser){
        req.user = foundUser;
        next();
      }
    } 
    catch(e) {
      console.log('BEARER MIDDLEWARE ERROR')
      next(e)
    }    
  }


}