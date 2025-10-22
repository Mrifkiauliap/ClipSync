const { Op, User } = require("../../../models");
const moment = require("moment");

class Model_r {
  constructor(req) {
    this.req = req;
  }

  async userProfile() {
    const userId = this.req.userId;

    const data = await User.findOne({
      where: { id: userId },
      attributes: ["id", "nama", "email", "is_active", "createdAt"],
    });

    return {
      data,
      total: 1,
    };
  }
}

module.exports = Model_r;
