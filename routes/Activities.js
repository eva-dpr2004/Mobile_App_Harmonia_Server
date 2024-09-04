const express = require('express');
const router = express.Router();
const { ajoutActivite, getActivitesByUserId, deleteActivitiesById } = require('../controllers/Activities');

router.post('/ajoutActivite', ajoutActivite);

router.get('/getActivitesByUserId/:userId', getActivitesByUserId);

router.delete('/deleteActivites/:activitiesId', deleteActivitiesById);

module.exports = router;