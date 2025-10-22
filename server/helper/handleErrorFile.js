const { validationResult } = require("express-validator");
const fs = require("fs");

const helper = {};

function deleteUploadedFiles(req) {
  // Kalau single upload
  if (req.file && req.file.path) {
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Gagal hapus file:", err);
    });
  }

  // Kalau multiple upload (array atau object)
  if (req.files) {
    // req.files bisa array (upload.array) atau object (upload.fields)
    if (Array.isArray(req.files)) {
      req.files.forEach((file) => {
        if (file.path) {
          fs.unlink(file.path, (err) => {
            if (err) console.error("Gagal hapus file:", err);
          });
        }
      });
    } else {
      // upload.fields -> { field1: [file1, file2], field2: [file3] }
      Object.values(req.files).forEach((fileArray) => {
        fileArray.forEach((file) => {
          if (file.path) {
            fs.unlink(file.path, (err) => {
              if (err) console.error("Gagal hapus file:", err);
            });
          }
        });
      });
    }
  }
}

helper.handleFileErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    deleteUploadedFiles(req); // hapus semua file kalau ada error
  }

  next();
};

module.exports = helper;
