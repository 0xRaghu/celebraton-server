const express = require("express");

const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
const passport = require("passport");

//Load Input Validation
const validateRegisterInput = require("../../validation/register");

//Load User Model
const User = require("../../models/User");

router.get("/test", (req, res) => {
  res.json({ msg: "Users Works !" });
});

router.post("/sendOTP", (req, res) => {
  const body = {
    mobile: req.body.mobile,
    role: req.body.role
  };
  User.findOne({ mobile: req.body.mobile })
    .then(user => {
      if (user) {
        var number = user.mobile;
        var shortnum = number.slice(-10);
        var http = require("http");
        var options = {
          method: "POST",
          hostname: "api.msg91.com",
          port: null,
          path: "/api/v2/sendsms",
          headers: {
            authkey: "185228AUF57pUKt5n5a17fb80",
            "content-type": "application/json"
          }
        };

        var req = http.request(options, function(res) {
          var chunks = [];
          res.on("data", function(chunk) {
            chunks.push(chunk);
          });
          res.on("end", function() {
            var body = Buffer.concat(chunks);
          });
        });
        //Generate OTP
        const otp = Math.floor(1000 + Math.random() * 9000);
        var otpObject = { tempPassword: otp };
        //Update in database
        User.updateOne({ _id: user.id }, otpObject, function(err, res) {})
          .then(res.json(user))
          .catch(err => console.log(err));
        // req.write(
        //   JSON.stringify({
        //     sender: "CBRTON",
        //     route: "4",
        //     country: "91",
        //     sms: [
        //       {
        //         message:
        //           otp +
        //           " is the OTP to login to CelebratON. Happy Celebrating !!!",
        //         to: [shortnum]
        //       }
        //     ]
        //   })
        // );
        // req.end();
      } else {
        var number = body.mobile;
        var shortnum = number.slice(-10);
        var http = require("http");
        var options = {
          method: "POST",
          hostname: "api.msg91.com",
          port: null,
          path: "/api/v2/sendsms",
          headers: {
            authkey: "185228AUF57pUKt5n5a17fb80",
            "content-type": "application/json"
          }
        };

        var req = http.request(options, function(res) {
          var chunks = [];
          res.on("data", function(chunk) {
            chunks.push(chunk);
          });
          res.on("end", function() {
            var body = Buffer.concat(chunks);
          });
        });
        //Generate OTP
        const otp = Math.floor(1000 + Math.random() * 9000);
        // var otpObject = { tempPassword: otp };
        //Create in database
        const newUser = new User({
          mobile: body.mobile,
          tempPassword: otp,
          role: body.role
        });

        newUser
          .save()
          .then(user => res.json(user))
          .catch(err => console.log(err));

        // req.write(
        //   JSON.stringify({
        //     sender: "CBRTON",
        //     route: "4",
        //     country: "91",
        //     sms: [
        //       {
        //         message:
        //           otp +
        //           " is the OTP to Register with CelebratON. Happy Celebrating !!!",
        //         to: [shortnum]
        //       }
        //     ]
        //   })
        // );
        // req.end();
      }
    })
    .catch(err => console.log(err));
});

router.post("/registerOrLogin", (req, res) => {
  let userFields = {};
  if (req.body.name) userFields.name = req.body.name;
  if (req.body.email) userFields.email = req.body.email;

  //Make sure the user does not change the mobile number after receiving OTP
  User.findOneAndUpdate(
    { mobile: req.body.mobile },
    { $set: userFields },
    { new: true }
  )
    .then(user => {
      const { errors, isValid } = validateRegisterInput(
        req.body,
        user.tempPassword
      );
      //Check Validation
      if (!isValid) {
        res.status(200).json({ errors: "Incorrect OTP", success: false });
      }

      //Have to login the user
      //User Matched
      const payload = {
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        role: user.role,
        tempPassword: user.tempPassword
      }; //Create jwt payload
      //Sign Token
      jwt.sign(payload, keys.secretOrKey, (err, token) => {
        res.status(200).json({
          success: true,
          token: token
        });
      });
    })
    .catch(err => console.log(errors));
});

//The below routes are not used

router.post("/register", (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body);
  //Check Validation
  if (!isValid) {
    res.status(400).json(errors);
  }

  User.findOne({ mobile: req.body.mobile }).then(user => {
    if (user) {
      errors.mobile = "Email already exists";
      return res.status(400).json(errors);
    } else {
      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        mobile: req.body.mobile,
        password: req.body.password
      });
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then(user => res.json(user))
            .catch(err => console.log(err));
        });
      });
    }
  });
});

router.post("/login", (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);
  //Check Validation
  if (!isValid) {
    res.status(400).json(errors);
  }

  const email = req.body.email;
  const password = req.body.password;

  User.findOne({ email }).then(user => {
    if (!user) {
      errors.email = "User not found";
      return res.status(404).json(errors);
    }
    bcrypt.compare(password, user.password).then(isMatch => {
      if (isMatch) {
        //User Matched
        const payload = { id: user.id, name: user.name, mobile: user.mobile }; //Create jwt payload
        //Sign Token
        jwt.sign(payload, keys.secretOrKey, (err, token) => {
          res.json({
            success: true,
            token: "Bearer " + token
          });
        });
      } else {
        return res.status(400).json({ password: "Password Incorrect" });
      }
    });
  });
});

router.get("/currentUser/:mobile", (req, res) => {
  User.findOne({ mobile: req.params.mobile })
    .then(user => {
      if (user.mobile) {
        res.status(200).json(user);
      }
    })
    .catch(err => res.status(404).json(err));
});

module.exports = router;
