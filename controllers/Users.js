const { Utilisateurs } = require("../models");
//const bcrypt = require("bcrypt");
const bcrypt = require('bcryptjs');
const { sign } = require('jsonwebtoken');
const validator = require('validator');
const { Op } = require("sequelize");

//Inscription
const createUser = async (req, res) => {
  // Extraire les données de la requête
  const { Nom, Email, Mot_De_Passe } = req.body;

  const sanitizedNom = validator.escape(Nom.trim());
  const sanitizedEmail = validator.normalizeEmail(Email.trim());
  
  if (!validator.isLength(sanitizedNom, { min: 3, max: 15 }) ||
      !validator.isAlphanumeric(sanitizedNom.replace(/[^a-zA-Z0-9]/g, '')) ||
      !validator.isEmail(sanitizedEmail) ||
      !validator.isLength(Mot_De_Passe, { min: 12 })) {
    return res.status(400).json({ error: "Données d'entrée invalides" });
  }

  try {
    // Vérifier si le nom ou l'email existent déjà
    const existingUserByName = await Utilisateurs.findOne({ where: { Nom: sanitizedNom } });
    if (existingUserByName) {
      return res.status(400).json({ error: "Nom déjà pris" });
    }

    const existingUserByEmail = await Utilisateurs.findOne({ where: { Email: sanitizedEmail } });
    if (existingUserByEmail) {
      return res.status(400).json({ error: "Email déjà pris" });
    }

    const hash = await bcrypt.hash(Mot_De_Passe, 10);

    const newUser = await Utilisateurs.create({
      Nom: sanitizedNom,
      Email: sanitizedEmail,
      Mot_De_Passe: hash,
    });

    // Réponse de succès
    res.json({ success: true, message: "Utilisateur créé avec succès", user: newUser });
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);
    res.status(500).json({ error: "Erreur interne du serveur", details: error.message });
  }
};

//Connexion
const failedAttempts = {}; 

const MAX_FAILED_ATTEMPTS = 3; 
const LOCK_TIME = 5 * 60 * 1000; 

const loginUser = async (req, res) => {
  const { NomOrEmail, Mot_De_Passe } = req.body;

  const sanitizedNomOrEmail = validator.escape(NomOrEmail.trim());
  const sanitizedMot_De_Passe = Mot_De_Passe.trim();
  
  if (!validator.isLength(sanitizedNomOrEmail, { min: 3 }) || !validator.isLength(sanitizedMot_De_Passe, { min: 12 })) {
    return res.status(400).json({ error: "Données d'entrée invalides" });
  }

  try {
    let utilisateur;

    if (validator.isEmail(sanitizedNomOrEmail)) {
      utilisateur = await Utilisateurs.findOne({ where: { Email: sanitizedNomOrEmail } });
    } else {
      utilisateur = await Utilisateurs.findOne({ where: { Nom: sanitizedNomOrEmail } });
    }

    if (!utilisateur) {
      handleFailedAttempt(sanitizedNomOrEmail);
      return res.json({ error: "Utilisateur non existant" });
    }

    if (isUserLocked(sanitizedNomOrEmail)) {
      const lockUntil = failedAttempts[sanitizedNomOrEmail].lockUntil;
      const lockTimeLeft = Math.round((lockUntil - Date.now()) / 1000); // in seconds
      return res.status(403).json({ error: `Compte verrouillé. Réessayez dans ${lockTimeLeft} secondes.` });
    }

    const match = await bcrypt.compare(sanitizedMot_De_Passe, utilisateur.Mot_De_Passe);
    if (!match) {
      handleFailedAttempt(sanitizedNomOrEmail);
      return res.json({ error: "Mot de passe incorrect" });
    }

    if (utilisateur.Email !== sanitizedNomOrEmail && utilisateur.Nom !== sanitizedNomOrEmail) {
      handleFailedAttempt(sanitizedNomOrEmail);
      return res.json({ error: "Nom d'utilisateur ou email incorrect" });
    }

    resetFailedAttempts(sanitizedNomOrEmail);
    const accessToken = sign(
      { Nom: utilisateur.Nom, Id_Utilisateur: utilisateur.Id_Utilisateur }, 
      "importantsecret"
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    res.status(500).json({ error: "Erreur interne du serveur", details: error.message });
  }
};

function handleFailedAttempt(NomOrEmail) {
  if (!failedAttempts[NomOrEmail]) {
    failedAttempts[NomOrEmail] = { attempts: 0, lockUntil: null };
  }

  failedAttempts[NomOrEmail].attempts += 1;

  if (failedAttempts[NomOrEmail].attempts >= MAX_FAILED_ATTEMPTS) {
    failedAttempts[NomOrEmail].lockUntil = Date.now() + LOCK_TIME;
  }
}

function isUserLocked(NomOrEmail) {
  if (failedAttempts[NomOrEmail] && failedAttempts[NomOrEmail].lockUntil > Date.now()) {
    return true;
  }
  return false;
}

function resetFailedAttempts(NomOrEmail) {
  if (failedAttempts[NomOrEmail]) {
    failedAttempts[NomOrEmail] = { attempts: 0, lockUntil: null };
  }
}

//Déconnexion
const logoutUser = async (req, res) => {
  res.clearCookie('accessToken');
  console.log('Cookie cleared');
  res.json({ success: true, message: 'Déconnexion réussie' });
};

//Récupération de l'Utilisateur co
const getAuthenticatedUser = async (req, res) =>{
  res.json(req.utilisateur);
}

//Récupération Utilisateur
const getBasicInfo = async (req, res) => {
    const Id_Utilisateur = req.params.id;
  
    try {
      const utilisateur = await Utilisateurs.findByPk(Id_Utilisateur, {
        attributes: ['Id_Utilisateur', 'Nom', 'Email', 'Mot_De_Passe']
      });
  
      if (!utilisateur) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }
  
      res.json(utilisateur);
    } catch (error) {
      res.status(500).json({ error: "Erreur interne du serveur" });
    }
  };

