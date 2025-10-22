"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const devices = [
      {
        user_id: 1,
        device_name: "Rifki's Laptop",
        device_identifier: "DEV-1-LAPTOP",
        device_type: "Desktop",
        last_active: new Date(),
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        user_id: 1,
        device_name: "Rifki's Phone",
        device_identifier: "DEV-1-PHONE",
        device_type: "Mobile",
        last_active: new Date(),
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        user_id: 2,
        device_name: "John's PC",
        device_identifier: "DEV-2-PC",
        device_type: "Desktop",
        last_active: new Date(),
        is_active: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        user_id: 2,
        device_name: "John's iPhone",
        device_identifier: "DEV-2-IPHONE",
        device_type: "Mobile",
        last_active: new Date(),
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        user_id: 3,
        device_name: "Alice's Tablet",
        device_identifier: "DEV-3-TABLET",
        device_type: "Tablet",
        last_active: new Date(),
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await queryInterface.bulkInsert("Devices", devices);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Devices", null, {});
  },
};
