const { Op, Clipboard, ClipboardFavorite, Device } = require("../../../models");
const dayjs = require("dayjs");

class Model_r {
  constructor(req) {
    this.req = req;
  }

  /**
   * Get clipboard list dengan pagination & filter
   */
  async get_clipboard() {
    const userId = this.req.user.id;
    const {
      page = 1,
      limit = 20,
      search = "",
      content_type,
      days = 30,
      device_id,
    } = this.req.query;

    const offset = (page - 1) * limit;

    try {
      // Fitur where conditions
      const whereConditions = {
        user_id: userId,
        createdAt: {
          [Op.gte]: dayjs().subtract(days, "day").toDate(),
        },
      };

      // Filter by content type
      if (content_type) {
        whereConditions.content_type = content_type;
      }

      // Filter by device
      if (device_id) {
        whereConditions.device_id = device_id;
      }

      // Search
      if (search) {
        whereConditions[Op.or] = [
          { content_name: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const clipboards = await Clipboard.findAndCountAll({
        limit: parseInt(limit),
        offset: parseInt(offset),
        where: whereConditions,
        order: [["createdAt", "DESC"]],
        include: [
          {
            model: Device,
            as: "device",
            attributes: ["id", "device_name", "device_type"],
          },
        ],
        attributes: [
          "id",
          "content_name",
          "content_type",
          "content_text",
          "context_size",
          "createdAt",
        ],
        raw: true,
        nest: true,
      });

      return {
        data: clipboards.rows.map((clipboard) => ({
          id: clipboard.id,
          content_name: clipboard.content_name,
          content_type: clipboard.content_type,
          content_text:
            clipboard.content_text?.length > 200
              ? clipboard.content_text.substring(0, 200) + "..."
              : clipboard.content_text,
          context_size: clipboard.context_size,
          device: clipboard.device
            ? {
                id: clipboard.device.id,
                name: clipboard.device.device_name,
                type: clipboard.device.device_type,
              }
            : null,
          createdAt: dayjs(clipboard.createdAt).format("YYYY-MM-DD HH:mm:ss"),
        })),
        total: clipboards.count,
        page: parseInt(page),
        limit: parseInt(limit),
        total_pages: Math.ceil(clipboards.count / limit),
      };
    } catch (error) {
      console.error("Error fetching clipboard:", error);
      return { error: true, message: error.message };
    }
  }

  /**
   * Get 9 clipboard terbaru
   */
  async get_recent_clipboard() {
    const userId = 1;

    try {
      const clipboards = await Clipboard.findAndCountAll({
        where: { user_id: userId },
        include: [
          {
            model: Device,
            as: "device",
            attributes: ["id", "device_name", "device_type"],
          },
        ],
        order: [["createdAt", "DESC"]],
        limit: 9,
        attributes: [
          "id",
          "content_name",
          "content_type",
          "content_text",
          "context_size",
          "createdAt",
        ],
        raw: true,
        nest: true,
      });

      return {
        data: clipboards.rows.map((clipboard) => ({
          id: clipboard.id,
          content_name: clipboard.content_name,
          content_type: clipboard.content_type,
          content_text:
            clipboard.content_text?.length > 100
              ? clipboard.content_text.substring(0, 100) + "..."
              : clipboard.content_text,
          context_size: clipboard.context_size || 0,
          device: clipboard.device
            ? {
                id: clipboard.device.id,
                name: clipboard.device.device_name,
              }
            : null,
          createdAt: dayjs(clipboard.createdAt).format("YYYY-MM-DD HH:mm:ss"),
        })),
        total: clipboards.count,
      };
    } catch (error) {
      console.error("Error fetching recent clipboard:", error);
      return { error: true, message: error.message };
    }
  }

  /**
   * Get clipboard by ID
   */
  async get_clipboard_by_id() {
    const userId = this.req.user.id;
    const clipboardId = this.req.params.id;

    try {
      const [clipboard, isFavClip] = await Promise.all([
        Clipboard.findOne({
          where: {
            id: clipboardId,
            user_id: userId,
          },
        }),
        ClipboardFavorite.findByPk(clipboardId),
      ]);

      return {
        data: {
          id: clipboard.id,
          content_type: clipboard.content_type,
          content_text: clipboard.content_text,
          content_url: clipboard.content_url,
          content_name: clipboard.content_name,
          context_size: clipboard.context_size,
          is_favorite: isFavClip ? true : false,
          device: clipboard.device
            ? {
                id: clipboard.device.id,
                name: clipboard.device.device_name,
                type: clipboard.device.device_type,
              }
            : null,
          createdAt: dayjs(clipboard.createdAt).format("YYYY-MM-DD HH:mm:ss"),
        },
      };
    } catch (error) {
      console.error("Error fetching clipboard by ID:", error);
      return { error: true, message: error.message };
    }
  }

  /**
   * Get clipboard statistics
   */
  async get_clipboard_stats() {
    const userId = this.req.user.id;

    try {
      const [total, textCount, urlCount, favoriteCount] = await Promise.all([
        Clipboard.count({ where: { user_id: userId } }),
        Clipboard.count({
          where: { user_id: userId, content_type: "text" },
        }),
        Clipboard.count({
          where: { user_id: userId, content_type: "url" },
        }),
        ClipboardFavorite.count({
          where: { user_id: userId },
        }),
      ]);

      // Get today's clipboard count
      const todayStart = dayjs().startOf("day").toDate();
      const todayCount = await Clipboard.count({
        where: {
          user_id: userId,
          createdAt: { [Op.gte]: todayStart },
        },
      });

      return {
        data: {
          total,
          by_type: {
            text: textCount,
            url: urlCount,
          },
          favorites: favoriteCount,
          today: todayCount,
        },
      };
    } catch (error) {
      console.error("Error fetching clipboard stats:", error);
      return { error: true, message: error.message };
    }
  }
}

module.exports = Model_r;
