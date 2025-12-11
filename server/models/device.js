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
      });

      // Device has many Sessions
      Device.hasMany(models.Session, {
        foreignKey: "device_id",
        as: "sessions",
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
      },
      device_identifier: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      device_type: {
        type: DataTypes.STRING(50),
        defaultValue: "android",
        allowNull: false,
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
          name: "idx_user_device",
        },
        {
          unique: true,
          fields: ["device_identifier"],
          name: "idx_device_identifier",
        },
        {
          fields: ["id", "user_id", "is_active"],
          name: "idx_device_id_user_id_is_active",
        },
      ],
    },
  );

  return Device;
};
