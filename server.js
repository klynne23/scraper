var express = require("express");
var logger = require("morgan");
var exphbs = require('express-handlebars');
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

//setting up handlebars middleware
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI);

// Routes

// after scraping send all the article data to the index handlebars
app.get("/", function(req, res){
    db.Article.find({}).then(function(articles){
        res.render("index", {articles: articles})
        // res.json(articles);
    })
})

/* SCRAPING IS NOT REALLY WORKING WITH MY BRAIN  */
/* THIS CODE WAS TAKEN FROM THE SOLVED SCRAPING THE MONGOOSE ACTIVITY 
BC I AM TRYING TO FOCUS ON THE REST OF THE APP */

// A GET route for scraping the echoJS website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with axios
  axios.get("http://www.echojs.com/").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $("article h2").each(function(i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");

      // Create a new Article using the `result` object built from scraping
      db.Article.create(result)
        .then(function(dbArticle) {
          // View the added result in the console
          console.log(dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, log it
          console.log(err);
        });
    });

    // Send a message to the client
    res.send("Scrape Complete");
  });
});

/* ROUTES FOR THE ARTICLES */

// THIS ROUTE WOULD UPDATE THE ARTICLES BOOLEAN VALUE OF SAVED TO TRUE
// app.get("/saved/:id", function (req, res){
//     db.Article.update({_id:req.params.id}, {saved:true})
//     .then(function(data){
//         res.json(data);
//     })
// })


// THIS ROUTE WOULD FIND ALL ARTICLES AND SEND TO THE SAVEDARTCILES HANDLEBARS
// app.get("/savedArticles", function(req, res){
//     db.Article.find({})
//     .then(function(data){
//         res.render("savedArticles", {articles:data})
//     })
// })


// THIS ROUTE WOULD REMOVE AN ARTICLE AFTER IT WAS SAVED
// app.delete("/removeArticle/:id", function(req, res){
//     db.Article.remove({_id:req.params.id})
//     .then(function(data){
//         res.json(data);
//     })
// })


/* ROUTES FOR THE NOTES */

// THIS ROUTE CREATES A NEW NOTE
// app.post("/newNote/:id", function(req, res){
//     var note = {
//         title: req.body.title,
//         body: req.body.body
//     };

//     db.Note.create(note)
//     .then(function(data){
//         db.Article.findOneAndUpdate({_id:req.params.id}, {$push: {notes: data._id}}, {new:true})
//         .then(function(data){
//             res.json(data);
//         })
//     })
// })

// THIS ROUTE GETS ALL NOTES FOR ONE ARTICLE
// app.get("/articleNotes/:id", function(req, res){
//     db.Article.findOne({_id:req.params.id})
//     .populate("note").then(function(data){
//         res.json(data);
//     })
// })

// THIS ROUTE RETURNS ONE NOTE
// app.get("/oneNote/:id", function(req, res){
//     db.Note.findOne({_id:req.params.id})
//     .then(function(data){
//         res.json(data);
//     })
// })

// THIS ROUTE WILL DELETE A NOTE
// app.post("/deleteNote", function(req, res){
//     db.Note.remove({_id:req.body.noteId})
//     .then(function(data){
//         res.json(data);
//     })
// })

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
