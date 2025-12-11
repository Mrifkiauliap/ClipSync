const { Device } = require("../models");

const validation = {};

validation.check_ID_Device_Active = async (value, { req }) => {
  const device = await Device.findOne({
    where: {
      id: value,
      user_id: req.user.id,
      is_active: true,
    },
    raw: true,
    nest: true,
  });

  if (!device) {
    throw new Error(
      "Device dengan ID tersebut tidak ditemukan atau tidak aktif.",
    );
  }

  return true;
};

validation.check_ID_Device_Delete = async (value, { req }) => {
  const device = await Device.findOne({
    where: {
      id: value,
      user_id: req.user.id,
    },
    raw: true,
    nest: true,
  });

  if (!device) {
    throw new Error(
      "Device dengan ID tersebut tidak ditemukan atau sudah terhapus.",
    );
  }

  return true;
};

module.exports = validation;
