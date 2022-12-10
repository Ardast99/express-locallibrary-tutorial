const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// The Schema:
const GenreSchema = new Schema({
  name: { type: String, required: true, minLength: 3, maxLength: 100 }
});
// the genre's virtual url:
GenreSchema.virtual('url').get(function(){
  return `/catalog/genre/${this._id}`;
})
module.exports = mongoose.model("Genre", GenreSchema);