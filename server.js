const express = require('express')
const logger = require('morgan')
const mongoose = require('mongoose')
const axios = require('axios')
const cheerio = require('cheerio')

// Require all models
const db = require('./models')

const PORT = 8080

// Initialize Express
const app = express()

// Configure middleware

// Use morgan logger for logging requests
app.use(logger('dev'))
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
// Make public a static folder
app.use(express.static('public'))

// Connect to the Mongo DB
mongoose.connect('mongodb://localhost/newScraperDB', {
	useNewUrlParser: true,
	useUnifiedTopology: true
})

// Routes

// A GET route for scraping the echoJS website
app.get('/scrape', (req, res) => {
	// First, we grab the body of the html with axios
	axios.get('https://www.nytimes.com/section/world').then(response => {
		// Then, we load that into cheerio and save it to $ for a shorthand selector
		let $ = cheerio.load(response.data)

		// Now, we grab every h2 within an article tag, and do the following:
		$('div.css-1l4spti').each(function(i, element) {
			// Save an empty result object
			let result = {}
			// Add the text and href of every link, and save them as properties of the result object
			result.title = $(this)
				.find('h2')
				.text()
				.trim()
			result.summary = $(this)
				.find('p.css-1echdzn.e1xfvim31')
				.text()
				.trim()
			result.author = $(this)
				.find('p.css-1xonkmu')
				.text()
				.trim()
			result.link = $(this)
				.find('a')
				.attr('href')

			// Create a new Article using the `result` object built from scraping
			db.Article.create(result)
				.then(dbArticle => res.json(dbArticle))
				.catch(err => console.log(err))
		})

		// Send a message to the client
		res.send('Scrape Complete')
	})
})

// Route for getting all Articles from the db
app.get('/articles', (req, res) =>
	// Grab every document in the Articles collection
	db.Article.find({})
		.then(dbArticle => res.json(dbArticle))
		.catch(err => console.log(err))
)

// Route for grabbing a specific Article by id, populate it with it's note
app.get('/articles/:id', (req, res) => {
	// Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
	db.Article.findOne({ _id: req.params.id })
		// ..and populate all of the notes associated with it
		.populate('note')
		.then(dbArticle => res.json(dbArticle))
		.catch(err => res.json(err))
})

// Route for saving/updating an Article's associated Note
app.post('/articles/:id', (req, res) => {
	// Create a new note and pass the req.body to the entry
	db.Note.create(req.body)
		.then(dbNote =>
			db.Article.findOneAndUpdate(
				{ _id: req.params.id },
				{ note: dbNote._id },
				{ new: true }
			)
		)
		.then(dbArticle => res.json(dbArticle))
		.catch(err => res.json(err))
})

// Start the server
app.listen(PORT, () => console.log('App running on port ' + PORT + '!'))
