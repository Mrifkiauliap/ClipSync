"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Device extends Model {
    static associate(models) {
      // Device belongs to User
      Device.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      // Device has many Clipboards
      Device.hasMany(models.Clipboard, {
        foreignKey: "device_id",
        as: "clipboards",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      // Device has many ClipboardSyncs (as target)
      Device.hasMany(models.ClipboardSync, {
        foreignKey: "target_device_id",
        as: "sync_targets",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      // Device has many Sessions
      Device.hasMany(models.Session, {
        foreignKey: "device_id",
        as: "sessions",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    }
  }

  Device.init(
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
      device_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Nama device tidak boleh kosong",
          },
        },
      },
      device_identifier: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: {
          msg: "Device identifier sudah terdaftar",
        },
        validate: {
          notEmpty: {
            msg: "Device identifier tidak boleh kosong",
          },
        },
      },
      device_type: {
        type: DataTypes.STRING(50),
        defaultValue: "android",
        allowNull: false,
        validate: {
          isIn: {
            args: [["android", "ios", "web", "desktop"]],
            msg: "Device type harus salah satu dari: android, ios, web, desktop",
          },
        },
      },
      last_active: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Device",
      tableName: "Devices",
      indexes: [
        {
          fields: ["user_id"],
        },
        {
          unique: true,
          fields: ["device_identifier"],
        },
      ],
    }
  );

  return Device;
};
