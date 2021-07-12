module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      host: process.env.DEV_DB_HOST || 'db',
      database: process.env.DEV_DB_NAME || 'hitech_apd',
      user: process.env.DEV_DB_USER || 'postgres',
      password: process.env.DEV_DB_PASSWORD || 'cms'
    },
    seeds: { directory: './seeds/development' }
  },

  test: {
    client: 'postgresql',
    connection: {
      host: process.env.TEST_DB_HOST || 'db',
      database: 'hitech_apd_test',
      user: 'postgres',
      password: 'cms'
    },
    seeds: { directory: './seeds/test' }
  },

  production: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL,
    seeds: { directory: './seeds/production' }
  }
};
