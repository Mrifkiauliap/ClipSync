const {
  Op,
  sequelize,
  Clipboard,
  ClipboardFavorite,
} = require("../../../models");
const dayjs = require("dayjs");

class Model_cud {
  constructor(req) {
    this.req = req;
  }

  async initialize() {
    this.t = await sequelize.transaction();
    this.state = true;
  }

  /**
   * Create clipboard baru
   */
  async create_clipboard() {
    await this.initialize();
    const expire_at = process.env.CLIPBOARD_EXPIRE_HOURS;
    const userId = this.req.user.id;
    const { content_type, content_text, device_id } = this.req.body;

    try {
      const insert = await Clipboard.create(
        {
          user_id: userId,
          device_id: device_id,
          content_name: content_name || null,
          content_type: content_type,
          content_text: content_text || null,
          context_size: content_text.length || 0,
          expire_at: dayjs().add(expire_at, "hour").toDate(),
        },
        { transaction: this.t },
      );

      return {
        data: {
          clipboard_id: insert.id,
          device_id: insert.device_id,
          content_name: insert.content_name,
          content_type: insert.content_type,
          content_text: insert.content_text,
          context_size: insert.context_size,
        },
      };
    } catch (error) {
      console.error("Error in create_clipboard:", error);
      this.state = false;
      return null;
    }
  }

  /**
   * Delete clipboard
   */
  async delete_clipboard() {
    await this.initialize();
    const userId = this.req.user.id;
    const clipboardId = this.req.params.id;

    try {
      const deleted = await Clipboard.destroy({
        where: {
          id: clipboardId,
          user_id: userId,
        },
        transaction: this.t,
      });

      if (deleted === 0) {
        this.state = false;
      }
    } catch (error) {
      console.error("Error in delete_clipboard:", error);
      this.state = false;
    }
  }

  /**
   * Delete multiple clipboard
   */
  async delete_clipboard_bulk() {
    await this.initialize();
    const userId = this.req.user.id;
    const { clipboard_ids } = this.req.body;

    try {
      const deletedCount = await Clipboard.destroy({
        where: {
          id: clipboard_ids,
          user_id: userId,
        },
        transaction: this.t,
      });

      return deletedCount;
    } catch (error) {
      console.error("Error in delete_clipboard_bulk:", error);
      this.state = false;
      return 0;
    }
  }

  /**
   * Toggle favorite status
   */
  async toggle_favorite() {
    await this.initialize();
    const userId = this.req.user.id;
    const clipboardId = this.req.body.id;

    try {
      const favorite = await ClipboardFavorite.create(
        {
          user_id: userId,
          clipboard_id: clipboardId,
        },
        { transaction: this.t },
      );

      if (favorite === 0) {
        this.state = false;
      }
    } catch (error) {
      console.error("Error in toggle_favorite:", error);
      this.state = false;
    }
  }

  /**
   * Commit or rollback transaction
   */
  async response() {
    if (this.state) {
      await this.t.commit();
      return true;
    } else {
      await this.t.rollback();
      return false;
    }
  }
}

module.exports = Model_cud;
