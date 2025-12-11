"use strict";
const { Model, Op } = require("sequelize");

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
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      });

      // Clipboard has many ClipboardFavorites
      Clipboard.hasMany(models.ClipboardFavorite, {
        foreignKey: "clipboard_id",
        as: "favorites",
      });
    }
  }

  Clipboard.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
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
        allowNull: true,
        references: {
          model: "Devices",
          key: "id",
        },
      },
      content_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      content_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          isIn: {
            args: [["text", "url"]],
            msg: "Content type harus salah satu dari: text, url",
          },
        },
      },
      content_text: {
        type: DataTypes.TEXT("long"),
        allowNull: true,
      },
      context_size: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
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
      indexes: [
        {
          fields: ["user_id", "createdAt"],
          name: "idx_clipboard_created_per_user",
        },
        {
          fields: ["id", "user_id"],
          name: "idx_clipboard_id_user_id",
        },
        {
          fields: ["user_id"],
          name: "idx_clipboard_user_id",
        },
        {
          fields: ["device_id"],
          name: "idx_device_id",
        },
        {
          fields: ["content_type"],
          name: "idx_content_type",
        },
        {
          fields: ["expire_at"],
          name: "idx_clipboard_expired",
        },
      ],
    },
  );

  // Helper method untuk cek apakah clipboard expired
  Clipboard.prototype.isExpired = function () {
    if (!this.expire_at) return false;
    return new Date() > new Date(this.expire_at);
  };

  return Clipboard;
};
