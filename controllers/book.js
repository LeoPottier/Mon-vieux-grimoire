const Book = require('../models/books');
const fs = require('fs');

// POST 
exports.createBook = (req, res, next) => {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject._userId;
    const book = new Book({
        ...bookObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/resized_${req.file.filename}`,
        averageRating: bookObject.ratings[0].grade
    });
    book.save()
        .then(() => { res.status(201).json({ message: 'Objet enregistré !' }) })
        .catch(error => { res.status(400).json( { error }) })
};

// Get 
exports.getOneBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
        .then(book => res.status(200).json(book))
        .catch(error => res.status(404).json({ error }));
};

// PUT 
exports.modifyBook = (req, res, next) => {
    const bookObject = req.file ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get('host')}/images/resized_${req.file.filename}` 
    } : { ...req.body };
    delete bookObject._userId;
    Book.findOne({_id: req.params.id})
        .then((book) => {
            // Le livre ne peut être mis à jour que par le créateur de sa fiche
            if (book.userId != req.auth.userId) {
                res.status(403).json({ message : '403: unauthorized request' });
            } else {
                const filename = book.imageUrl.split('/images/')[1];
                // Si l'image a été modifiée, on supprime l'ancienne
                req.file && fs.unlink(`images/${filename}`, (err => {
                        if (err) console.log(err);
                    })
                );
                // Mise à jour du livre
                Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
                    .then(() => res.status(200).json({ message: 'Objet modifié !' }))
                    .catch(error => res.status(400).json({ error }));
            }
        })
        .catch((error) => {
            res.status(404).json({ error });
        });
};


// DELETE 
exports.deleteBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
        .then(book => {
            if (book.userId != req.auth.userId) {
                res.status(403).json({ message: '403: unauthorized request' });
            } else {
                const filename = book.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Book.deleteOne({ _id: req.params.id })
                        .then(() => { res.status(200).json({ message: 'Objet supprimé !' }) })
                        .catch(error => res.status(400).json({ error }));
                });
            }
        })
        .catch( error => {
            res.status(404).json({ error });
        });
};

// GET 
exports.getAllBooks = (req, res, next) => {
    Book.find()
        .then(books => res.status(200).json(books))
        .catch(error => res.status(404).json({ error }));
};

// POST
exports.rateBook = async (req, res, next) => {
  try {
      const { rating } = req.body;

      if (typeof rating !== 'number' || rating < 0 || rating > 5) {
          return res.status(400).json({ message: 'Grade must be a number between 0 and 5' });
      }

      const book = await Book.findByIdAndUpdate(
          req.params.id,
          { $push: { ratings: { grade: rating, userId: req.auth.userId } } },
          { new: true }
      );

      if (!book) {
          return res.status(404).json({ message: 'Book not found' });
      }

      const grades = book.ratings.map(rating => rating.grade);
      const averageGrades = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
      book.averageRating = averageGrades;

      await book.save();

      res.status(200).json(book);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'An error has occurred' });
  }
};

// POST
exports.getBestRating = (req, res, next) => {
    // Utiliser la méthode de recherche MongoDB pour trier les livres par note en ordre décroissant
    Book.find().sort({ averageRating: -1 }).limit(3)
        .then(topRatedBooks => {
            res.status(200).json(topRatedBooks);
        })
        .catch(error => {
            res.status(500).json({ error: error.message });
        });
};