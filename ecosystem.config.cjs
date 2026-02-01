/**
 * PM2 config for Deuncify.
 * Use: pm2 start ecosystem.config.cjs
 *
 * IMPORTANT: Clone repo to a path WITHOUT leading hyphen, e.g.:
 *   git clone ... /var/www/Deuncify-Video-Processor
 * A leading hyphen in the path can cause ERR_MODULE_NOT_FOUND.
 */
module.exports = {
  apps: [
    {
      name: "deuncify",
      script: "/var/www/Deuncify-Video-Processor/dist/index.cjs",
      cwd: "/var/www/Deuncify-Video-Processor",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: { NODE_ENV: "production" },
    },
  ],
};
