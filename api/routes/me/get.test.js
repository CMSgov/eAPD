const tap = require('tap');
const sinon = require('sinon');
const getEndpoint = require('./get');

const mockExpress = require('../../util/mockExpress');
const mockResponse = require('../../util/mockResponse');

let app;
let res;
let next;
const req = { jwt: 'aaaa.bbbb.cccc' };
const user = { uid: 1234, state: { id: 'ak' } };
const claims = { id: 123, claims: 'this is a claim' };

tap.test('me GET endpoint', async endpointTest => {
  endpointTest.beforeEach(async () => {
    app = mockExpress();
    res = mockResponse();
    next = sinon.stub();
  });

  endpointTest.test('setup', async setupTest => {
    getEndpoint(app);

    setupTest.ok(
      app.get.calledWith('/me', sinon.match.func),
      'me GET endpoint is registered'
    );
  });

  endpointTest.test('get me handler', async test => {
    const extractor = sinon.stub();
    const eapdTokenVerifier = sinon.stub();
    const updateFromOkta = sinon.stub();

    extractor.withArgs(req).returns(req.jwt);

    eapdTokenVerifier.withArgs(req.jwt).resolves(claims);

    getEndpoint(app, {
      extractor,
      verifier: eapdTokenVerifier,
      updateFromOkta
    });
    const meHandler = app.get.args.filter(arg => arg[0] === '/me')[0][1];

    await meHandler(req, res, next);

    test.ok(
      extractor.calledWith(req),
      'calls the token extractor with the request'
    );

    test.ok(
      eapdTokenVerifier.calledWith(req.jwt),
      'calls the token extractor with the request'
    );

    test.ok(updateFromOkta.calledWith(123));

    test.ok(res.send.calledWith(claims), 'sends back the claims object');
  });

  endpointTest.test(
    "get me handler returns 401 if it can't extract a token ",
    async test => {
      const extractor = sinon.stub();
      const eapdTokenVerifier = sinon.stub();

      extractor.withArgs(req).returns('');

      getEndpoint(app, { extractor });
      const meHandler = app.get.args.filter(arg => arg[0] === '/me')[0][1];

      await meHandler(req, res, next);

      test.ok(
        extractor.calledWith(req),
        'calls the token extractor with the request'
      );

      test.ok(eapdTokenVerifier.notCalled, "doesn't call the token verifier");

      test.ok(res.status.calledWith(401), 'returns a 401 status code');
    }
  );

  endpointTest.test(
    "get me handler returns 401 if it can't verify a token ",
    async test => {
      const extractor = sinon.stub();
      const eapdTokenVerifier = sinon.stub();

      extractor.withArgs(req).returns(req.jwt);

      eapdTokenVerifier.withArgs(req.jwt).resolves(null);

      getEndpoint(app, { extractor, verifier: eapdTokenVerifier });
      const meHandler = app.get.args.filter(arg => arg[0] === '/me')[0][1];

      await meHandler(req, res, next);

      test.ok(
        extractor.calledWith(req),
        'calls the token extractor with the request'
      );

      test.ok(
        eapdTokenVerifier.calledWith(req.jwt),
        'call the token verifier with the JWT'
      );

      test.ok(res.status.calledWith(401), 'returns a 401 status code');
    }
  );

  endpointTest.test(
    'get me handler returns 400 if the verifier throws an error ',
    async test => {
      const extractor = sinon.stub();
      const eapdTokenVerifier = sinon.stub();
      const error = new Error('some error');

      extractor.withArgs(req).returns(req.jwt);

      eapdTokenVerifier.withArgs(req.jwt).throws(error);

      getEndpoint(app, { extractor, verifier: eapdTokenVerifier });
      const meHandler = app.get.args.filter(arg => arg[0] === '/me')[0][1];

      await meHandler(req, res, next);

      test.ok(
        extractor.calledWith(req),
        'calls the token extractor with the request'
      );

      test.ok(
        eapdTokenVerifier.calledWith(req.jwt),
        'call the token verifier with the JWT'
      );

      test.ok(next.calledWith(error), 'returns a call to next');
    }
  );

  endpointTest.test('get me/jwToken handler returns a token', async test => {
    const tokenExchanger = sinon.stub();

    tokenExchanger.withArgs(req).returns(user);

    getEndpoint(app, { tokenExchanger });
    const meHandler = app.get.args.filter(
      arg => arg[0] === '/me/jwToken'
    )[0][1];

    await meHandler(req, res, next);

    test.ok(
      tokenExchanger.calledWith(req),
      'calls the token exchanger with the request'
    );

    test.ok(res.send.calledWith(user), 'returns a user');
  });

  endpointTest.test(
    'get me/jwToken handler returns a 401 when it there is no user',
    async test => {
      const tokenExchanger = sinon.stub();

      tokenExchanger.withArgs(req).returns(null);

      getEndpoint(app, { tokenExchanger });
      const meHandler = app.get.args.filter(
        arg => arg[0] === '/me/jwToken'
      )[0][1];

      await meHandler(req, res, next);

      test.ok(
        tokenExchanger.calledWith(req),
        'calls the token exchanger with the request'
      );

      test.ok(
        res.status.calledWith(401),
        'returns 401 because there was no user'
      );
    }
  );

  endpointTest.test(
    'get me/jwToken handler returns a 400 when it there is no user',
    async test => {
      const tokenExchanger = sinon.stub();
      const error = new Error('some error');

      tokenExchanger.withArgs(req).throws(error);

      getEndpoint(app, { tokenExchanger });
      const meHandler = app.get.args.filter(
        arg => arg[0] === '/me/jwToken'
      )[0][1];

      await meHandler(req, res, next);

      test.ok(
        tokenExchanger.calledWith(req),
        'calls the token exchanger with the request'
      );

      test.ok(next.calledWith(error), 'returns a call to next');
    }
  );
});
