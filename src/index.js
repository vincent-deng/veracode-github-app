const { app_route } = require('./utils/constants');
const { handlePush } = require('./handlers/push');
const { handleRegister } = require('./handlers/register');
const { handleCompletedRun } = require('./handlers/completed-run');
const { handleReRun } = require('./handlers/re-run');
const { dbConnect } = require('./utils/db-connect');

module.exports = async (app, { getRouter }) => {
  const { dbStatus } = await dbConnect();
  app.log.info("Yay, the app was loaded!");

  app.on('push', handlePush);
  app.on("workflow_run.completed", handleCompletedRun);
  app.on("check_run.rerequested", handleReRun);

  const router = getRouter(app_route);

  router.get('/register', (req, res) => {
    handleRegister(req, res, { app });
  });

  router.get('/health', (req, res) => {
    const { connection, dbState } = dbStatus();
    const status = connection === "up" && dbState === "connected" ? 200 : 503;
    res.status(status).json({
      ...dbStatus(),
    });
  });
};
