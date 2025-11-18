const path = require('path');

// Get the directory where this config file is located
const projectRoot = __dirname;

module.exports = {
  apps: [
    {
      name: "orbit-hr-frontend",
      cwd: path.join(projectRoot, "Frontend"),
      script: "npm",
      args: "start -- --hostname ::",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: path.join(projectRoot, "logs", "orbit-hr-frontend-error.log"),
      out_file: path.join(projectRoot, "logs", "orbit-hr-frontend-out.log"),
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 4000,
    },
    {
      name: "orbit-hr-backend",
      cwd: path.join(projectRoot, "Backend"),
      script: path.join(projectRoot, "Backend", ".venv", "bin", "uvicorn"),
      args: "app.main:app --host 0.0.0.0 --port 8000",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      interpreter: "none",
      env: {
        PYTHONPATH: path.join(projectRoot, "Backend"),
        PATH: `${path.join(projectRoot, "Backend", ".venv", "bin")}:${process.env.PATH}`,
      },
      error_file: path.join(projectRoot, "logs", "orbit-hr-backend-error.log"),
      out_file: path.join(projectRoot, "logs", "orbit-hr-backend-out.log"),
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 4000,
    },
  ],
};
