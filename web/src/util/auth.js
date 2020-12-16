import { v4 as uuidv4 } from 'uuid';
import oktaAuth from './oktaAuth';
import { MFA_FACTORS } from '../constants';

export const INACTIVITY_LIMIT = 300000;
export const EXPIRE_EARLY_SECONDS = 300;

// Log in methods
export const authenticateUser = (username, password) => {
  return oktaAuth.signInWithCredentials({ username, password });
};

export const retrieveExistingTransaction = () => {
  const exists = oktaAuth.tx.exists();
  return exists ? oktaAuth.tx.resume() : null;
};

export const verifyMFA = async ({ transaction, otp }) => {
  return transaction.verify({
    passCode: otp,
    autoPush: true
  });
};

export const getSessionExpiration = async () => {
  const { expiresAt = null } =
    (await oktaAuth.tokenManager.get('accessToken')) || {};
  return expiresAt;
};

export const setTokens = sessionToken => {
  const stateToken = uuidv4();
  return oktaAuth.token
    .getWithoutPrompt({
      // responseType: ['id_token', 'token'],
      scopes: ['openid', 'email', 'profile'],
      sessionToken,
      state: stateToken
      // prompt: 'none'
    })
    .then(async res => {
      const { state: responseToken, tokens } = res;
      if (stateToken === responseToken) {
        await oktaAuth.tokenManager.setTokens(tokens);
        const expiresAt = await getSessionExpiration();
        return expiresAt;
      }
      throw new Error('Authentication failed');
    });
};

export const getAvailableFactors = factors =>
  factors.map(item => {
    const { factorType, provider } = item;
    const { displayName, active } = MFA_FACTORS[`${factorType}-${provider}`];
    return {
      ...item,
      displayName,
      active
    };
  });

export const getFactor = async mfaSelectedType => {
  const transaction = await retrieveExistingTransaction();
  if (transaction) {
    const check = MFA_FACTORS[mfaSelectedType].findType || (() => false);
    return transaction.factors.find(f => check(f));
  }
  return null;
};

// Token Manager methods

export const setTokenListeners = ({
  expiredCallback = null,
  errorCallback = null,
  renewedCallback = null,
  removedCallback = null
}) => {
  if (expiredCallback) oktaAuth.tokenManager.on('expired', expiredCallback);
  if (errorCallback) oktaAuth.tokenManager.on('error', errorCallback);
  if (renewedCallback) oktaAuth.tokenManager.on('renewed', renewedCallback);
  if (removedCallback) oktaAuth.tokenManager.on('removed', removedCallback);
};

export const getAccessToken = () => oktaAuth.getAccessToken();

const renewToken = async key => {
  const token = await oktaAuth.tokenManager.get(key);
  if (token) {
    if (oktaAuth.tokenManager.hasExpired(token)) {
      oktaAuth.tokenManager.remove(key);
    } else {
      await oktaAuth.tokenManager.renew(key);
    }
  }
};

export const renewTokens = async () => {
  await renewToken('accessToken');
  await renewToken('idToken');
  const expiresAt = await getSessionExpiration();
  return expiresAt;
};

export const removeTokenListeners = () => {
  oktaAuth.tokenManager.off('expired');
  oktaAuth.tokenManager.off('renewed');
  oktaAuth.tokenManager.off('error');
  oktaAuth.tokenManager.off('removed');
};

// Log out methods
export const logoutAndClearTokens = async () => {
  await oktaAuth.closeSession();
};

export const isUserActive = latestActivity => {
  const now = new Date().getTime();
  return now - latestActivity < INACTIVITY_LIMIT;
};
