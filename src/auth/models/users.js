const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const SECRET = process.env.SECRET
const SALT = parseInt(process.env.SALT) 

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true
  }
});

userSchema.pre('save', async function(next) {
  let hashedPassword = await bcrypt.hash(this.password, SALT);
  this.password = hashedPassword;
  // next();
})

userSchema.pre('findOne', async function(next) {
  // console.log(this.schema.paths.password, this.schema.tree.password )
  // const user = await bcrypt.compare()
})

module.exports = mongoose.model('User', userSchema)