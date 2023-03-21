'use strict'

const mongoose = require('mongoose')
const express = require('express')
const cors = require('cors')
require('dotenv').config()
// add auth0 verify
const Team = require('./dbmodels/pkmnteam')
const { findByIdAndUpdate } = require('./dbmodels/pkmnteam')
const { response } = require('express')

const app = express()
// middleware
app.use(cors())
app.use(express.json())
//app.use(*put created auth0 verify middleware here*)

const PORT = process.env.PORT || 3001;

mongoose.connect(process.env.DATABASE_URL);


// CREATE | adds a new team to the database
app.post ('/teams', (request, response) => {
  
  console.log('post request received from client | save team to database');

  if (request.body.length === 0) {
    response.status(406).send('Team must have at least 1 member')
  }
  else {
    Team
      .create(request.body)
      .then(res => {
        console.log('pokemon team successfully created and added to database');
        response.status(202).send(res);
      })
      .catch(err => response.status(500).send(`${err} | Could not save team to database`))
  }


})

// READ | gets all relevant teams from database > when displayed on front end, user will choose which specific team to load/display
app.get('/teams', (request, response) => {

  console.log('get request received from client | get all teams for user')

  Team
    // once Authentication is added, will need to filter by userID
    .find()
    .then(res => {
      let teamIds = [];
      res.forEach(element => {
        let team = {
          id: element._id,
          teamName: element.teamName,
        };
        teamIds.push(team);
      })
      console.log(teamIds);
      response.status(200).send(teamIds);
    })
    .catch(err => {
      console.log('error querying database')
      response.send(500).send(err);
    })
})

// READ | this endpoint is hit when the user chooses which team to load in the client 
app.get('/team', (request, response) => {

  console.log('get request received from client | load team to client')
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

app.listen(PORT, () => console.log(`pokedex server listening on ${PORT}`))