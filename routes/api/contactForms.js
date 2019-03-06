const express = require("express");

const router = express.Router();

const ContactForm = require("../../models/ContactForm");

router.post("/:role", (req, res) => {
  const newForm = new ContactForm({
    name: req.body.name,
    mobile: req.body.mobile,
    role: req.params.role
  });
  if (typeof req.body.profile !== "undefined") {
    newForm.profile = { _id: req.body.profile._id };
  } else {
    newForm.profile = { _id: "general" };
  }
  let savedForm;
  newForm
    .save()
    .then(form => res.json(form))
    .catch(err => console.log(err));

  //Sending mail to admin
  var elasticemail = require("elasticemail");
  var client = elasticemail.createClient({
    username: "admin@celebraton.in",
    apiKey: "4110245d-e1d2-4944-ac43-52bd0d720c2b"
  });

  var msg = {
    from: "admin@celebraton.in",
    from_name: "CelebratON.in",
    to: "admin@celebraton.in",
    subject: "New " + req.params.role + " Contact Form Submission",
    body_html:
      "Name: " +
      req.body.name +
      "<br>Mobile: " +
      req.body.mobile +
      "<br>Role: " +
      req.params.role +
      "<br>Profile: " +
      newForm.profile._id
  };

  client.mailer.send(msg, function(err, result) {
    if (err) {
      return console.error(err);
    }
  });
});

router.get("/allForms/:limit/:skip", (req, res) => {
  
  ContactForm.find()
    .sort({ date: -1 })
    .limit(Number(req.params.limit))
    .skip(Number(req.params.skip))
    .then(contactForms => {
      res.status(200).json(contactForms);
    });
});

module.exports = router;
