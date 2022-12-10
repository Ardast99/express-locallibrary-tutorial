const { DateTime } = require('luxon');
const { default: mongoose } = require('mongoose');
const moongose = require('mongoose');

const Schema = moongose.Schema;

// The Schema:
const AuthorSchema = new Schema({
  first_name: { type:String, required: true, maxLength: 100 },
  family_name: { type:String, required: true, maxLength: 100},
  date_of_birth:{ type: Date },
  date_of_death:{ type: Date },
})

// virtual for author's full name:
AuthorSchema.virtual("name").get(function(){
  // To avoid errors in cases where an author does not have either a family name or first name
  // We want to make sure we handle the exception by returning an empty string for that case.
  let fullname = '';
  if(this.first_name && this.family_name){
    fullname = `${this.family_name}, ${this.first_name}`;
  }
  if(!this.first_name || !this.family_name){
    fullname = '';
  }
  return fullname
})
// Virtual for author's URL:
AuthorSchema.virtual('url').get(function(){
  // The arrow function aren't used because we need: this.
  return `/catalog/author/${this._id}`;
})
// Virtual for author's date of birth:
AuthorSchema.virtual('date_of_birth_formatted').get(function(){
  return this.date_of_birth ?
  DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED) : '';
})
// Virtual for author's date of birth:
AuthorSchema.virtual('date_of_death_formatted').get(function(){
  return this.date_of_death ?
  DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_MED) : '';
})
// Virtual for author's lifespan:
AuthorSchema.virtual('lifespan').get(function(){
  let lifespan_string = '';
  if (this.date_of_birth){
    lifespan_string = DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED)
    
  }
  if (this.date_of_death){
    if(lifespan_string !== ''){
      lifespan_string += ' - ';
    } 
    lifespan_string += DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_MED)
  }
  return lifespan_string
})
// Virtuals are properties that don't exist in the database, they only exist for the user use.

// And export:
module.exports = mongoose.model('Author', AuthorSchema);