'use strict'

const mongoose = require('mongoose')

const teamSchema = new mongoose.Schema({
  teamName: String,
  slot1: Object,
  slot2: Object,
  slot3: Object,
  slot4: Object,
  slot5: Object,
  slot6: Object
})

module.exports = mongoose.model('Team', teamSchema);