/**
 * EARTH.ONLINE — 玩家进度云端同步
 *
 * 提供给业务模块用的小客户端：
 *   await window.eoProgress.load()        启动时拉取，合并到 localStorage
 *   window.eoProgress.patch({ ... })      局部更新（节流批量发给后端）
 *   window.eoProgress.isReady             首次 load 是否完成（本地立即可用 / 服务端是否拉回来）
 *
 * 同步的字段（对应后端 user_progress 表 / 各模块的 localStorage key）：
 *   - achievements   <-> eo_achievements_v1
 *   - achSlots       <-> eo_ach_slots_v1
 *   - signin         <-> eo_signin_v1
 *   - favorites      <-> eo_favorites_v1
 *   - dailyTasks     <-> eo_daily_state_v1
 *   - reviewVotes    <-> eo_review_voted_<id>_<type>
 *
 * 用户未登录时：所有调用都为空操作，不读取或写入账号进度。
 * 用户登录后：服务端状态覆盖本地镜像，旧本地进度绝不反向灌入账号。
 */
(function () {
  if (typeof window === 'undefined') return;
  if (window.eoProgress) return;

  var STATE = { isReady: false, lastServer: null };
  var pendingPatch = null;     /* 累积下一次发出的 patch payload */
  var patchTimer = null;       /* 防抖 timer */
  var FLUSH_DELAY = 350;       /* 多次 patch 在 350ms 内合并一次发出 */
  var retryDelay = 5000;

  function scheduleRetry() {
    if (patchTimer || !isLoggedIn()) return;
    patchTimer = setTimeout(flushPatch, retryDelay);
    retryDelay = Math.min(retryDelay * 2, 60000);
  }

  function apiBase() {
    try { return (window.EO_API_BASE || localStorage.getItem('eo_api_base') || (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) ? 'http://localhost:3000' : '')).replace(/\/+$/, ''); }
    catch (e) { return (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) ? 'http://localhost:3000' : ''); }
  }
  function token() {
    try { return localStorage.getItem('eo_access_token') || ''; } catch (e) { return ''; }
  }
  function isLoggedIn() {
    try {
      if (window.EOSession && typeof window.EOSession.isAuthenticated === 'function') {
        return !!window.EOSession.isAuthenticated();
      }
    } catch (e) { }
    return !!token();
  }
  function safeGet(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function safeSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { }
  }

  /* 从 access token(JWT) 里读当前登录用户 uid，用于检测"换了人登录" */
  function currentUid() {
    try {
      var t = token(); if (!t) return '';
      var seg = t.split('.')[1]; if (!seg) return '';
      var b = seg.replace(/-/g, '+').replace(/_/g, '/');
      var pad = b.length % 4; if (pad) b += '===='.slice(pad);
      var json = JSON.parse(atob(b));
      return json.uid || json.sub || '';
    } catch (e) { return ''; }
  }

  /* 同一台机器上换了登录用户 → 清掉上一个用户残留的本地状态，避免串号污染
     （成就/签到/收藏/每日/钱包/点数/信用/本机档案/任务等都是 per-user）。
     同一用户重复登录则不清（保留"本机离线档案"设计）。*/
  var PER_USER_KEYS = [
    /* 成就 / 进度 */
    'eo_achievements_v1', 'eo_ach_slots_v1', 'eo_ach_login_once', 'eo_ach_intercept_once',
    'eo_signin_v1', 'eo_favorites_v1', 'eo_daily_state_v1',
    /* 钱包 / 点数 / 信用（后端权威，本地仅镜像）*/
    'eo_wallet_v1', 'eo_wallet_seen_v1', 'eo_guardian_points', 'eo_party_credit_v1',
    /* 本机角色档案 / 背包 / 任务 */
    'eo_registered_profile_v1', 'eo_active_profile_v1', 'eo_inventory_v1',
    'eo_user_tasks_v1', 'eo_task_state_v1',
    /* 本地内容 / 草稿 */
    'eo_community_posts_v1', 'eo_review_drafts_v1', 'eo_guide_tree_draft_v1',
    /* 备用 token 存储（避免残留上个用户的会话）*/
    'eo_session_v1'
  ];
  /* 这些前缀下的 key 也是 per-user，整批清 */
  var PER_USER_PREFIXES = ['eo_review_voted_', 'eo_pr_helpful_', 'eo_tree_done_v1::', 'eo_tree_added_v1::'];
  function enforceOwner() {
    var uid = currentUid(); if (!uid) return;
    var owner = null; try { owner = localStorage.getItem('eo_local_owner_uid'); } catch (e) { }
    if (owner && owner !== uid) {
      PER_USER_KEYS.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) { } });
      try {
        for (var i = localStorage.length - 1; i >= 0; i--) {
          var key = localStorage.key(i);
          if (!key) continue;
          for (var p = 0; p < PER_USER_PREFIXES.length; p++) { if (key.indexOf(PER_USER_PREFIXES[p]) === 0) { localStorage.removeItem(key); break; } }
        }
      } catch (e) { }
      dispatch('eo:user-switched', { from: owner, to: uid });
    }
    try { localStorage.setItem('eo_local_owner_uid', uid); } catch (e) { }
  }

  /* ─────────── load：拉服务端权威状态 → 覆盖本地镜像 ─────────── */
  async function load() {
    if (!isLoggedIn()) {
      STATE.isReady = true;
      dispatch('eo:progress-loaded', { online: false });
      return;
    }
    enforceOwner();   /* 关键：合并前先按 uid 隔离，污染不会进云端 */
    try {
      var res = await fetch(apiBase() + '/me/progress', {
        headers: { Authorization: 'Bearer ' + token() }
      });
      if (!res.ok) throw new Error('PROGRESS_FETCH_FAILED');
      var json = await res.json();
      var server = (json && json.data) ? json.data : null;
      if (!server) throw new Error('NO_DATA');
      STATE.lastServer = server;
      replaceLocalFromServer(server);
      STATE.isReady = true;
      dispatch('eo:progress-loaded', { online: true });
    } catch (e) {
      STATE.isReady = true;
      dispatch('eo:progress-loaded', { online: false, error: String(e) });
    }
  }

  /* 本地只做当前账号的显示镜像。服务器返回空集合时也必须覆盖，避免旧账号、
     游客或失败请求留下的状态被误认为已解锁/已签到/已完成。 */
  function replaceLocalFromServer(server) {
    safeSet('eo_achievements_v1', server.achievements || {});
    safeSet('eo_ach_slots_v1', Array.isArray(server.achSlots) ? server.achSlots : []);
    safeSet('eo_signin_v1', server.signin || {});
    safeSet('eo_favorites_v1', Array.isArray(server.favorites) ? server.favorites : []);
    safeSet('eo_daily_state_v1', server.dailyTasks || {});

    try {
      for (var i = localStorage.length - 1; i >= 0; i--) {
        var localKey = localStorage.key(i);
        if (localKey && localKey.indexOf('eo_review_voted_') === 0) localStorage.removeItem(localKey);
      }
    } catch (e) { }
    var serverVotes = server.reviewVotes || {};
    Object.keys(serverVotes).forEach(function (key) {
      if (!serverVotes[key]) return;
      var idx = key.lastIndexOf(':');
      if (idx <= 0) return;
      try {
        localStorage.setItem('eo_review_voted_' + key.slice(0, idx) + '_' + key.slice(idx + 1), '1');
      } catch (e) { }
    });
  }

  function pickLatestStr(a, b) {
    if (!a) return b;
    if (!b) return a;
    return a >= b ? a : b;
  }

  /* ─────────── patch：节流批量发到 server ─────────── */
  function patch(partial) {
    if (!partial || typeof partial !== 'object') return;
    if (!isLoggedIn()) return; /* 未登录：不产生任何账号进度 */

    pendingPatch = mergePatchPayload(pendingPatch, partial);
    if (!Object.keys(pendingPatch).length) { pendingPatch = null; return; }
    if (patchTimer) clearTimeout(patchTimer);
    patchTimer = setTimeout(flushPatch, FLUSH_DELAY);
  }

  function mergePatchPayload(base, next) {
    base = base || {};
    next = next || {};
    var out = {};
    if (base.achSlots !== undefined) out.achSlots = base.achSlots;
    if (base.favorites !== undefined) out.favorites = base.favorites;
    if (next.achSlots !== undefined) out.achSlots = next.achSlots;
    if (next.favorites !== undefined) out.favorites = next.favorites;
    return out;
  }

  async function flushPatch() {
    var payload = pendingPatch;
    pendingPatch = null;
    patchTimer = null;
    if (!payload) return;
    try {
      var sender = window.EOSession ? window.EOSession.fetch : (window.eoFetch || fetch);
      var response = await sender(apiBase() + '/me/progress', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token()
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) { var httpError = new Error('PROGRESS_SYNC_HTTP_' + response.status); httpError.status = response.status; throw httpError; }
      retryDelay = 5000;
    } catch (e) {
      if (e && e.status === 400) {
        dispatch('eo:progress-sync-rejected', { status: 400 });
        return;
      }
      /* 失败：把这次 payload 推回 pending，等下次 flush 再试 */
      pendingPatch = mergePatchPayload(payload, pendingPatch || {});
      scheduleRetry();
    }
  }

  /* sendPatchNow：不防抖，立即发。用于 load() 合并后反向同步本地独有数据到服务端 */
  async function sendPatchNow(payload) {
    payload = mergePatchPayload(null, payload);
    if (!Object.keys(payload).length || !isLoggedIn()) return false;
    try {
      var sender = window.EOSession ? window.EOSession.fetch : (window.eoFetch || fetch);
      var response = await sender(apiBase() + '/me/progress', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token()
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) { var httpError = new Error('PROGRESS_SYNC_HTTP_' + response.status); httpError.status = response.status; throw httpError; }
      retryDelay = 5000;
      return true;
    } catch (e) {
      if (e && e.status === 400) return false;
      /* 保留 payload；网络或会话恢复后继续同步，绝不静默丢弃。 */
      pendingPatch = mergePatchPayload(payload, pendingPatch || {});
      scheduleRetry();
      return false;
    }
  }

  function dispatch(name, detail) {
    try { window.dispatchEvent(new CustomEvent(name, { detail: detail })); } catch (e) { }
  }

  window.eoProgress = {
    load: load,
    patch: patch,
    get isReady() { return STATE.isReady; },
    get lastServer() { return STATE.lastServer; }
  };

  /* 自动加载：DOM 就绪 + 已登录则 fetch 一次 */
  function autoBoot() {
    if (isLoggedIn()) load();
    else { STATE.isReady = true; dispatch('eo:progress-loaded', { online: false }); }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoBoot);
  } else {
    autoBoot();
  }
})();
