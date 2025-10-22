"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ClipboardSync extends Model {
    static associate(models) {
      // ClipboardSync belongs to Clipboard
      ClipboardSync.belongsTo(models.Clipboard, {
        foreignKey: "clipboard_id",
        as: "clipboard",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      // ClipboardSync belongs to Device (target device)
      ClipboardSync.belongsTo(models.Device, {
        foreignKey: "target_device_id",
        as: "target_device",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    }
  }

  ClipboardSync.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      clipboard_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Clipboards",
          key: "id",
        },
      },
      target_device_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Devices",
          key: "id",
        },
      },
      sync_status: {
        type: DataTypes.STRING(20),
        defaultValue: "pending",
        allowNull: false,
        validate: {
          isIn: {
            args: [["pending", "synced", "failed", "skipped"]],
            msg: "Sync status harus salah satu dari: pending, synced, failed, skipped",
          },
        },
      },
      synced_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "ClipboardSync",
      tableName: "ClipboardSyncs",
      updatedAt: false,
      indexes: [
        {
          unique: true,
          fields: ["clipboard_id", "target_device_id"],
          name: "unique_clipboard_device_sync",
        },
        {
          fields: ["sync_status"],
        },
      ],
      hooks: {
        // Auto set synced_at when status changes to 'synced'
        beforeUpdate: async (instance, options) => {
          if (
            instance.changed("sync_status") &&
            instance.sync_status === "synced"
          ) {
            instance.synced_at = new Date();
          }
        },
      },
    }
  );

  // Helper method untuk mark as synced
  ClipboardSync.prototype.markAsSynced = async function () {
    this.sync_status = "synced";
    this.synced_at = new Date();
    return await this.save();
  };

  // Helper method untuk mark as failed
  ClipboardSync.prototype.markAsFailed = async function () {
    this.sync_status = "failed";
    return await this.save();
  };

  // Static method untuk get pending syncs by device
  ClipboardSync.getPendingSyncsByDevice = async function (deviceId) {
    return await this.findAll({
      where: {
        target_device_id: deviceId,
        sync_status: "pending",
      },
      include: [
        {
          model: sequelize.models.Clipboard,
          as: "clipboard",
          include: [
            {
              model: sequelize.models.Device,
              as: "device",
            },
          ],
        },
      ],
      order: [["createdAt", "ASC"]],
    });
  };

  return ClipboardSync;
};
