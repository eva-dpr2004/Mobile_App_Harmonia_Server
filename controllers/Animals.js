const { Animaux } = require('../models');
const jwt = require('jsonwebtoken');
const validator = require('validator');

const createAnimal = async (req, res) => {
    const { Nom, Date_De_Naissance, Date_Adoption, Espece, Race, Sexe, Poids, Habitat, photoURL } = req.body;
    const token = req.cookies.accessToken;

    if (!token) {
        return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    try {
        const decoded = jwt.verify(token, 'importantsecret');
        const Id_Utilisateur = decoded.Id_Utilisateur;

        if (!validator.isLength(Nom, { min: 3, max: 100 }) ||
            !validator.matches(Nom, /^[A-Za-zÀ-ÖØ-öø-ÿ _-]*$/) ||
            /(DROP\s+TABLE|SELECT|DELETE|INSERT|UPDATE|CREATE|ALTER|EXEC)/i.test(Nom) ||
            /(?:[A-Z]{2,})/.test(Nom) ||
            !validator.isLength(Nom.replace(/\s/g, ''), { min: 3 })) {
            return res.status(400).json({ error: "Nom invalide" });
        }

        if (!validator.isDate(Date_De_Naissance) ||
            validator.isAfter(Date_De_Naissance, new Date().toISOString().split('T')[0])) {
            return res.status(400).json({ error: "Date de naissance invalide" });
        }

        if (!validator.isDate(Date_Adoption) ||
            validator.isAfter(Date_Adoption, new Date().toISOString().split('T')[0]) ||
            validator.isBefore(Date_Adoption, Date_De_Naissance)) {
            return res.status(400).json({ error: "Date d'adoption invalide" });
        }

        if (!validator.isIn(Espece, [
            'chat', 'chien', 'lapin', 'hamster', 'cochon d\'inde', 'furet', 'chinchilla', 'souris', 'singe', 'hérisson',
            'poissons rouges', 'carpes koï', 'poisson-clown', 'poisson-ange', 'poisson-chat',
            'perroquet', 'canari', 'poule', 'coq', 'canard', 'oie', 'dindon', 'perruche', 'pigeon', 'moineau',
            'tortue', 'lézard', 'gecko', 'serpent', 'axolotl', 'salamandre', 'iguane', 'caméléon', 'grenouille', 'triton'
        ])) {
            return res.status(400).json({ error: "Type d'animal invalide" });
        }

        if (!validator.isLength(Race, { min: 3, max: 100 }) ||
            !validator.matches(Race, /^[A-Za-zÀ-ÖØ-öø-ÿ _-]*$/) ||
            /(DROP\s+TABLE|SELECT|DELETE|INSERT|UPDATE|CREATE|ALTER|EXEC)/i.test(Race) ||
            /(?:[A-Z]{2,})/.test(Race) ||
            !validator.isLength(Race.replace(/\s/g, ''), { min: 3 })) {
            return res.status(400).json({ error: "Race invalide" });
        }

        if (!validator.isIn(Sexe, ['Mâle', 'Femelle', 'Inconnu', 'Hermaphrodite'])) {
            return res.status(400).json({ error: "Sexe invalide" });
        }

        if (!validator.isFloat(String(Poids), { min: 0.1, max: 4000 })) {
            return res.status(400).json({ error: "Poids invalide" });
        }

        if (!validator.isIn(Habitat, ['Intérieur', 'Extérieur'])) {
            return res.status(400).json({ error: "Habitat invalide" });
        }

        const animalCount = await Animaux.count({
            where: { Id_Utilisateur: Id_Utilisateur }
        });

        if (animalCount >= 50) {
            return res.status(400).json({ error: "Vous ne pouvez pas ajouter plus de 50 animaux." });
        }

        const newAnimal = await Animaux.create({
            Nom: validator.escape(Nom),
            Date_De_Naissance,
            Date_Adoption,
            Espece: validator.escape(Espece),
            Race: validator.escape(Race),
            Sexe,
            Poids,
            Habitat,
            Id_Utilisateur,
            photoURL
        });

        res.status(201).json({ success: true, message: "Animal créé avec succès", animal: newAnimal });
    } catch (error) {
        console.error("Erreur lors de la création de l'animal:", error);
        res.status(500).json({ error: "Erreur interne du serveur", details: error.message });
    }
};

const getAnimalByUserId = async (req, res) => {
    const { id } = req.params;
    try {
        const animaux = await Animaux.findAll({ where: { Id_Utilisateur: id } });
        res.status(200).json(animaux);
    } catch (error) {
        console.error("Erreur lors de la récupération des animaux:", error);
        res.status(500).json({ error: "Erreur interne du serveur", details: error.message });
    }
};

let modificationsTracker = {};

const updateAnimal = async (req, res) => {
    const { id } = req.params;
    const { Nom, Date_De_Naissance, Date_Adoption, Espece, Race, Sexe, Poids, Habitat } = req.body;
    const token = req.cookies.accessToken;

    if (!token) {
        return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    try {
        const decoded = jwt.verify(token, 'importantsecret');
        const Id_Utilisateur = decoded.Id_Utilisateur;

        const animal = await Animaux.findOne({
            where: {
                Id_Animal: id,
                Id_Utilisateur: Id_Utilisateur
            }
        });

        if (!animal) {
            return res.status(404).json({ error: "Animal non trouvé" });
        }

        const today = new Date().toISOString().split('T')[0]; 
        const key = `${id}-${today}`; 

        if (!modificationsTracker[key]) {
            modificationsTracker[key] = 0;
        }

        if (modificationsTracker[key] >= 3) {
            return res.status(400).json({ error: "Vous ne pouvez pas modifier les informations d'un animal plus de 3 fois par jour." });
        }

        modificationsTracker[key] += 1;

        // Validation des champs
        if (Nom && (
            !validator.isLength(Nom, { min: 3, max: 100 }) ||
            !validator.matches(Nom, /^[A-Za-zÀ-ÖØ-öø-ÿ _-]*$/) ||
            /(DROP\s+TABLE|SELECT|DELETE|INSERT|UPDATE|CREATE|ALTER|EXEC)/i.test(Nom) ||
            /(?:[A-Z]{2,})/.test(Nom) ||
            !validator.isLength(Nom.replace(/\s/g, ''), { min: 3 })
        )) {
            return res.status(400).json({ error: "Nom invalide" });
        }

        if (Date_De_Naissance && (
            !validator.isDate(Date_De_Naissance) ||
            validator.isAfter(Date_De_Naissance, today)
        )) {
            return res.status(400).json({ error: "Date de naissance invalide" });
        }

        if (Date_Adoption && (
            !validator.isDate(Date_Adoption) ||
            validator.isAfter(Date_Adoption, today) ||
            validator.isBefore(Date_Adoption, Date_De_Naissance)
        )) {
            return res.status(400).json({ error: "Date d'adoption invalide" });
        }

        if (Espece && !validator.isIn(Espece.toLowerCase(), [
            'chat', 'chien', 'lapin', 'hamster', 'cochon d\'inde', 'furet', 'chinchilla', 'souris', 'singe', 'hérisson',
            'poissons rouges', 'carpes koï', 'poisson-clown', 'poisson-ange', 'poisson-chat',
            'perroquet', 'canari', 'poule', 'coq', 'canard', 'oie', 'dindon', 'perruche', 'pigeon', 'moineau',
            'tortue', 'lézard', 'gecko', 'serpent', 'axolotl', 'salamandre', 'iguane', 'caméléon', 'grenouille', 'triton'
        ])) {
            return res.status(400).json({ error: "Type d'animal invalide" });
        }

        if (Race && (
            !validator.isLength(Race, { min: 3, max: 100 }) ||
            !validator.matches(Race, /^[A-Za-zÀ-ÖØ-öø-ÿ _-]*$/) ||
            /(DROP\s+TABLE|SELECT|DELETE|INSERT|UPDATE|CREATE|ALTER|EXEC)/i.test(Race) ||
            /(?:[A-Z]{2,})/.test(Race) ||
            !validator.isLength(Race.replace(/\s/g, ''), { min: 3 })
        )) {
            return res.status(400).json({ error: "Race invalide" });
        }

        if (Sexe && !validator.isIn(Sexe, ['Mâle', 'Femelle', 'Inconnu', 'Hermaphrodite'])) {
            return res.status(400).json({ error: "Sexe invalide" });
        }

        if (Poids && !validator.isFloat(String(Poids), { min: 0.1, max: 4000 })) {
            return res.status(400).json({ error: "Poids invalide" });
        }

        if (Habitat && !validator.isIn(Habitat, ['Intérieur', 'Extérieur'])) {
            return res.status(400).json({ error: "Habitat invalide" });
        }

        await animal.update(
            { 
              Nom: Nom ? validator.escape(Nom) : animal.Nom,
              Date_De_Naissance,
              Date_Adoption,
              Espece: Espece ? validator.escape(Espece.toLowerCase()) : animal.Espece,
              Race: Race ? validator.escape(Race) : animal.Race,
              Sexe,
              Poids,
              Habitat 
            }
        );

        const updatedAnimal = await Animaux.findOne({ where: { Id_Animal: id } });

        res.status(200).json({ success: true, message: "Animal mis à jour avec succès", animal: updatedAnimal });
    } catch (error) {
        console.error("Erreur lors de la mise à jour de l'animal:", error);
        res.status(500).json({ error: "Erreur interne du serveur", details: error.message });
    }
};


const deleteAnimal = async (req, res) => {
    const { id } = req.params;
    try {
        await Animaux.destroy({ where: { Id_Animal: id } });
        res.status(200).json({ success: true, message: "Animal supprimé avec succès" });
    } catch (error) {
        console.error("Erreur lors de la suppression de l'animal:", error);
        res.status(500).json({ error: "Erreur interne du serveur", details: error.message });
    }
};

module.exports = { createAnimal, getAnimalByUserId, updateAnimal, deleteAnimal };
