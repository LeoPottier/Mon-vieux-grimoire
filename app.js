require("dotenv").config({ path: ".env.local" });
const express = require('express');
const mongoose = require('mongoose');
const booksRoutes = require('./routes/books');
const userRoutes = require('./routes/user');
const path = require('path');

console.log(process.env)

// Connection to DataBase MongoDB
mongoose.connect(process.env.DB_URI,
  { 
    useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

const app = express();

// Middleware allowing Express to extract the JSON body from POST requests
app.use(express.json());

// Middleware handling CORS errors
app.use((req, res, next) => {
    // Access to our API from any origin.
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Authorization to add the mentioned headers to requests sent to our API.
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    // Authorization to send requests with the mentioned methods.
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

// Management of the images resource.
app.use('/images', express.static(path.join(__dirname, 'images')));

// Registration of the routers
app.use('/api/auth', userRoutes);
app.use('/api/books', booksRoutes);

module.exports = app;