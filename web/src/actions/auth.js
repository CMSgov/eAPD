import axios from '../util/api';

import { fetchAllApds } from './app';
import { getRoles, getUsers } from './admin';
import {
  authenticateUser,
  retrieveExistingTransaction,
  verifyMFA,
  setTokens,
  getAvailableFactors,
  getFactor,
  logoutAndClearTokens
} from '../util/auth';
import { MFA_FACTOR_TYPES } from '../constants';

export const AUTH_CHECK_SUCCESS = 'AUTH_CHECK_SUCCESS';
export const AUTH_CHECK_FAILURE = 'AUTH_CHECK_FAILURE';

export const AUTH_CHECK_REQUEST = 'AUTH_CHECK_REQUEST';
export const LOGIN_REQUEST = 'LOGIN_REQUEST';
export const LOGIN_OTP_STAGE = 'LOGIN_OTP_STAGE';
export const LOGIN_MFA_REQUEST = 'LOGIN_MFA_REQUEST';
export const LOGIN_MFA_ENROLL_START = 'LOGIN_MFA_ENROLL_START';
export const LOGIN_MFA_ENROLL_ADD_PHONE = 'LOGIN_MFA_ENROLL_ADD_PHONE';
export const LOGIN_MFA_ENROLL_ACTIVATE = 'LOGIN_MFA_ENROLL_ACTIVATE';
export const LOGIN_MFA_FAILURE = 'LOGIN_MFA_FAILURE';
export const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
export const LOGIN_FAILURE = 'LOGIN_FAILURE';
export const LOCKED_OUT = 'LOCKED_OUT';
export const RESET_LOCKED_OUT = 'RESET_LOCKED_OUT';
export const LOGOUT_SUCCESS = 'LOGOUT_SUCCESS';

export const STATE_ACCESS_REQUEST = 'STATE_ACCESS_REQUEST';
export const STATE_ACCESS_SUCCESS = 'STATE_ACCESS_SUCCESS';
export const STATE_ACCESS_COMPLETE = 'STATE_ACCESS_COMPLETE';

export const requestAuthCheck = () => ({ type: AUTH_CHECK_REQUEST });
export const completeAuthCheck = user => ({
  type: AUTH_CHECK_SUCCESS,
  data: user
});
export const failAuthCheck = () => ({ type: AUTH_CHECK_FAILURE });

export const requestLogin = () => ({ type: LOGIN_REQUEST });
export const completeFirstStage = () => ({ type: LOGIN_OTP_STAGE });
export const mfaEnrollStart = (factors, phoneNumber) => ({
  type: LOGIN_MFA_ENROLL_START,
  data: { factors, phoneNumber }
});
export const mfaEnrollAddPhone = mfaEnrollType => ({
  type: LOGIN_MFA_ENROLL_ADD_PHONE,
  data: mfaEnrollType
});
export const mfaEnrollActivate = (mfaEnrollType, activationData) => ({
  type: LOGIN_MFA_ENROLL_ACTIVATE,
  data: { mfaEnrollType, activationData }
});
export const startSecondStage = () => ({ type: LOGIN_MFA_REQUEST });
export const completeLogin = user => ({ type: LOGIN_SUCCESS, data: user });
export const failLogin = error => ({ type: LOGIN_FAILURE, error });
export const failLoginMFA = error => ({ type: LOGIN_MFA_FAILURE, error });
export const failLoginLocked = () => ({ type: LOCKED_OUT });
export const resetLocked = () => ({ type: RESET_LOCKED_OUT });

export const completeLogout = () => ({ type: LOGOUT_SUCCESS });

export const requestAccessToState = () => ({ type: STATE_ACCESS_REQUEST });
export const successAccessToState = () => ({ type: STATE_ACCESS_SUCCESS });
export const completeAccessToState = () => ({ type: STATE_ACCESS_COMPLETE });

const loadData = activities => dispatch => {
  if (activities.includes('view-document')) {
    dispatch(fetchAllApds());
  }
  if (activities.includes('view-users')) {
    dispatch(getUsers());
  }
  if (activities.includes('view-roles')) {
    dispatch(getRoles());
  }
};

const getCurrentUser = () => dispatch => {
  dispatch(requestAccessToState());

  dispatch(
    completeLogin({
      id: '12345',
      email: 'bypass@email.com',
      name: 'Bypass User',
      position: '',
      state: null,
      states: [],
      activities: []
    })
  );
  dispatch(resetLocked());
};
// axios
//   .get('/me')
//   .then(userRes => {
//     if (userRes.data.states.length === 0) {
//       dispatch(requestAccessToState());
//     }
//     if (userRes.data.activities) {
//       dispatch(loadData(userRes.data.activities));
//     }
//     dispatch(completeLogin(userRes.data));
//     dispatch(resetLocked());
//   })
//   .catch(error => {
//     const reason = error ? error.message : 'N/A';
//     dispatch(failLogin(reason));
//   });

