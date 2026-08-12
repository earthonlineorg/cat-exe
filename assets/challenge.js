/**
 * EARTH.ONLINE — 全局 UGC fetch 包装器
 *
 * 接管所有"发评论/发悬赏/投票"等 UGC 提交：
 *   - 命中 429 + needChallenge → 弹出"地球Online 玩家测试" modal，答题拿 token，自动重发原请求
 *   - 命中 429 + banned → 弹出温和提示并自动关闭，不重发
 *   - 其它错误透传给调用方处理
 *
 * 用法：把页面里的 fetch(url, { method:'POST', headers, body }) 换成 window.eoFetch(url, opts)
 *      返回的是和 fetch 一样的 Response（已重发 1 次，挑战通过后的那次）
 *
 * 注意：modal 是单例，同时只允许一个挑战在进行；其它请求碰到 needChallenge 时排队等同一个 token
 */
(function () {
  if (typeof window === 'undefined') return;
  if (window.eoFetch) return;

  function apiBase() {
    try {
      return (window.EO_API_BASE || localStorage.getItem('eo_api_base') || (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) ? 'http://localhost:3000' : '')).replace(/\/$/, '');
    } catch (e) {
      return (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) ? 'http://localhost:3000' : '');
    }
  }

  /* ──────── 单例 modal：避免并发挑战时反复弹窗 ──────── */
  var modalState = {
    el: null,
    pending: null, // { resolve, reject }
    queue: [],     // 排队等同一个 token 的 resolve
  };

  function ensureModal() {
    if (modalState.el) return modalState.el;
    var overlay = document.createElement('div');
    overlay.className = 'eo-challenge-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = ''
      + '<div class="eo-challenge-card">'
      +   '<div class="eo-challenge-head">'
      +     '<span class="k">EARTH.ONLINE / PLAYER TEST</span>'
      +     '<strong>地球Online 玩家测试</strong>'
      +     '<em>系统检测到您提交频率较高，请通过以下测试以证明您是真实玩家。</em>'
      +   '</div>'
      +   '<div class="eo-challenge-body">'
      +     '<p class="prompt" data-prompt>正在抽题...</p>'
      +     '<input type="text" class="eo-challenge-input" data-input autocomplete="off" aria-label="玩家测试答案" placeholder="">'
      +     '<div class="eo-challenge-status" data-status></div>'
      +   '</div>'
      +   '<div class="eo-challenge-actions">'
      +     '<button type="button" class="eo-challenge-btn ghost" data-cancel>取消</button>'
      +     '<button type="button" class="eo-challenge-btn primary" data-submit>提交</button>'
      +   '</div>'
      + '</div>';
    document.body.appendChild(overlay);
    modalState.el = overlay;

    overlay.querySelector('[data-cancel]').addEventListener('click', function () {
      finish(null, new Error('CHALLENGE_CANCELLED'));
    });
    overlay.querySelector('[data-submit]').addEventListener('click', submitAnswer);
    overlay.querySelector('[data-input]').addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); submitAnswer(); }
    });
    return overlay;
  }

  function setStatus(text, tone) {
    if (!modalState.el) return;
    var el = modalState.el.querySelector('[data-status]');
    if (!el) return;
    el.textContent = text || '';
    el.classList.remove('ok', 'bad');
    if (tone) el.classList.add(tone);
  }

  function showModal(challenge) {
    var el = ensureModal();
    el.querySelector('[data-prompt]').textContent = challenge.prompt || '请回答以下问题：';
    var input = el.querySelector('[data-input]');
    var submit = el.querySelector('[data-submit]');
    var cancel = el.querySelector('[data-cancel]');
    input.style.display = '';
    submit.disabled = false;
    cancel.textContent = '取消';
    input.value = '';
    input.placeholder = challenge.hint || '请输入答案';
    input.setAttribute('data-challenge-id', challenge.id || '');
    setStatus('');
    el.classList.add('is-open');
    setTimeout(function () { try { input.focus(); } catch (e) { } }, 60);
  }

  function hideModal() {
    if (!modalState.el) return;
    modalState.el.classList.remove('is-open');
  }

  function finish(token, err) {
    var pending = modalState.pending;
    var queue = modalState.queue.slice();
    modalState.pending = null;
    modalState.queue = [];
    hideModal();
    if (err) {
      if (pending) pending.reject(err);
      queue.forEach(function (q) { q.reject(err); });
    } else {
      if (pending) pending.resolve(token);
      queue.forEach(function (q) { q.resolve(token); });
    }
  }

  async function submitAnswer() {
    if (!modalState.el) return;
    var input = modalState.el.querySelector('[data-input]');
    var submitBtn = modalState.el.querySelector('[data-submit]');
    var id = input.getAttribute('data-challenge-id') || '';
    var answer = (input.value || '').trim();
    if (!answer) { setStatus('请填写答案', 'bad'); return; }
    submitBtn.disabled = true;
    setStatus('正在验证...');
    try {
      var res = await fetch(apiBase() + '/challenge/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, answer: answer })
      });
      var json = await res.json().catch(function () { return null; });
      if (res.ok && json && json.data && json.data.token) {
        setStatus('验证通过', 'ok');
        setTimeout(function () { finish(json.data.token); }, 200);
        return;
      }
      /* 答错 → 再抽一题让用户重试 */
      setStatus((json && json.message) || '答错了，再来一题。', 'bad');
      var next = await fetch(apiBase() + '/challenge');
      var nextJson = await next.json().catch(function () { return null; });
      if (next.ok && nextJson && nextJson.data) {
        showModal(nextJson.data);
      }
    } catch (e) {
      setStatus('网络异常，请稍后再试。', 'bad');
    } finally {
      submitBtn.disabled = false;
    }
  }

  function requestChallengeToken(initialChallenge) {
    return new Promise(function (resolve, reject) {
      /* 已有在进行的挑战：排队等同一个 token */
      if (modalState.pending) {
        modalState.queue.push({ resolve: resolve, reject: reject });
        return;
      }
      modalState.pending = { resolve: resolve, reject: reject };
      showModal(initialChallenge);
    });
  }

  function alertBanned(banSeconds, message) {
    var el = ensureModal();
    el.querySelector('[data-prompt]').textContent = message || '提交过于频繁，请稍后再试。';
    var input = el.querySelector('[data-input]');
    input.value = '';
    input.style.display = 'none';
    setStatus('剩余封禁时间：约 ' + Math.ceil((banSeconds || 60) / 60) + ' 分钟', 'bad');
    el.classList.add('is-open');
    el.querySelector('[data-submit]').disabled = true;
    el.querySelector('[data-cancel]').textContent = '我知道了';
  }

  /* ──────── 主入口 ──────── */
  window.eoFetch = async function (url, opts) {
    opts = Object.assign({}, opts || {});
    /* Headers is iterable but has no enumerable own properties.  Copying it
       with Object.assign silently dropped Content-Type from media JSON calls,
       so both avatar and post uploads failed at /media/upload-intents with a
       400 before object storage was ever reached. */
    opts.headers = new Headers(opts.headers || {});

    var sender = window.EOSession ? window.EOSession.fetch : fetch;
    var res = await sender(url, opts);
    if (res.status !== 429) return res;

    /* 克隆响应以便业务侧仍可读 body */
    var bodyText = await res.clone().text();
    var json = null;
    try { json = bodyText ? JSON.parse(bodyText) : null; } catch (e) { json = null; }

    /* 已封禁：弹提示后透传 429 */
    if (json && json.banned) {
      try { alertBanned(json.banSeconds, json.message); } catch (e) { }
      return res;
    }

    /* 需要挑战：弹 modal → 拿 token → 重发 */
    if (json && json.needChallenge && json.challenge) {
      var token;
      try {
        token = await requestChallengeToken(json.challenge);
      } catch (e) {
        return res; /* 用户取消，透传原 429 */
      }
      opts.headers.set('X-Challenge-Token', token);
      return sender(url, opts);
    }

    /* 其它 429（普通限流）透传 */
    return res;
  };
})();
