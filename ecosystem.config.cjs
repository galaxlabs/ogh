module.exports = {
  apps: [
    {
      name: 'ogh-admin-api',
      cwd: '/home/fg/ogh/apps/admin-api',
      script: 'server.js',
      interpreter: 'node',
      env_file: '/home/fg/ogh/apps/admin-api/.env',
      autorestart: true,
      watch: false,
    },
    {
      name: 'ogh-pocketbase',
      cwd: '/home/fg/ogh/apps/pocketbase',
      script: './pocketbase',
      args: 'serve --http=0.0.0.0:8090 --encryptionEnv=PB_ENCRYPTION_KEY --dir=./pb_data_dev --migrationsDir=./pb_migrations --hooksDir=./pb_hooks --hooksWatch=false',
      interpreter: 'none',
      env_file: '/home/fg/ogh/.env',
      autorestart: true,
      watch: false,
    }
  ]
};
