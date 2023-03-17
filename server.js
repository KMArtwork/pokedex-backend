'use strict'

const mongoose = require('mongoose')
const express = require('express')
const cors = require('cors')
require('dotenv').config()
// add auth0 verify
const Team = require('./dbmodels/pkmnteam')

const app = express()
// middleware
app.use(cors())
app.use(express.json())
//app.use(*put created auth0 verify middleware here*)

const PORT = process.env.PORT || 3001;

mongoose.connect(process.env.DATABASE_URL);

app.post ('/teams', (request, response) => {
  
  console.log(request.body);
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

app.get('/teams', (request, reponse) => {
  console.log('get request received from client')
  response.status(200).send('request received')
})

app.listen(PORT, () => console.log(`pokedex server listening on ${PORT}`))