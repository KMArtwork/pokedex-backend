'use strict';

const base64 = require('base-64');
const bcrypt = require('bcrypt');
const User = require('../models/users');

module.exports = async (request, response, next) => {
  if (!request.headers.authorization) {
    response.status(401).send('Request is missing authorization header');
  }

  let basic = request.headers.authorization.split(' ').pop();
  let [user, pass] = base64.decode(basic).split(':');

  User
    .findOne({
      username: user
    })
    .then(async (foundUser) => {
      const isValid = await bcrypt.compare(pass, foundUser.password);
      // console.log('FOUND USER BASIC AUTH: ', foundUser)
      if (isValid) {
        console.log(`${user} login success!`);
        request.user = foundUser; 
        next();
      } else {
        response.status(401).send('Invalid Username or Password')
      }
    })
    .catch(e => {
      response.status(401).send('Invalid Username or Password')
    })
}