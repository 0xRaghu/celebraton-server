const Validator = require("validator");
const isEmpty = require("./is-empty");

module.exports = function validateRegisterInput(data, tempPassword) {
  let errors = {};

  data.mobile = !isEmpty(data.mobile) ? data.mobile : "";
  data.otp = !isEmpty(data.otp) ? data.otp : "";

  if (data.otp != tempPassword) {
    errors.otp = "Incorrect OTP";
  }

  if (!Validator.isLength(data.mobile, { min: 10 })) {
    errors.mobile = "Mobile number must be a minimum of 10 characters";
  }
  if (Validator.isEmpty(data.mobile)) {
    errors.mobile = "Mobile number is required";
  }

  if (!Validator.isLength(data.otp, { min: 4, max: 4 })) {
    errors.otp = "Enter a 4 digit OTP";
  }
  if (Validator.isEmpty(data.otp)) {
    errors.otp = "Please enter the 4 digit OTP received on your mobile";
  }
  console.log(isEmpty(errors), errors);
  return {
    isValid: isEmpty(errors),
    errors
  };
};
