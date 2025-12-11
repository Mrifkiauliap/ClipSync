"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // User has many Devices
      User.hasMany(models.Device, {
        foreignKey: "user_id",
        as: "devices",
      });

      // User has many Clipboards
      User.hasMany(models.Clipboard, {
        foreignKey: "user_id",
        as: "clipboards",
      });

      // User has many Sessions
      User.hasMany(models.Session, {
        foreignKey: "user_id",
        as: "sessions",
      });

      // User has many ClipboardFavorites
      User.hasMany(models.ClipboardFavorite, {
        foreignKey: "user_id",
        as: "favorites",
      });
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      nama: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "Users",
      indexes: [
        {
          unique: true,
          fields: ["email"],
          name: "idx_user_email",
        },
      ],
    },
  );

  // Hide password in JSON responses
  User.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    delete values.password;
    return values;
  };

  return User;
};
