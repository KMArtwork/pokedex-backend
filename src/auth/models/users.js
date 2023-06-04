const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const SECRET = process.env.SECRET 

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true
  }
});

userSchema.pre('save', async function(next) {
  let hashedPassword = await bcrypt.hash(this.password, 10);
  this.password = hashedPassword;
  // next();
})

userSchema.pre('findOne', async function(next) {

})

module.exports = mongoose.model('User', userSchema)