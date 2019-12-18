const express = require('express')
const logger = require('morgan')
const mongoose = require('mongoose')

const PORT = process.env.PORT || 3000

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

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/newScraperDB'
// Connect to the Mongo DB
mongoose.connect( MONGODB_URI, {
	useNewUrlParser: true,
	useUnifiedTopology: true
})

require('./routes/html-routes.js')(app);
require('./routes/api-routes.js')(app);

// Start the server
app.listen(PORT, () => console.log('App running on port ' + PORT + '!'))
