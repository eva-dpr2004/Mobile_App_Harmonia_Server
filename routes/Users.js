const express = require('express');
const router = express.Router();
const {createUser, loginUser, logoutUser, getAuthenticatedUser, getBasicInfo, updateUser, deleteUser} = require("../controllers/Users");
const { validateToken } = require('../middlewares/AuthMiddleware');

router.post("/", createUser);

router.post("/login", loginUser);

router.post("/logout", logoutUser);

router.get('/auth', validateToken, getAuthenticatedUser)

router.get("/basicinfo/:id", validateToken, getBasicInfo);

router.put("/updateuser/:id", validateToken, updateUser);

router.delete("/deleteuser/:id", validateToken, deleteUser);


module.exports = router;