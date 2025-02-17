import { call, put, take, takeLatest } from "redux-saga/effects";
import {
  getUserInfo,
  sendAuthConfigured,
  sendInitComplete,
  setAdminOrgs,
  setOrganisationConfig,
  setUserInfo,
  types
} from "./ducks";
import {
  cognitoConfig as cognitoConfigFromEnv,
  cognitoInDev,
  isDevEnv,
  isProdEnv,
  ROLES
} from "../common/constants";
import http from "common/utils/httpClient";
import { configureAuth } from "./utils";
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { get, intersection, isEmpty } from "lodash";
import { userLogout } from "react-admin";
import Auth from "@aws-amplify/auth";

const api = {
  fetchCognitoDetails: () => http.fetchJson("/idp-details").then(response => response.json),
  fetchUserInfo: () => http.fetchJson("/me").then(response => response.json),
  fetchAdminOrgs: () => http.fetchJson("/organisation", {}, true).then(response => response.json),
  fetchTranslations: () => http.fetchJson("/web/translations").then(response => response.json),
  fetchOrganisationConfig: () =>
    http.fetchJson("/web/organisationConfig").then(response => response.json),
  saveUserInfo: userInfo => http.post("/me", userInfo),
  logout: () => http.get("/web/logout")
};

export function* initialiseCognito() {
  if (isProdEnv || cognitoInDev) {
    yield take(types.INIT_COGNITO);
    try {
      const cognitoDetails = cognitoInDev
        ? cognitoConfigFromEnv
        : yield call(api.fetchCognitoDetails);
      yield call(configureAuth, cognitoDetails);
      yield put(sendAuthConfigured());
    } catch (e) {
      yield call(alert, e);
    }
  } else {
  }
}

export function* onSetCognitoUser() {
  const action = yield take(types.SET_COGNITO_USER);
  yield call(http.initAuthContext, {
    username: action.payload.authData.username,
    idToken: action.payload.authData.signInUserSession.idToken.jwtToken
  });
  yield put(getUserInfo());
}

export function* saveUserInfoWatcher() {
  yield takeLatest(types.SAVE_USER_INFO, saveUserInfoWorker);
}

function* saveUserInfoWorker(action) {
  yield call(api.saveUserInfo, action.userInfo);
  yield put(setUserInfo(action.userInfo));
}

export function* userInfoWatcher() {
  yield takeLatest(types.GET_USER_INFO, setUserDetails);
}

function* setUserDetails() {
  const userDetails = yield call(api.fetchUserInfo);
  const translationData = yield call(api.fetchTranslations);
  if (!isEmpty(intersection(userDetails.roles, [ROLES.ADMIN]))) {
    const organisations = yield call(api.fetchAdminOrgs);
    yield put(setAdminOrgs(organisations));
  }
  yield put(setUserInfo(userDetails));
  const organisationName = get(userDetails, "organisationName", "");
  document.cookie = `IMPLEMENTATION-NAME=${encodeURIComponent(organisationName)}; path=/`;
  if (!isEmpty(organisationName)) {
    const organisationConfig = yield call(api.fetchOrganisationConfig);
    yield put(setOrganisationConfig(get(organisationConfig, "organisationConfig", {})));
  }
  const i18nInstance = i18n.use(initReactI18next).use(LanguageDetector);
  const i18nParams = {
    resources: translationData,
    fallbackLng: "en",
    lng: userDetails.settings ? userDetails.settings.locale : "en",
    debug: false,
    ns: ["translations"],
    defaultNS: "translations",
    keySeparator: false,
    nsSeparator: false,
    interpolation: {
      escapeValue: false,
      formatSeparator: ","
    },
    react: {
      wait: true
    }
  };
  const init = params => i18nInstance.init(params);
  yield call(init, i18nParams);

  if (isDevEnv && !cognitoInDev) {
    yield call(http.initAuthContext, { username: userDetails.username });
  }
  yield put(sendInitComplete());
}

export function* getAdminOrgsWatcher() {
  yield takeLatest(types.GET_ADMIN_ORGANISATIONS, setAdminOrgsWorker);
}

function* setAdminOrgsWorker() {
  const organisations = yield call(api.fetchAdminOrgs);
  yield put(setAdminOrgs(organisations));
}

function* logoutWorker() {
  console.log("calling api");
  yield call(api.logout);
  localStorage.clear();
  userLogout() && Auth.signOut().then(() => (document.location.href = "/"));
}

export function* logoutWatcher() {
  yield takeLatest(types.LOGOUT, logoutWorker);
}
