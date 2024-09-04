const express = require('express');
const router = express.Router();
const { validateToken } = require('../middlewares/AuthMiddleware');
const { createAnimal, getAnimalByUserId, updateAnimal, deleteAnimal } = require('../controllers/Animals');

router.post('/ajoutAnimal', createAnimal);

router.get('/byUserId/:id', getAnimalByUserId);

router.put("/updateAnimal/:id", validateToken, updateAnimal);

router.delete("/deleteAnimal/:id" , deleteAnimal);

module.exports = router;