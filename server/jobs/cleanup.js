const { Op, Clipboard } = require("../models");

async function cleanupExpiredClipboards({ silent = false } = {}) {
  try {
    const deleted = await Clipboard.destroy({
      where: {
        expire_at: {
          [Op.ne]: null,
          [Op.lt]: new Date(),
        },
      },
      raw: true,
    });

    if (!silent && deleted > 0) {
      console.log(`Menghapus ${deleted} Clipboard yang expired`);
    }

    return deleted;
  } catch (err) {
    console.error("Pembersihan Clipboard yang expired gagal:", err.message);
    throw 0;
  }
}

module.exports = { cleanupExpiredClipboards };
