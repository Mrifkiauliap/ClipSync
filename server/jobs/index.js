const { cleanupExpiredClipboards } = require("./cleanup");

async function startCleanupJob() {
  try {
    // run saat boot
    await cleanupExpiredClipboards();

    // interval job
    setInterval(
      async () => {
        console.log(`[${new Date().toISOString()}] Menjalankan job Cleanup`);
        await cleanupExpiredClipboards();
      },
      10 * 60 * 1000,
    ); // tiap 10 menit
  } catch (err) {
    console.error("Cleanup init gagal:", err.message);
  }
}

module.exports = { startCleanupJob };
