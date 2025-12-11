const Model_r = require("../models/model_r");
const Model_cud = require("../models/model_cud");
const {
  handleValidationErrors,
  handleServerError,
} = require("../../../helper/handleError");

const controllers = {};

/**
 * Get clipboard list dengan pagination
 */
controllers.get_clipboard = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;
  try {
    const model_r = new Model_r(req);
    const feedBack = await model_r.get_clipboard();

    res.status(200).json({
      error: false,
      data: feedBack.data,
      pagination: {
        total: feedBack.total,
        page: feedBack.page,
        limit: feedBack.limit,
        total_pages: feedBack.total_pages,
      },
    });
  } catch (error) {
    handleServerError(res, error);
  }
};

/**
 * Get recent clipboard (9 terakhir)
 */
controllers.get_recent_clipboard = async (req, res) => {
  try {
    const model_r = new Model_r(req);
    const feedBack = await model_r.get_recent_clipboard();

    res.status(200).json({
      error: false,
      data: feedBack.data,
      total: feedBack.total,
    });
  } catch (error) {
    handleServerError(res, error);
  }
};

/**
 * Get clipboard by ID
 */
controllers.get_clipboard_by_id = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;
  try {
    const model_r = new Model_r(req);
    const feedBack = await model_r.get_clipboard_by_id();

    if (!feedBack.data) {
      return res.status(404).json({
        error: true,
        message: "Clipboard tidak ditemukan",
      });
    }

    res.status(200).json({
      error: false,
      data: feedBack.data,
      total: 1,
    });
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.create_clipboard = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_cud = new Model_cud(req);
    const data = await model_cud.create_clipboard();

    if (await model_cud.response()) {
      const userId = req.user.id;

      // Emit ke semua device user via helper
      req.app.emitToUser(userId, "clipboard:new", {
        clipboardId: data.clipboard_id,
        deviceId: data.device_id,
        contentName: data.content_name,
        contentType: data.content_type,
        contentText: data.content_text,
        contextSize: data.context_size,
        timestamp: new Date().toISOString(),
      });

      res.status(201).json({
        error: false,
        message: "Clipboard berhasil dibuat",
        data: { id: data.clipboard_id },
      });
    } else {
      res.status(500).json({
        error: true,
        message: "Clipboard gagal dibuat",
      });
    }
  } catch (error) {
    handleServerError(res, error);
  }
};

/**
 * Delete clipboard
 */
controllers.delete_clipboard = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;
  try {
    const model_cud = new Model_cud(req);
    await model_cud.delete_clipboard();

    if (await model_cud.response()) {
      res.status(200).json({
        error: false,
        message: "Clipboard berhasil dihapus",
      });
    } else {
      res.status(404).json({
        error: true,
        message: "Clipboard tidak ditemukan atau gagal dihapus",
      });
    }
  } catch (error) {
    handleServerError(res, error);
  }
};

/**
 * Delete multiple clipboard
 */
controllers.delete_clipboard_bulk = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;
  try {
    const model_cud = new Model_cud(req);
    const deletedCount = await model_cud.delete_clipboard_bulk();

    if (await model_cud.response()) {
      res.status(200).json({
        error: false,
        message: `${deletedCount} clipboard berhasil dihapus`,
        deleted_count: deletedCount,
      });
    } else {
      res.status(500).json({
        error: true,
        message: "Gagal menghapus clipboard",
      });
    }
  } catch (error) {
    handleServerError(res, error);
  }
};

/**
 * Toggle favorite status
 */
controllers.toggle_favorite = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;
  try {
    const model_cud = new Model_cud(req);
    await model_cud.toggle_favorite();

    if (await model_cud.response()) {
      res.status(200).json({
        error: false,
        message: "Status favorite berhasil diubah",
      });
    } else {
      res.status(404).json({
        error: true,
        message: "Clipboard tidak ditemukan",
      });
    }
  } catch (error) {
    handleServerError(res, error);
  }
};

/**
 * Get clipboard statistics
 */
controllers.get_clipboard_stats = async (req, res) => {
  try {
    const model_r = new Model_r(req);
    const feedBack = await model_r.get_clipboard_stats();

    res.status(200).json({
      error: false,
      data: feedBack.data,
    });
  } catch (error) {
    handleServerError(res, error);
  }
};

module.exports = controllers;
