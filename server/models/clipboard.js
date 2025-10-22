"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Clipboard extends Model {
    static associate(models) {
      // Clipboard belongs to User
      Clipboard.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      // Clipboard belongs to Device
      Clipboard.belongsTo(models.Device, {
        foreignKey: "device_id",
        as: "device",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      // Clipboard has many ClipboardSyncs
      Clipboard.hasMany(models.ClipboardSync, {
        foreignKey: "clipboard_id",
        as: "syncs",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      // Clipboard has many ClipboardFavorites
      Clipboard.hasMany(models.ClipboardFavorite, {
        foreignKey: "clipboard_id",
        as: "favorites",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    }
  }

  Clipboard.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
      device_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Devices",
          key: "id",
        },
      },
      content_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          isIn: {
            args: [["text", "image", "file", "url"]],
            msg: "Content type harus salah satu dari: text, image, file, url",
          },
        },
      },
      content_text: {
        type: DataTypes.TEXT("long"),
        allowNull: true,
      },
      content_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
          isUrl: {
            msg: "Format URL tidak valid",
          },
        },
      },
      file_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      file_size: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: {
            args: [0],
            msg: "File size tidak boleh negatif",
          },
        },
      },
      is_encrypted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      is_synced: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      expire_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Clipboard",
      tableName: "Clipboards",
      updatedAt: false, // Clipboard tidak perlu updatedAt
      indexes: [
        {
          fields: ["user_id", "createdAt"],
        },
        {
          fields: ["device_id"],
        },
        {
          fields: ["content_type"],
        },
        {
          fields: ["expire_at"],
        },
      ],
      hooks: {
        // Auto delete expired clipboard
        beforeFind: async (options) => {
          if (!options.where) {
            options.where = {};
          }
          // Tambahkan kondisi untuk filter clipboard yang belum expired
          options.where = {
            ...options.where,
            [sequelize.Op.or]: [
              { expire_at: null },
              { expire_at: { [sequelize.Op.gt]: new Date() } },
            ],
          };
        },
      },
    }
  );

  // Helper method untuk cek apakah clipboard expired
  Clipboard.prototype.isExpired = function () {
    if (!this.expire_at) return false;
    return new Date() > new Date(this.expire_at);
  };

  // Helper method untuk format file size
  Clipboard.prototype.getFormattedFileSize = function () {
    if (!this.file_size) return "0 B";

    const units = ["B", "KB", "MB", "GB"];
    let size = this.file_size;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  return Clipboard;
};
