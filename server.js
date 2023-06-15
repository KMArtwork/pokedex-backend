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
  origin: ['http://localhost:3000', 'http://localhost:3001'],
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

app.post('/signup', (request, response) => {
  let [user, pass] = base64.decode(request.body.credentials).split(':')

  User
    .create({
      username: user,
      password: pass
    })
    .then(res => {
      const token = jwt.sign({username: user}, SECRET, {expiresIn: '1hr'});
      const newUser = {
        user: user,
        token: token
      }
      response.cookie('pokeToken', token, {maxAge: 1 * 60 * 60 * 1000, httpOnly: true});
      response.status(202).json(newUser);
    })
    .catch(err => {
      console.log(err);
      response.status(500).send(err)
    })
})

app.post('/logout', (request, response) => {

})

// CREATE | adds a new team to the database
app.post ('/teams', bearerAuth, (request, response, next) => {
  
  console.log('POST request received from client, attempting to save team to database...\n');

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

  console.log('get request received from client | userId: xxx | attempting to get all teams of user')

  Team
    // once Authentication is added, will need to filter by userID
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
      console.log('TRAINER TEAMS: ', foundTeams);
      response.status(200).json(foundTeams);
    })
    .catch(err => {
      console.log('error querying database')
      response.send(500).send(err);
    })
})

// READ | this endpoint is hit when the user chooses which team to load in the client 
app.get('/team', (request, response) => {

  console.log('get request received from client | userId: xxx | attempting to load team to client')
  console.log(request.query.id);

  Team
    .findById(request.query.id)
    .then(res =>{
      response.status(200).send(res)
    })
    .catch(err => {
      console.log('error loading team from database')
      response.send(500).send(err)
    })

})

// UPDATE | updates pre-existing team that has been loaded/modified on the client
app.put('/teams/:id', (request, response) => {
  console.log('put request received from client | userId: xxx | attempting to update a team in the database')

  Team
    .findByIdAndUpdate(request.body.id, request.body, {new: true})
    .then(res => {
      console.log(`successfully updated pokemon team, db-id: ${request.body.id}`)
      response.status(202).send(res)
    })
    .catch(err => {
      console.log('error updating team')
      response.status(404).send(`${err} | Unable to update team`)
    })
})

// DELETE | removes a team from the database using the id
app.delete('/teams/:id', (request, response) => {
  console.log('delete request received from client | userId: xxx | attempting to delete team from database')

  Team
    .findByIdAndDelete(request.params.id)
    .then(res => {
      console.log('successfully deleted team')
      response.status(200).send('team sucessfully deleted')
    })
    .catch(err => {
      console.log('unable to delete team from database')
      response.send(500).send(err)
    })
})

app.use('*', handle404)
app.use(handle500)

app.listen(PORT, () => console.log(`pokedex server listening on ${PORT}`))