require("dotenv").config();

const base = {
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_DATABASE,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  dialect: "mysql",
  timezone: "+07:00",

  define: {
    timestamps: true,
  },

  pool: {
    acquire: 30000,
    idle: 10000,
  },
};

module.exports = {
  development: {
    ...base,
    logging: true,
    pool: {
      ...base.pool,
      max: 5,
      min: 0,
    },
  },
  production: {
    ...base,
    logging: false,
    pool: {
      ...base.pool,
      max: 10,
      min: 2,
    },
  },
};
