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
      script: './start-pm2.sh',
      interpreter: 'bash',
      autorestart: true,
      watch: false,
    }
  ]
};
