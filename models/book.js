const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// The Schema:
const BookSchema = new Schema({
  title: { type:String, required: true },
  author: { type:Schema.Types.ObjectId, ref: "Author", required: true },
  summary: { type:String, required: true },
  isbn: { type:String, required: true },
  genre: [{type:Schema.Types.ObjectId, ref:"Genre"}],
});
// Note: genre value is an array because the book 
// can refer to more than one genre model objects.

// virtual for book's url:
BookSchema.virtual("url").get(function(){
  return `/catalog/book/${this._id}`
})
// And export:
module.exports = mongoose.model('Book', BookSchema);