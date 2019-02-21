const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const passport = require("passport");
var cors = require("cors");

const users = require("./routes/api/users");
const categories = require("./routes/api/categories");
const contactForms = require("./routes/api/contactForms");
const enquiries = require("./routes/api/enquiries");
const profiles = require("./routes/api/profiles");
const admin = require("./routes/api/admin");

const app = express();
app.use(cors());

app.use(function(req, res, next) {
  var allowedOrigins = [
    "http://127.0.0.1:3000",
    "https://celebraton.herokuapp.com"
  ];
  var origin = req.headers.origin;
  if (allowedOrigins.indexOf(origin) > -1) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  // Website you wish to allow to connect
  // res.setHeader(
  //   "Access-Control-Allow-Origin",
  //   "https://celebraton.herokuapp.com"
  // );

  // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );

  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);

  // Pass to next layer of middleware
  next();
}); //npm run server
//next
//npm run devx

//Body Parser Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//DB config
const db = require("./config/keys").mongoURI;

//Connect to mongoDB through Mongoose
mongoose
  .connect(db, { useNewUrlParser: true })
  .then(() => console.log("DB Connected successfully"))
  .catch(err => console.log(err));

//Passport Middleware
app.use(passport.initialize());

//Passport Config
require("./config/passport")(passport);

//Use Routes
app.use("/api/users", users);
app.use("/api/categories", categories);
app.use("/api/contactForms", contactForms);
app.use("/api/enquiries", enquiries);
app.use("/api/profiles", profiles);
app.use("/api/admin", admin);

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server running on port: ${port}`));
