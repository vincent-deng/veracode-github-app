const { handleRegister } = require('./handlers/register');
const { handleCompletedRun } = require('./handlers/completed-run');
const { handleEvents } = require('./handlers/handler');
const handleInstallationRepositories = require('./handlers/installation');

module.exports = async (app, { getRouter }) => {
  app.on(
    ["push", "pull_request"], 
    handleEvents.bind(null, app)
  );

  app.on(
    'workflow_run.completed', 
    handleCompletedRun.bind(null, app)
  );

  // app.on([
  //   "installation",
  //   "installation_repositories"
  //   ], 
  //   handleInstallationRepositories.bind(null, app)
  // );
  
  // app.on("check_run.rerequested", handleReRun);
  // app.on('pull_request.opened', async (context) => {
  //   console.log(context);
  // });

  app.on('issues.opened', async context => {
    app.log.info(context);
  });

  const router = getRouter('');
  router.get('/register', (req, res) => {
    handleRegister(req, res, { app });
  });

  router.get('/health-check', (req, res) => {
    return res.status(200).send('Hello World');
  });
};
