const BookInstance = require("../models/bookinstance.js");
const Book = require("../models/book.js");
const { body, validationResult } = require("express-validator");
const bookinstance = require("../models/bookinstance.js");
const debug = require("debug")("bookinstance");
const async = require("async");

// Display list of all BookInstances.
exports.bookinstance_list = function (req, res, next) {
  BookInstance.find()
    .populate("book")
    .exec(function (err, list_bookinstances) {
      if (err) {
        debug(`List Error: ${err}`)
        return next(err);
      }
      // Successful, so render
      res.render("bookinstance_list", {
        title: "Book Instance List",
        bookinstance_list: list_bookinstances,
      });
    });
};


// Display detail page for a specific BookInstance.
exports.bookinstance_detail = (req, res, next) => {
  BookInstance.findById(req.params.id)
    .populate("book")
    .exec((err, bookinstance)=>{
      if (err){
        debug(`Detail Page Error: ${err}`);
        return next(err);
      }
      if (bookinstance == null){
        // No results.
        const err = new Error('Book copy not found');
        err.status = 404;
        return next(err);
      }
      // Succesful, so render:
      res.render('bookinstance_detail', {
        title: `Copy: ${bookinstance.book.title}`,
        bookinstance
      });
    });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = (req, res) => {
  Book.find({}, "title").exec((err, books)=>{
    if(err){
      debug(`Creation GET Error: ${err}`)
      return next(err);
    }
    // Succesful, so render.
    res.render('bookinstance_form', {
      title: 'Create Book Instance',
      book_list: books
    });
  });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  // Validate and sanitize fields.
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped and trimmed data.
    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values and error messages.
      Book.find({}, "title").exec(function (err, books) {
        if (err) {
          debug(`Rerending form Error: ${err}`)
          return next(err);
        }
        // Successful, so render.
        res.render("bookinstance_form", {
          title: "Create BookInstance",
          book_list: books,
          selected_book: bookinstance.book._id,
          errors: errors.array(),
          bookinstance,
        });
      });
      return;
    }

    // Data from form is valid.
    bookinstance.save((err) => {
      if (err) {
        debug(`Saving bookinstance Error: ${err}`);
        return next(err);
      }
      // Successful: redirect to new record.
      res.redirect(bookinstance.url);
    });
  },
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = (req, res, next) => {
  BookInstance.findById(req.params.id)
    .populate("book")
    .exec((err, bookinstance)=>{
      if(err){
        debug(`Delete GET Error: ${err}`);
        return next(err);
      }
      if(bookinstance == null){
        // No results.
        res.redirect('/catalog/bookinstances');
      }
      // Succesful, so render.
      res.render('bookinstance_delete', {
        title: 'Delete Book Instance',
        bookinstance: bookinstance
      });
    })
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = (req, res, next) => {
  // Assume valid id in field.
  BookInstance.findByIdAndRemove(req.body.id, function deleteBookInstance(err){
    if(err){
      debug(`Delete POST Error: ${err}`)
      return next(err);
    }
    // Succesful, so render.
    res.redirect('/catalog/bookinstances');
  })
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = (req, res) => {
  // Get book, authors and genres for form.
  async.parallel(
    {
      bookinstance(callback){
        BookInstance.findById(req.params.id).populate("book").exec(callback);
      },
      books(callback){
        Book.find(callback);
      }
    },
    (err, results)=>{
      if(err){
        debug(`bookinstance update GET Error: ${err}`);
        return next(err);
      }
      if (results.bookinstance == null ){
        // No results.
        let err = new Error("Book copy not found");
        err.status = 404;
        return next(err);
      };
      // Success.
      res.render('bookinstance_form', {
        title: 'Update Book Instance',
        book_list: results.books,
        selected_book: results.bookinstance.book._id,
        bookinstance: results.bookinstance
      });
    }
  )
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  // Validate and sanitize fields.
  body("book", "book must be specified").trim().isLength({ min:1 }).escape(),
  body("imprint", "imprint must be specified").trim().isLength({ min: 1 }).escape(),
  body("status").escape(),
  body("due_back", "invalid date").optional({checkFalsy: true}).isISO8601().toDate(),

  // Process request after validation and sanitization.
  (req, res, next)=>{
    // Extract the validation errors from the request.
    const errors = validationResult(req);
    
    // Create a book Instance with the same _id and updated properties
    let bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id
    });

    if (!errors.isEmpty()){
      // There are errors. Render the form again passing the sanitized values/ error values.
      Book.find({}, "title").exec( (err, books)=>{
        if(err){
          debug(`Book List Error: ${err}`);
          return next(err);
        }
        // Succesful- so render.
        res.render('bookinstance_form', {
          title: 'Book Instance Update',
          book_list: books,
          selected_book: bookinstance.book._id,
          errors: errors.array(),
          bookinstance: bookinstance
        });
      }); 
      return
    } else {
      // Data from form is valid
      BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, (err, thebookinstance)=>{
        if (err){
          debug(`bookinstance update POST Error: ${err}`);
          return next(err);
        }
        // Succesful- redirect to detail page.
        res.redirect(thebookinstance.url)
      })
    }
  }
]