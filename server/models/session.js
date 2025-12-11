"use strict";
const { Model, Op } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Session extends Model {
    static associate(models) {
      // Session belongs to User
      Session.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      // Session belongs to Device
      Session.belongsTo(models.Device, {
        foreignKey: "device_id",
        as: "device",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    }
  }

  Session.init(
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
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      device_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Devices",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      token: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      refresh_token: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Session",
      tableName: "Sessions",
      indexes: [
        {
          unique: true,
          fields: ["token"],
          name: "idx_session_token",
        },
        {
          unique: true,
          fields: ["refresh_token"],
          name: "idx_session_refresh_token",
        },
        {
          fields: ["user_id", "device_id"],
          name: "idx_session_user_device",
        },
        {
          fields: ["expires_at"],
          name: "idx_session_expires",
        },
      ],
    },
  );

  // Helper method untuk cek apakah session expired
  Session.prototype.isExpired = function () {
    return new Date() > new Date(this.expires_at);
  };

  // Helper method untuk extend session
  Session.prototype.extend = async function (days = 7) {
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + days);
    this.expires_at = newExpiresAt;
    return await this.save();
  };

  // Static method untuk cleanup expired sessions
  Session.cleanupExpiredSessions = async function () {
    const deleted = await this.destroy({
      where: {
        expires_at: {
          [Op.lt]: new Date(),
        },
      },
    });
    console.log(`Cleaned up ${deleted} expired sessions`);
    return deleted;
  };

  // Static method untuk get active sessions by user
  Session.getActiveSessionsByUser = async function (userId) {
    return await this.findAll({
      where: {
        user_id: userId,
        expires_at: {
          [Op.gt]: new Date(),
        },
      },
      include: [
        {
          model: models.Device,
          as: "device",
          attributes: ["id", "device_name", "device_type", "last_active"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
  };

  return Session;
};
