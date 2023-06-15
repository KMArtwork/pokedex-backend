'use strict'

const mongoose = require('mongoose')

const teamSchema = new mongoose.Schema({
  teamName: String,
  pokemon: Array,
  trainer: String,
})

module.exports = mongoose.model('Team', teamSchema);