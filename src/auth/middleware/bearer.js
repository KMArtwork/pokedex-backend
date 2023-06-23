'use strict';

const { accessCookieConfig, refreshCookieConfig } = require('../../configs/cookies');
const { accessTokenConfig, refreshTokenConfig } = require('../../configs/tokens');
const User = require('../models/users');
const jwt = require('jsonwebtoken')
const SECRET = process.env.SECRET;

module.exports = async (req, res, next) => {
  console.log('COOKIE TOKENS: ', req.cookies)
  if (!req.cookies.pokeToken && !req.cookies.pokeRefresh) {
    // console.log('BEARER AUTH REQUEST: ', req)
    next('No Access Token found');
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
      if (e.message === 'jwt expired'){
        let refresh = req.cookies.pokeRefresh;
        console.log('Access Token expired, attempting to refresh token...')
        try{
          const parsedRefresh = jwt.verify(refresh, SECRET);
          const newToken = jwt.sign({username: parsedRefresh.username}, SECRET, accessTokenConfig);
          const newRefresh = jwt.sign({username: parsedRefresh.username}, SECRET, refreshTokenConfig);
          const foundUser = await User.findOne({username: parsedRefresh.username});
          if(foundUser){
            req.user = foundUser;
            res
              .cookie('pokeToken', newToken, accessCookieConfig)
              .cookie('pokeRefresh', newRefresh, refreshCookieConfig);
            console.log(`${parsedRefresh.username}'s tokens successfully refreshed!`)
            next();
          }
        }
        catch(err){
          console.log('REFRESH TOKEN ERROR')
          next(err)
        }
      } else if(e.message !== 'jwt expired') {
        console.log('BEARER MIDDLEWARE ERROR')
        next(e)
      }
    }    
  }


}