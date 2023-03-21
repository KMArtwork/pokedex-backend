'use strict'

const mongoose = require('mongoose')

const teamSchema = new mongoose.Schema({
  teamName: String,
  pokemon: Array,
})

module.exports = mongoose.model('Team', teamSchema);