//Modifier Utilisateur
const updateUser = async (req, res) => {
  const Id_Utilisateur = req.params.id;  
  const { Nom, Email, Mot_De_Passe } = req.body;

  try {
      const utilisateur = await Utilisateurs.findByPk(Id_Utilisateur);
      if (!utilisateur) {
          return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      let sanitizedNom = Nom ? validator.escape(Nom.trim()) : null;
      let sanitizedEmail = Email ? validator.normalizeEmail(Email.trim()) : null;

      if (sanitizedNom && !validator.isLength(sanitizedNom, { min: 3, max: 15 })) {
          return res.status(400).json({ error: "Le nom doit contenir entre 3 et 15 caractères" });
      }
      
      if (sanitizedEmail && !validator.isEmail(sanitizedEmail)) {
          return res.status(400).json({ error: "L'email est invalide" });
      }

      if (Mot_De_Passe) {
          utilisateur.Mot_De_Passe = await bcrypt.hash(Mot_De_Passe, 10);
      }

      if (sanitizedNom) utilisateur.Nom = sanitizedNom;
      if (sanitizedEmail) utilisateur.Email = sanitizedEmail;
      
      await utilisateur.save();

      res.json({ success: true, message: "Utilisateur mis à jour avec succès", utilisateur });
  } catch (error) {
      console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
      res.status(500).json({ error: "Erreur interne du serveur", details: error.message });
  }
};

//Supprimer Utilisateur
const deleteUser = async (req, res) => {
  const Id_Utilisateur = req.params.id;  // Récupérer l'ID de l'URL

  try {
      const utilisateur = await Utilisateurs.findByPk(Id_Utilisateur);
      if (!utilisateur) {
          return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      await utilisateur.destroy();  // Supprimer l'utilisateur
      res.json({ success: true, message: "Utilisateur supprimé avec succès" });
  } catch (error) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error);
      res.status(500).json({ error: "Erreur interne du serveur", details: error.message });
  }
};

module.exports = { createUser, loginUser, logoutUser, getAuthenticatedUser, getBasicInfo, updateUser, deleteUser};