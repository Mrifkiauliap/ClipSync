"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ClipboardFavorite extends Model {
    static associate(models) {
      // ClipboardFavorite belongs to User
      ClipboardFavorite.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      // ClipboardFavorite belongs to Clipboard
      ClipboardFavorite.belongsTo(models.Clipboard, {
        foreignKey: "clipboard_id",
        as: "clipboard",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    }
  }

  ClipboardFavorite.init(
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
      clipboard_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Clipboards",
          key: "id",
        },
      },
    },
    {
      sequelize,
      modelName: "ClipboardFavorite",
      tableName: "ClipboardFavorites",
      updatedAt: false,
      indexes: [
        {
          unique: true,
          fields: ["user_id", "clipboard_id"],
          name: "unique_user_clipboard_favorite",
        },
      ],
    }
  );

  // Static method untuk toggle favorite
  ClipboardFavorite.toggleFavorite = async function (userId, clipboardId) {
    const existing = await this.findOne({
      where: {
        user_id: userId,
        clipboard_id: clipboardId,
      },
    });

    if (existing) {
      // Remove favorite
      await existing.destroy();
      return { isFavorite: false, message: "Removed from favorites" };
    } else {
      // Add favorite
      await this.create({
        user_id: userId,
        clipboard_id: clipboardId,
      });
      return { isFavorite: true, message: "Added to favorites" };
    }
  };

  // Static method untuk get all favorites by user
  ClipboardFavorite.getFavoritesByUser = async function (userId, options = {}) {
    const { limit = 20, offset = 0 } = options;

    return await this.findAndCountAll({
      where: { user_id: userId },
      include: [
        {
          model: sequelize.models.Clipboard,
          as: "clipboard",
          include: [
            {
              model: sequelize.models.Device,
              as: "device",
              attributes: ["id", "device_name", "device_type"],
            },
          ],
        },
      ],
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });
  };

  // Static method untuk check if clipboard is favorited
  ClipboardFavorite.isFavorited = async function (userId, clipboardId) {
    const count = await this.count({
      where: {
        user_id: userId,
        clipboard_id: clipboardId,
      },
    });
    return count > 0;
  };

  return ClipboardFavorite;
};
