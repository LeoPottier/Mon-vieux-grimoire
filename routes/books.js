const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
// const multer = require('../middleware/multer-config')

const booksCtrl = require('../controllers/books');

router.get('/', booksCtrl.getAllBooks);

router.post('/', auth, booksCtrl.createBook); //  multer

router.get('/:id', booksCtrl.getOneBook);

router.delete('/:id', auth, booksCtrl.deleteBook);

module.exports = router;