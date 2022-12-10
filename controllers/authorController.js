const async = require('async');
const Book = require('../models/book');
const Author = require('../models/author');
const debug = require('debug')('author');
const { body, validationResult } = require("express-validator");

// Display list of all Authors.
exports.author_list = function (req, res, next) {
  Author.find()
    .sort([["family_name", "ascending"]])
    .exec(function (err, list_authors) {
      if (err) {
        debug(`List Error: ${err}`)
        return next(err);
      }
      //Successful, so render
      res.render("author_list", {
        title: "Author List",
        author_list: list_authors
      });
    });
};


// Display detail page for a specific author:
exports.author_detail = (req, res, next)=>{
  async.parallel(
    {
      author(callback){
        Author.findById(req.params.id).exec(callback);
      },
      author_books(callback){
        Book.find({ author: req.params.id }, "title summary").exec(callback);
      }
    },
    (err, results)=>{
      if(err){
        // Error in API usage.
        debug(`Detail Page Error: ${err}`)
        return next(err)
      }
      if (results.author == null){
        // No results
        const err = new Error('No author found.');
        err.status = 404;
        return next(err);
      }
      // Succesful, so render:
      res.render('author_detail', {
        title: 'Author Detail',
        author: results.author,
        author_books: results.author_books
      });
    }
  )
};

// Display Author create form on GET:
exports.author_create_get = (req, res, next)=>{
  res.render('author_form', { title:'Create Author'});
};

// Handle Author create on POST.
exports.author_create_post = [
  body("first_name")
    .trim()
    .isLength({ min:1 })
    .escape()
    .withMessage('First name must be specified.')
    .isAlphanumeric()
    .withMessage('First name has non alpha-numeric characters.'),
  body('family_name')
    .trim()
    .isLength({ min:1 })
    .escape()
    .withMessage('Family name must be specified.'),
  body('date_of_birth', 'Invalid date of birth')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  body('date_of_death', 'Invalid date of death')
    .optional({checkFalsy: true})
    .escape()
    .isISO8601()
    .toDate(),
    // Process request after validation and sanitization.
    (req, res, next) =>{
      // Extract the validation errors from the request.
      const errors = validationResult(req);

      if (!errors.isEmpty()){
        // There are errors. Render form again with sanitized values/errors message.
        res.render('author_form', {
          title: 'Create Author',
          author: req.body,
          errors: errors.array()
        });
        return;
      }
      // Data form is valid.

      // Create an Author object with escaped and trimed data.
      const author = new Author({
        first_name: req.body.first_name,
        family_name: req.body.family_name,
        date_of_birth: req.body.date_of_birth,
        date_of_death: req.body.date_of_death
      });
      author.save((err)=>{
        if (err){
          debug(`Saving Author Error: ${err}`)
          return next(err)
        }
        res.redirect(author.url)
      });
    }
]

// Display Author delete form on GET.
exports.author_delete_get = (req, res, next) => {
  async.parallel(
    {
      author(callback){
        Author.findById(req.params.id).exec(callback);
      },
      author_books(callback){
        Book.find({ author:req.params.id }).exec(callback);
      }
    },
    (err, results)=>{
      if(err){
        debug(`Delete GET Error: ${err}`);
        return next(err);
      }
      if (results.author == null){
        // No results.
        res.redirect('/catalog/authors');
      }
      // Succesful so render.
      res.render('author_delete', {
        title: 'Delete Author',
        author: results.author,
        author_books: results.author_books
      });
    }
  );
};

// Handle Author delete on POST.
exports.author_delete_post = (req, res, next) => {
  async.parallel(
    {
      author(callback) {
        Author.findById(req.body.authorid).exec(callback);
      },
      author_books(callback) {
        Book.find({ author: req.body.authorid }).exec(callback);
      }
    },
    (err, results)=>{
      if(err){
        debug(`Delete POST Error: ${err}`)
        return next(err);
      }

      // Success.
      if (results.author_books.length > 0){
        // Author has books. Render in same way as GET route.
        res.render('author_delete', {
          title: 'Delete Author',
          author: results.author,
          authors_books: results.author_books,
        });
        return;
      }
      // Author has no books. Delete object and redirect to list of authors.
      Author.findByIdAndRemove(req.body.authorid, (err)=>{
        if (err){
          return next(err);
        }
        // Succesful- go to author list.
        res.redirect('/catalog/authors');
      })
    }
  )
};

// Display Author update form on GET.
exports.author_update_get = (req, res, next) => {
  Author.findById(req.params.id, (err, author)=>{
    if (err){
      debug(`Update Author GET Error: ${err}`)
      return next(err);
    }
    if (author == null){
      // No results.
      let err = new Error("Author not found");
      err.status = 404;
      return next(err);
    }
    // Success, so render.
    res.render('author_form', {
      title: 'Update author',
      author: author
    });
  });
};

// Handle Author update on POST.
exports.author_update_post = [
  // Validate and sanitize fields.
  body("first_name")
    .trim()
    .isLength( {min:1 })
    .escape()
    .withMessage("first name must not be empty")
    .isAlphanumeric()
    .withMessage("first name has non alphanumeric characters"),
  body("family_name")
  .trim()
  .isLength( {min:1 })
  .escape()
  .withMessage("family name must not be empty")
  .isAlphanumeric()
  .withMessage("family name has non alphanumeric characters"),
  body("date_of_birth", 'invalid date of birth')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  body("date_of_death", 'invalid date of death')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  // Process request after validation
   (req, res, next)=>{
    // Extract the errors from the request.
    const errors = validationResult(req);
    // create an Author object with the trimmed and escaped data.
    const author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
      _id: req.params.id
    });
    if (!errors.isEmpty()){
      // There are errors. Render the form again with the sanitized messages, and error values.
      res.render('author_form', {
        title: 'Update Author',
        author: author,
        errors: errors.array()
      }); 
      return
    } else {
      // The form is valid. Update the record.
      Author.findByIdAndUpdate(req.params.id, author, (err, theauthor)=>{
        if(err){
          debug(`Update Author POST Error: ${err}`);
          return next(err);
        }
        // Success, so redirect to the detail page.
        res.redirect(theauthor.url);
      });
    }
   }
];