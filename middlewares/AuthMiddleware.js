const { verify } = require("jsonwebtoken");

const validateToken = (req, res, next) => {
  const token = req.cookies.accessToken;
  
  if (!token) return res.json({ error: "Utilisateur non connecté :(" });

  try {
    const validToken = verify(token, "importantsecret");
    req.utilisateur = validToken;
    if (validToken) {
      return next();
    }
  } catch (err) {
    return res.json({ error: "Token invalide", details: err.message });
  }
};

module.exports = { validateToken };
