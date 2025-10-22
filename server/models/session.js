"use strict";
const { Model } = require("sequelize");

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
      token: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: {
          msg: "Token sudah digunakan",
        },
      },
      refresh_token: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: {
          msg: "Refresh token sudah digunakan",
        },
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          isDate: {
            msg: "Format tanggal tidak valid",
          },
        },
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
        },
        {
          fields: ["expires_at"],
        },
      ],
    }
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
          [sequelize.Op.lt]: new Date(),
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
          [sequelize.Op.gt]: new Date(),
        },
      },
      include: [
        {
          model: sequelize.models.Device,
          as: "device",
          attributes: ["id", "device_name", "device_type", "last_active"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
  };

  return Session;
};
