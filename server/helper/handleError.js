const { validationResult } = require("express-validator");

const MESSAGES = {
  ADD_SUCCESS: "Add Success",
  ADD_FAILURE: "Add Failure",
  UPDATE_SUCCESS: "Update Success",
  UPDATE_FAILURE: "Update Failure",
  DELETE_SUCCESS: "Delete Success",
  DELETE_FAILURE: "Delete Failure",
  INTERNAL_ERROR: "Internal Server Error",
  VALIDATION_ERROR: "Data yang dimasukkan tidak valid",
  DATA_NOTFOUND: "Data tidak ditemukan",
  DATA_FOUNDED: "Data ditemukan",
};

const helper = {};

helper.error_msg2 = async (errors) => {
  var detail = [];
  errors.array().forEach((error) => {
    detail.push({ path: error.path, msg: error.msg });
  });
  return detail;
};

helper.error_msg = async (errors) => {
  let num = 0;
  let err_msg = "";

  errors.array().forEach((error) => {
    if (num != 0) err_msg += "<br>";
    err_msg += error.msg;
    num++;
  });
  return err_msg;
};

helper.handleValidationErrors2 = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err_msg = await helper.error_msg2(errors);
    res.status(400).json({ error: true, detail: err_msg });
    return false;
  }
  return true;
};

helper.handleValidationErrors = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err_msg = await helper.error_msg(errors);

    if (!res.headersSent) {
      res.status(400).json({
        error: true,
        message: err_msg.replace(/<br>/g, " "),
      });
    }
    return false;
  }
  return true;
};

helper.handleValidationErrorsFiles = async (req, res, files) => {
  const errors = validationResult(req);
  for (let x in files) {
    if (req.files[files[x].path] === undefined) {
      errors.errors.push({
        value: "",
        msg: `File ${files[x].path} Wajib Diupload.`,
        param: files[x].path,
        location: "body",
      });
    }
  }

  if (!errors.isEmpty()) {
    const err_msg = await helper.error_msg(errors);

    if (!res.headersSent) {
      res.status(400).json({
        error: true,
        message: err_msg.replace(/<br>/g, " "),
      });
    }
    return false;
  }
  return true;
};

helper.handleServerError = (res, error) => {
  if (!res.headersSent) {
    const statusCode = error?.statusCode || 500;
    const message = error?.message || MESSAGES.INTERNAL_ERROR;

    res.status(statusCode).json({
      error: true,
      message: message,
    });
  }
};

module.exports = helper;
