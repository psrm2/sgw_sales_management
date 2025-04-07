const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const defaultFares = {
  '一般宅配': 170,
  '代引き': 190,
  '着払い&クール': 190,
  '指定場所': 150,
  '160S': 300,
  '170S': 400,
  '180S': 500,
  '200S': 600,
  '集荷': 100,
  '商業': 100,
  'メール便': 40
};

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'user' },
  fares: { type: Object, default: defaultFares }
});

UserSchema.methods.verifyPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

UserSchema.pre('save', function(next) {
  if (!this.isModified('password')) return next();
  this.password = bcrypt.hashSync(this.password, 10);
  next();
});

module.exports = mongoose.model('User', UserSchema);
