const { Op, Clipboard } = require("../models");
const dayjs = require("dayjs");

class ClipboardService {
  static async insertClipboard(data, options) {
    const { userId, content_name, content_type, content_text } = data;
    const context_size = content_text?.length || 0;
    const expire_at = process.env.CLIPBOARD_EXPIRE_HOURS;

    console.log("ClipboardService.insertClipboard", {
      userId,
      content_name,
      content_type,
      content_text,
      context_size,
      expire_at,
    });

    const clipboardId = await Clipboard.create(
      {
        user_id: userId,
        content_name,
        content_type,
        content_text,
        context_size,
        expire_at: dayjs().add(expire_at, "hour").toDate(),
      },
      { transaction: options.transaction },
    );

    return clipboardId.id;
  }
}

module.exports = ClipboardService;
