'use strict';

const base64 = require('base-64');
const bcrypt = require('bcrypt');
const User = require('../models/users');
const jwt = require('jsonwebtoken')
const SECRET = process.env.SECRET;

module.exports = async (req, res, next) => {
  if (!req.headers.authorization) {
    res.status(401).send('Request is missing authorization header');
  }
  let token = req.cookies.pokeToken;

  try{
    const parsedToken = jwt.verify(token, SECRET);
    const foundUser = await User.findOne({username: parsedToken.username});
    if(foundUser){
      req.user = foundUser;
      next();
    } else {
      res.status(401).send('Invalid Token')
    }
  } 
  catch(e) {
    res.status(401).send('Unable to authenticate token', e)
  }

}