export const mfaConfig = (mfaSelected, phoneNumber) => async dispatch => {
  const factor = await getFactor(mfaSelected);

  if (factor) {
    const enrollTransaction =
      mfaSelected === MFA_FACTOR_TYPES.SMS ||
      mfaSelected === MFA_FACTOR_TYPES.CALL
        ? await factor.enroll({
            profile: { phoneNumber, updatePhone: true }
          })
        : await factor.enroll();

    if (enrollTransaction.status === 'MFA_ENROLL_ACTIVATE') {
      return dispatch(
        mfaEnrollActivate(mfaSelected, enrollTransaction.factor.activation)
      );
    }
  }
  return false;
};

export const mfaAddPhone = mfaSelected => async dispatch => {
  dispatch(mfaEnrollAddPhone(mfaSelected));
};

export const mfaActivate = code => async dispatch => {
  const transaction = await retrieveExistingTransaction();

  const activateTransaciton = await transaction.activate({
    passCode: code
  });

  if (activateTransaciton.status === 'SUCCESS') {
    await setTokens(activateTransaciton.sessionToken);
    dispatch(getCurrentUser());
  }
};

export const login = (username, password) => dispatch => {
  dispatch(requestLogin());
  authenticateUser(username, password)
    .then(async res => {
      if (res.status === 'LOCKED_OUT') {
        return dispatch(failLoginLocked());
      }
      // MFA enrollment starts here. If MFA is required as part
      // of a users policy, get the list of available options
      if (res.status === 'MFA_ENROLL') {
        const factors = getAvailableFactors(res.factors);
        return dispatch(mfaEnrollStart(factors));
      }

      if (res.status === 'MFA_REQUIRED') {
        const mfaFactor = res.factors.find(
          factor => factor.provider === 'OKTA' || factor.provider === 'GOOGLE'
        );

        if (!mfaFactor) throw new Error('Could not find a valid multi-factor');

        return mfaFactor.verify(res).then(() => {
          dispatch(completeFirstStage());
        });
      }

      if (res.status === 'SUCCESS') {
        await setTokens(res.sessionToken);
        return dispatch(getCurrentUser());
      }
      return null;
    })
    .catch(error => {
      const reason = error ? error.message : 'N/A';
      dispatch(failLogin(reason));
    });
};

export const loginOtp = otp => async dispatch => {
  dispatch(startSecondStage());
  const transaction = await retrieveExistingTransaction();
  if (transaction) {
    return verifyMFA({ transaction, otp })
      .then(async ({ sessionToken }) => {
        await setTokens(sessionToken);
        return dispatch(getCurrentUser());
      })
      .catch(error => {
        const reason = error ? error.message : 'N/A';
        if (reason === 'User Locked') {
          dispatch(failLoginLocked(reason));
        } else {
          dispatch(failLoginMFA(reason));
        }
      });
  }
  return dispatch(failLoginMFA('Authentication failed'));
};

export const createAccessRequest = states => dispatch => {
  states.forEach(stateId => {
    axios
      .post(`/states/${stateId}/affiliations`)
      .then(() => {
        dispatch(successAccessToState());
        dispatch(getCurrentUser());
      })
      .catch(error => {
        const reason = error ? error.message : 'N/A';
        dispatch(failLogin(reason));
      });
  });
};

export const logout = () => dispatch => {
  logoutAndClearTokens();
  dispatch(completeLogout());
};

export const checkAuth = () => (dispatch, getState) => {
  dispatch(requestAuthCheck());

  const {
    auth: { hasEverLoggedOn = false }
  } = getState();
  console.log({ hasEverLoggedOn });

  if (hasEverLoggedOn) {
    dispatch(
      completeAuthCheck({
        id: '12345',
        email: 'bypass@email.com',
        name: 'Bypass User',
        position: '',
        state: null,
        states: [],
        activities: []
      })
    );
    dispatch(loadData([]));
  }

  dispatch(failAuthCheck());

  // return axios
  //   .get('/me')
  //   .then(req => {
  //     dispatch(completeAuthCheck(req.data));
  //     dispatch(loadData(req.data.activities));
  //   })
  //   .catch(() => dispatch(failAuthCheck()));
};
