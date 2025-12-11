const { Device } = require("../../../models");
const dayjs = require("dayjs");

class Model_r {
  constructor(req) {
    this.req = req;
  }

  async get_device() {
    const userId = this.req.user.id;
    try {
      // Semua device user
      const { rows, count } = await Device.findAndCountAll({
        where: { user_id: userId, is_active: true },
        order: [["createdAt", "DESC"]],
        attributes: [
          "id",
          "device_name",
          "device_type",
          "last_active",
          "createdAt",
        ],
        raw: true,
        nest: true,
      });

      // Ambil device yang sedang online dari memory
      const activeDevices = this.req.app.getActiveDevices(userId);
      const activeIds = activeDevices.map((d) => d.deviceId || d.id);

      const data = rows.map((device) => ({
        id: device.id,
        device_name: device.device_name,
        device_type: device.device_type,
        last_active: device.last_active
          ? dayjs(device.last_active).format("YYYY-MM-DD HH:mm:ss")
          : null,
        createdAt: dayjs(device.createdAt).format("YYYY-MM-DD HH:mm:ss"),
        isOnline: activeIds.includes(device.id), // tandai online
      }));

      return { data, total: count };
    } catch (error) {
      console.error("Error fetching devices:", error);
      return { error: true, message: error.message };
    }
  }
}

module.exports = Model_r;
