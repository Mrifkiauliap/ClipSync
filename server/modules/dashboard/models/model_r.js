const { Device, Clipboard, ClipboardFavorite } = require("../../../models");
const dayjs = require("dayjs");

class Model_r {
  constructor(req) {
    this.req = req;
  }

  async info_dashboard() {
    const userId = this.req.user.id;
    try {
      const [deviceCount, clipboardCount, favoriteCount, recentClipboard] =
        await Promise.all([
          Device.count({
            where: {
              user_id: userId,
              is_active: true,
            },
          }),
          Clipboard.count({
            where: {
              user_id: userId,
            },
          }),
          ClipboardFavorite.count({
            where: {
              user_id: userId,
            },
          }),
          Clipboard.findAll({
            where: { user_id: userId },
            order: [["createdAt", "DESC"]],
            limit: 3,
            attributes: [
              "id",
              "content_name",
              "content_type",
              "content_text",
              "context_size",
              "createdAt",
            ],
            raw: true,
          }),
        ]);

      return {
        deviceCount,
        clipboardCount,
        favoriteCount,
        recentClipboard: recentClipboard.map((item) => ({
          id: item.id,
          content_name: item.content_name,
          content_type: item.content_type,
          content_text: item.content_text,
          context_size: item.context_size,
          createdAt: dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss"),
        })),
      };
    } catch (error) {
      console.error("Error fetching devices:", error);
      return { error: true, message: error.message };
    }
  }
}

module.exports = Model_r;
