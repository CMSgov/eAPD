const logger = require('../../logger')('me route get');
const {
  jwtExtractor,
  verifyEAPDToken,
  exchangeToken,
  verifyWebToken
} = require('../../auth/jwtUtils');
const { createOrUpdateOktaUserFromOkta } = require('../../db/oktaUsers');

module.exports = (
  app,
  {
    extractor = jwtExtractor,
    verifier = verifyEAPDToken,
    tokenExchanger = exchangeToken,
    updateFromOkta = createOrUpdateOktaUserFromOkta
  } = {}
) => {
  logger.debug('setting up GET endpoint');
  app.get('/me', async (req, res, next) => {
    try {
      const jwt = extractor(req);
      const claims = jwt ? await verifyWebToken(jwt, { verifier }) : false;
      if (!claims) return res.status(401).end();
      await updateFromOkta(claims.id);
      return res.send(claims);
    } catch (e) {
      return next(e);
    }
  });

  app.get('/me/jwToken', async (req, res, next) => {
    try {
      const user = await tokenExchanger(req, res);
      if (!user) return res.status(401).send();
      return res.send(user);
    } catch (e) {
      return next(e);
    }
  });
};
