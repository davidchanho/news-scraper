var db = require('../models')
const axios = require('axios')
const cheerio = require('cheerio')

module.exports = function(app) {
  // A GET route for scraping the echoJS website
  app.get('/scrape', (req, res) => {
    res.sendFile(path.join(__dirname, './public/scrape.html'))
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

  app.post('/delete/:id', (req, res) => {
		// Create a new note and pass the req.body to the entry
		db.Note.deleteOne(req.body)
			.then(dbNote =>
				db.Article.findOneAndDelete(
					{ _id: req.params.id },
					{ note: dbNote._id },
					{ new: true }
				)
			)
			.then(dbArticle => res.json(dbArticle))
			.catch(err => res.json(err))
	})
}
