/* eslint-disable global-require, no-shadow */
const tap = require('tap');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');

const sandbox = sinon.createSandbox();
const mockVerifier = sandbox.stub();

const JWT_SECRET = process.env.JWT_SECRET || 'SOME_SECRET_VALUE_SHHHHH';
process.env.JWT_SECRET = JWT_SECRET;

tap.test('Okta jwtUtils', async t => {
  t.afterEach(async () => {
    sandbox.resetBehavior();
    sandbox.resetHistory();
  });

  t.test('verifyWebToken()', async t => {
    const { verifyWebToken } = require('./jwtUtils');

    t.test('given a valid JWT', async t => {
      const claims = { email: 'test@email.com' };
      mockVerifier.resolves(claims);
      const result = await verifyWebToken('good token', {
        verifier: mockVerifier
      });
      t.equal(result, claims, 'returns a valid claim');
    });

    t.test('given an invalid JWT string', async t => {
      mockVerifier.rejects({ message: 'bad token' });
      const result = await verifyWebToken('bad token', {
        verifier: mockVerifier
      });
      t.equal(result, false, 'returns false');
    });
  });

  t.test('jwtExtractor() Authorization test', async t => {
    const { jwtExtractor } = require('./jwtUtils');
    let request;

    t.beforeEach(async () => {
      request = new Map();
      request.url = '/apds';
      request.headers = {};
    });

    const scenarios = [
      ['Bearer xxx.yyy.zzz', 'xxx.yyy.zzz', 'returns the JWT'],
      ['bearer xxx.yyy.zzz', 'xxx.yyy.zzz', 'returns the JWT'],
      ['bearer', null, 'returns null'],
      ['', null, 'returns null'],
      ['Elephanter xxx.yyy.zzz', null, 'returns null']
    ];

    scenarios.forEach(([header, expected, message]) => {
      t.test(`given Authorization header is '${header}'`, async t => {
        request.set('Authorization', header);
        const result = jwtExtractor(request);
        t.equal(result, expected, message);
      });
    });
  });

  t.test('jwtExtractor() Cookie test', async t => {
    const { jwtExtractor } = require('./jwtUtils');
    let request;

    t.beforeEach(async () => {
      request = new Map();
      request.headers = {};
    });

    const scenarios = [
      [
        '/apds/1/files/12345',
        'gov.cms.eapd.api-token={%22accessToken%22%3A%22example.cookie.value%22%2C%22max-age%22%3A900}',
        'example.cookie.value',
        'returns the JWT'
      ],
      [
        '/apds/1/files/12345',
        'gov.cms.eapd.API-TOKEN={%22accessToken%22%3A%22example.cookie.value%22%2C%22max-age%22%3A900}',
        'example.cookie.value',
        'returns the JWT'
      ],
      [
        '/apds/1/files/12345',
        'gov.cms.eapd.hasConsented=true;',
        null,
        'returns null'
      ],
      ['/apds/1/files/12345', '', null, 'returns null'],
      ['/apds/1/files/12345', 'Elephanter xxx.yyy.zzz', null, 'returns null']
    ];

    scenarios.forEach(([url, cookie, expected, message]) => {
      t.test(`given Authorization cookie is '${cookie}'`, async t => {
        request.url = url;
        request.set('Cookie', cookie);
        const result = jwtExtractor(request);
        t.equal(result, expected, message);
      });
    });

    scenarios.forEach(([url, cookie, expected, message]) => {
      t.test(`given Authorization cookie is '${cookie}'`, async t => {
        request.url = url;
        request.headers.cookie = cookie;
        const result = jwtExtractor(request);
        t.equal(result, expected, message);
      });
    });
  });
});

