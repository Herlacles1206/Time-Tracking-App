var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const imageSchema = new mongoose.Schema({
    data: Buffer,
    contentType: String,
    userid: Schema.ObjectId
  });
  
const Image = mongoose.model('image', imageSchema);
  
module.exports = Image;