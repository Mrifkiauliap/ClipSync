const { sequelize, Session, Device } = require("../../../models");
const Model_r = require("../models/model_r");

class Model_cud {
  constructor(req) {
    this.req = req;
  }

  async initialize() {
    this.t = await sequelize.transaction();
    this.state = true;
  }

  async revoke_device() {
    await this.initialize();
    const deviceId = this.req.body.device_id;
    const userId = this.req.user.id;

    try {
      await Device.update(
        { is_active: false },
        {
          where: {
            id: deviceId,
            user_id: userId,
          },
          transaction: this.t,
        }
      );
      await Session.destroy({
        where: {
          user_id: userId,
          device_id: deviceId,
        },
        transaction: this.t,
      });
    } catch (error) {
      console.log("Error in revoke_device:", error);
      this.state = false;
    }
  }

  async delete_device() {
    await this.initialize();
    const deviceId = this.req.body.device_id;
    const userId = this.req.user.id;

    try {
      await Device.destroy({
        where: {
          id: deviceId,
          user_id: userId,
        },
        transaction: this.t,
      });
      await Session.destroy({
        where: {
          user_id: userId,
          device_id: deviceId,
        },
        transaction: this.t,
      });
    } catch (error) {
      console.log("Error in delete_device:", error);
      this.state = false;
    }
  }

  // commit or rollback transaction
  async response() {
    if (this.state) {
      await this.t.commit();
      return true;
    } else {
      await this.t.rollback();
      return false;
    }
  }
}

module.exports = Model_cud;
