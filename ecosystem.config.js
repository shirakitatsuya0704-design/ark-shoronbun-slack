// ローカル開発用（pm2）
// シークレットは .env.ja に記述し、起動時に export で渡す
module.exports = {
  apps: [
    {
      name: "shoronbun-ja",
      script: "node",
      args: "-r ts-node/register src/index.ts",
      cwd: "/Users/tatsuyashiraki/ark_news_review",
      interpreter: "none",
      watch: false,
      autorestart: true,
      max_restarts: 5,
      restart_delay: 5000,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
