"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // User has many Devices
      User.hasMany(models.Device, {
        foreignKey: "user_id",
        as: "devices",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      // User has many Clipboards
      User.hasMany(models.Clipboard, {
        foreignKey: "user_id",
        as: "clipboards",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      // User has many Sessions
      User.hasMany(models.Session, {
        foreignKey: "user_id",
        as: "sessions",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      // User has many ClipboardFavorites
      User.hasMany(models.ClipboardFavorite, {
        foreignKey: "user_id",
        as: "favorites",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
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
        validate: {
          notEmpty: {
            msg: "Nama tidak boleh kosong",
          },
          len: {
            args: [2, 100],
            msg: "Nama harus antara 2-100 karakter",
          },
        },
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: {
          msg: "Email sudah terdaftar",
        },
        validate: {
          isEmail: {
            msg: "Format email tidak valid",
          },
          notEmpty: {
            msg: "Email tidak boleh kosong",
          },
        },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Password tidak boleh kosong",
          },
          len: {
            args: [6, 255],
            msg: "Password minimal 6 karakter",
          },
        },
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
        },
      ],
    }
  );

  // Hide password in JSON responses
  User.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    delete values.password;
    return values;
  };

  return User;
};