tap.test('Local jwtUtils', async t => {
  const {
    getDefaultOptions,
    sign,
    actualVerifyEAPDToken,
    verifyWebToken,
    exchangeToken,
    changeState
  } = require('./jwtUtils');

  const payload = {
    user: 'Test User',
    role: 'Some Role',
    foo: 'bar',
    complexObject: {
      foo: 'bar',
      state: {
        id: 'ak'
      }
    }
  };

  t.test('getDefaultOptions', async () => {
    const options = getDefaultOptions();
    tap.matchSnapshot(options, 'output');
  });

  t.test('signing a payload', async t => {
    const token = sign(payload);

    // a jwt has 3 parts, separated by .
    t.ok(token.match(/\./g).length === 2, 'JWT is 3 parts');

    // Decodes WITHOUT verifying; only use if certain the token is valid
    // using this here to prevent a completely circular test
    const actualPayload = jwt.decode(token);

    Object.keys(payload).forEach(key => {
      t.same(actualPayload[key], payload[key], `${key} is in the jwt`);
    });

    t.equal(
      actualPayload.complexObject.state.id,
      'ak',
      'A complex object is stored correctly in the token'
    );
    t.equal(actualPayload.aud, 'eAPD', 'Token has the correct audience');
    t.equal(actualPayload.iss, 'eAPD', 'Token has the correct issuer');
    // iat = Issued At
    // nbf = Not Valid Before
    // These values should match because the token is valid the instant it is issued
    t.equal(
      actualPayload.iat,
      actualPayload.nbf,
      'Token has the same iat and nbf values'
    );
    // jwt time is epoch time in seconds so Date.now() is divided by 1000
    t.ok(
      actualPayload.iat < Date.now() / 1000 + 1,
      'Token was issued in the past'
    );

    // Expiration should be more than 11 hours from now
    t.ok(
      actualPayload.exp > Date.now() / 1000 + 11 * 60 * 60,
      'Token expires in more than 11 hours'
    );
    // and less than 13 hours from now
    t.ok(
      actualPayload.exp < Date.now() / 1000 + 13 * 60 * 60,
      'Token expires in less than 13 hours'
    );
  });

  t.test('verifying a payload', async t => {
    const token = sign(payload);

    t.ok(actualVerifyEAPDToken(token), 'a valid token was verified');
  });

  t.test('verifying a nonsensical token', async t => {
    const token = 'AAAAAAAAA.BBBBBBBBBBBBBBBBBBBBBBB.CCCCCCCCCCC';

    t.throws(() => actualVerifyEAPDToken(token), 'a bad token throws an error');
  });

  t.test('verifying a token signed with a different secret', async t => {
    const token = jwt.sign(payload, 'BBBBBBBBBBBBBBBBBBBBBBB');

    t.throws(() => actualVerifyEAPDToken(token), 'a bad token throws an error');
  });

  t.test('verifying a hacked token', async t => {
    const token = sign(payload);
    const tokenParts = token.split('.');

    t.ok(
      actualVerifyEAPDToken(tokenParts.join('.')),
      'splitting and reassembling the token works'
    );

    // hack the payload
    tokenParts[1] = 'CCCCCCCCCCCCCCCC';

    t.throws(
      () => actualVerifyEAPDToken(tokenParts.join('.')),
      'a bad token throws an error'
    );
  });

  t.test('overriding iss and aud options', async t => {
    const options = getDefaultOptions();
    const override = 'NOT EapD';
    options.audience = override;
    options.issuer = override;
    const token = sign(payload, options);
    // Decodes WITHOUT verifying; only use if certain the token is valid
    // using this here to prevent a completely circular test
    const actualPayload = jwt.decode(token);
    t.same(actualPayload.aud, override, 'audience was overwritten');
    t.same(actualPayload.iss, override, 'issuer was overwritten');
  });

  t.test('overriding expiration', async t => {
    const options = getDefaultOptions();
    options.expiresIn = 0;
    const token = sign(payload, options);
    // Decodes WITHOUT verifying; only use if certain the token is valid
    // using this here to prevent a completely circular test
    const actualPayload = jwt.decode(token);
    t.ok(actualPayload.exp < Date.now() / 1000 + 1);
    t.throws(() => actualVerifyEAPDToken(token), 'token is no longer valid');
  });

  t.test('works with the existing webTokenVerify', async t => {
    const token = sign(payload);

    // make sure the token is in fact valid
    t.ok(actualVerifyEAPDToken(token), 'a valid token was verified');

    const actualPayload = await verifyWebToken(token, {
      verifier: actualVerifyEAPDToken
    });
    // all of the keys seem to be here.
    Object.keys(payload).forEach(key => {
      t.same(actualPayload[key], payload[key], `${key} is in the jwt`);
    });
  });

  t.test('missing secret causes an error', async t => {
    // remove the JWT_SECRET from the environment.
    delete process.env.JWT_SECRET;

    // can't sign a payload without a JWT_SECRET
    t.throws(() => sign(payload), 'a missing JWT_SECRET throws an error');

    // reset the JWT_SECRET
    process.env.JWT_SECRET = JWT_SECRET;
  });

  t.test('changing the secret invalidates the token', async t => {
    // sanity check here because the rest of the test is inconclusive if this fails.
    const token = sign(payload);
    t.ok(actualVerifyEAPDToken(token), 'a valid token was verified');

    // Change the secret and the token is now invalid
    process.env.JWT_SECRET = 'ABCDEFG';
    t.throws(
      () => actualVerifyEAPDToken(token),
      'a changed JWT_SECRET throws an error'
    );

    // set it back and the token is valid again.
    process.env.JWT_SECRET = JWT_SECRET;
    t.ok(actualVerifyEAPDToken(token), 'a valid token was verified');
  });

  t.test('tokenExchanger works', async t => {
    const extractor = sinon.stub();
    const verifier = sinon.stub();
    const getUser = sinon.stub();

    const req = { jwt: 'AAAA.BBBB.DDDD' };
    const claims = { uid: '1234' };

    extractor.withArgs(req).returns(req.jwt);
    verifier.withArgs(req.jwt).resolves(claims);
    const { uid, ...additionalValues } = claims;
    getUser.withArgs(claims.uid, true, { additionalValues }).returns(claims);

    const user = await exchangeToken(req, {
      extractor,
      verifier,
      getUser
    });
    t.ok(user.jwt, 'user has a JWT');

    t.ok(actualVerifyEAPDToken(user.jwt), 'user has a valid JWT set on them');

    t.ok(user.uid, claims.uid, 'user has the expected value');
  });

  t.test(
    'tokenExchanger returns null if there is no JWT in the req',
    async t => {
      const extractor = sinon.stub();
      const oktaVerify = sinon.stub();
      const getUser = sinon.stub();

      const req = { jwt: 'AAAA.BBBB.DDDD' };
      const claims = { uid: '1234' };

      extractor.withArgs(req).returns(false);
      oktaVerify.withArgs(req.jwt).returns(claims);
      const { uid, ...additionalValues } = claims;
      getUser.withArgs(claims.uid, true, { additionalValues }).returns(claims);

      const user = await exchangeToken(req, {
        extractor,
        oktaVerify,
        getUser
      });
      t.same(user, null, 'user is null');

      t.ok(oktaVerify.notCalled, 'Okta not called because JWT was missing');

      t.ok(getUser.notCalled, 'get user not called because no JWT was present');
    }
  );

  t.test("tokenExchanger returns null if okta doesn't validate it", async t => {
    const extractor = sinon.stub();
    const verifier = sinon.stub();
    const getUser = sinon.stub();

    const req = { jwt: 'AAAA.BBBB.DDDD' };
    const claims = { uid: '1234' };

    extractor.withArgs(req).returns(req.jwt);
    verifier.withArgs(req.jwt).resolves(false);
    const { uid, ...additionalValues } = claims;
    getUser.withArgs(claims.uid, true, { additionalValues }).returns(claims);

    const user = await exchangeToken(req, {
      extractor,
      verifier,
      getUser
    });
    t.same(user, null, 'user is null');

    t.ok(verifier.calledWith(req.jwt), 'okta was called with the JWT');

    t.ok(getUser.notCalled, 'get user not called because no JWT was present');
  });

  t.test('Change State of a token', async t => {
    const getStateById = sinon.stub();
    getStateById.withArgs('new').resolves({
      id: 'new',
      address1: 'New Address1',
      director: {
        name: 'New Director'
      }
    });

    const originalPermissions = [
      'original-roles',
      'original-affiliations',
      'original-affiliations'
    ]
    const newPermissions = [
      'new-draft',
      'new-document',
      'new-document',
      'new-roles'
    ]
    const getUserPermissionsForStates = sinon.stub()
    getUserPermissionsForStates
      .withArgs('ABCD1234')
      .resolves({
        original:originalPermissions,
        new: newPermissions
      })


    const user = {
      id: 'ABCD1234',
      state: {
        id: 'original',
        address1: 'Original Address1',
        director: {
          name: 'Original Director'
        }
      },
      states: {original:'approved', new: 'approved'},

      foo: 'bar',
      activities: [
        'original-roles',
        'original-affiliations',
        'original-affiliations'
      ]
    };

    const token = await changeState(user, 'new', {
      getStateById_: getStateById,
      getUserPermissionsForStates_:getUserPermissionsForStates
    });
    const newUser = await actualVerifyEAPDToken(token);

    t.same(newUser.state.id, 'new', 'token has the new state');
    t.same(
      newUser.activities,
      newPermissions,
      'token activities are those from the right permission set'
    );

    t.same(user.state.id, 'original', 'original user is unchanged');
  });
});
