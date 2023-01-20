const { handlePush } = require('./handlers/push');
const { handleRegister } = require('./handlers/register');
const { handleCompletedRun } = require('./handlers/completed-run');

module.exports = async (app, { getRouter }) => {
  app.on('push', handlePush);
  app.on("workflow_run.completed", context => {
    handleCompletedRun(context, { app })});
  // app.on("check_run.rerequested", handleReRun);
  // app.on('pull_request.opened', async (context) => {
  //   console.log(context);
  // });

  const router = getRouter('');
  router.get('/register', (req, res) => {
    handleRegister(req, res, { app });
  });
};
