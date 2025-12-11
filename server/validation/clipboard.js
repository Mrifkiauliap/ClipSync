const { Device, Clipboard, ClipboardFavorite } = require("../models");

const validation = {};

validation.check_ID_device = async (value, { req }) => {
  const device = await Device.findOne({
    where: {
      id: value,
      user_id: req.userId,
      is_active: true,
    },
    raw: true,
  });

  if (!device) {
    throw new Error(
      "Device dengan ID tersebut tidak ditemukan atau tidak aktif.",
    );
  }

  return true;
};

validation.check_ID_clipboard = async (value, { req }) => {
  const clipboard = await Clipboard.findOne({
    where: {
      id: value,
      user_id: req.userId,
    },
    raw: true,
  });

  if (!clipboard) {
    throw new Error("Clipboard dengan ID tersebut tidak ditemukan.");
  }

  return true;
};

module.exports = validation;
