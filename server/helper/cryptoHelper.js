// cryptoHelper.js (server-side)
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const cryptoHelper = {};

cryptoHelper.hashUserId = (userId) => {
  return crypto
    .createHash("sha256")
    .update(String(userId))
    .digest("hex")
    .slice(0, 16);
};

cryptoHelper.hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 10);
  return bcrypt.hash(password, salt);
};

cryptoHelper.verifyPassword = async (password, hashed) => {
  return bcrypt.compare(password, hashed);
};

module.exports = cryptoHelper;
