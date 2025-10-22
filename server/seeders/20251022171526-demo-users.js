"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Users", [
      {
        nama: "Rifki Dev",
        email: "rifki@gmail.com",
        password:
          "$2a$10$Zr648UXQwtmNNUqeHhE5oujX.ecj7Kz4xL8Fv9iOQXMOREUf2PVDK", // nanti diganti bcrypt kalau mau real
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        nama: "John Doe",
        email: "john.doe@example.com",
        password:
          "$2a$10$Zr648UXQwtmNNUqeHhE5oujX.ecj7Kz4xL8Fv9iOQXMOREUf2PVDK",
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        nama: "Alice Test",
        email: "alice@example.com",
        password:
          "$2a$10$Zr648UXQwtmNNUqeHhE5oujX.ecj7Kz4xL8Fv9iOQXMOREUf2PVDK",
        is_active: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },
  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  },
};
