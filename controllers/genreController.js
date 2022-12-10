const Book = require("../models/book");
const { body, validationResult } = require("express-validator");
const async = require("async");
const Genre = require("../models/genre");
const mongoose = require("mongoose");


// Display list of all Genre.
exports.genre_list = (req, res) => {
  Genre.find()
  .sort({ name: 1 })
  .exec(function(err, list_genres){
    if(err){
      debug(`List Error: ${err}`);
      return next(err)
    }
    // Succesful, so render:
    res.render('genre_list', {
      title: 'Genre List',
      genre_list: list_genres
    })
  })
};

// Display detail page for a specific Genre.
exports.genre_detail = (req, res, next) => {
  async.parallel(
    {
      genre(callback) {
        Genre.findById(req.params.id).exec(callback);
      },

      genre_books(callback) {
        Book.find({ genre: req.params.id }).exec(callback);
      },
    },
    (err, results) => {
      debug(`Detail Page Error: ${err}`);
      if (err) {
        return next(err);
      }
      if (results.genre == null) {
        // No results.
        const err = new Error("Genre not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render
      res.render("genre_detail", {
        title: "Genre Detail",
        genre: results.genre,
        genre_books: results.genre_books,
      });
    }
  );
};


// Display Genre create form on GET.
exports.genre_create_get = (req, res) => {
  res.render("genre_form", { title: 'Create Genre'})
};

// Handle Genre create on POST.
exports.genre_create_post = [
  // Validate and sanitize the name field.
  body('name', 'Genre name required').trim().isLength({ min: 1 }).escape(),
  // Process request after validation and sanitization.
  (req, res, next)=>{
    // Extract the validation errors from a request.
    const errors = validationResult(req);
    
    // Create a genre object with escaped and trimmed data.
    const genre = new Genre({name: req.body.name});

    if(!errors.isEmpty()){
      // There are error. Render the form again with the sanitized values/error message.
      res.render('genre_form', {
        title: 'Create Genre',
        genre,
        errors: errors.array()
      });
      return
    } else {
      // Data form is valid.
      // Check if Genre with same name exists.
      Genre.findOne({ name: req.body.name }).exec((err, found_genre)=>{
        if(err){
          debug(`Finding genre Error: ${err}`);
          return next(err)
        }

        if(found_genre){
          let correctUrlPath = '/catalog/genre/' + found_genre.url.split('/')[1]
          res.redirect(correctUrlPath);
        } else {
          genre.save((err) =>{
          if (err){
            debug(`Saving genre Error: ${err}`);
            return next(err)
          }
          // Genre saved. Redirect to genre detail page.
          res.redirect(genre.url)
          });
        }
      });
    }
  }
]

// Display Genre delete form on GET.
exports.genre_delete_get = (req, res, next) => {
  async.parallel(
    {
      genre(callback){
        Genre.findById(req.params.id).exec(callback);
      },
      books(callback){
        Book.find({ genre: req.params.id}).exec(callback);
      }
    },
    (err, results)=>{
      if(err){
        debug(`Delete GET Error: ${err}`);
        return next(err);
      }
      if(results.genre == null){
        // No results.
        res.redirect('/catalog/genres');
      }
      // Succesful, so render.
      res.render('genre_delete', {
        title: 'Delete Genre',
        genre: results.genre,
        genre_books: results.book
      });
    }
  )
};

// Handle Genre delete on POST.
exports.genre_delete_post = (req, res, next) => {
  async.parallel(
    {
      genre(callback){
        Genre.findById(req.body.genre).exec(callback)
      },
      genre_books(callback){
        Book.find({ genre: req.body.genre }).exec(callback);
      }
    },
    (err, results)=>{
      if(err){
        debug(`Delete POST Error: ${err}`);
        return next(err);
      }
      if (results.genre_books.length > 0){
        res.render('genre_delete', {
          title: 'Delete Genre',
          genre: results.genre,
          genre_books: results.genre_books
        });
        return
      }
      // Genre has no books. Delete object and redirect.
      Genre.findByIdAndRemove(req.body.genre, (err)=>{
        if(err){
          debug(`Removing genre Error: ${err}`);
          return next(err);
        }
        // Succesful- go to genre list.
        res.redirect('/catalog/genres');
      })
    }
  )
};

// Display Genre update form on GET.
exports.genre_update_get = (req, res, next) => {
  Book.findById(req.params.id, (err, genre)=>{
    if (err){
      debug(`Finding books Error: ${err}`);
      return next(err);
    }
    if (genre==null){
      // No results.
      let err = new Error("genre not found");
      err.status = 404;
      return next(err);
    }
    // Success. So render.
    res.render('genre_form', {
      title: 'Update genre',
      genre: genre
    });
  });
};

// Handle Genre update on POST.
exports.genre_update_post = [
  // Validate and sanitize fields.
  body("name", "Name must have at least 3 characters.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
    
  // Process request after validation and sanitization.
  (req, res, next)=>{
    
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a genre object with escaped and trimmed data.
    const genre = new Genre({
      name: req.body.name,
      _id: req.params.id
    });

    if (!errors.isEmpty()){
      // There are errors. Render the form again with the sanitized values and error message.
      res.render('genre_form', {
        title: 'Update Genre',
        genre: genre,
        errors: errors.array()
      });
      return
    } else {
      // The form is valid. Update record.
      Genre.findByIdAndUpdate(req.params.id, genre, {}, (err, thegenre)=>{
        if(err){
          debug(`Updating genre Error: ${err}`);
          return next(err);
        }
        // Success, so redirect to genre's detail.
        res.redirect(thegenre.url);
      })
    }
  }
]