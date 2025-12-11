const Model_r = require("../models/model_r");
const Model_cud = require("../models/model_cud");
const {
  handleValidationErrors,
  handleServerError,
} = require("../../../helper/handleError");

const controllers = {};

controllers.get_device = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_r = new Model_r(req);
    const feedBack = await model_r.get_device();

    res.status(200).json({
      error: false,
      data: feedBack.data,
      total: feedBack.total,
    });
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.revoke_device = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_cud = new Model_cud(req);
    await model_cud.revoke_device();

    if (await model_cud.response()) {
      res.status(200).json({
        error: false,
        message: "Device berhasil dicabut.",
      });
    } else {
      res.status(500).json({
        error: true,
        message: "Device gagal dicabut.",
      });
    }
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.delete_device = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_cud = new Model_cud(req);
    await model_cud.delete_device();

    if (await model_cud.response()) {
      res.status(200).json({
        error: false,
        message: "Device berhasil dihapus.",
      });
    } else {
      res.status(500).json({
        error: true,
        message: "Gagal menghapus device.",
      });
    }
  } catch (error) {
    handleServerError(res, error);
  }
};

module.exports = controllers;
