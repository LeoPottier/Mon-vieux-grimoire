const bcrypt = require('bcrypt');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

// POST => Création de compte
exports.signup = (req, res, next) => {
    // Vérification si l'utilisateur existe déjà dans la base de données
    User.findOne({ email: req.body.email })
        .then(existingUser => {
            if (existingUser) {
                // Si l'utilisateur existe déjà, renvoyer une erreur
                return res.status(409).json({ message: "Utilisateur déjà existant" });
            } else {
                // Si l'utilisateur n'existe pas, procéder à la création du nouvel utilisateur
                // Appel de la fonction de hachage de bcrypt dans le MDP (qui est "salé" 10 fois)
                bcrypt.hash(req.body.password, 10)
                    .then(hash => {
                        // Création d'une instance du modèle User avec l'email et le mot de passe hashé
                        const user = new User({
                            email: req.body.email,
                            password: hash
                        });
                        // Enregistrement dans la base de données
                        user.save()
                            .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
                            .catch(error => res.status(400).json({ error }));
                    })
                    .catch(error => res.status(500).json({ error }));
            }
        })
        .catch(error => res.status(500).json({ error }));
};

// POST => Connexion
exports.login = (req, res, next) => {
    // Vérification de l'existence de l'utilisateur dans notre base de données
    User.findOne({ email: req.body.email })
        .then(user => {
            if (!user) {
                return res.status(401).json({ error: 'Utilisateur non trouvé !' });
            }
            // Comparaison du mot de passe entré avec le hash de la base de données
            bcrypt.compare(req.body.password, user.password)
                .then(valid => {
                    if (!valid) {
                        return res.status(401).json({ error: 'Mot de passe incorrect !' });
                    }
                    // Si les informations sont valides, nous renvoyons une réponse contenant userId et un token crypté
                    res.status(200).json({
                        userId: user._id,
                        token: jwt.sign(
                            { userId: user._id },
                            'RANDOM_TOKEN_SECRET',
                            { expiresIn: '24h' }
                        )
                    });
                })
                .catch(error => res.status(500).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
};