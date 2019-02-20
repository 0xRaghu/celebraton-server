const Validator = require("validator");
const isEmpty = require("./is-empty");

module.exports = function validateContactForm(data) {
  let errors = {};

  data.mobile = !isEmpty(data.mobile) ? data.mobile : "";
  data.name = !isEmpty(data.name) ? data.name : "";

  if (!Validator.isLength(data.mobile, { min: 10 })) {
    errors.mobile = "Mobile number must be a minimum of 10 characters";
  }
  if (Validator.isEmpty(data.mobile)) {
    errors.mobile = "Mobile number is required";
  }
  if (!Validator.isLength(data.name, { min: 2, max: 30 })) {
    errors.name = "Name must be between 2 and 30 characters long";
  }
  if (Validator.isEmpty(data.name)) {
    errors.name = "Please enter your name";
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};
