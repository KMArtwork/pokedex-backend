'use strict'

const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SECRET = process.env.SECRET;
const base64 = require('base-64');
const Team = require('./dbmodels/pkmnteam');
const User = require('./src/auth/models/users');
const basicAuth = require('./src/auth/middleware/basic.js');
const bearerAuth = require('./src/auth/middleware/bearer.js')
const cookieParser = require('cookie-parser');
const handle404 = require('./src/errorHandlers/404')
const handle500 = require('./src/errorHandlers/500')

const PORT = process.env.PORT || 3001;
const app = express()


// middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'https://kmdevsign-pokedex.netlify.app'],
  credentials: true
}));
app.use(express.json({limit: '5mb'}));
app.use(cookieParser());


mongoose.connect(process.env.DATABASE_URL);


app.post('/login', basicAuth, (request, response) => {
  const token = jwt.sign({username: request.user.username}, SECRET, {expiresIn: '1hr'});
  const user = {
    user: request.user,
    token: token
  }
  console.log('LOGIN TOKEN: ', token)
  response
    .cookie('pokeToken', token, {maxAge: 1 * 60 * 60 * 1000, httpOnly: true})
    .status(200)
    .json(user)
})

app.post('/signup', async (request, response) => {
  let [user, pass] = base64.decode(request.body.credentials).split(':')
  let userIsTaken;
  try{
    userIsTaken = await User.findOne({username: user});
  }
  catch(e){
    response.status(500).send(e)
  }

  if (userIsTaken){
    response.status(205).send('Username is taken')
  } 
  else {
    User
    .create({
      username: user,
      password: pass
    })
    .then(res => {
      console.log('SIGNUP SERVER RESPONSE: ', res)
      const token = jwt.sign({username: user}, SECRET, {expiresIn: '1hr'});
      const newUser = {
        user: user,
        token: token,
        _id: res._id
      }
      response.cookie('pokeToken', token, {maxAge: 1 * 60 * 60 * 1000, httpOnly: true});
      response.status(202).json(newUser);
    })
    .catch(err => {
      console.log(err);
      response.status(500).send(err)
    }) 
  }
})

app.post('/logout', (request, response) => {

})

// CREATE | adds a new team to the database
app.post ('/teams', bearerAuth, (request, response, next) => {
  
  console.log(`POST request received from trainer ${request.user.username} to /teams.\n Attempting to save team to database...\n`);

  if (request.body.length === 0) {
    response.status(406).send('Unable to save. Team must have at least 1 member')
  }
  else {
    Team
      .create(request.body)
      .then(res => {
        console.log('Team successfully saved to database!');
        response.status(202).send(res);
      })
      .catch(err => next(err))
  }
})

// READ | gets all relevant teams from database > when displayed on front end, user will choose which specific team to load/display
app.get('/teams', bearerAuth, (request, response) => {

  console.log(`GET request received from trainer ${request.user.username} to /teams. \n Attempting to fetch all of their saved teams...`)

  Team
    .find({trainer: request.user.username})
    .then(res => {
      let foundTeams = [];
      res.forEach(element => {
        let team = {
          id: element._id,
          teamName: element.teamName,
        };
        foundTeams.push(team);
      })
      console.log(`${request.user.username}'s teams were found! Sending back to client...`)
      response.status(200).json(foundTeams);
    })
    .catch(err => next(err))
})

// READ | this endpoint is hit when the user chooses which team to load in the client 
app.get('/team', bearerAuth, (request, response) => {

  console.log(`GET request received from trainer ${request.user.username} to /teams. \n Attempting to fetch team id: ${request.query.id}`)

  Team
    .findById(request.query.id)
    .then(res =>{
      console.log(`Team ID:${request.query.id} was found! Sending back to client...`)
      response.status(200).send(res)
    })
    .catch(err => next(err))

})

// UPDATE | updates pre-existing team that has been loaded/modified on the client
app.put('/teams/:id', bearerAuth, (request, response) => {
  console.log(`PUT request received from trainer ${request.user.username} to /teams. \n Attempting to update team id: ${request.params.id}`)

  console.log(request.body)

  Team
    .findByIdAndUpdate(request.params.id, request.body, {new: true})
    .then(res => {
      console.log(`Team ID:${request.params.id} was successfully updated!`)
      response.status(202).send(res)
    })
    .catch(err => next(err))
})

// DELETE | removes a team from the database using the id
app.delete('/teams/:id', bearerAuth, (request, response) => {
  console.log(`DELETE request received from trainer ${request.user.username} to /teams. \n Attempting to delete team id: ${request.params.id}\n`)

  Team
    .findByIdAndDelete(request.params.id)
    .then(res => {
      console.log('Team was successfully deleted!')
      response.status(200).send('Team was successfully deleted!')
    })
    .catch(err => next(err))
})

app.use('*', handle404)
app.use(handle500)

app.listen(PORT, () => console.log(`pokedex server listening on ${PORT}`))