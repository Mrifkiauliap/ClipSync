"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    const clipboards = [
      {
        user_id: 1,
        device_id: 1,
        content_name: "Buat pengenalan",
        content_type: "text",
        content_text: "Hello world — first clipboard sync!",
        context_size: 35,
        is_synced: true,
        expire_at: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        user_id: 1,
        device_id: 1,
        content_name: "Meeting Notes",
        content_type: "text",
        content_text: "Meeting notes: check server logs & deploy patch v1.2",
        context_size: 52,
        is_synced: true,
        expire_at: null,
        createdAt: now,
        updatedAt: now,
      },
      // {
      //   user_id: 1,
      //   device_id: 1,
      //   content_type: "text",
      //   content_text:
      //     "Shopping list: coffee, oat milk, GPU (if budget fits 🤣)",
      //   content_url: null,
      //   file_name: null,
      //   file_size: null,
      //   is_synced: false,
      //   expire_at: null,
      //   createdAt: now,
      //   updatedAt: now,
      // },
      // {
      //   user_id: 1,
      //   device_id: 1,
      //   content_type: "text",
      //   content_text: "Temporary token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
      //   content_url: null,
      //   file_name: null,
      //   file_size: null,
      //   is_synced: false,
      //   expire_at: new Date(Date.now() + 60 * 60 * 1000), // expired in 1 hour
      //   createdAt: now,
      //   updatedAt: now,
      // },
      // {
      //   user_id: 1,
      //   device_id: 1,
      //   content_type: "text",
      //   content_text: "Backup plan: use websocket fallback when offline",
      //   content_url: null,
      //   file_name: null,
      //   file_size: null,
      //   is_synced: true,
      //   expire_at: null,
      //   createdAt: now,
      //   updatedAt: now,
      // },
      // {
      //   user_id: 1,
      //   device_id: 1,
      //   content_type: "text",
      //   content_text: "Random quote: 'Code never lies, comments sometimes do.'",
      //   content_url: null,
      //   file_name: null,
      //   file_size: null,
      //   is_synced: true,
      //   expire_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // expired in 1 day
      //   createdAt: now,
      //   updatedAt: now,
      // },
      // {
      //   user_id: 1,
      //   device_id: 1,
      //   content_type: "text",
      //   content_text: "Secret password: 123456",
      //   content_url: null,
      //   file_name: null,
      //   file_size: null,
      //   is_synced: false,
      //   expire_at: new Date(Date.now() + 60 * 60 * 1000), // expired in 1 hour
      //   createdAt: now,
      //   updatedAt: now,
      // },
    ];

    await queryInterface.bulkInsert("Clipboards", clipboards);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Clipboards", null, {});
  },
};
