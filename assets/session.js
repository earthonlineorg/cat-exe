/* EARTH.ONLINE shared browser session client.
 * The backend rotates refresh tokens, so all refreshes in this tab share one promise.
 * This module never treats a cached profile or account flag as authentication. */
(function (window) {
  'use strict';

  /* Public UI must never echo an arbitrary server/network error string. Keep
     the allow-list here so every page uses the same safe wording. */
  if (!window.EOPublicError) {
    var PUBLIC_ERROR_MESSAGES = Object.freeze({
      ABORT_ERROR: '请求超时，请稍后重试。',
      ALREADY_REVIEWED: '这项内容已经评价过了。',
      APPEAL_WINDOW_NOT_PASSED: '申诉冷静期尚未结束。',
      CONFIRM_WINDOW_NOT_PASSED: '当前还不能执行此操作，请稍后再试。',
      DAILY_ALREADY_CLAIMED: '今天已经领取过了。',
      DAILY_CAP_REACHED: '今日额度已用完。',
      EMPTY_TOKEN: '登录状态已失效，请重新登录。',
      FILE_TOO_LARGE: '文件过大，请压缩后重试。',
      FORBIDDEN: '当前账号没有执行此操作的权限。',
      INSUFFICIENT_BALANCE: '余额不足。',
      INSUFFICIENT_ETO: '$ETO 积分不足。',
      INVALID_TOKEN: '登录状态已失效，请重新登录。',
      LOGIN_REQUIRED: '请先登录后再试。',
      MISSING_TOKEN: '请先登录后再试。',
      NETWORK_ERROR: '网络连接失败，请检查网络后重试。',
      NOT_FOUND: '请求的内容不存在或已被移除。',
      PAYMENT_CHANNEL_PENDING_APPROVAL: '支付功能暂未开放。',
      RATE_LIMITED: '操作过于频繁，请稍后再试。',
      REQUEST_TIMEOUT: '请求超时，请稍后重试。',
      SERVICE_TEMPORARILY_UNAVAILABLE: '服务暂时不可用，请稍后重试。',
      STILL_IN_COOLING: '当前仍在冷静期，请稍后再试。',
      TOO_MANY_REQUESTS: '操作过于频繁，请稍后再试。',
      WALLET_NOT_FOUND: '钱包尚未初始化，请重新登录后再试。'
    });
    var PUBLIC_STATUS_MESSAGES = Object.freeze({
      400: '提交内容有误，请检查后重试。',
      401: '登录状态已失效，请重新登录。',
      403: '当前账号没有执行此操作的权限。',
      404: '请求的内容不存在或已被移除。',
      408: '请求超时，请稍后重试。',
      409: '页面状态已经变化，请刷新后重试。',
      413: '提交内容过大，请精简后重试。',
      422: '提交内容未通过校验，请检查后重试。',
      429: '操作过于频繁，请稍后再试。',
      500: '服务暂时不可用，请稍后重试。',
      502: '服务暂时不可用，请稍后重试。',
      503: '服务暂时不可用，请稍后重试。',
      504: '服务响应超时，请稍后重试。'
    });

    function publicErrorStatus(error, code) {
      var status = error && typeof error === 'object'
        ? Number(error.status || error.statusCode || (error.response && error.response.status) || 0)
        : 0;
      if (!status) {
        var matched = String(code || '').match(/^HTTP[_\s-]?(\d{3})$/i);
        if (matched) status = Number(matched[1]);
      }
      return Number.isFinite(status) ? status : 0;
    }

    function publicErrorCode(error) {
      var raw = '';
      if (typeof error === 'string') raw = error;
      else if (error && typeof error === 'object') {
        raw = error.code || error.error || error.message || '';
        if (raw && typeof raw === 'object') raw = raw.code || raw.error || raw.message || '';
      }
      raw = String(raw || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
      return /^[A-Z0-9_]{2,80}$/.test(raw) ? raw : '';
    }

    function publicErrorMessage(error, fallback) {
      var code = publicErrorCode(error);
      if (code && PUBLIC_ERROR_MESSAGES[code]) return PUBLIC_ERROR_MESSAGES[code];
      if (/^INSUFFICIENT_[A-Z0-9_]*(?:BALANCE|FUNDS|CURRENCY|STONE|BRICK|SOIL|GUARDIAN_POINTS)$/.test(code)) return '余额不足。';
      if (/^(?:AUTH|SESSION|REFRESH)_.*(?:EXPIRED|INVALID|REVOKED)$/.test(code)) return '登录状态已失效，请重新登录。';
      if (/^(?:RATE_LIMIT|TOO_MANY_)/.test(code)) return PUBLIC_STATUS_MESSAGES[429];
      var status = publicErrorStatus(error, code);
      if (PUBLIC_STATUS_MESSAGES[status]) return PUBLIC_STATUS_MESSAGES[status];
      return typeof fallback === 'string' && fallback.trim()
        ? fallback.trim()
        : '操作未完成，请稍后重试。';
    }

    window.EOPublicError = Object.freeze({
      code: publicErrorCode,
      message: publicErrorMessage
    });
  }
  if (window.EOSession) return;

  var ACCESS_KEY = 'eo_access_token';
  var REFRESH_KEY = 'eo_refresh_token';
  var ACCOUNT_KEY = 'eo_account_auth_v1';
  var ACTIVE_PROFILE_KEY = 'eo_active_profile_v1';
  var API_BASE_KEY = 'eo_api_base';
  var REFRESH_LOCK_NAME = 'eo-auth-refresh-v1';
  var PEER_REFRESH_GRACE_MS = 2000;
  var nativeFetch = window.fetch.bind(window);
  var refreshInFlight = null;
  var sessionGeneration = 0;

  function readStorage(key) {
    try { return localStorage.getItem(key) || ''; } catch (e) { return ''; }
  }
  function writeStorage(key, value) {
    try {
      if (value) localStorage.setItem(key, value);
      else localStorage.removeItem(key);
    } catch (e) {}
  }
  function readAccount() {
    try { return JSON.parse(localStorage.getItem(ACCOUNT_KEY) || 'null') || {}; }
    catch (e) { return {}; }
  }
  function writeAccount(account) {
    try { localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account || {})); } catch (e) {}
  }
  function apiBase() {
    try {
      return (window.EO_API_BASE || readStorage(API_BASE_KEY) ||
        ((location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/.test(location.hostname)) ? 'http://localhost:3000' : ''))
        .replace(/\/+$/, '');
    } catch (e) {
      return '';
    }
  }
  function apiUrl(path) { return apiBase() + path; }
  function accessToken() { return readStorage(ACCESS_KEY); }
  function refreshToken() { return readStorage(REFRESH_KEY); }

  function decodeJwt(token) {
    try {
      var part = String(token || '').split('.')[1];
      if (!part) return null;
      part = part.replace(/-/g, '+').replace(/_/g, '/');
      while (part.length % 4) part += '=';
      return JSON.parse(decodeURIComponent(Array.prototype.map.call(atob(part), function (ch) {
        return '%' + ('00' + ch.charCodeAt(0).toString(16)).slice(-2);
      }).join('')));
    } catch (e) { return null; }
  }
  function accessTokenUsable(skewSeconds) {
    var payload = decodeJwt(accessToken());
    if (!payload || !Number(payload.exp)) return false;
    return Number(payload.exp) * 1000 > Date.now() + Math.max(0, Number(skewSeconds) || 0) * 1000;
  }
  function refreshTokenUsable(skewSeconds) {
    var token = refreshToken();
    if (!token) return false;
    var payload = decodeJwt(token);
    if (!payload || !Number(payload.exp)) return false;
    return Number(payload.exp) * 1000 > Date.now() + Math.max(0, Number(skewSeconds) || 0) * 1000;
  }
  function isAuthenticated() {
    return accessTokenUsable(0) || refreshTokenUsable(0);
  }
  function dispatch(name, detail) {
    try { window.dispatchEvent(new CustomEvent(name, { detail: detail || {} })); } catch (e) {}
  }
  function syncDocumentAuthState(authenticated) {
    try {
      if (!window.document || !window.document.documentElement) return;
      window.document.documentElement.classList.toggle('eo-logged-in', !!authenticated);
    } catch (e) {}
  }

  function markAccountLoggedIn(profile) {
    var account = readAccount();
    delete account.password;
    account.loggedIn = true;
    account.loggedInAt = new Date().toISOString();
    if (profile && profile.uid) account.uid = profile.uid;
    if (profile && profile.email) account.email = profile.email;
    if (profile) account.profile = profile;
    writeAccount(account);
  }
  function clearLocalSession(reason) {
    /* Invalidate any refresh that started before logout/clear, so a late response
       can never resurrect a session the user has already ended. */
    sessionGeneration += 1;
    writeStorage(ACCESS_KEY, '');
    writeStorage(REFRESH_KEY, '');
    writeStorage(ACTIVE_PROFILE_KEY, '');
    var account = readAccount();
    delete account.password;
    account.loggedIn = false;
    account.loggedOutAt = new Date().toISOString();
    if (reason) account.sessionEndReason = String(reason);
    writeAccount(account);
    syncDocumentAuthState(false);
    dispatch('eo:session-ended', { reason: reason || 'cleared' });
  }
  function storeTokens(data, profile) {
    data = data || {};
    /* A login/refresh response is one atomic credential pair. Mixing half of a
       new pair with a token left by another account can create a phantom login. */
    if ((data.accessToken || data.refreshToken) && !(data.accessToken && data.refreshToken)) {
      throw sessionError('INVALID_TOKEN_PAIR', 0);
    }
    if (profile && !(data.accessToken && data.refreshToken)) {
      throw sessionError('INVALID_AUTH_RESPONSE', 0);
    }
    /* A successful explicit login/registration changes account ownership of
       this tab. Invalidate refreshes that started for the previous account. */
    if (profile && data.accessToken && data.refreshToken) sessionGeneration += 1;
    if (data.accessToken) writeStorage(ACCESS_KEY, data.accessToken);
    if (data.refreshToken) writeStorage(REFRESH_KEY, data.refreshToken);
    if (data.accessToken || data.refreshToken) {
      markAccountLoggedIn(profile || data.profile || data.user || null);
      syncDocumentAuthState(true);
      dispatch('eo:session-refreshed', { rotated: !!data.refreshToken });
    }
    return accessToken();
  }
  function sessionError(message, status) {
    var error = new Error(message || 'SESSION_REQUEST_FAILED');
    error.status = status || 0;
    return error;
  }

  function waitForPeerRefresh(attemptedRefreshToken) {
    return new Promise(function (resolve) {
      var settled = false;
      var timer = null;
      var pollTimer = null;
      function finish(value) {
        if (settled) return;
        settled = true;
        if (timer) clearTimeout(timer);
        if (pollTimer) clearTimeout(pollTimer);
        try { window.removeEventListener('storage', onStorage); } catch (e) {}
        resolve(value || null);
      }
      function inspect() {
        var currentRefreshToken = refreshToken();
        if (!currentRefreshToken) {
          finish({ loggedOut: true });
          return true;
        }
        if (currentRefreshToken && currentRefreshToken !== attemptedRefreshToken && accessTokenUsable(0)) {
          finish({ accessToken: accessToken() });
          return true;
        }
        return false;
      }
      function onStorage(event) {
        if (event.key === ACCESS_KEY || event.key === REFRESH_KEY) inspect();
      }
      if (inspect()) return;
      try { window.addEventListener('storage', onStorage); } catch (e) {}
      /* Inspect once more after subscribing so a rotation between the first
         read and addEventListener cannot be missed. */
      if (inspect()) return;
      function poll() {
        if (!inspect() && !settled) pollTimer = setTimeout(poll, 50);
      }
      pollTimer = setTimeout(poll, 50);
      timer = setTimeout(function () {
        if (!inspect()) finish(null);
      }, PEER_REFRESH_GRACE_MS);
    });
  }

  function withRefreshLock(task) {
    try {
      if (window.navigator && window.navigator.locks && typeof window.navigator.locks.request === 'function') {
        return window.navigator.locks.request(REFRESH_LOCK_NAME, { mode: 'exclusive' }, task);
      }
    } catch (e) {}
    return Promise.resolve().then(task);
  }

  function runRefreshRequest(attemptedRefreshToken) {
    var attemptedGeneration = sessionGeneration;
    var refreshController = window.AbortController ? new AbortController() : null;
    var refreshTimer = refreshController ? setTimeout(function () { refreshController.abort(); }, 15000) : null;

    return nativeFetch(apiUrl('/auth/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: attemptedRefreshToken }),
      signal: refreshController ? refreshController.signal : undefined
    }).then(async function (response) {
      var data = null;
      try { data = await response.json(); } catch (e) {}
      if (!response.ok) {
        /* Another tab may already have rotated the same token. Never clear its newer pair. */
        if (refreshToken() !== attemptedRefreshToken && accessTokenUsable(0)) return accessToken();
        if (response.status === 400 || response.status === 401 || response.status === 404) {
          var rejectionCode = (data && (data.message || data.error)) || '';
          if (rejectionCode === 'REFRESH_TOKEN_REVOKED') {
            var peerRefresh = await waitForPeerRefresh(attemptedRefreshToken);
            if (peerRefresh && peerRefresh.accessToken) return peerRefresh.accessToken;
            if (peerRefresh && peerRefresh.loggedOut) {
              throw sessionError(rejectionCode, response.status);
            }
            /* A refresh rotation must not revoke an access token that is still
               valid. This happens when another tab wins a rotation but its
               storage event arrives late (or a stale browser replays an old
               refresh token). Keep the current access token until its normal
               expiry; the next refresh will converge or require login. */
            if (refreshToken() === attemptedRefreshToken && accessTokenUsable(0)) {
              return accessToken();
            }
          }
          if (refreshToken() !== attemptedRefreshToken && accessTokenUsable(0)) return accessToken();
          clearLocalSession((data && (data.message || data.error)) || 'refresh_rejected');
        }
        throw sessionError((data && (data.message || data.error)) || ('HTTP_' + response.status), response.status);
      }
      if (!data || !data.accessToken || !data.refreshToken) {
        clearLocalSession('invalid_refresh_response');
        throw sessionError('INVALID_REFRESH_RESPONSE', response.status);
      }
      if (attemptedGeneration !== sessionGeneration || refreshToken() !== attemptedRefreshToken) {
        /* Logout won the race. Revoke the newly rotated token as cleanup, but do
           not wait for that best-effort request and never store the new pair. */
        nativeFetch(apiUrl('/auth/logout'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: data.refreshToken })
        }).catch(function () {});
        return null;
      }
      storeTokens(data);
      return data.accessToken;
    }).finally(function () {
      if (refreshTimer) clearTimeout(refreshTimer);
    });
  }

  function refresh() {
    if (refreshInFlight) return refreshInFlight;
    var requestedRefreshToken = refreshToken();
    if (!requestedRefreshToken) return Promise.resolve(null);

    /* Web Locks makes refresh-token rotation single-flight across every tab.
       A tab that queued behind the winner reuses the pair now in localStorage
       instead of replaying the already consumed token. */
    refreshInFlight = withRefreshLock(function () {
      var currentRefreshToken = refreshToken();
      if (!currentRefreshToken) return null;
      if (currentRefreshToken !== requestedRefreshToken && accessTokenUsable(0)) return accessToken();
      return runRefreshRequest(currentRefreshToken);
    }).finally(function () {
      refreshInFlight = null;
    });
    return refreshInFlight;
  }

  function ensureAccessToken() {
    if (accessTokenUsable(30)) return Promise.resolve(accessToken());
    if (!refreshToken()) return Promise.resolve(null);
    return refresh().catch(function () { return null; });
  }

  function isSessionEndpoint(input) {
    try {
      var raw = typeof input === 'string' ? input : input.url;
      var pathname = new URL(raw, location.href).pathname;
      return /\/auth\/(refresh|logout)\/?$/.test(pathname);
    } catch (e) { return false; }
  }
  function isApiRequest(input) {
    try {
      var raw = typeof input === 'string' ? input : input.url;
      var url = new URL(raw, location.href);
      var base = apiBase();
      if (!base) return url.origin === location.origin;
      return url.origin === new URL(base, location.href).origin;
    } catch (e) { return false; }
  }

  async function sessionFetch(input, init) {
    init = Object.assign({}, init || {});
    var skipAuth = init.eoSkipAuth === true;
    var skipRefresh = init.eoSkipRefresh === true || isSessionEndpoint(input);
    delete init.eoSkipAuth;
    delete init.eoSkipRefresh;

    var apiRequest = isApiRequest(input);
    var preflightRefreshFailed = false;
    var headers = new Headers(init.headers || (typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined));
    init.headers = headers;
    var retryInput = input;
    if (typeof Request !== 'undefined' && input instanceof Request) {
      try { retryInput = input.clone(); } catch (e) { retryInput = null; }
    }

    if (apiRequest && !skipAuth && !skipRefresh) {
      if (!accessTokenUsable(20) && refreshToken()) {
        try { await refresh(); }
        catch (e) { preflightRefreshFailed = true; }
      }
      var current = accessToken();
      if (current) headers.set('Authorization', 'Bearer ' + current);
      else headers.delete('Authorization');
    }

    var response = await nativeFetch(input, init);
    if (response.status !== 401 || !apiRequest || skipRefresh || preflightRefreshFailed || !refreshToken() || !retryInput) return response;

    var renewed = null;
    try { renewed = await refresh(); } catch (e) { return response; }
    if (!renewed) return response;
    headers.set('Authorization', 'Bearer ' + renewed);
    var retriedResponse = await nativeFetch(retryInput, init);
    if (retriedResponse.status === 401) clearLocalSession('access_rejected_after_refresh');
    return retriedResponse;
  }

  async function logout() {
    var currentRefreshToken = refreshToken();
    var revoked = false;
    var logoutController = window.AbortController ? new AbortController() : null;
    var logoutTimer = logoutController ? setTimeout(function () { logoutController.abort(); }, 8000) : null;
    /* Logout is local-first: UI and protected requests stop immediately, even
       when the revoke request is slow/offline. Keep only the captured token for
       the best-effort server revocation below. */
    clearLocalSession('logout');
    try {
      if (currentRefreshToken) {
        var response = await nativeFetch(apiUrl('/auth/logout'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: currentRefreshToken }),
          signal: logoutController ? logoutController.signal : undefined
        });
        revoked = response.ok;
      }
    } catch (e) {
      revoked = false;
    } finally {
      if (logoutTimer) clearTimeout(logoutTimer);
    }
    return revoked;
  }

  function migrateLegacyState() {
    var account = readAccount();
    var dirty = Object.prototype.hasOwnProperty.call(account, 'password');
    if (dirty) delete account.password;
    if (!isAuthenticated()) {
      if (account.loggedIn) dirty = true;
      account.loggedIn = false;
      writeStorage(ACTIVE_PROFILE_KEY, '');
    }
    if (dirty) writeAccount(account);
  }

  window.EOSession = {
    apiBase: apiBase,
    accessToken: accessToken,
    refreshToken: refreshToken,
    accessTokenUsable: accessTokenUsable,
    refreshTokenUsable: refreshTokenUsable,
    isAuthenticated: isAuthenticated,
    ensureAccessToken: ensureAccessToken,
    refresh: refresh,
    fetch: sessionFetch,
    storeTokens: storeTokens,
    clear: clearLocalSession,
    logout: logout
  };

  migrateLegacyState();
  syncDocumentAuthState(isAuthenticated());
  if (refreshToken() && !accessTokenUsable(30)) ensureAccessToken();
  window.addEventListener('storage', function (event) {
    if (event.key === ACCESS_KEY || event.key === REFRESH_KEY) {
      /* Any refresh-token replacement may represent another tab logging in,
         rotating or logging out. A response for our old token must not win. */
      if (event.key === REFRESH_KEY) sessionGeneration += 1;
      dispatch(isAuthenticated() ? 'eo:session-refreshed' : 'eo:session-ended', { crossTab: true });
    }
  });
})(window);
