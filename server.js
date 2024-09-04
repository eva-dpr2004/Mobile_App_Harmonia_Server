const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const cors = require('cors');

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: 'http://localhost:8081', credentials: true }));

// DB
const db = require('./models');

// ROUTERS
const usersRouter = require("./routes/Users");
app.use("/auth", usersRouter);

const animalsRouter = require("./routes/Animals");
app.use("/animals", animalsRouter);

const activitiesRouter = require("./routes/Activities");
app.use("/activities", activitiesRouter);

// PORT
db.sequelize.sync().then(() => {
    app.listen(8000, () => {
        console.log('Server tourne sur le port 8000');
    });
});