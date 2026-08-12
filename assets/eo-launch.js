/* EARTH.ONLINE launch hardening layer */
(function(){
  'use strict';

  var LS = window.localStorage;
  var CART_KEY = 'eo_shop_cart_v1';
  var CATALOG_KEY = 'eo_shop_catalog_v1';
  var TASKS_KEY = 'eo_user_tasks_v1';
  var ADMIN_DRAFTS_KEY = 'eo_admin_drafts_v1';
  var ORDERS_KEY = 'eo_shop_orders_v1';
  var WALLET_KEY = 'eo_wallet_v1';
  var PRODUCT_REVIEWS_KEY = 'eo_product_reviews_v1';

  function $(sel, root){ return (root || document).querySelector(sel); }
  function $all(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function page(){ return (location.pathname.split('/').pop() || 'index.html').toLowerCase(); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
  function clean(s){ return String(s || '').replace(/\s+/g,' ').trim(); }
  function publicError(error, fallback){ return window.EOPublicError ? window.EOPublicError.message(error, fallback) : fallback; }
  function readJson(key, fallback){
    try{
      var raw = LS.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    }catch(e){ return fallback; }
  }
  function writeJson(key, value){
    try{ LS.setItem(key, JSON.stringify(value)); }catch(e){}
  }
  function uid(prefix){ return (prefix || 'EO') + '-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2,7).toUpperCase(); }
  function apiBase(){
    if(window.EOSession) return window.EOSession.apiBase();
    try{ return (window.EO_API_BASE || LS.getItem('eo_api_base') || (location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) ? 'http://localhost:3000' : '')).replace(/\/+$/,''); }
    catch(e){ return (location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) ? 'http://localhost:3000' : ''); }
  }
  function token(){
    if(window.EOSession) return window.EOSession.accessToken();
    try{ return LS.getItem('eo_access_token') || ''; }catch(e){ return ''; }
  }
  function authHeaders(json){
    var headers = {};
    if(json !== false) headers['Content-Type'] = 'application/json';
    var tk = token();
    if(tk) headers.Authorization = 'Bearer ' + tk;
    return headers;
  }
  function apiJson(path, options){
    options = options || {};
    var headers = Object.assign({}, authHeaders(options.json), options.headers || {});
    var init = Object.assign({}, options, { headers:headers });
    delete init.json;
    if(options.payload !== undefined){
      init.body = JSON.stringify(options.payload);
      delete init.payload;
    }
    var sender = window.EOSession ? window.EOSession.fetch : fetch;
    return sender(apiBase() + path, init).then(function(res){
      return res.json().catch(function(){ return {}; }).then(function(data){
        if(!res.ok){
          var err = new Error(data.message || data.error || ('HTTP ' + res.status));
          err.status = res.status;
          err.data = data;
          throw err;
        }
        return data && Object.prototype.hasOwnProperty.call(data, 'data') ? data.data : data;
      });
    });
  }
  function postServiceSubmission(type, title, body, payload, contact){
    var headers = { 'Content-Type':'application/json' };
    var tk = token();
    if(tk) headers.Authorization = 'Bearer ' + tk;
    return fetch(apiBase() + '/submissions', {
      method:'POST',
      headers:headers,
      body:JSON.stringify({
        type:type,
        title:title,
        contact:contact || undefined,
        payload:Object.assign({ body:body || '' }, payload || {})
      })
    }).then(function(res){
      return res.json().catch(function(){ return {}; }).then(function(data){
        if(!res.ok) throw new Error(data.message || data.error || ('HTTP ' + res.status));
        return data.data || data;
      });
    });
  }

  function bodyClass(){
    var name = page().replace(/\.html$/,'').replace(/[^a-z0-9]+/g,'-') || 'index';
    document.body.classList.add('eo-page-' + name);
  }


  function markHomeLogoReturn(){
    document.addEventListener('click', function(e){
      var link = e.target.closest('.brand-logo-link, .brand-name, .m-appbar-brand');
      if(!link || !link.matches('a[href]')) return;
      var href = link.getAttribute('href') || '';
      var target = href.split('#')[0].split('?')[0].split('/').pop() || 'index.html';
      if(target.toLowerCase() !== 'index.html') return;
      var current = page();
      if(current === 'index.html') return;
      try{
        if(/^artisan(?:-|\.html$)/.test(current)) sessionStorage.setItem('eo_force_home_splash_once', '1');
        else sessionStorage.setItem('eo_skip_home_splash_once', '1');
      }catch(err){}
    }, true);
  }

  /* 全站返回按钮：[data-eo-back] → 返回上一页；无历史则回退到 data-eo-back-fallback */
  document.addEventListener('click', function(e){
    var b = e.target.closest('[data-eo-back]');
    if(!b) return;
    e.preventDefault();
    var fb = b.getAttribute('data-eo-back-fallback') || 'index.html';
    if(window.history.length > 1){ window.history.back(); }
    else { window.location.href = fb; }
  });

  function toast(message){
    var node = $('#eoLaunchToast');
    if(!node){
      node = document.createElement('div');
      node.id = 'eoLaunchToast';
      node.className = 'eo-launch-toast';
      node.setAttribute('role','status');
      node.setAttribute('aria-live','polite');
      document.body.appendChild(node);
    }
    node.textContent = message;
    node.classList.add('is-open');
    clearTimeout(node._timer);
    node._timer = setTimeout(function(){ node.classList.remove('is-open'); }, 2600);
  }

  function modal(title, html, options){
    options = options || {};
    var mask = $('#eoLaunchModal');
    if(!mask){
      mask = document.createElement('div');
      mask.id = 'eoLaunchModal';
      mask.className = 'eo-modal-mask';
      mask.innerHTML =
        '<div class="eo-modal" role="dialog" aria-modal="true">' +
          '<div class="eo-modal-head"><span data-eo-modal-title></span><button class="eo-modal-close" type="button" aria-label="close">×</button></div>' +
          '<div class="eo-modal-body" data-eo-modal-body></div>' +
        '</div>';
      document.body.appendChild(mask);
      mask.addEventListener('click', function(e){
        if(e.target === mask || e.target.closest('.eo-modal-close')) closeModal();
      });
      document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeModal(); });
    }
    if(mask._eoCleanup){ try{ mask._eoCleanup(); }catch(e){} mask._eoCleanup = null; }
    $('[data-eo-modal-title]', mask).textContent = title || 'SYSTEM';
    $('[data-eo-modal-body]', mask).innerHTML = html || '';
    mask.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    if(typeof options.onOpen === 'function') options.onOpen(mask);
    return mask;
  }
  function closeModal(){
    var mask = $('#eoLaunchModal');
    if(mask){
      if(mask._eoCleanup){ try{ mask._eoCleanup(); }catch(e){} mask._eoCleanup = null; }
      mask.classList.remove('is-open');
    }
    document.body.style.overflow = '';
  }

  /* 条款 / 政策：用弹窗（iframe）打开，看完关掉即可，绝不离开当前页（修复注册/登录读条款丢数据）*/
  var LEGAL_PAGES = { 'terms.html':'服务器一命通关条款', 'policy.html':'玩家隐私政策', 'nodelete.html':'不可重开告知书' };
  function openLegalModal(href, title){
    var mask = modal('LEGAL · ' + (title || '条款'),
      '<div class="eo-legal-modal">' +
        '<iframe class="eo-legal-frame" src="' + esc(href) + '" title="' + esc(title || '条款') + '" loading="eager"></iframe>' +
        '<div class="eo-legal-hint">↳ 看完直接关掉这个弹窗就行——不会离开当前页面，您刚才填的信息都还在。</div>' +
      '</div>'
    );
    var frame = $('.eo-legal-frame', mask);
    if(frame){
      frame.addEventListener('load', function(){
        try{
          var doc = frame.contentDocument;
          if(doc && doc.documentElement){
            doc.documentElement.classList.add('legal-embed');
            doc.body && doc.body.classList.add('legal-embed');
          }
        }catch(e){}
      });
    }
  }
  function bindLegalModals(){
    document.addEventListener('click', function(e){
      var link = e.target.closest('a.legal-link, a[href$="terms.html"], a[href$="policy.html"], a[href$="nodelete.html"]');
      if(!link || !link.matches('a[href]')) return;
      /* The mobile navigation is itself a modal sheet. Let its legal links
         navigate normally instead of opening a second modal underneath it. */
      if(link.closest('.m-more-sheet')) return;
      var file = (link.getAttribute('href') || '').split('?')[0].split('#')[0].split('/').pop();
      if(!LEGAL_PAGES[file]) return;
      e.preventDefault();
      e.stopPropagation();
      var label = clean(link.textContent).replace(/[《》]/g,'') || LEGAL_PAGES[file];
      openLegalModal(file, label);
    }, true);
  }

  function isLoggedIn(){
    return window.EOSession ? window.EOSession.isAuthenticated() : !!token();
  }
  function updateAuthButtons(){
    $all('.strip .logout').forEach(function(btn){
      btn.removeAttribute('data-modal');
      btn.textContent = isLoggedIn() ? '登出' : '登录';
      btn.setAttribute('aria-label', isLoggedIn() ? '登出当前网站账号' : '登录网站账号');
    });
    refreshInboxWidget();
  }

  /* ═══════════ 站内信信封入口（全站顶栏，登录才显，未读红点）═══════════ */
  var inboxPollTimer = null;
  function installInboxWidget(){
    var strip = document.querySelector('.strip');
    if(!strip || document.getElementById('eo-inbox-btn')) { refreshInboxWidget(); return; }
    var btn = document.createElement('button');
    btn.id = 'eo-inbox-btn';
    btn.type = 'button';
    btn.className = 'inbox-btn';
    btn.setAttribute('aria-label', '通知');
    btn.setAttribute('title', '通知');
    btn.hidden = true;
    btn.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="4.5" width="15" height="11" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M3.2 6l6.8 4.9L16.8 6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="inbox-dot" hidden></span>';
    var logout = strip.querySelector('.logout');
    if(logout) strip.insertBefore(btn, logout); else strip.appendChild(btn);
    btn.addEventListener('click', function(){ location.href = 'inbox.html'; });
    refreshInboxWidget();
  }
  /* ─── 货币到账弹窗（复用成就弹窗特效；CSS .eo-ach-popup 在 style.css 全站可用）─── */
  function rewardPopup(opts){
    if(!isLoggedIn() || !opts || !opts.name || !document.body) return;
    var host = document.getElementById('eo-ach-popup-host');
    if(!host){ host = document.createElement('div'); host.id='eo-ach-popup-host'; host.className='eo-ach-popup-host'; document.body.appendChild(host); }
    var node = document.createElement('div');
    node.className = 'eo-ach-popup color-' + (opts.color || 'amber');
    node.innerHTML = '<div class="eo-ach-popup-glow"></div>'
      + '<div class="eo-ach-popup-icon-wrap"><div class="eo-ach-popup-icon">' + (opts.icon||'✦') + '</div><div class="eo-ach-popup-sheen"></div><div class="eo-ach-popup-ring"></div></div>'
      + '<div class="eo-ach-popup-body"><span class="eo-ach-popup-kicker">' + (opts.kicker||'REWARD · 货币到账') + '</span><strong class="eo-ach-popup-name">' + opts.name + '</strong><span class="eo-ach-popup-desc">' + (opts.desc||'') + '</span></div>';
    host.appendChild(node);
    requestAnimationFrame(function(){ node.classList.add('is-in'); requestAnimationFrame(function(){ node.classList.add('is-shining'); }); });
    setTimeout(function(){ node.classList.remove('is-in'); node.classList.add('is-out'); setTimeout(function(){ if(node.parentNode) node.parentNode.removeChild(node); }, 480); }, 2800);
  }

  /* 钱包余额监测：任一货币增加 → 弹"货币到账"特效。首次只记基线不弹（避免把全部余额当成新到账）*/
  var CUR_DEF = [ ['dirt','土','amber'], ['stone','石','green'], ['brick','砖','rust'], ['eto','$ETO','mustard'] ];
  function walletWatch(){
    if(!isLoggedIn()) return;
    apiJson('/wallet').then(function(d){
      var w = (d && d.wallet) || {};
      var cur = {};
      CUR_DEF.forEach(function(c){ cur[c[0]] = Math.floor(Number(w[c[0]]||0)); });
      var seen = null;
      try{ seen = JSON.parse(localStorage.getItem('eo_wallet_seen_v1')||'null'); }catch(e){}
      try{ localStorage.setItem('eo_wallet_seen_v1', JSON.stringify(cur)); }catch(e){}
      if(!seen || typeof seen !== 'object') return;
      var gains = [];
      CUR_DEF.forEach(function(c){ var dlt = cur[c[0]] - (Number(seen[c[0]])||0); if(dlt > 0) gains.push({ label:c[1], color:c[2], delta:dlt, eto:c[0]==='eto' }); });
      if(!gains.length) return;
      var name = gains.map(function(g){ return '+' + g.delta.toLocaleString('en-US') + ' ' + g.label; }).join('　');
      rewardPopup({ icon: gains.length===1 ? (gains[0].eto?'E':gains[0].label) : '✦', name:name, desc:'已到账你的钱包', color:gains[0].color, kicker:'REWARD · 货币到账' });
    }).catch(function(){});
  }

  function refreshInboxWidget(){
    var btn = document.getElementById('eo-inbox-btn');
    if(!btn) return;
    if(!isLoggedIn()){
      btn.hidden = true;
      if(inboxPollTimer){ clearInterval(inboxPollTimer); inboxPollTimer = null; }
      return;
    }
    btn.hidden = false;
    pollUnread();
    walletWatch();
    if(!inboxPollTimer) inboxPollTimer = setInterval(pollUnread, 30000);
  }
  function pollUnread(){
    if(!isLoggedIn()) return;
    apiJson('/inbox/unread-count').then(function(d){
      var dot = document.querySelector('#eo-inbox-btn .inbox-dot');
      if(!dot) return;
      var n = (d && d.unread) || 0;
      if(n > 0){ dot.hidden = false; dot.textContent = n > 99 ? '99+' : String(n); }
      else { dot.hidden = true; dot.textContent = ''; }
    }).catch(function(){});
  }

  /* 全站私信入口：任意元素加 data-eo-dm="对方UID" 即可一键开私信（未登录先登录）*/
  var dmBound = false;
  function bindDMButtons(){
    if(dmBound) return; dmBound = true;
    document.addEventListener('click', function(e){
      var el = e.target.closest('[data-eo-dm]');
      if(!el) return;
      e.preventDefault(); e.stopPropagation();
      var uid = el.getAttribute('data-eo-dm');
      if(!uid) return;
      var dest = 'inbox.html?dm=' + encodeURIComponent(uid);
      if(!isLoggedIn()){ try{ LS.setItem('eo_intercept_redirect', dest); }catch(_){}; location.href = 'intercept.html?entry=login&next=' + encodeURIComponent(dest); return; }
      location.href = dest;
    });
  }
  async function logoutRealSession(){
    if(window.EOSession) return window.EOSession.logout();
    var refresh = '';
    try{ refresh = LS.getItem('eo_refresh_token') || ''; }catch(e){}
    try{
      if(refresh){
        await fetch(apiBase() + '/auth/logout', {
          method:'POST',
          headers:{ 'Content-Type':'application/json' },
          body:JSON.stringify({ refreshToken:refresh })
        });
      }
    }catch(e){}
    LS.removeItem('eo_access_token');
    LS.removeItem('eo_refresh_token');
    LS.removeItem('eo_active_profile_v1');
    var account = readJson('eo_account_auth_v1', {});
    delete account.password;
    account.loggedIn = false;
    account.loggedOutAt = new Date().toISOString();
    writeJson('eo_account_auth_v1', account);
    return false;
  }
  function bindAuth(){
    updateAuthButtons();
    document.addEventListener('click', function(e){
      var btn = e.target.closest('.strip .logout');
      if(!btn) return;
      e.preventDefault();
      e.stopPropagation();
      if(!isLoggedIn()){
        LS.setItem('eo_intercept_redirect', page());
        location.href = 'intercept.html?entry=login&next=' + encodeURIComponent(page());
        return;
      }
      modal('SIGN OUT / 登出确认',
        '<div class="eo-product-detail">' +
          '<h2>登出网站账号</h2>' +
          '<p class="eo-product-desc">这只会退出当前网站账号，不影响您现实中的正常游玩，也不会删除保存在此设备的角色档案。</p>' +
          '<div class="eo-modal-actions">' +
            '<button class="btn ghost" type="button" data-eo-close><span>取消</span></button>' +
            '<button class="btn primary" type="button" data-eo-confirm-logout><span>确认登出</span><span class="arr"></span></button>' +
          '</div>' +
        '</div>',
        { onOpen:function(root){
          $('[data-eo-close]', root).addEventListener('click', closeModal);
          $('[data-eo-confirm-logout]', root).addEventListener('click', async function(){
            var confirmButton = this;
            confirmButton.disabled = true;
            var label = $('span', confirmButton);
            if(label) label.textContent = '正在登出';
            await logoutRealSession();
            LS.removeItem('eo_intercept_redirect');
            LS.removeItem('eo_intercept_seen');
            closeModal();
            updateAuthButtons();
            location.replace('index.html');
          });
        }}
      );
    }, true);
    window.addEventListener('storage', updateAuthButtons);
    window.addEventListener('eo:session-refreshed', updateAuthButtons);
    window.addEventListener('eo:session-ended', updateAuthButtons);
  }

  /* ═══════════════ 全站 i18n（中 / 英）═══════════════
     文本节点级翻译：词典命中的 UI 文案整段替换，未命中保留原文。
     首次记录原文（WeakMap），切回中文即还原。动态内容由 MutationObserver 补译。*/
  var EO_I18N = {
    /* 导航 / 顶栏 */
    '角色档案':'Character','玩家社区':'Community','任务':'Quests','商城':'Shop','评价':'Reviews','新闻':'News','基金会':'Foundation','联系我们':'Contact','前台首页':'Home','社区':'Community',
    '当前在线':'Online','人':'players','服务器延迟':'Latency','天':'d','已运行':'Uptime','登录':'Sign in','登出':'Sign out','商务合作':'Business','购物车':'Cart','订单':'Orders','我的钱包':'My Wallet','悬赏任务':'Bounties','通知':'Inbox','系统通知':'Notifications','私信':'Direct message','发消息':'Send','暂无消息':'No messages yet',
    'ONLINE':'ONLINE','UNSTABLE':'UNSTABLE',
    /* 通用按钮 / 动作 */
    '加入购物车':'Add to cart','立即购买':'Buy now','提交订单并支付':'Submit & pay','提交订单':'Submit order','提交':'Submit','取消':'Cancel','确认':'Confirm','关闭':'Close','清空':'Clear','清空购物车':'Clear cart','移除':'Remove','充值':'Top up','确认支付':'Pay','确认充值':'Confirm','返回商城':'Back to shop','返回主世界':'Back to world','返回角色档案':'Back to profile','返回社区':'Back to community','返回':'Back','查看全部':'View all','下一步':'Next','上一步':'Back','继续':'Continue','继续查看':'Continue','继续本局游戏':'Continue this run','发布':'Publish','发布评论':'Post comment','发布悬赏':'Post bounty','报名':'Apply','选择执行者':'Pick taker','添加进我的任务':'Add to my quests','开源到社区':'Open-source','标记完成':'Mark done','已完成':'Done','去支付':'Pay now','确认收货':'Confirm receipt','去使用':'Use now','评价':'Review','申请售后':'After-sale','再买一单':'Buy again','取消订单':'Cancel order','保存':'Save','导出':'Export','导出角色卡':'Export card','点开放大':'Zoom in','整理背包':'Organize','整理背包 ↗':'Organize ↗','装备':'Equip','卸下':'Unequip','发送验证码':'Send code','我已有账号':'I have an account','新建角色档案':'Create profile','登录已有账号':'Log in','重新出生':'Reroll','下载角色卡':'Download card','下载游戏':'Download','进入个人档案':'Enter my profile','参与本期':'Join this season','进入世界任务':'Enter world quest','进入商城':'Enter shop','去商城':'To shop','去任务获得':'Earn via quests','我的订单':'My orders','去使用':'Use',
    /* 订单状态 / tab */
    '待付款':'Unpaid','待收货':'Shipping','待使用':'To use','待评价':'To review','售后':'After-sale','全部订单':'All orders','已完成':'Completed','售后中':'In after-sale','已退款':'Refunded','已取消':'Cancelled',
    /* 商城 / 钱包 */
    '商品列表':'Catalog','钱包':'Wallet','本次结算':'Checkout','合计':'Total','库存充足':'In stock','暂无评价':'No reviews yet','用户评价':'User reviews','商品详情':'Product','价格':'Price','支持土 / 石 / 砖 换币支付':'Pay in dirt / stone / brick',
    /* 任务 / 世界任务 */
    '世界任务':'World Quest','今日委托':'Daily','主线':'Mainline','支线':'Sideline','悬赏大厅':'Bounty Hall','悬赏':'Bounty','全服共建中':'Global build in progress','现在开始起飞':'Start your takeoff','领取任务':'Claim','新建主线':'New mainline','新建支线':'New sideline','重置本期记录':'Reset season',
    /* 社区 */
    '攻略开源':'Open Guides','玩家日志':'Player Logs','BUG 反馈':'Bug Reports','发布攻略':'Post guide','搜索':'Search','热度':'Hot','最新':'Newest','收藏':'Save','赞同':'Agree','分享':'Share','评论':'Comments',
    /* 角色 / 装备 */
    '背包':'Backpack','装备栏':'Equipped','主手':'Main','信物':'Token','隐藏':'Sealed','天赋':'Talents','职业映射':'Class','出生服':'Shard','物种':'Species','认同':'Identity','六维':'Stats','体力':'VIT','智力':'INT','共情':'EMP','灵感':'INS','社交':'SOC','幸运':'LUK',
    /* 基金会 / 评价 / 新闻 常见 */
    '援助基金':'Aid Fund','梦想基金':'Dream Fund','好评如潮':'Overwhelmingly positive','推荐':'Recommend','不推荐':'Not recommend','写评价':'Write review','官方公告':'Official','服务器公告':'Server log','查看全部公告 ↗':'View all ↗','查看全部评价':'View all reviews',
    /* 加入我们 */
    '加入我们':'Join Us','生成工牌':'Generate badge','提交候选记录':'Submit candidacy','保存工卡':'Save badge',
    /* 弹窗 / 后台 */
    '总览':'Overview','内容审核':'Moderation','官方发布':'Publishing','商品上架':'Listings','订单 / 评价':'Orders / Reviews','用户管理':'Users','服务提交':'Submissions','审计日志':'Audit Log','后台系统':'Admin Console','本机订单':'Local orders','商品评价':'Product reviews','售后队列':'After-sale queue',
    /* 状态条页脚常见 */
    '客服在线时间：总是。':'Support hours: always.','单线程，一命通关，不分服。':'Single-thread. One life. One server.'
  };
  var EO_I18N_TEXT = new WeakMap();
  var EO_I18N_ATTR = new WeakMap();
  var EO_I18N_ON = false;
  function i18nTranslateNode(node, en){
    if(!EO_I18N_TEXT.has(node)) EO_I18N_TEXT.set(node, node.nodeValue);
    var orig = EO_I18N_TEXT.get(node);
    if(!en){ if(node.nodeValue !== orig) node.nodeValue = orig; return; }
    var trimmed = orig.trim();
    var t = EO_I18N[trimmed];
    node.nodeValue = t ? orig.replace(trimmed, t) : orig;
  }
  function i18nWalk(root, en){
    if(!root || root.nodeType === 3){ if(root && root.parentNode) i18nTranslateNode(root, en); return; }
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode:function(n){
        if(!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        var p = n.parentNode; if(!p) return NodeFilter.FILTER_REJECT;
        var nm = p.nodeName;
        if(nm==='SCRIPT'||nm==='STYLE'||nm==='NOSCRIPT'||nm==='TEXTAREA') return NodeFilter.FILTER_REJECT;
        if(p.closest && p.closest('[data-no-i18n],code,pre')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var arr=[], n; while(n=w.nextNode()) arr.push(n);
    arr.forEach(function(node){ i18nTranslateNode(node, en); });
    /* 属性：placeholder / title / aria-label */
    ['placeholder','title','aria-label'].forEach(function(attr){
      var els = root.querySelectorAll ? root.querySelectorAll('['+attr+']') : [];
      Array.prototype.forEach.call(els, function(el){
        var store = EO_I18N_ATTR.get(el) || {};
        if(!(attr in store)){ store[attr] = el.getAttribute(attr); EO_I18N_ATTR.set(el, store); }
        var orig = store[attr]; if(orig == null) return;
        var t = EO_I18N[orig.trim()];
        el.setAttribute(attr, (en && t) ? t : orig);
      });
    });
  }
  var i18nObserver = null;
  function applyI18n(lang){
    var en = (lang === 'en-US' || lang === 'en');
    EO_I18N_ON = en;
    document.documentElement.lang = en ? 'en' : 'zh-CN';
    i18nWalk(document.body, en);
    updateAuthButtons();
    if(en && !i18nObserver && window.MutationObserver){
      i18nObserver = new MutationObserver(function(muts){
        if(!EO_I18N_ON) return;
        muts.forEach(function(m){ Array.prototype.forEach.call(m.addedNodes, function(nd){
          if(nd.nodeType === 1) i18nWalk(nd, true);
          else if(nd.nodeType === 3) i18nTranslateNode(nd, true);
        }); });
      });
      i18nObserver.observe(document.body, { childList:true, subtree:true });
    }
  }
  window.EOI18n = { refresh:function(){ if(EO_I18N_ON) i18nWalk(document.body, true); }, isEn:function(){ return EO_I18N_ON; } };

  function bindLanguageMenu(){
    var logo = $('.brand-logo-link');
    if(!logo || document.querySelector('script[src*="site-theme.js"]')) return;
    logo.removeAttribute('href');
    logo.setAttribute('role','button');
    logo.setAttribute('aria-haspopup','menu');
    logo.setAttribute('title','选择语言 / Language');
    var panel = document.createElement('div');
    panel.className = 'eo-lang-panel';
    panel.id = 'eoLangPanel';
    panel.setAttribute('data-no-i18n','');
    panel.innerHTML =
      '<div class="eo-lang-title">Language / 语言</div>' +
      '<button type="button" data-eo-lang="zh-CN"><span>简体中文</span><span class="code">CN</span></button>' +
      '<button type="button" data-eo-lang="en-US"><span>English</span><span class="code">EN</span></button>';
    document.body.appendChild(panel);

    function position(){
      var r = logo.getBoundingClientRect();
      panel.style.left = Math.max(12, r.left) + 'px';
      panel.style.top = (r.bottom + 8) + 'px';
    }
    function current(){ var l = LS.getItem('eo_lang_v1') || 'zh-CN'; return (l === 'ja-JP') ? 'zh-CN' : l; }
    function setLang(lang, announce){
      LS.setItem('eo_lang_v1', lang);
      $all('[data-eo-lang]', panel).forEach(function(btn){ btn.classList.toggle('is-active', btn.getAttribute('data-eo-lang') === lang); });
      applyI18n(lang);
      if(announce && lang !== 'zh-CN') toast('Switched to English UI. Long-form worldview prose stays in Chinese for now.');
      else if(announce) toast('已切换回简体中文。');
    }
    function open(mode){ position(); panel.classList.add('is-open'); if(mode) panel.dataset.openMode = mode; }
    function close(){ panel.classList.remove('is-open'); delete panel.dataset.openMode; }
    logo.addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      if(panel.classList.contains('is-open') && panel.dataset.openMode === 'click') close();
      else open('click');
    });
    logo.addEventListener('mouseenter', function(){ if(panel.dataset.openMode !== 'click') open('hover'); });
    panel.addEventListener('mouseenter', function(){ if(panel.dataset.openMode !== 'click') open('hover'); });
    panel.addEventListener('mouseleave', function(){ if(panel.dataset.openMode !== 'click') close(); });
    document.addEventListener('click', function(e){ if(!e.target.closest('#eoLangPanel,.brand-logo-link')) close(); });
    panel.addEventListener('click', function(e){
      var btn = e.target.closest('[data-eo-lang]');
      if(!btn) return;
      setLang(btn.getAttribute('data-eo-lang'), true);
      close();
    });
    setLang(current(), false);
  }

  function homePolish(){
    if(page() !== 'index.html') return;
    var wq = $('.wq-banner .body');
    if(wq && !$('.eo-wq-explain', wq)){
      var p = document.createElement('p');
      p.className = 'eo-wq-explain';
      p.textContent = '世界任务入口：这里不是装饰进度条。点击进入后可提交现实锚点、领取本期共同目标，并同步到您的任务履历。';
      wq.appendChild(p);
    }
    var tick = $all('.hr-tick').filter(function(el){ return /SHOP/.test(el.textContent); })[0];
    if(tick) tick.textContent = 'SHOP · 地球 Online 官方商城';
    var sbName = $('.shop-banner .sb-name');
    if(sbName) sbName.innerHTML = '<span class="br">[</span>官方商城<span class="br">]</span> · 道具箱 / 纪念品 / 公益守护者';
    var sbDesc = $('.shop-banner .sb-desc');
    if(!sbDesc && sbName){
      sbDesc = document.createElement('p');
      sbDesc.className = 'sb-desc';
      sbName.insertAdjacentElement('afterend', sbDesc);
    }
    if(sbDesc) sbDesc.textContent = '商城只展示当前可购买内容：数字道具即买即入背包，实体商品走订单与物流，公益商品利润自动进入基金会池。';
    var sbInfo = $('.shop-banner .sb-info');
    if(sbInfo) sbInfo.innerHTML =
      '<span>购物车&nbsp;·&nbsp;<span class="v" data-eo-cart-count>0</span> 件待结算</span>' +
      '<span class="sep">|</span>' +
      '<span>商品&nbsp;·&nbsp;<span class="v">实时库存</span></span>' +
      '<span class="sep">|</span>' +
      '<span>公益&nbsp;·&nbsp;<span class="v">守护者商品自动入池</span></span>';
  }

  function cart(){ var arr = readJson(CART_KEY, []); return Array.isArray(arr) ? arr : []; }
  function saveCart(arr){ writeJson(CART_KEY, arr.slice(0, 100)); updateCartCount(); }
  function updateCartCount(){
    var count = cart().reduce(function(sum, item){ return sum + (Number(item.qty) || 1); }, 0);
    $all('[data-eo-cart-count]').forEach(function(el){ el.textContent = count; });
  }
  function hash(s){
    var h = 5381;
    s = String(s || '');
    for(var i=0;i<s.length;i++) h = ((h * 33) ^ s.charCodeAt(i)) | 0;
    return Math.abs(h).toString(36);
  }
  function productFromCard(card){
    var name = clean($('.pc-name', card) ? $('.pc-name', card).textContent : '');
    var cat = clean($('.pc-cat', card) ? $('.pc-cat', card).textContent : '');
    var desc = clean($('.pc-desc', card) ? $('.pc-desc', card).textContent : '');
    var price = clean($('.pc-price', card) ? $('.pc-price', card).textContent : '');
    var stock = clean($('.pc-stock', card) ? $('.pc-stock', card).textContent : '');
    return {
      id:'sk-' + hash(name),
      name:name,
      category:cat,
      description:desc,
      price:price || '不可购买',
      stock:stock,
      status:card.classList.contains('soldout') ? 'soldout' : (card.classList.contains('limited') ? 'limited' : 'active'),
      href:'product.html?id=' + encodeURIComponent('sk-' + hash(name)),
      addedAt:new Date().toISOString()
    };
  }
  function upsertCatalog(products){
    var existing = readJson(CATALOG_KEY, {});
    products.forEach(function(p){ if(p && p.id) existing[p.id] = p; });
    writeJson(CATALOG_KEY, existing);
  }
  function addToCart(product, qty){
    if(!product || product.status === 'soldout'){
      toast('该商品已售罄，不能加入购物车。');
      return;
    }
    if(product.status === 'limited' && /不可购买|已发放|参与/.test(product.price + product.stock)){
      toast('该商品需要通过任务或活动获得，不能直接购买。');
      return;
    }
    var arr = cart();
    var ex = arr.find(function(x){ return x.id === product.id; });
    if(ex) ex.qty = Math.min(99, (Number(ex.qty) || 1) + (qty || 1));
    else arr.unshift(Object.assign({}, product, { qty: qty || 1 }));
    saveCart(arr);
    toast('已加入购物车：' + product.name);
  }

  /* ═══════════════ EO 商城引擎：钱包 / 支付 / 订单 / 评价 ═══════════════ */
  var CUR = { dirt:{ k:'dirt', label:'土', cls:'coin-dirt' }, stone:{ k:'stone', label:'石', cls:'coin-stone' }, brick:{ k:'brick', label:'砖', cls:'coin-brick' } };
  var RATES = { dirt:1, stone:10, brick:100 }; /* 以「土」计价：1 砖 = 10 石 = 100 土 */
  function num(v){ var n = Number(String(v == null ? 0 : v).replace(/[^\d.]/g, '')); return isNaN(n) ? 0 : n; }
  function fmtAmount(v){
    var n = Number(v);
    if(!isFinite(n)) n = 0;
    return String(Math.round(n * 10000) / 10000).replace(/(\.\d*?)0+$/,'$1').replace(/\.$/,'');
  }
  function readWallet(){
    var w = readJson(WALLET_KEY, null);
    if(!w || typeof w !== 'object'){ w = { dirt:2000, stone:200, brick:30 }; writeJson(WALLET_KEY, w); }
    ['dirt','stone','brick'].forEach(function(k){ if(typeof w[k] !== 'number') w[k] = num(w[k]); });
    return w;
  }
  function saveWallet(w){ writeJson(WALLET_KEY, w); }

  /* ── 账单 / 资金流水（钱包账单）── */
  var WALLET_TX_KEY = 'eo_wallet_tx_v1';
  function readTx(){ var a = readJson(WALLET_TX_KEY, []); return Array.isArray(a) ? a : []; }
  function recordTx(tx){
    var list = readTx();
    list.unshift({
      id: uid('TX'),
      at: new Date().toISOString(),
      currency: tx.currency,
      amount: Number(tx.amount) || 0,          /* 正=收入，负=支出 */
      reason: tx.reason || '',
      channel: tx.channel || '其它',
      orderId: tx.orderId || null,
      balanceAfter: tx.balanceAfter
    });
    writeJson(WALLET_TX_KEY, list.slice(0, 200));
  }
  /* 入账（任务奖励 / 锚点 / 充值等）：增加余额并记一笔流水 */
  function addCoins(currency, amount, reason, channel, orderId){
    /* 货币只能由后端账本发放。本函数保留兼容接口，但绝不修改浏览器余额。 */
    return null;
  }
  /* 扣账（购物 / 发悬赏等）：减少余额并记一笔流水。返回是否成功 */
  function spendCoins(currency, amount, reason, channel, orderId){
    /* 扣款必须走后端事务；禁止旧页面制造本机“支付成功”。 */
    return false;
  }
  /* 从奖励文本里解析币种与数量并入账（任务完成时调用）。无可解析金币则不入账。*/
  function creditTaskReward(rewardText, title){
    /* 用户填写的奖励文案不是铸币指令；真实奖励由服务端业务接口结算。 */
    return false;
  }

  function parsePrice(raw){
    raw = String(raw || '');
    if(/不可购买|已发放|需.*参与|售罄|不可直接|任务.*获得|活动.*获得/.test(raw)) return { buyable:false, raw:raw };
    var m;
    if((m = raw.match(/砖\s*([\d,]+)/))) return { currency:'brick', amount:num(m[1]), buyable:true, raw:raw };
    if((m = raw.match(/石\s*([\d,]+)/))) return { currency:'stone', amount:num(m[1]), buyable:true, raw:raw };
    if((m = raw.match(/土\s*([\d,]+)/))) return { currency:'dirt', amount:num(m[1]), buyable:true, raw:raw };
    if((m = raw.match(/[¥￥]\s*([\d,.]+)/))) return { currency:'brick', amount:Math.max(1, Math.ceil(num(m[1]))), buyable:true, raw:raw };
    if(/免费|赠送/.test(raw)) return { currency:'dirt', amount:0, buyable:true, raw:raw };
    if((m = raw.match(/([\d,]+)/))) return { currency:'dirt', amount:num(m[1]), buyable:true, raw:raw };
    return { buyable:false, raw:raw };
  }
  function productKind(p){
    var s = (p.category || '') + (p.name || '') + (p.description || '');
    return /实体|周边|奖牌|手办|海报|徽章|卡片|贴纸|T恤|帆布|马克杯|实物|包邮|快递/.test(s) ? 'physical' : 'virtual';
  }
  function priceInDirt(item){ return (Number(item.amount)||0) * (RATES[item.currency]||1) * (Number(item.qty)||1); }
  function orderTotalDirt(order){ return (order.items||[]).reduce(function(s,i){ return s + priceInDirt(i); }, 0); }
  function convertToCurrency(totalDirt, currency){ return Math.ceil(totalDirt / (RATES[currency] || 1)); }
  function fmtPrice(currency, amount){ return (CUR[currency] ? CUR[currency].label : '') + ' ' + amount; }
  function fmtServerPrice(currency, amount){ return (CUR[currency] ? CUR[currency].label : currency) + ' ' + fmtAmount(amount); }

  function readOrders(){ var a = readJson(ORDERS_KEY, []); return Array.isArray(a) ? a : []; }
  function saveOrders(a){ writeJson(ORDERS_KEY, a.slice(0, 80)); }
  function normItem(it){
    var pp = parsePrice(it.price);
    return { id:it.id, name:it.name, category:it.category || '', priceRaw:it.price || '', qty:Number(it.qty)||1,
      currency:pp.currency || 'dirt', amount:pp.amount || 0, kind:productKind(it),
      sku:it.id, href:it.href || ('product.html?id=' + encodeURIComponent(it.id)) };
  }
  function createOrder(items){
    var norm = (items || []).map(normItem);
    var order = {
      id: uid('ORDER'),
      items: norm,
      kind: norm.some(function(i){ return i.kind === 'physical'; }) ? 'physical' : 'virtual',
      status: 'pending_payment',
      createdAt: new Date().toISOString(),
      buyer: (readJson('eo_registered_profile_v1', {}) || {}).uid || '本机玩家'
    };
    var orders = readOrders(); orders.unshift(order); saveOrders(orders);
    return order;
  }
  function getOrder(id){ return readOrders().find(function(o){ return o.id === id; }) || null; }
  function updateOrder(id, patch){
    var orders = readOrders();
    var o = orders.find(function(x){ return x.id === id; });
    if(o){ Object.assign(o, patch); saveOrders(orders); }
    return o;
  }
  var ORDER_TABS = [
    { k:'pending_payment', label:'待付款' },
    { k:'pending_ship', label:'待收货' },
    { k:'pending_use', label:'待使用' },
    { k:'pending_review', label:'待评价' },
    { k:'after_sale', label:'售后' },
    { k:'all', label:'全部订单' }
  ];
  var ORDER_STATUS_LABEL = { pending_payment:'待付款', pending_ship:'待收货', pending_use:'待使用', pending_review:'待评价', completed:'已完成', after_sale:'售后中', refunded:'已退款', cancelled:'已取消' };
  function orderInTab(o, tab){
    if(tab === 'all') return true;
    if(tab === 'after_sale') return o.status === 'after_sale' || o.status === 'refunded';
    return o.status === tab;
  }

  /* 钱包余额条 */
  function walletBarHtml(){
    var w = readWallet();
    return '<div class="eo-wallet-bar"><span class="eo-wallet-lab">钱包</span>' +
      ['dirt','stone','brick'].map(function(k){ return '<span class="eo-coin ' + CUR[k].cls + '"><span class="ic">' + CUR[k].label + '</span><span class="n" data-wallet="' + k + '">' + w[k] + '</span></span>'; }).join('') +
      '<button class="eo-inline-btn" type="button" data-wallet-recharge>充值</button></div>';
  }
  function rechargeDialog(onDone){
    /* 体验额度：站内体验金币，不作真实货币用途（去除人民币表述，规避法律风险）*/
    modal('CREDITS / 领取体验额度',
      '<div class="eo-product-detail"><p class="eo-product-desc">这是站内体验额度，仅用于试用商城与悬赏功能，不作真实货币用途。换算关系：1 砖 = 10 石 = 100 土。</p>' +
        '<div class="eo-form-grid"><div class="eo-field"><label>领取砖块数量</label><input class="eo-input" id="rcAmt" type="number" min="1" max="999" value="10"></div></div>' +
        '<div class="eo-modal-actions"><button class="btn ghost" type="button" data-eo-close><span>取消</span></button><button class="btn primary" type="button" data-rc-go><span>领取额度</span><span class="arr"></span></button></div>' +
      '</div>',
      { onOpen:function(root){
        $('[data-eo-close]', root).addEventListener('click', closeModal);
        $('[data-rc-go]', root).addEventListener('click', function(){
          var amt = Math.max(1, Math.min(999, Math.floor(num($('#rcAmt', root).value)) || 10));
          addCoins('brick', amt, '领取体验额度', '体验额度');
          closeModal(); toast('已领取 ' + amt + ' 砖体验额度。'); if(onDone) onDone();
        });
      }}
    );
  }

  /* 支付弹窗：选币种 + 余额校验 + 扣款 */
  function payDialog(order, onPaid){
    var totalDirt = orderTotalDirt(order);
    function render(root){
      var w = readWallet();
      var opts = ['dirt','stone','brick'].map(function(k){
        var need = convertToCurrency(totalDirt, k);
        var enough = w[k] >= need;
        return '<label class="eo-pay-opt' + (enough ? '' : ' is-short') + '"><input type="radio" name="paycur" value="' + k + '"' + (k === order.items[0].currency ? ' checked' : '') + (enough ? '' : ' disabled') + '>' +
          '<span class="eo-pay-cur">' + CUR[k].label + '</span><span class="eo-pay-need">应付 ' + need + ' ' + CUR[k].label + '</span><span class="eo-pay-have">余 ' + w[k] + (enough ? '' : ' · 不足') + '</span></label>';
      }).join('');
      root.innerHTML =
        '<div class="eo-pay-shell">' +
          '<div class="eo-pay-items">' + order.items.map(function(i){ return '<div class="eo-pay-item"><span>' + esc(i.name) + ' ×' + i.qty + '</span><span class="mono">' + fmtPrice(i.currency, i.amount * i.qty) + '</span></div>'; }).join('') + '</div>' +
          '<div class="eo-pay-total">合计 ≈ <strong>' + totalDirt + ' 土</strong>（可换币支付）</div>' +
          '<div class="eo-pay-opts">' + opts + '</div>' +
          '<div class="eo-modal-actions"><button class="btn ghost" type="button" data-pay-recharge><span>充值</span></button><button class="btn primary" type="button" data-pay-confirm><span>确认支付</span><span class="arr"></span></button></div>' +
        '</div>';
      $('[data-pay-recharge]', root).addEventListener('click', function(){ rechargeDialog(function(){ render(root); }); });
      $('[data-pay-confirm]', root).addEventListener('click', function(){
        var sel = $('input[name=paycur]:checked', root);
        if(!sel){ toast('请选择一种余额充足的货币。'); return; }
        var cur = sel.value; var need = convertToCurrency(totalDirt, cur);
        var itemNames = order.items.map(function(i){ return i.name; }).join('、');
        if(!spendCoins(cur, need, '购买：' + itemNames, '商城消费', order.id)){ toast('余额不足，请换币或领取体验额度。'); return; }
        updateOrder(order.id, { status: order.kind === 'physical' ? 'pending_ship' : 'pending_use', payCurrency:cur, payAmount:need, paidAt:new Date().toISOString() });
        closeModal();
        toast('支付成功：' + need + ' ' + CUR[cur].label + '。' + (order.kind === 'physical' ? '商家备货中。' : '可在「待使用」里使用。'));
        if(onPaid) onPaid();
      });
    }
    var mask = modal('PAYMENT / 支付', '<div data-pay-root></div>', { onOpen:function(root){ render($('[data-pay-root]', root)); } });
    return mask;
  }
  function buyNow(product){
    var pp = parsePrice(product.price);
    if(!pp.buyable){ toast('该商品不能直接购买，多为任务 / 活动获得。'); return; }
    var order = createOrder([Object.assign({}, product, { qty: product.qty || 1 })]);
    payDialog(order, function(){ if(page() === 'orders.html') renderOrdersPage(); else setTimeout(function(){ location.href = 'orders.html'; }, 500); });
  }

  /* 商品评价 */
  function readProductReviews(sku){ var all = readJson(PRODUCT_REVIEWS_KEY, {}) || {}; return Array.isArray(all[sku]) ? all[sku] : []; }
  function addProductReview(sku, review){
    var all = readJson(PRODUCT_REVIEWS_KEY, {}) || {};
    if(!Array.isArray(all[sku])) all[sku] = [];
    all[sku].unshift(review);
    writeJson(PRODUCT_REVIEWS_KEY, all);
  }
  function avgRating(sku){ var r = readProductReviews(sku); if(!r.length) return 0; return r.reduce(function(s,x){ return s + (Number(x.rating)||0); }, 0) / r.length; }
  function stars(n){ n = Math.round(n); return '★★★★★☆☆☆☆☆'.slice(5 - Math.max(0,Math.min(5,n)), 10 - Math.max(0,Math.min(5,n))); }

  /* 评价弹窗（对某个订单里的商品） */
  function reviewDialog(order, onDone){
    modal('REVIEW / 评价订单',
      '<form class="eo-review-form" data-review-form>' +
        order.items.map(function(it, idx){
          return '<div class="eo-review-item" data-ri="' + idx + '"><h4>' + esc(it.name) + '</h4>' +
            '<div class="eo-star-pick" data-star-pick>' + [1,2,3,4,5].map(function(s){ return '<button type="button" data-star="' + s + '" class="eo-star' + (s <= 5 ? ' is-on' : '') + '">★</button>'; }).join('') + '<input type="hidden" name="rating" value="5"></div>' +
            '<textarea class="eo-textarea" name="body" maxlength="500" placeholder="说说这件商品 / 这次体验…"></textarea></div>';
        }).join('') +
        '<div class="eo-modal-actions"><button class="btn ghost" type="button" data-eo-close><span>取消</span></button><button class="btn primary" type="submit"><span>提交评价</span><span class="arr"></span></button></div>' +
      '</form>',
      { onOpen:function(root){
        $('[data-eo-close]', root).addEventListener('click', closeModal);
        $all('[data-star-pick]', root).forEach(function(pick){
          pick.addEventListener('click', function(e){
            var b = e.target.closest('[data-star]'); if(!b) return;
            var v = Number(b.getAttribute('data-star'));
            $('input[name=rating]', pick).value = v;
            $all('[data-star]', pick).forEach(function(s){ s.classList.toggle('is-on', Number(s.getAttribute('data-star')) <= v); });
          });
        });
        $('[data-review-form]', root).addEventListener('submit', function(e){
          e.preventDefault();
          var profile = readJson('eo_registered_profile_v1', {}) || {};
          $all('.eo-review-item', root).forEach(function(box, idx){
            var it = order.items[idx];
            addProductReview(it.sku || it.id, {
              id: uid('PREV'), orderId: order.id, rating: Number($('input[name=rating]', box).value) || 5,
              body: clean($('textarea', box).value) || '（未留文字）',
              author: profile.nickname || profile.uid || '本机玩家', authorUid: profile.uid || '', at: new Date().toISOString()
            });
          });
          updateOrder(order.id, { status:'completed', reviewedAt:new Date().toISOString() });
          closeModal(); toast('评价已提交，订单完成。'); if(onDone) onDone();
        });
      }}
    );
  }

  /* 售后弹窗 */
  function afterSaleDialog(order, onDone){
    modal('AFTER-SALE / 申请售后',
      '<form class="eo-form-grid" data-as-form>' +
        '<div class="eo-field full"><label>售后类型</label><select class="eo-select" name="kind"><option value="退款">仅退款</option><option value="退货退款">退货退款</option><option value="换货">换货</option><option value="咨询">仅咨询</option></select></div>' +
        '<div class="eo-field full"><label>说明</label><textarea class="eo-textarea" name="reason" maxlength="500" placeholder="说说遇到的问题"></textarea></div>' +
        '<div class="eo-modal-actions full"><button class="btn ghost" type="button" data-eo-close><span>取消</span></button><button class="btn primary" type="submit"><span>提交申请</span><span class="arr"></span></button></div>' +
      '</form>',
      { onOpen:function(root){
        $('[data-eo-close]', root).addEventListener('click', closeModal);
        $('[data-as-form]', root).addEventListener('submit', function(e){
          e.preventDefault(); var f = e.target;
          updateOrder(order.id, { status:'after_sale', afterSale:{ kind:f.kind.value, reason:clean(f.reason.value), at:new Date().toISOString() } });
          adminLocalDraft('aftersale', '售后 · ' + (order.items[0] ? order.items[0].name : order.id), f.kind.value + ' · ' + clean(f.reason.value), { orderId:order.id });
          closeModal(); toast('售后申请已提交，等待处理。'); if(onDone) onDone();
        });
      }}
    );
  }
  function installOrdersEntry(){ installShopEntries(); }
  /* 订单 / 购物车入口只出现在「商城」相关页，并紧挨「我的钱包」按钮。
     内容页（角色档案 / 任务 / 社区 …）不再注入购物车和订单。 */
  var SHOP_PAGES = ['shop.html','cart.html','orders.html','product.html'];
  function installShopEntries(){
    if(SHOP_PAGES.indexOf(page()) < 0){ updateCartCount(); return; }
    var panel = $('.shop-hero-panel');
    var compact = false, host;
    if(panel){ host = panel; } else { host = $('.subpage-h') || $('.subpage-hero-inner'); compact = true; }
    if(!host || $('.eo-shop-tools', host)){ updateCartCount(); return; }
    var group = document.createElement('div');
    group.className = 'eo-shop-tools' + (compact ? ' compact' : '');
    group.innerHTML =
      (compact ? '<a class="eo-shop-tool" href="wallet.html"><span class="ic">⌖</span><span>我的钱包</span></a>' : '') +
      '<a class="eo-shop-tool" href="cart.html"><span class="ic">⊞</span><span>购物车</span><span class="eo-cart-count" data-eo-cart-count>0</span></a>' +
      '<a class="eo-shop-tool" href="orders.html"><span class="ic">▤</span><span>订单</span></a>';
    if(panel){
      var wallet = $('.shop-wallet-entry', panel);
      /* 商城页：钱包 + 购物车 + 订单 放进同一行（item：不再两排）*/
      if(wallet && wallet.parentNode){
        wallet.parentNode.insertBefore(group, wallet);
        group.insertBefore(wallet, group.firstChild);
      } else {
        panel.insertBefore(group, panel.firstChild);
      }
    } else {
      host.appendChild(group);
    }
    updateCartCount();
  }
  function installCartEntry(){ installShopEntries(); }
  var serverOrdersState = { loading:false, loaded:false, items:[], error:'' };
  function serverStockText(item){
    if(!item) return '未知';
    if(item.status === 'withdrawn') return '已下架';
    if(item.status === 'soldout' || item.stock === 0) return 'SOLD OUT';
    if(item.stock < 0) return '库存 ∞';
    return '库存 ' + item.stock;
  }
  function serverItemCard(item){
    var unavailable = item.status === 'withdrawn' || item.status === 'soldout' || item.stock === 0;
    return '<article class="product-card eo-server-card" id="online-' + esc(item.id) + '">' +
      '<div class="pc-head"><span class="pc-cat">在线 · ' + esc(item.category || '道具') + '</span><span class="pc-stock' + (unavailable ? ' pc-stock-sold' : '') + '">' + esc(serverStockText(item)) + '</span></div>' +
      '<h3 class="pc-name">' + esc(item.name) + (item.effect ? ' <span class="pc-eff">' + esc(item.effect) + '</span>' : '') + '</h3>' +
      '<p class="pc-desc">' + esc(item.description || '暂无说明。') + '</p>' +
      '<div class="pc-price"><span class="coin coin-' + esc(item.priceCurrency) + '"><span class="ic">' + esc((CUR[item.priceCurrency] || {}).label || item.priceCurrency) + '</span><span class="n">' + esc(fmtAmount(item.priceAmount)) + '</span></span></div>' +
      '<button class="btn sm primary pc-btn" type="button" data-server-buy="' + esc(item.id) + '"' + (unavailable ? ' disabled' : '') + '><span>' + (unavailable ? '不可购买' : '购买') + '</span><span class="arr"></span></button>' +
    '</article>';
  }
  function renderServerShopPanel(){
    if(page() !== 'shop.html') return;
    var inner = $('.shop-catalog-section .section-inner');
    if(!inner) return;
    var host = $('#eoServerCatalog', inner);
    if(!host){
      host = document.createElement('div');
      host.id = 'eoServerCatalog';
      host.className = 'eo-server-catalog';
      var tabs = $('.task-tabs', inner);
      inner.insertBefore(host, tabs || inner.firstChild);
    }
    host.innerHTML = '<div class="hr-tick">ONLINE STOCK · 在线库存</div><div class="sr-empty">正在同步在线库存…</div>';
    apiJson('/shop/items?limit=12', { method:'GET', json:false }).then(function(items){
      items = Array.isArray(items) ? items : [];
      if(!items.length){
        host.innerHTML = '<div class="hr-tick">ONLINE STOCK · 在线库存</div><div class="sr-empty">在线库存暂时为空。</div>';
        return;
      }
      host.innerHTML = '<div class="hr-tick">ONLINE STOCK · 在线库存</div><div class="product-grid eo-server-grid">' + items.map(serverItemCard).join('') + '</div>';
      $all('[data-server-buy]', host).forEach(function(btn){
        btn.addEventListener('click', function(){
          buyServerItem(btn.getAttribute('data-server-buy'), btn);
        });
      });
    }).catch(function(err){
      host.innerHTML = '<div class="hr-tick">ONLINE STOCK · 在线库存</div><div class="sr-empty">' + esc(publicError(err, '在线库存暂时无法加载，请稍后重试。')) + '</div>';
    });
  }
  function buyServerItem(itemId, btn){
    if(!token()){
      toast('请先登录角色档案，再购买在线库存。');
      return;
    }
    if(!itemId || btn.disabled) return;
    var old = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span>处理中</span>';
    apiJson('/shop/items/' + encodeURIComponent(itemId) + '/purchase', { method:'POST', payload:{} }).then(function(result){
      serverOrdersState.loaded = false;
      serverOrdersState.items = [];
      serverOrdersState.error = '';
      toast('购买成功，订单已同步。');
      renderServerShopPanel();
    }).catch(function(err){
      var code = window.EOPublicError ? window.EOPublicError.code(err) : '';
      var msg = code === 'INSUFFICIENT_BALANCE'
        ? '余额不足，请先完成任务或领取体验额度。'
        : publicError(err, '购买未完成，请稍后重试。');
      if(err.status === 401) msg = '登录状态已过期，请重新登录。';
      toast('购买失败：' + msg);
    }).then(function(){
      btn.disabled = false;
      btn.innerHTML = old;
    });
  }
  function serverOrderToLocal(row){
    if(!row || !row.order || !row.item) return null;
    var o = row.order, item = row.item;
    var amount = Number(o.pricePaid || item.priceAmount || 0);
    return {
      id:'DB-' + String(o.id).slice(0, 8),
      remoteId:o.id,
      source:'server',
      status:'completed',
      kind:'virtual',
      createdAt:o.createdAt,
      paidAt:o.createdAt,
      payCurrency:o.currency,
      payAmount:fmtAmount(amount),
      buyer:'当前账号',
      items:[{
        id:item.id,
        sku:item.sku || item.id,
        name:item.name,
        category:item.category || '在线库存',
        priceRaw:fmtServerPrice(o.currency, amount),
        qty:1,
        currency:o.currency,
        amount:amount,
        kind:'virtual',
        href:'shop.html#online-' + item.id
      }]
    };
  }
  function loadServerOrders(done){
    if(!token()){
      serverOrdersState = { loading:false, loaded:false, items:[], error:'' };
      return;
    }
    if(serverOrdersState.loading || serverOrdersState.loaded) return;
    serverOrdersState.loading = true;
    serverOrdersState.error = '';
    apiJson('/shop/orders?limit=80', { method:'GET', json:false }).then(function(rows){
      serverOrdersState.items = Array.isArray(rows) ? rows : [];
      serverOrdersState.loaded = true;
    }).catch(function(err){
      serverOrdersState.error = publicError(err, '在线订单暂时无法同步，请稍后重试。');
    }).then(function(){
      serverOrdersState.loading = false;
      if(done) done();
    });
  }
  function shopPolish(){
    installCartEntry();
    installOrdersEntry();
    if(page() !== 'shop.html') return;
    renderServerShopPanel();
    var cards = $all('.product-card');
    var products = cards.map(productFromCard).filter(function(p){ return p.name; });
    upsertCatalog(products);
    cards.forEach(function(card){
      if(card.dataset.eoShopBound) return;
      card.dataset.eoShopBound = '1';
      var product = productFromCard(card);
      var purchasable = !card.classList.contains('soldout') && !card.classList.contains('limited') && parsePrice(product.price).buyable;
      var btn = $('.pc-btn', card);
      if(btn && btn.tagName === 'BUTTON' && purchasable){
        btn.removeAttribute('data-modal');
        btn.classList.add('eo-cart-btn');
        var label = $('span', btn);
        if(label) label.textContent = '加入购物车';
        btn.addEventListener('click', function(e){
          e.preventDefault(); e.stopPropagation();
          addToCart(product, 1);
        }, true);
        /* 追加「立即购买」按钮 */
        if(!$('.eo-buynow-btn', card)){
          var buy = document.createElement('button');
          buy.type = 'button';
          buy.className = 'btn sm primary eo-buynow-btn';
          buy.innerHTML = '<span>立即购买</span><span class="arr"></span>';
          buy.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); upsertCatalog([product]); buyNow(product); }, true);
          btn.parentNode.insertBefore(buy, btn.nextSibling);
        }
      }
      card.addEventListener('click', function(e){
        if(e.target.closest('a,button')) return;
        upsertCatalog([product]);
        location.href = product.href;
      });
    });
  }

  function renderProductPage(){
    if(page() !== 'product.html') return;
    installCartEntry();
    installOrdersEntry();
    var id = new URLSearchParams(location.search).get('id') || '';
    var catalog = readJson(CATALOG_KEY, {});
    var product = catalog[id] || Object.keys(catalog).map(function(k){ return catalog[k]; })[0] || null;
    var host = $('#productDetailHost');
    if(!host) return;
    if(!product){
      host.innerHTML = '<div class="eo-product-page"><p class="eo-product-desc">没有找到商品详情。请先从商城打开任意商品。</p><a class="btn ghost" href="shop.html"><span>返回商城</span><span class="arr"></span></a></div>';
      return;
    }
    var sku = product.id;
    var pp = parsePrice(product.price);
    var buyable = pp.buyable && product.status !== 'soldout';
    function renderDetail(){
      var reviews = readProductReviews(sku);
      var avg = avgRating(sku);
      document.title = product.name + ' / 商品详情 — EARTH.ONLINE';
      host.innerHTML =
        '<article class="eo-product-page">' +
          '<a class="eo-product-back" href="shop.html">← 返回商城</a>' +
          '<div class="eo-product-grid">' +
            '<div class="eo-product-figure"><span class="eo-product-figmark">' + esc((product.category || '商品').slice(0,2)) + '</span><span class="eo-product-figkind">' + (productKind(product) === 'physical' ? '实体周边' : '虚拟道具') + '</span></div>' +
            '<div class="eo-product-info">' +
              '<div class="eo-product-meta"><span>' + esc(product.category || '商品') + '</span><span>' + esc(product.stock || '库存充足') + '</span>' + (reviews.length ? '<span>' + stars(avg) + ' ' + avg.toFixed(1) + ' · ' + reviews.length + ' 条评价</span>' : '<span>暂无评价</span>') + '</div>' +
              '<h2>' + esc(product.name) + '</h2>' +
              '<p class="eo-product-desc">' + esc(product.description || '暂无说明。') + '</p>' +
              '<div class="eo-product-price">' + (buyable ? '<strong>' + esc(product.price) + '</strong><span>支持土 / 石 / 砖 换币支付</span>' : '<strong>' + esc(product.price || '不可直接购买') + '</strong><span>多为任务 / 活动获得</span>') + '</div>' +
              (buyable
                ? '<div class="eo-product-actions"><button class="btn ghost" type="button" data-add-detail-cart><span>加入购物车</span><span class="arr"></span></button><button class="btn primary" type="button" data-buy-now><span>立即购买</span><span class="arr"></span></button></div>'
                : '<div class="eo-product-actions"><a class="btn ghost" href="task.html"><span>去任务获得</span><span class="arr"></span></a></div>') +
            '</div>' +
          '</div>' +
          '<div class="eo-product-reviews">' +
            '<div class="hr-tick">USER REVIEWS · 用户评价 (' + reviews.length + ')</div>' +
            (reviews.length ? reviews.map(function(r){
              return '<div class="eo-prev"><div class="eo-prev-head"><span class="eo-prev-author">' + esc(r.author) + '</span><span class="eo-prev-stars">' + stars(r.rating) + '</span><span class="eo-prev-time">' + esc((r.at||'').slice(0,10)) + '</span></div><p class="eo-prev-body">' + esc(r.body) + '</p></div>';
            }).join('') : '<div class="sr-empty">还没有评价。买过并完成评价后会显示在这里。</div>') +
          '</div>' +
        '</article>';
      var addBtn = $('[data-add-detail-cart]', host); if(addBtn) addBtn.addEventListener('click', function(){ addToCart(product, 1); });
      var buyBtn = $('[data-buy-now]', host); if(buyBtn) buyBtn.addEventListener('click', function(){ buyNow(product); });
    }
    renderDetail();
  }

  function renderCartPage(){
    if(page() !== 'cart.html') return;
    installCartEntry();
    installOrdersEntry();
    var host = $('#cartHost');
    if(!host) return;
    function qtyChange(id, delta){
      var arr = cart();
      var it = arr.find(function(x){ return x.id === id; });
      if(it){ it.qty = Math.max(1, Math.min(99, (Number(it.qty)||1) + delta)); saveCart(arr); render(); }
    }
    function render(){
      var list = cart();
      if(!list.length){
        host.innerHTML = '<div class="eo-cart-shell">' + walletBarHtml() + '<div class="sr-empty">购物车为空。商城里有些东西能买，有些只能承认它售罄。</div><div class="eo-modal-actions"><a class="btn ghost" href="orders.html"><span>我的订单</span></a><a class="btn primary" href="shop.html"><span>去商城</span><span class="arr"></span></a></div></div>';
        bindWallet(host); updateCartCount();
        return;
      }
      var totalDirt = list.reduce(function(s,i){ return s + priceInDirt(normItem(i)); }, 0);
      host.innerHTML =
        '<div class="eo-cart-shell">' +
          walletBarHtml() +
          list.map(function(item){
            var n = normItem(item);
            return '<article class="eo-cart-row" data-cart-id="' + esc(item.id) + '">' +
              '<div><h3>' + esc(item.name) + '</h3><p>' + esc(item.category || '') + ' · ' + esc(item.price || '') + ' · ' + (n.kind === 'physical' ? '实体' : '虚拟') + '</p></div>' +
              '<div class="eo-qty"><button class="eo-qty-btn" type="button" data-qty-dec>−</button><span class="eo-qty-n">' + (item.qty || 1) + '</span><button class="eo-qty-btn" type="button" data-qty-inc>+</button></div>' +
              '<button class="eo-inline-btn" type="button" data-remove-cart>移除</button>' +
            '</article>';
          }).join('') +
          '<div class="eo-cart-total"><span>合计 ' + list.reduce(function(s,i){ return s + (Number(i.qty)||1); },0) + ' 件</span><strong>≈ ' + totalDirt + ' 土（可换币支付）</strong></div>' +
          '<div class="eo-modal-actions"><button class="btn ghost" type="button" data-clear-cart><span>清空</span></button><button class="btn primary" type="button" data-checkout-cart><span>提交订单并支付</span><span class="arr"></span></button></div>' +
        '</div>';
      bindWallet(host);
      $all('[data-remove-cart]', host).forEach(function(btn){
        btn.addEventListener('click', function(){
          var id = btn.closest('[data-cart-id]').getAttribute('data-cart-id');
          saveCart(cart().filter(function(item){ return item.id !== id; }));
          render();
        });
      });
      $all('[data-qty-dec]', host).forEach(function(b){ b.addEventListener('click', function(){ qtyChange(b.closest('[data-cart-id]').getAttribute('data-cart-id'), -1); }); });
      $all('[data-qty-inc]', host).forEach(function(b){ b.addEventListener('click', function(){ qtyChange(b.closest('[data-cart-id]').getAttribute('data-cart-id'), 1); }); });
      var clear = $('[data-clear-cart]', host);
      if(clear) clear.addEventListener('click', function(){ saveCart([]); render(); });
      var checkout = $('[data-checkout-cart]', host);
      if(checkout) checkout.addEventListener('click', function(){
        var buyable = list.filter(function(i){ return parsePrice(i.price).buyable; });
        if(!buyable.length){ toast('购物车里没有可直接购买的商品。'); return; }
        var order = createOrder(buyable);
        saveCart([]);
        payDialog(order, function(){ location.href = 'orders.html'; });
        render();
      });
    }
    render();
  }
  function bindWallet(root){
    var rc = $('[data-wallet-recharge]', root);
    if(rc) rc.addEventListener('click', function(){ rechargeDialog(function(){ var w = readWallet(); $all('[data-wallet]', root).forEach(function(el){ el.textContent = w[el.getAttribute('data-wallet')]; }); }); });
  }

  /* ═══════════════ 订单中心 orders.html ═══════════════ */
  var ordersTab = 'all';
  var ordersQuery = '';
  function renderOrdersPage(){
    if(page() !== 'orders.html') return;
    installCartEntry();
    installOrdersEntry();
    var host = $('#ordersHost');
    if(!host) return;
    loadServerOrders(renderOrdersPage);
    var remoteOrders = (serverOrdersState.items || []).map(serverOrderToLocal).filter(Boolean);
    var remoteIds = {};
    remoteOrders.forEach(function(o){ remoteIds[o.remoteId] = true; });
    var localOrders = readOrders().filter(function(o){ return !o.remoteId || !remoteIds[o.remoteId]; });
    var orders = remoteOrders.concat(localOrders);
    var counts = {}; ORDER_TABS.forEach(function(t){ counts[t.k] = orders.filter(function(o){ return orderInTab(o, t.k); }).length; });
    var q = ordersQuery.trim().toLowerCase();
    var list = orders.filter(function(o){ return orderInTab(o, ordersTab); });
    if(q) list = orders.filter(function(o){ return (o.id||'').toLowerCase().indexOf(q) >= 0 || (o.items||[]).some(function(i){ return (i.name||'').toLowerCase().indexOf(q) >= 0; }); });
    var syncLine = '';
    if(token()){
      if(serverOrdersState.loading) syncLine = '<div class="search-status">在线订单同步中…</div>';
      else if(serverOrdersState.error) syncLine = '<div class="search-status">在线订单同步失败：' + esc(serverOrdersState.error) + '</div>';
      else if(serverOrdersState.loaded) syncLine = '<div class="search-status">已同步 ' + remoteOrders.length + ' 笔在线订单。</div>';
    }
    host.innerHTML =
      walletBarHtml() +
      syncLine +
      '<div class="eo-order-lookup"><span class="ic">⌕</span><input class="eo-order-search" id="orderSearch" placeholder="按订单号或商品名查找订单…" value="' + esc(ordersQuery) + '">' + (q ? '<button class="eo-inline-btn" data-order-clear>清除</button>' : '') + '</div>' +
      (q ? '<div class="search-status">按「' + esc(ordersQuery) + '」找到 ' + list.length + ' 笔订单</div>' :
        '<div class="eo-order-tabs">' + ORDER_TABS.map(function(t){ return '<button data-otab="' + t.k + '"' + (ordersTab === t.k ? ' class="is-on"' : '') + '>' + t.label + (counts[t.k] ? ' <i>' + counts[t.k] + '</i>' : '') + '</button>'; }).join('') + '</div>') +
      '<div class="eo-order-list">' + (list.length ? list.map(orderCardHtml).join('') : '<div class="sr-empty">这个分类下还没有订单。<a href="shop.html" style="color:var(--rust-3)">去商城逛逛 →</a></div>') + '</div>';
    bindWallet(host);
    $all('[data-otab]', host).forEach(function(b){ b.addEventListener('click', function(){ ordersTab = b.getAttribute('data-otab'); renderOrdersPage(); }); });
    var search = $('#orderSearch', host);
    if(search){ search.addEventListener('input', function(){ ordersQuery = search.value; var pos = search.selectionStart; renderOrdersPage(); var s2 = $('#orderSearch'); if(s2){ s2.focus(); try{ s2.setSelectionRange(pos,pos); }catch(e){} } }); }
    var clr = $('[data-order-clear]', host); if(clr) clr.addEventListener('click', function(){ ordersQuery=''; renderOrdersPage(); });
  }
  function orderCardHtml(o){
    var totalDirt = orderTotalDirt(o);
    var actions = orderActions(o);
    return '<article class="eo-order-card" data-order-id="' + esc(o.id) + '">' +
      '<div class="eo-order-head"><span class="eo-order-id">' + esc(o.id) + '<button class="eo-copy-btn" type="button" data-copy="' + esc(o.remoteId || o.id) + '" title="复制订单号">⧉</button></span><span class="eo-order-status s-' + o.status + '">' + (o.source === 'server' ? '已同步' : (ORDER_STATUS_LABEL[o.status] || o.status)) + '</span></div>' +
      '<div class="eo-order-items">' + o.items.map(function(i){
        return '<a class="eo-order-item" href="' + esc(i.href || 'product.html?id=' + encodeURIComponent(i.sku || i.id)) + '"><span class="eo-order-thumb">' + esc((i.category||'品').slice(0,1)) + '</span><span class="eo-order-iname">' + esc(i.name) + '</span><span class="eo-order-iqty">×' + i.qty + '</span><span class="eo-order-iprice mono">' + fmtPrice(i.currency, i.amount * i.qty) + '</span></a>';
      }).join('') + '</div>' +
      '<div class="eo-order-foot"><span class="eo-order-total">' + (o.payCurrency ? ('已付 ' + o.payAmount + ' ' + CUR[o.payCurrency].label) : ('应付 ≈ ' + totalDirt + ' 土')) + '</span><div class="eo-order-acts">' + actions + '</div></div>' +
      (o.afterSale ? '<div class="eo-order-as">售后：' + esc(o.afterSale.kind) + (o.afterSale.reason ? ' · ' + esc(o.afterSale.reason) : '') + '</div>' : '') +
    '</article>';
  }
  function orderActions(o){
    if(o.source === 'server') return '';
    var a = [];
    if(o.status === 'pending_payment'){ a.push('<button class="btn sm primary" data-oact="pay"><span>去支付</span></button>'); a.push('<button class="btn sm ghost" data-oact="cancel"><span>取消</span></button>'); }
    else if(o.status === 'pending_ship'){ a.push('<button class="btn sm primary" data-oact="receive"><span>确认收货</span></button>'); a.push('<button class="btn sm ghost" data-oact="aftersale"><span>申请售后</span></button>'); }
    else if(o.status === 'pending_use'){ a.push('<button class="btn sm primary" data-oact="use"><span>去使用</span></button>'); a.push('<button class="btn sm ghost" data-oact="aftersale"><span>申请售后</span></button>'); }
    else if(o.status === 'pending_review'){ a.push('<button class="btn sm primary" data-oact="review"><span>评价</span></button>'); a.push('<button class="btn sm ghost" data-oact="aftersale"><span>申请售后</span></button>'); }
    else if(o.status === 'completed'){ a.push('<button class="btn sm ghost" data-oact="rebuy"><span>再买一单</span></button>'); a.push('<button class="btn sm ghost" data-oact="aftersale"><span>申请售后</span></button>'); }
    else if(o.status === 'after_sale'){ a.push('<button class="btn sm ghost" data-oact="cancel-as"><span>撤销售后</span></button>'); }
    return a.join('');
  }
  function bindOrdersDelegation(){
    document.addEventListener('click', function(e){
      var btn = e.target.closest('[data-oact]');
      if(!btn || page() !== 'orders.html') return;
      var card = btn.closest('[data-order-id]'); if(!card) return;
      var id = card.getAttribute('data-order-id');
      var act = btn.getAttribute('data-oact');
      var o = getOrder(id); if(!o) return;
      if(act === 'pay'){ payDialog(o, renderOrdersPage); }
      else if(act === 'cancel'){ updateOrder(id, { status:'cancelled' }); toast('订单已取消。'); renderOrdersPage(); }
      else if(act === 'receive'){ updateOrder(id, { status:'pending_review', receivedAt:new Date().toISOString() }); toast('已确认收货，去评价吧。'); renderOrdersPage(); }
      else if(act === 'use'){ updateOrder(id, { status:'pending_review', usedAt:new Date().toISOString() }); toast('已标记使用，欢迎评价。'); renderOrdersPage(); }
      else if(act === 'review'){ reviewDialog(o, renderOrdersPage); }
      else if(act === 'aftersale'){ afterSaleDialog(o, renderOrdersPage); }
      else if(act === 'cancel-as'){ updateOrder(id, { status: o.payCurrency ? (o.kind === 'physical' ? 'pending_review' : 'pending_review') : 'pending_payment', afterSale:null }); toast('已撤销售后。'); renderOrdersPage(); }
      else if(act === 'rebuy'){ o.items.forEach(function(i){ addToCart({ id:i.sku||i.id, name:i.name, category:i.category, price:i.priceRaw, status:'active', href:i.href }, i.qty); }); location.href = 'cart.html'; }
    });
  }

  /* 全站复制按钮（订单号 / 流水关联订单等）*/
  function copyToClipboard(text){
    text = String(text || '');
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(function(){ toast('已复制：' + text); }, function(){ legacyCopy(text); });
    } else legacyCopy(text);
  }
  function legacyCopy(text){
    try{ var ta = document.createElement('textarea'); ta.value = text; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); toast('已复制：' + text); }catch(e){ toast(text); }
  }
  function bindCopyButtons(){
    document.addEventListener('click', function(e){
      var b = e.target.closest('[data-copy]');
      if(!b) return;
      e.preventDefault(); e.stopPropagation();
      copyToClipboard(b.getAttribute('data-copy'));
    });
  }

  /* ═══════════════ 钱包 / 账单 wallet.html ═══════════════ */
  function renderWalletPage(){
    if(page() !== 'wallet.html') return;
    var host = $('#walletHost');
    if(!host) return;
    function render(){
      var w = readWallet();
      var tx = readTx();
      var orders = readOrders();
      var profile = readJson('eo_active_profile_v1', null) || readJson('eo_registered_profile_v1', null) || {};
      if(profile.uid) $all('[data-profile-uid]').forEach(function(el){ el.textContent = profile.uid; });
      var CARD_META = {
        dirt:{ label:'土块', tag:'签到币', src:'系统派发 · 现实锚点 · 连续签到', use:'仅限站内消费，无对外出口' },
        stone:{ label:'石块', tag:'额度币', src:'体验额度领取 · 站内活动', use:'站内消费 · 发布悬赏付出' },
        brick:{ label:'砖块', tag:'结算币', src:'完成悬赏 / 高价值任务所得', use:'站内消费 · 悬赏结算（纯站内积分）' }
      };
      var cards = ['dirt','stone','brick'].map(function(k){
        var m = CARD_META[k];
        var earned = tx.filter(function(t){ return t.currency===k && t.amount>0; }).reduce(function(s,t){ return s+t.amount; }, 0);
        var spent = tx.filter(function(t){ return t.currency===k && t.amount<0; }).reduce(function(s,t){ return s-t.amount; }, 0);
        return '<div class="vault-card ' + k + '">' +
          '<div class="vc-head"><span class="coin ' + CUR[k].cls + ' big"><span class="ic">' + CUR[k].label + '</span></span><div class="vc-name"><h3>' + m.label + '</h3><span class="vc-tag">' + m.tag + '</span></div></div>' +
          '<div class="vc-balance" data-wallet="' + k + '">' + w[k] + '</div>' +
          '<div class="vc-meta"><div><span class="k">来源</span><span class="v">' + m.src + '</span></div><div><span class="k">用途</span><span class="v">' + m.use + '</span></div><div><span class="k">累计</span><span class="v">入 ' + earned + ' · 出 ' + spent + '</span></div></div>' +
          (k==='dirt' ? '<div class="vc-action ghost">仅可消费</div>' : '<button class="btn sm primary vc-action" type="button" data-wallet-recharge><span>领取体验额度</span><span class="arr"></span></button>') +
        '</div>';
      }).join('');

      var txHtml = tx.length ? tx.slice(0,120).map(function(t){
        var sign = t.amount >= 0 ? '+' : '−';
        var cls = t.amount >= 0 ? 'in' : 'out';
        var order = t.orderId ? orders.find(function(o){ return o.id === t.orderId; }) : null;
        return '<div class="wtx-row">' +
          '<div class="wtx-main"><span class="wtx-reason">' + esc(t.reason || t.channel) + '</span>' +
            '<span class="wtx-meta">' + esc(t.channel) + ' · ' + fmtDateTime(t.at) +
              (t.orderId ? ' · 关联订单 <a href="orders.html" class="wtx-order">' + esc(t.orderId) + '</a><button class="eo-copy-btn" type="button" data-copy="' + esc(t.orderId) + '" title="复制订单号">⧉</button>' : '') +
            '</span>' +
          '</div>' +
          '<div class="wtx-amt ' + cls + '">' + sign + ' ' + Math.abs(t.amount) + ' <i>' + CUR[t.currency].label + '</i>' + (typeof t.balanceAfter==='number' ? '<span class="wtx-bal">余 ' + t.balanceAfter + '</span>' : '') + '</div>' +
        '</div>';
      }).join('') : '<div class="sr-empty">还没有任何流水。去任务页完成任务、或在商城消费，这里就会记账。</div>';

      host.innerHTML =
        '<div class="section-head"><div><div class="section-eyebrow">VAULT · 余额一览</div><h2 class="section-title"><span class="zh">三货币<span class="accent">柜台</span></span></h2></div>' +
          '<div class="section-num"><div>账户&nbsp;/ <span class="v">' + esc(profile.uid || 'EO-XXXX-XXXXXXXX') + '</span></div><div>状态&nbsp;/ <span class="v">未冻结</span></div></div></div>' +
        '<div class="vault-grid">' + cards + '</div>' +
        '<div class="wallet-bill"><div class="hr-tick">BILL · 账单 / 资金流水（' + tx.length + ' 笔）</div>' +
          '<p class="wallet-bill-note">每一笔金币的进出都记在这里：什么时候、通过什么途径、多了还是少了。涉及商城消费的会关联到对应订单号（可一键复制）。本页所有货币均为站内积分，不作真实货币用途。</p>' +
          '<div class="wtx-list">' + txHtml + '</div>' +
        '</div>';
      bindWallet(host);
    }
    render();
  }
  function fmtDateTime(iso){
    try{ var d = new Date(iso); if(isNaN(d)) return ''; return d.getFullYear()+'.'+(d.getMonth()+1)+'.'+d.getDate()+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); }catch(e){ return ''; }
  }

  function readTasks(){ var list = readJson(TASKS_KEY, []); return Array.isArray(list) ? list : []; }
  function saveTasks(list){ writeJson(TASKS_KEY, list.slice(0,200)); }

  /* 任务 → 模块化科技树（v3 GuideTree）：新建/点开任务时都走这里 *
   * - task.tree 已是合法 v3 树：直接复用
   * - task.steps 有多步：start → 每步一个节点（链式 deps）→ end
   * - 否则：单步 start → step → end 兜底 */
  function taskToTree(task){
    task = task || {};
    if(task.tree && task.tree.version === 3 && Array.isArray(task.tree.nodes) && task.tree.nodes.length){
      return task.tree;
    }
    var base = 'N-' + (task.id || uid('TASK'));
    var startId = base + '-START';
    var endId = base + '-END';
    var steps = Array.isArray(task.steps) ? task.steps.map(clean).filter(Boolean) : [];
    var nodes = [], modules = [];
    nodes.push({ id:startId, nodeType:'start', title:'明确目标', kind:'起点', position:{ col:0, row:0 }, deps:[], summary:(task.note || '把任务目标、边界和完成标准写清楚，避免执行到一半才发现方向不对。'), est:'10 分钟' });
    if(steps.length){
      var prev = startId;
      steps.forEach(function(s, i){
        var sid = base + '-S' + i;
        nodes.push({
          id:sid,
          nodeType:(i === steps.length - 1 ? 'checkpoint' : 'step'),
          title:s, kind:'第 ' + (i+1) + ' 步',
          position:{ col:i+1, row:0 }, deps:[prev],
          summary:'按这一步执行，做完后在右侧标记完成，下一步会自动解锁。',
          taskTemplate:{ type:task.type || 'sideline', level:task.level || '任务', title:s, progress:{ current:0, total:1, unit:'步' }, rewardText:task.rewardText || '完成此步' }
        });
        prev = sid;
      });
      nodes.push({ id:endId, nodeType:'end', title:'完成并复盘', kind:'终点', position:{ col:steps.length+1, row:0 }, deps:[prev], summary:'提交结果、记录踩坑，回看整条线。', est:'15 分钟' });
    } else {
      var stepId = base + '-STEP';
      nodes.push({ id:stepId, nodeType:'step', title:task.title || '执行任务', kind:(task.type === 'mainline' ? '主线任务' : '支线任务'), position:{ col:1, row:0 }, deps:[startId], summary:task.note || '按照任务描述执行，并保留可复盘的过程记录。', est:(task.progress && task.progress.total ? task.progress.total + (task.progress.unit || '次') : '按任务推进'), taskTemplate:{ type:task.type || 'sideline', level:task.level || '任务', title:task.title || '执行任务', progress:task.progress || { current:0, total:1, unit:'次' }, rewardText:task.rewardText || '完成后自行结算' } });
      nodes.push({ id:endId, nodeType:'end', title:'完成并复盘', kind:'终点', position:{ col:2, row:0 }, deps:[stepId], summary:'提交结果、记录踩坑，并把经验开放给后来者继续修改。', est:'15 分钟' });
      modules.push({ id:'M-' + base + '-CHECK', nodeId:stepId, order:0, type:'checklist', attrs:{ title:'执行检查', items:['完成标准明确', '过程可记录', '结果可复盘'] } });
    }
    return { version:3, canvas:{ cols:nodes.length, rows:1 }, nodes:nodes, modules:modules };
  }
  /* 取某任务的模块化进度（done/total/pct），用于卡片角标 */
  function taskTreeProgress(task){
    if(!(window.EOGuideTree && window.EOGuideProgress)) return null;
    try{
      var tree = taskToTree(task);
      var done = window.EOGuideProgress.get(task.id);
      return window.EOGuideTree.computeProgress(tree, done);
    }catch(e){ return null; }
  }

  /* ── 系统默认任务：注册即下发，玩家不可移除、不可发布成攻略 ──
   * 后端注册时也会种子入库（system=true），前端这份是显示与模块化树的来源（含游客）。
   * 模块化树 = 起点 + 一组「支柱」checkpoint（全部挂在起点下，先认领起点再逐项推进）。 */
  function buildPillarTree(base, start, pillars, tail){
    var startId = base + '-START';
    var nodes = [{ id:startId, nodeType:'start', title:start.title, kind:'起点', position:{ col:0, row:0 }, deps:[], summary:start.summary || '' }];
    var pillarIds = [];
    pillars.forEach(function(p, i){
      var pid = base + '-P' + i;
      pillarIds.push(pid);
      nodes.push({ id:pid, nodeType:'checkpoint', title:p.title, kind:p.kind || '支柱', position:{ col:1, row:i }, deps:[startId], summary:p.summary || '' });
    });
    var cols = 2;
    if(tail){
      /* 永不可完成的收尾节点 → 整棵树永远到不了 100%（终生主线专用） */
      nodes.push({ id:base + '-PERP', nodeType:'checkpoint', perpetual:true, title:tail.title, kind:tail.kind || '终生', position:{ col:2, row:Math.floor((pillars.length - 1) / 2) }, deps:pillarIds, summary:tail.summary || '' });
      cols = 3;
    }
    return { version:3, canvas:{ cols:cols, rows:Math.max(1, pillars.length) }, nodes:nodes, modules:[] };
  }
  var SYSTEM_TASKS = [
    {
      id:'SYS-character', systemKey:'character', system:true, evergreen:true,
      type:'mainline', level:'主线 · LV.MAX · 终生',
      title:'照顾好你的角色',
      note:'你只分到这一具角色，不能换、不能退、不保修。让它一直能玩下去。',
      rewardText:'请按时维护你的角色身心健康',
      tree:buildPillarTree('SYS-character',
        { title:'接收角色', summary:'你出生那天，系统把这具角色交给了你。先确认：你接手了。' },
        [
          { title:'让身体动起来', summary:'别久坐，每天动一动。' },
          { title:'好好吃饭', summary:'按时吃、吃够、别长期凑合。' },
          { title:'睡眠规律', summary:'睡够，少熬夜。' },
          { title:'情绪能自理', summary:'不长期内耗，难受的时候给自己留个出口。' },
          { title:'定期体检', summary:'每年至少查一次，别拖。' }
        ],
        { title:'一直照顾下去', summary:'没有"照顾完"那一天。只要还在线，这一项就永远亮着——这条主线注定到不了 100%。' })
    },
    {
      id:'SYS-mood', systemKey:'mood', system:true, evergreen:true,
      type:'sideline', level:'支线 · 每日 · 自我打卡',
      title:'保持心情愉悦',
      note:'不是装开心，是别让自己一直憋着。今天做点能让自己松一口气的事。',
      rewardText:'一个还过得去的心情。系统不验证。',
      tree:buildPillarTree('SYS-mood',
        { title:'今天', summary:'不用想通关，不用想明天。先把今天的心情顾好。' },
        [
          { title:'做一件纯为开心的小事', summary:'不为有用，只为高兴。' },
          { title:'和一个让你舒服的人说说话', summary:'哪怕只是几句。' },
          { title:'出门，哪怕只到楼下', summary:'换个空气。' },
          { title:'把一件烦心事先放一放', summary:'今天不解决也没关系。' },
          { title:'允许自己今天就这样', summary:'不达标也算过关。' }
        ])
    }
  ];
  function findSystemTask(id){ for(var i=0;i<SYSTEM_TASKS.length;i++){ if(SYSTEM_TASKS[i].id === id) return SYSTEM_TASKS[i]; } return null; }
  function renderSystemTaskCard(task){
    var tp = taskTreeProgress(task);
    var chip = tp ? ('模块 ' + tp.done + '/' + tp.total + ' · ' + tp.pct + '%') : '模块化';
    var pct = tp ? tp.pct : 0;
    var lock = '<span class="eo-sys-lock">系统 · 不可移除</span>';
    var progBtn = '<button class="btn sm ghost" data-local-task-progress data-system-id="' + esc(task.id) + '"><span>模块化进度</span></button>';
    if(task.type === 'mainline'){
      return '<article class="goal-card mainline eo-task-card eo-task-system eo-no-publish eo-task-clickable" data-system-id="' + esc(task.id) + '" role="button" tabindex="0" title="点击查看模块化进度">' +
        '<div class="gc-head"><span class="gtype">' + esc(task.level || '主线') + '</span><span class="gprog">' + esc(chip) + '</span></div>' +
        lock +
        '<h3 class="gtitle">' + esc(task.title) + '</h3>' +
        '<p class="gnote">' + esc(task.note || '') + '</p>' +
        '<div class="gbar"><div class="gbar-fill" style="--gp:' + pct + '%"></div></div>' +
        '<div class="gc-foot"><span class="gr-text">' + esc(task.rewardText || '') + '</span>' + progBtn + '</div>' +
      '</article>';
    }
    return '<article class="task-card eo-task-card eo-task-system eo-no-publish eo-task-clickable" data-system-id="' + esc(task.id) + '" role="button" tabindex="0" title="点击查看模块化进度">' +
      '<div class="meta"><span class="type">' + esc(task.level || '支线') + '</span><span class="diff">' + esc(chip) + '</span></div>' +
      lock +
      '<div class="title">' + esc(task.title) + '</div>' +
      '<div class="by"><span>' + esc(task.note || '') + '</span></div>' +
      '<div class="gbar"><div class="gbar-fill" style="--gp:' + pct + '%"></div></div>' +
      '<div class="reward">' + esc(task.rewardText || '') + '</div>' +
      '<div class="actions"><span class="ct">点击卡片看模块化进度</span>' + progBtn + '</div>' +
    '</article>';
  }
  /* 把 2 条系统默认任务钉在主线 / 支线面板最前面（幂等） */
  function renderSystemTasks(){
    if(page() !== 'task.html') return;
    SYSTEM_TASKS.forEach(function(task){
      var panel = task.type === 'mainline' ? $('#main .goal-grid') : $('#side .task-grid');
      if(!panel) return;
      var old = $('[data-system-id="' + task.id + '"]', panel);
      if(old) old.remove();
      var wrap = document.createElement('div');
      wrap.innerHTML = renderSystemTaskCard(task);
      panel.insertBefore(wrap.firstChild, panel.firstChild);
    });
  }

  function renderTaskCard(task){
    var cls = task.type === 'mainline' ? 'goal-card mainline eo-task-card eo-task-clickable' : 'task-card eo-task-card eo-task-clickable';
    if(task.status === 'completed') cls += ' is-done';
    var tp = taskTreeProgress(task);
    var allDone = !!(tp && tp.total && tp.done >= tp.total);
    var modChip = tp ? ('模块 ' + tp.done + '/' + tp.total + ' · ' + tp.pct + '%') : '模块化任务';
    var pct = tp ? tp.pct : (task.status === 'completed' ? 100 : 0);
    /* 悬赏任务(接单得来的)不提供"开源到社区/发布成攻略"——它是给个人的悬赏，不是可复用攻略 */
    var openSrcBtn = task.sourceType === 'bounty' ? '' : '<button class="btn sm ghost" data-local-task-open-source><span>开源到社区</span></button>';
    if(task.type === 'mainline'){
      return '<article class="' + cls + '" data-local-task-id="' + esc(task.id) + '" role="button" tabindex="0" title="点击查看模块化进度">' +
        '<div class="gc-head"><span class="gtype">' + esc(task.level || '主线') + '</span><span class="gprog">' + esc(modChip) + '</span></div>' +
        '<div class="eo-task-origin">' + esc(task.sourceGuideTitle ? '来自攻略 · ' + task.sourceGuideTitle : '用户创建') + (allDone ? ' · 已通关' : '') + '</div>' +
        '<h3 class="gtitle">' + esc(task.title) + '</h3>' +
        '<p class="gnote">' + esc(task.note || '没有说明。') + '</p>' +
        '<div class="gbar"><div class="gbar-fill" style="--gp:' + pct + '%"></div></div>' +
        '<div class="gc-foot"><span class="gr-text">' + esc(task.rewardText || '奖励：自己记录') + '</span><button class="btn sm ghost" data-local-task-progress><span>模块化进度</span></button>' + openSrcBtn + '<button class="btn sm ghost" data-local-task-complete><span>' + (task.status === 'completed' ? '已完成' : '标记完成') + '</span></button></div>' +
      '</article>';
    }
    return '<article class="' + cls + '" data-local-task-id="' + esc(task.id) + '" role="button" tabindex="0" title="点击查看模块化进度">' +
      '<div class="meta"><span class="type">' + esc(task.level || '支线') + '</span><span class="diff">' + esc(modChip) + '</span></div>' +
      '<div class="eo-task-origin">' + esc(task.sourceGuideTitle ? '来自攻略 · ' + task.sourceGuideTitle : '用户创建') + (allDone ? ' · 已通关' : '') + '</div>' +
      '<div class="title">' + esc(task.title) + '</div>' +
      '<div class="by"><span>' + esc(task.note || '没有说明。') + '</span><span>' + esc(task.status || 'active') + '</span></div>' +
      '<div class="gbar"><div class="gbar-fill" style="--gp:' + pct + '%"></div></div>' +
      '<div class="reward">奖励：<strong>' + esc(task.rewardText || '自己定') + '</strong></div>' +
      '<div class="actions"><span class="ct">点击卡片看模块化进度</span><button class="btn sm ghost" data-local-task-progress><span>模块化进度</span></button>' + openSrcBtn + '<button class="btn sm ghost" data-local-task-complete><span>' + (task.status === 'completed' ? '已完成' : '标记完成') + '</span></button></div>' +
    '</article>';
  }
  /* 点开任务 → 模块化进度（科技树）大弹窗 */
  function openTaskProgress(task){
    if(!task){ toast('没找到这条任务。'); return; }
    if(!(window.EOGuideTree && window.EOGuideProgress)){ toast('模块化任务系统未加载。'); return; }
    var tree = taskToTree(task);
    var typeLabel = task.type === 'mainline' ? '主线' : '支线';
    var mask = modal('模块化任务进度 · ' + typeLabel,
      '<div class="eo-task-tree-modal">' +
        '<div class="eo-task-tree-meta">' +
          '<div><span class="lab">任务</span><strong>' + esc(task.title || '未命名任务') + '</strong></div>' +
          '<div><span class="lab">说明</span><span>' + esc(task.note || '没有说明。') + '</span></div>' +
        '</div>' +
        '<div class="eo-task-tree-host"></div>' +
      '</div>',
      { onOpen:function(root){
        var host = $('.eo-task-tree-host', root);
        var ctrl = null;
        try{
          ctrl = window.EOGuideTree.render({
            host:host, tree:tree, post:{ id:task.id, title:task.title },
            opts:{
              taskMode:true,                      /* 已是任务 → 右上角显示「移除任务」 */
              taskRemovable: !task.system,        /* 系统默认任务不可移除 */
              onRemoveTask: function(){ confirmRemoveTask(task); }
            }
          });
        }catch(e){ host.innerHTML = '<div class="dyn-empty">模块化进度渲染失败。</div>'; }
        /* 关闭弹窗时：卸载科技树的全局监听，并按最新进度刷新卡片 / 自动结算 */
        root._eoCleanup = function(){
          if(ctrl && ctrl.unmount) try{ ctrl.unmount(); }catch(e){}
          syncTaskFromTreeProgress(task);
          renderLocalTasks();
          renderSystemTasks();
        };
      }}
    );
    return mask;
  }
  /* 科技树全部节点完成 → 任务标记完成 + 奖励入账（只触发一次） */
  function syncTaskFromTreeProgress(task){
    if(!task || task.system || task.evergreen) return;   /* 系统/终生任务不自动结算 */
    var tp = taskTreeProgress(task);
    if(!tp || !tp.total || tp.done < tp.total) return;
    if(task.status === 'completed') return;
    var list = readTasks();
    var item = list.find(function(t){ return t.id === task.id; });
    if(!item || item.status === 'completed') return;
    item.status = 'completed';
    item.completedAt = new Date().toISOString();
    saveTasks(list);
    var credited = creditTaskReward(item.rewardText, item.title);
    toast('模块化任务全部完成：' + item.title + (credited ? ' · 奖励已入账' : ''));
  }
  /* 移除任务：二次确认 → 本地删 + 后端 DELETE + 清模块化进度 */
  function confirmRemoveTask(task){
    if(!task){ return; }
    if(task.system){ toast('系统默认任务不可移除。'); return; }
    eoConfirm('移除任务', '确定移除任务「' + (task.title || '') + '」？\n该任务及其模块化进度会一并清除，且不可恢复。', function(){
      var list = readTasks();
      var next = list.filter(function(t){ return t.id !== task.id; });
      var removed = next.length !== list.length;
      if(removed) saveTasks(next);
      var serverId = task.serverId || task.id;
      if(token() && serverId){
        (window.eoFetch || fetch)(apiBase() + '/tasks/' + encodeURIComponent(serverId), {
          method:'DELETE', headers:{ Authorization:'Bearer ' + token() }
        }).catch(function(){});
      }
      try{ localStorage.removeItem('eo_tree_done_v1::' + task.id); localStorage.removeItem('eo_tree_added_v1::' + task.id); }catch(e){}
      closeModal();
      renderLocalTasks();
      renderSystemTasks();
      toast(removed ? ('已移除任务：' + (task.title || '')) : '该任务已不在列表。');
    });
  }
  /* 站内风格二次确认弹窗（独立浮层，不占用主 modal 单例） */
  function eoConfirm(title, message, onYes){
    var mask = document.createElement('div');
    mask.className = 'eo-confirm-mask';
    mask.innerHTML =
      '<div class="eo-confirm" role="alertdialog" aria-modal="true">' +
        '<div class="eo-confirm-title">' + esc(title || '确认') + '</div>' +
        '<div class="eo-confirm-msg">' + esc(message || '').replace(/\n/g, '<br>') + '</div>' +
        '<div class="eo-confirm-actions">' +
          '<button class="btn ghost sm" type="button" data-eo-confirm-cancel><span>取消</span></button>' +
          '<button class="btn sm eo-confirm-yes" type="button" data-eo-confirm-yes><span>确定移除</span></button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(mask);
    function close(){ mask.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e){ if(e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    mask.addEventListener('click', function(e){ if(e.target === mask || e.target.closest('[data-eo-confirm-cancel]')) close(); });
    mask.querySelector('[data-eo-confirm-yes]').addEventListener('click', function(){ close(); if(typeof onYes === 'function') onYes(); });
    requestAnimationFrame(function(){ mask.classList.add('is-open'); });
  }
  function openSourceTask(task){
    if(!task) return;
    var stepId = 'N-' + task.id + '-STEP';
    var tree = {
      version:3,
      canvas:{ cols:3, rows:2 },
      nodes:[
        { id:'N-' + task.id + '-START', nodeType:'start', title:'明确目标', kind:'起点', position:{ col:0, row:0 }, deps:[], summary:'把任务目标、边界和完成标准写清楚，避免执行到一半才发现方向不对。', est:'10 分钟' },
        { id:stepId, nodeType:'step', title:task.title, kind:task.type === 'mainline' ? '主线任务' : '支线任务', position:{ col:1, row:0 }, deps:['N-' + task.id + '-START'], summary:task.note || '按照任务描述执行，并保留可复盘的过程记录。', est:(task.progress && task.progress.total ? task.progress.total + (task.progress.unit || '次') : '按任务推进'), taskTemplate:{ type:task.type || 'sideline', level:task.level || '任务', title:task.title, progress:task.progress || { current:0, total:1, unit:'次' }, rewardText:task.rewardText || '完成后自行结算' } },
        { id:'N-' + task.id + '-END', nodeType:'end', title:'完成并复盘', kind:'终点', position:{ col:2, row:0 }, deps:[stepId], summary:'提交结果、记录踩坑，并把经验开放给后来者继续修改。', est:'15 分钟' }
      ],
      modules:[
        { id:'M-' + task.id + '-CHECK', nodeId:stepId, order:0, type:'checklist', attrs:{ title:'执行检查', items:['完成标准明确', '过程可记录', '结果可复盘'] } },
        { id:'M-' + task.id + '-NOTE', nodeId:stepId, order:1, type:'callout', attrs:{ tone:'info', text:'这份攻略由任务页生成。发布前可以继续拆节点、补材料、加风险提示。' } }
      ]
    };
    writeJson('eo_guide_tree_draft_v1', {
      title:task.title + ' · 模块化攻略',
      tags:['任务','实测'],
      sourceTaskId:task.id,
      tree:tree,
      at:new Date().toISOString()
    });
    toast('已生成模块化攻略草稿，正在进入社区发布页。');
    setTimeout(function(){ location.href = 'post-publish.html?type=guide&from=task&id=' + encodeURIComponent(task.id); }, 350);
  }
  function renderLocalTasks(){
    if(page() !== 'task.html') return;
    var tasks = readTasks();
    ['mainline','sideline'].forEach(function(type){
      var panel = type === 'mainline' ? $('#main .goal-grid') : $('#side .task-grid');
      if(!panel) return;
      $all('[data-local-task-id]', panel).forEach(function(el){ el.remove(); });
      var empty = $('.empty-card', panel);
      tasks.filter(function(t){
        var isGuideTask = t && (t.sourceType === 'guide' || t.source_type === 'guide' || t.sourceGuideId || t.source_guide_id);
        return !isGuideTask && (t.type || 'sideline') === type && t.status !== 'abandoned';
      }).slice(0,30).forEach(function(task){
        var wrap = document.createElement('div');
        wrap.innerHTML = renderTaskCard(task);
        panel.insertBefore(wrap.firstChild, empty || null);
      });
    });
    if(window.EORenderGuideImportedTasks) window.EORenderGuideImportedTasks();
  }
  /* 新建任务起手树：和发布攻略同款，留一个起点 + 一步让玩家接着拆 */
  function taskStarterTree(){
    var GT = window.EOGuideTree;
    var sId = GT ? GT.uid('N') : 'N-START';
    var s1 = GT ? GT.uid('N') : 'N-S1';
    return {
      version:3, canvas:{ cols:3, rows:2 },
      nodes:[
        { id:sId, nodeType:'start', title:'明确目标', kind:'起点', position:{ col:0, row:0 }, deps:[], summary:'把这条任务的目标、边界、完成标准写清楚。' },
        { id:s1, nodeType:'step', title:'第一步', kind:'核心', position:{ col:1, row:0 }, deps:[sId], summary:'拆成别人也能照着做的动作。' }
      ],
      modules:[]
    };
  }
  function createTaskDialog(type){
    type = type || 'sideline';
    var GT = window.EOGuideTree;
    /* 编辑器不可用时退回单步：保证功能不挂 */
    if(!(GT && window.EOGuideTreeEditor)){ createTaskDialogSimple(type); return; }
    modal(type === 'mainline' ? '新建主线 · 模块化' : '新建支线 · 模块化',
      '<div class="eo-create-task-modal">' +
        '<form class="eo-form-grid eo-create-meta" data-create-task-form>' +
          '<div class="eo-field"><label>任务类型</label><select class="eo-select" name="type"><option value="mainline">主线</option><option value="sideline">支线</option></select></div>' +
          '<div class="eo-field"><label>等级标签</label><input class="eo-input" name="level" maxlength="40" placeholder="LV.3 / 长期 / 7 天挑战"></div>' +
          '<div class="eo-field full"><label>任务标题</label><input class="eo-input" name="title" required maxlength="80" placeholder="写一个可以执行的目标"></div>' +
          '<div class="eo-field full"><label>说明</label><textarea class="eo-textarea eo-create-note" name="note" maxlength="800" placeholder="怎么做、做到什么程度、为什么要做"></textarea></div>' +
          '<div class="eo-field full"><label>奖励文本</label><input class="eo-input" name="rewardText" maxlength="120" placeholder="奖励：自己定"></div>' +
        '</form>' +
        '<div class="eo-create-editor">' +
          '<label class="eo-create-editor-label"><span>模块化科技树</span><span class="eo-create-editor-hint">和发布攻略同款 · 切「编辑」加节点拆步骤 · 移动端可拖可缩放</span></label>' +
          '<div class="eo-create-editor-host"></div>' +
        '</div>' +
        '<div class="eo-modal-actions"><button class="btn ghost" type="button" data-eo-close><span>取消</span></button><button class="btn primary" type="button" data-create-submit><span>创建任务</span><span class="arr"></span></button></div>' +
      '</div>',
      { onOpen:function(root){
        var form = $('[data-create-task-form]', root);
        form.type.value = type;
        var host = $('.eo-create-editor-host', root);
        var editor = window.EOGuideTreeEditor.mount(host, {
          tree: taskStarterTree(),
          autosaveKey: 'eo_task_tree_draft_v1'   /* 与攻略草稿 key 隔离，绝不污染发布攻略 */
        });
        root._eoCleanup = function(){ if(editor && editor.unmount) try{ editor.unmount(); }catch(e){} };
        $('[data-eo-close]', root).addEventListener('click', closeModal);
        $('[data-create-submit]', root).addEventListener('click', function(){
          var tree = editor.getTree ? editor.getTree() : null;
          var task = {
            id:uid('TASK'),
            type:form.type.value,
            level:clean(form.level.value) || (form.type.value === 'mainline' ? '主线' : '支线'),
            title:clean(form.title.value),
            note:clean(form.note.value),
            progress:{ current:0, total:(tree && tree.nodes ? tree.nodes.length : 1), unit:'节点' },
            rewardText:clean(form.rewardText.value) || '奖励：自己记录',
            sourceType:'manual',
            status:'active',
            createdAt:new Date().toISOString()
          };
          if(!task.title){ toast('任务标题不能为空。'); var ti = form.querySelector('[name=title]'); if(ti) ti.focus(); return; }
          if(tree && tree.version === 3 && tree.nodes && tree.nodes.length) task.tree = tree;
          else task.tree = taskToTree(task);
          var list = readTasks();
          list.unshift(task);
          saveTasks(list);
          try{ localStorage.removeItem('eo_task_tree_draft_v1'); }catch(e){}
          closeModal();
          renderLocalTasks();
          renderSystemTasks();
          toast('已创建模块化任务：' + task.title);
          syncTaskToBackend(task);
        });
      }}
    );
  }
  /* 退化版（编辑器未加载时）：原单步表单 */
  function createTaskDialogSimple(type){
    modal(type === 'mainline' ? '新建主线' : '新建支线',
      '<form class="eo-form-grid" data-create-task-form>' +
        '<div class="eo-field"><label>任务类型</label><select class="eo-select" name="type"><option value="mainline">主线</option><option value="sideline">支线</option></select></div>' +
        '<div class="eo-field"><label>等级标签</label><input class="eo-input" name="level" maxlength="40" placeholder="LV.3 / 长期"></div>' +
        '<div class="eo-field full"><label>任务标题</label><input class="eo-input" name="title" required maxlength="80" placeholder="写一个可以执行的目标"></div>' +
        '<div class="eo-field full"><label>说明</label><textarea class="eo-textarea" name="note" maxlength="800"></textarea></div>' +
        '<div class="eo-field full"><label>奖励文本</label><input class="eo-input" name="rewardText" maxlength="120" placeholder="奖励：自己定"></div>' +
        '<div class="eo-modal-actions full"><button class="btn ghost" type="button" data-eo-close><span>取消</span></button><button class="btn primary" type="submit"><span>创建任务</span><span class="arr"></span></button></div>' +
      '</form>',
      { onOpen:function(root){
        var form = $('[data-create-task-form]', root);
        form.type.value = type;
        $('[data-eo-close]', root).addEventListener('click', closeModal);
        form.addEventListener('submit', function(e){
          e.preventDefault();
          var task = {
            id:uid('TASK'), type:form.type.value,
            level:clean(form.level.value) || (form.type.value === 'mainline' ? '主线' : '支线'),
            title:clean(form.title.value), note:clean(form.note.value),
            progress:{ current:0, total:1, unit:'次' },
            rewardText:clean(form.rewardText.value) || '奖励：自己记录',
            sourceType:'manual', status:'active', createdAt:new Date().toISOString()
          };
          if(!task.title){ toast('任务标题不能为空。'); return; }
          task.tree = taskToTree(task);
          var list = readTasks(); list.unshift(task); saveTasks(list);
          renderLocalTasks(); renderSystemTasks(); closeModal();
          toast('已创建任务：' + task.title);
          syncTaskToBackend(task);
        });
      }}
    );
  }
  async function syncTaskToBackend(task){
    if(!token()) return;
    try{
      var res = await (window.eoFetch || fetch)(apiBase() + '/tasks', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', Authorization:'Bearer ' + token() },
        body:JSON.stringify({
          type:task.type,
          level:task.level,
          title:task.title,
          note:task.note,
          progress:Object.assign({}, task.progress || {}, task.tree ? { tree: task.tree } : {}),
          rewardText:task.rewardText,
          sourceType:task.sourceType || 'manual',
          sourceGuideId:task.sourceGuideId || null,
          sourceBlockId:task.sourceBlockId || null
        })
      });
      var json = await res.json().catch(function(){ return null; });
      if(res.ok && json && json.data){
        var list = readTasks();
        var item = list.find(function(x){ return x.id === task.id; });
        if(item){ item.serverId = json.data.id; saveTasks(list); }
      }
    }catch(e){}
  }
  function taskPagePolish(){
    if(page() !== 'task.html') return;
    var hero = $('.subpage-hero');
    var wqSection = $('.world-quest-banner') && $('.world-quest-banner').closest('section');
    if(hero && wqSection && hero.previousElementSibling !== wqSection){
      hero.parentNode.insertBefore(wqSection, hero);
    }
    var wq = $('.world-quest-banner .wqb-body');
    if(wq && !$('.eo-wq-explain', wq)){
      var p = document.createElement('p');
      p.className = 'eo-wq-explain';
      p.textContent = '全服共建入口已置顶。进入后提交现实锚点，完成状态会进入您的结算面板和任务履历。';
      wq.appendChild(p);
    }
    /* 任务业务已由 task.html 的 taskDbBridge 全面接管。旧逻辑会重新
       渲染 localStorage 任务、先报完成再尝试同步，正式站必须停用。 */
    return;
    $all('[data-name="新建主线"], [data-name="新建支线"]').forEach(function(btn){
      btn.removeAttribute('data-modal');
      btn.addEventListener('click', function(e){
        e.preventDefault();
        e.stopPropagation();
        createTaskDialog(/主线/.test(btn.getAttribute('data-name') || btn.textContent) ? 'mainline' : 'sideline');
      }, true);
    });
    renderLocalTasks();
    renderSystemTasks();
    document.addEventListener('click', function(e){
      var btn = e.target.closest('[data-local-task-complete]');
      if(!btn) return;
      var id = btn.closest('[data-local-task-id]').getAttribute('data-local-task-id');
      var list = readTasks();
      var task = list.find(function(t){ return t.id === id; });
      if(!task) return;
      if(task.status === 'completed'){ toast('该任务已完成。'); return; }
      task.status = 'completed';
      task.completedAt = new Date().toISOString();
      saveTasks(list);
      renderLocalTasks();
      var credited = creditTaskReward(task.rewardText, task.title);
      toast('任务已完成：' + task.title + (credited ? ' · 奖励已入账' : ''));
    });
    document.addEventListener('click', function(e){
      var btn = e.target.closest('[data-local-task-open-source]');
      if(!btn) return;
      var id = btn.closest('[data-local-task-id]').getAttribute('data-local-task-id');
      var task = readTasks().find(function(t){ return t.id === id; });
      openSourceTask(task);
    });
    /* "模块化进度"按钮：系统任务走 SYSTEM_TASKS，本地任务按 id 取 */
    document.addEventListener('click', function(e){
      var btn = e.target.closest('[data-local-task-progress]');
      if(!btn) return;
      e.preventDefault(); e.stopPropagation();
      var sysId = btn.getAttribute('data-system-id');
      if(sysId){ openTaskProgress(findSystemTask(sysId)); return; }
      var holder = btn.closest('[data-local-task-id]');
      var task = holder ? readTasks().find(function(t){ return t.id === holder.getAttribute('data-local-task-id'); }) : null;
      openTaskProgress(task);
    });
    /* 点击任意一张任务卡（主线 / 支线面板）→ 打开模块化进度 */
    function openCardProgress(card){
      if(!card || card.classList.contains('empty-card')) return;
      var task = null;
      var sysId = card.getAttribute('data-system-id');
      if(sysId){ openTaskProgress(findSystemTask(sysId)); return; }
      var localId = card.getAttribute('data-local-task-id');
      if(localId){
        task = readTasks().find(function(t){ return t.id === localId; });
      } else {
        var encoded = card.getAttribute('data-guide-task-json');
        if(encoded){ try{ task = JSON.parse(decodeURIComponent(encoded)); }catch(err){} }
      }
      if(!task) task = cardToTask(card);   /* 静态示例卡：从 DOM 合成任务 */
      openTaskProgress(task);
    }
    document.addEventListener('click', function(e){
      if(e.target.closest('button, a, input, select, textarea, label')) return;
      var card = e.target.closest('.goal-card, .task-card');
      if(!card || !card.closest('#main, #side')) return;
      openCardProgress(card);
    });
    document.addEventListener('keydown', function(e){
      if(e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
      var card = e.target.closest('.eo-task-clickable, .goal-card[role="button"], .task-card[role="button"]');
      if(!card || !card.closest('#main, #side')) return;
      if(e.target.closest('button, a, input, select, textarea')) return;
      e.preventDefault();
      openCardProgress(card);
    });
  }
  /* 静态示例卡 → 合成任务对象（id 用标题做稳定键，进度可持久化） */
  function cardToTask(card){
    var titleEl = card.querySelector('.gtitle, .title');
    var noteEl = card.querySelector('.gnote, .reward, .by');
    var levelEl = card.querySelector('.gtype, .type');
    var title = clean(titleEl ? titleEl.textContent : '任务');
    return {
      id:'CARD-' + title.slice(0, 40),
      type:card.classList.contains('mainline') ? 'mainline' : 'sideline',
      level:clean(levelEl ? levelEl.textContent : ''),
      title:title,
      note:clean(noteEl ? noteEl.textContent : ''),
      rewardText:''
    };
  }

  function communityPolish(){
    if(page() !== 'bug.html') return;
    var notice = $('.cm-notice p');
    if(notice) notice.textContent = '模块化攻略、玩家日志、BUG 反馈已经统一进入公开队列；推荐排序按热度、收藏、评论和新鲜度综合计算。';
  }

  function saveFilePolish(){
    /* save.html 自带的 hydrateSaveFile 已做完整结算面板数据绑定（item 6），此处不再重复覆盖以免冲突。 */
    return;
  }

  function installCardOpenAffordance(){
    var card = $('.ppv3-charcard');
    if(!card || card.dataset.eoOpenable) return;
    card.dataset.eoOpenable = '1';
    card.classList.add('eo-card-openable');
    if(!$('.eo-card-zoom', card)){
      var badge = document.createElement('button');
      badge.type = 'button';
      badge.className = 'eo-card-zoom';
      badge.setAttribute('title', '点开放大查看角色卡');
      badge.innerHTML = '<span class="ic">⤢</span><span class="eo-card-zoom-lab">点开放大</span>';
      /* 放进卡片头部、紧挨「导出角色卡」按钮，避免浮层覆盖造成「重复」观感 */
      var exportBtn = $('.ppv3-export-btn', card);
      var header = $('header', card);
      if(exportBtn && exportBtn.parentNode){ exportBtn.parentNode.insertBefore(badge, exportBtn); }
      else if(header){ header.appendChild(badge); }
      else { card.appendChild(badge); }
    }
  }
  function openCharacterCard(){
    var card = $('.ppv3-charcard');
    if(!card){ toast('没有找到角色卡。'); return; }
    var clone = card.cloneNode(true);
    $all('.eo-card-zoom, .ppv3-export-btn, button[data-modal]', clone).forEach(function(x){ x.remove(); });
    modal('CHARACTER CARD / 角色卡',
      '<div class="eo-card-zoomview">' + clone.outerHTML +
        '<div class="eo-modal-actions"><button class="btn ghost" type="button" data-eo-close><span>关闭</span></button><button class="btn primary" type="button" data-card-export><span>导出这张卡</span><span class="arr"></span></button></div>' +
      '</div>',
      { onOpen:function(root){
        $('[data-eo-close]', root).addEventListener('click', closeModal);
        $('[data-card-export]', root).addEventListener('click', function(){ closeModal(); exportCharacterDialog(); });
        $all('.eo-talent-token', root).forEach(function(tk){
          tk.addEventListener('click', function(){
            modal('TALENT DETAIL / 天赋说明',
              '<div class="eo-talent-detail"><strong>' + esc(clean(tk.dataset.talentName||tk.textContent)) + '</strong><em>' + esc(clean(tk.dataset.talentLvl||'TALENT')) + '</em><p>' + esc(clean(tk.dataset.talentDesc||'天赋说明暂未同步。')) + '</p></div>');
          });
        });
      }}
    );
  }
  function characterPolish(){
    if(page() !== 'character.html') return;
    installCardOpenAffordance();
    /* 档案面板可能在登录后才渲染：监听变化补挂放大入口 */
    if(window.MutationObserver){
      var mo = new MutationObserver(function(){ installCardOpenAffordance(); });
      mo.observe(document.body, { childList:true, subtree:true });
    }
    document.addEventListener('click', function(e){
      var zoom = e.target.closest('.eo-card-zoom');
      if(zoom){ e.preventDefault(); e.stopPropagation(); openCharacterCard(); return; }
      var talent = e.target.closest('.talent, .eo-talent-token');
      if(talent){
        e.preventDefault();
        var name = clean(talent.dataset.talentName || ($('.name', talent) ? $('.name', talent).textContent : talent.textContent));
        var desc = clean(talent.dataset.talentDesc || ($('.desc', talent) ? $('.desc', talent).textContent : '天赋说明暂未同步。'));
        var lvl = clean(talent.dataset.talentLvl || ($('.lvl', talent) ? $('.lvl', talent).textContent : ($('.v', talent) ? $('.v', talent).textContent : 'TALENT')));
        modal('TALENT DETAIL / 天赋说明',
          '<div class="eo-talent-detail"><strong>' + esc(name) + '</strong><em>' + esc(lvl) + '</em><p>' + esc(desc) + '</p></div>'
        );
        return;
      }
      var exportBtn = e.target.closest('[data-modal="export"], .ppv3-export-btn');
      if(exportBtn){
        e.preventDefault();
        e.stopPropagation();
        exportCharacterDialog();
      }
    }, true);
  }
  function exportCharacterDialog(){
    modal('EXPORT CHARACTER / 导出角色卡',
      '<div class="eo-product-detail">' +
        '<h2>导出角色卡</h2>' +
        '<p class="eo-product-desc">PDF 走浏览器打印流程，图片导出会生成一张本地 PNG。若浏览器限制样式渲染，打印 PDF 是最稳定版本。</p>' +
        '<div class="eo-modal-actions">' +
          '<button class="btn ghost" type="button" data-export-print><span>导出 PDF</span><span class="arr"></span></button>' +
          '<button class="btn primary" type="button" data-export-png><span>导出图片</span><span class="arr"></span></button>' +
        '</div>' +
      '</div>',
      { onOpen:function(root){
        $('[data-export-print]', root).addEventListener('click', function(){ closeModal(); window.print(); });
        $('[data-export-png]', root).addEventListener('click', function(){ exportProfilePng(); });
      }}
    );
  }
  function exportProfilePng(){
    var node = $('.ppv3-charcard') || $('.ppv3-hero-card') || $('[data-profile-dashboard] .ppv3-card') || $('.char-card') || $('[data-profile-dashboard]');
    if(!node){ toast('没有找到可导出的角色卡。'); return; }
    var clone = node.cloneNode(true);
    clone.querySelectorAll('button,a').forEach(function(x){ x.remove(); });
    var html = '<div xmlns="http://www.w3.org/1999/xhtml"><style>body{margin:0;background:#0d0d10;color:#e8e6e1;font-family:Arial,"Microsoft YaHei",sans-serif}.wrap{width:900px;padding:24px;background:#0d0d10}.wrap *{box-sizing:border-box}</style><div class="wrap">' + clone.outerHTML + '</div></div>';
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="948" height="640"><foreignObject width="100%" height="100%">' + html + '</foreignObject></svg>';
    var img = new Image();
    img.onload = function(){
      var canvas = document.createElement('canvas');
      canvas.width = 948; canvas.height = 640;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#0d0d10'; ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(img,0,0);
      var a = document.createElement('a');
      a.download = 'earth-online-character.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
      toast('角色卡图片已生成。');
    };
    img.onerror = function(){ toast('图片导出被浏览器拦截，请使用 PDF 导出。'); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function joinPolish(){
    if(page() !== 'join.html') return;
    var eyebrow = $('.join-wizard-section .section-eyebrow');
    if(eyebrow) eyebrow.textContent = 'EARTH.ONLINE STAFF MATCH · 协作风格评估';
    var title = $('.join-wizard-section .section-title .zh');
    if(title) title.innerHTML = '完成一组日常判断，生成您的<span class="accent">临时协作身份</span>';
    var model = $all('.section-num div').find(function(d){ return /MODEL/.test(d.textContent); });
    if(model) model.innerHTML = 'MODEL&nbsp;&nbsp;&nbsp;/ <span class="v">协作风格模型</span>';
    var badgeK = $('.badge-k');
    if(badgeK) badgeK.textContent = 'TEMP STAFF / COMMUNITY ROLE';
    var resumeNote = $('#resumeNote');
    if(resumeNote) resumeNote.textContent = '完成评估后可生成临时协作卡，并提交候选申请。';
    var resumeBtn = $('#resumeBtn');
    if(resumeBtn){
      resumeBtn.addEventListener('click', function(){
        if(resumeBtn.dataset.submitting === '1') return;
        var title = clean($('#roleTitle') ? $('#roleTitle').textContent : '加入我们申请');
        var body = clean($('#roleDesc') ? $('#roleDesc').textContent : '');
        resumeBtn.dataset.submitting = '1';
        resumeBtn.disabled = true;
        if(resumeNote) resumeNote.textContent = '正在提交到服务器审核队列…';
        postServiceSubmission('join', title, body, {
          badgeRole:clean($('#badgeRole') ? $('#badgeRole').textContent : ''),
          badgeCode:clean($('#badgeCode') ? $('#badgeCode').textContent : ''),
          source:'join.html'
        }).then(function(){
          if(resumeNote) resumeNote.textContent = '候选记录已提交审核。正式编制仍未开放。';
          toast('候选记录已提交审核。');
        }).catch(function(err){
          if(resumeNote) resumeNote.textContent = '提交失败，服务器未确认接收；协作卡仍在本页，可稍后重试。';
          toast(publicError(err, '候选申请未提交，请稍后重试。'));
        }).finally(function(){
          resumeBtn.dataset.submitting = '';
          resumeBtn.disabled = false;
        });
      });
    }
    var saveBtn = $('#saveBadgeBtn');
    if(saveBtn){
      saveBtn.addEventListener('click', function(e){
        e.preventDefault();
        var badge = $('#joinBadgeArt');
        if(!badge){ toast('没有找到工卡。'); return; }
        window.print();
      }, true);
    }
  }

  function adminLocalDraft(type, title, body, payload){
    var drafts = readJson(ADMIN_DRAFTS_KEY, []);
    drafts.unshift({ id:uid('ADM'), type:type, title:title, body:body, payload:payload || {}, status:'pending', at:new Date().toISOString() });
    writeJson(ADMIN_DRAFTS_KEY, drafts.slice(0,200));
    return drafts[0];
  }

  function foundationNewsReviewPolish(){
    if(['foundation.html','news.html','review.html'].indexOf(page()) === -1) return;
    if(page() === 'news.html'){
      var head = $('.news-list-section .section-inner') || $('.section-inner');
      if(head && !$('#eoNewsAdminHint')){
        var hint = document.createElement('div');
        hint.id = 'eoNewsAdminHint';
        hint.className = 'search-status';
        hint.textContent = '官方公告、版本事件和世界动态会在此持续更新。';
        head.insertBefore(hint, head.firstChild);
      }
    }
  }

  /* ── 滚动折叠 wordmark：品牌名 → EARTHONLINE，过 15px 折叠为 ETO，回顶部反放 */
  function setupWordmark(){
    var el = $('.brand-name');
    if(!el || el.dataset.wmDone) return;
    el.dataset.wmDone = '1';
    var FULL = 'EARTHONLINE';
    var KEEP = { 0:1, 3:1, 5:1 };   /* E(0) T(3) O(5) → 折叠后只剩 ETO */
    var DURATION = 600;              /* Anthropic Lottie: 18 frames / 30fps */
    var FADE_END = .82;
    var ease = cubicBezier(.77, 0, .175, 1);
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.classList.add('eo-wordmark');
    el.setAttribute('aria-label', 'EARTHONLINE');
    el.setAttribute('data-no-i18n', '');
    el.textContent = '';
    var letters = [];
    for(var i=0;i<FULL.length;i++){
      var s = document.createElement('span');
      s.className = 'eo-wm-letter' + (KEEP[i] ? ' eo-wm-keep' : ' eo-wm-fold');
      s.dataset.index = String(i);
      s.textContent = FULL.charAt(i);
      el.appendChild(s);
      letters.push(s);
    }

    function cubicBezier(x1, y1, x2, y2){
      function sampleCurveX(t){ return ((1 - 3 * x2 + 3 * x1) * t + (3 * x2 - 6 * x1)) * t * t + (3 * x1) * t; }
      function sampleCurveY(t){ return ((1 - 3 * y2 + 3 * y1) * t + (3 * y2 - 6 * y1)) * t * t + (3 * y1) * t; }
      function sampleDerivativeX(t){ return (3 * (1 - 3 * x2 + 3 * x1) * t + 2 * (3 * x2 - 6 * x1)) * t + (3 * x1); }
      function solveCurveX(x){
        var t = x, i, d, x2v, t0, t1;
        for(i = 0; i < 8; i++){
          x2v = sampleCurveX(t) - x;
          if(Math.abs(x2v) < 1e-5) return t;
          d = sampleDerivativeX(t);
          if(Math.abs(d) < 1e-5) break;
          t -= x2v / d;
        }
        t0 = 0;
        t1 = 1;
        t = x;
        for(i = 0; i < 16; i++){
          x2v = sampleCurveX(t);
          if(Math.abs(x2v - x) < 1e-5) return t;
          if(x > x2v) t0 = t;
          else t1 = t;
          t = (t1 - t0) * .5 + t0;
        }
        return t;
      }
      return function(x){
        if(x <= 0) return 0;
        if(x >= 1) return 1;
        return sampleCurveY(solveCurveX(x));
      };
    }

    function now(){
      return (window.performance && performance.now) ? performance.now() : Date.now();
    }

    function px(n){
      return (Math.round(n * 100) / 100) + 'px';
    }

    function opacityAt(frameProgress){
      if(frameProgress <= 0) return 1;
      if(frameProgress >= FADE_END) return 0;
      return Math.max(0, 1 - ease(frameProgress / FADE_END));
    }

    function renderProgress(frameProgress){
      var moveProgress = ease(frameProgress);
      letters.forEach(function(node){
        var fromX = Number(node.dataset.fromX) || 0;
        var toX = Number(node.dataset.toX) || fromX;
        var x = fromX + (toX - fromX) * moveProgress;
        node.style.transform = 'translate3d(' + px(x) + ', -50%, 0)';
        node.style.opacity = node.classList.contains('eo-wm-fold') ? String(opacityAt(frameProgress)) : '1';
      });
    }

    /* 量出 Michroma 字形坐标；播放时用 Anthropic 的 18 帧曲线驱动 */
    function measure(){
      el.classList.remove('is-ready');
      el.classList.remove('is-collapsing', 'is-expanding');
      if(animFrame) cancelAnimationFrame(animFrame);
      requestAnimationFrame(function(){
        var rect = el.getBoundingClientRect();
        var fontSize = parseFloat(getComputedStyle(el).fontSize) || 16;
        var gap = Math.max(1, Math.round(fontSize * .08));
        var fullGap = 0;
        var keepX = 0;
        var cursorX = 0;
        var collapsedWidth = 0;
        var metrics = letters.map(function(node, index){
          var metric = { node:node, x:cursorX, w:node.offsetWidth };
          cursorX += metric.w + (index === letters.length - 1 ? 0 : fullGap);
          return metric;
        });
        var fullWidth = metrics.reduce(function(max, m){ return Math.max(max, m.x + m.w); }, rect.width);
        el.style.setProperty('--eo-wm-width', Math.ceil(fullWidth) + 'px');
        el.style.setProperty('--eo-wm-height', Math.ceil(rect.height) + 'px');
        metrics.forEach(function(m){
          var index = Number(m.node.dataset.index);
          m.node.style.setProperty('--from-x', (Math.round(m.x * 100) / 100) + 'px');
          m.node.dataset.fromX = String(m.x);
          if(KEEP[index]){
            m.node.style.setProperty('--to-x', (Math.round(keepX * 100) / 100) + 'px');
            m.node.dataset.toX = String(keepX);
            keepX += m.w + gap;
            collapsedWidth = keepX - gap;
          }
        });
        metrics.forEach(function(m){
          var index = Number(m.node.dataset.index);
          if(!KEEP[index]){
            var pull = 4 + (index % 3) * .22;
            m.node.style.setProperty('--fold-x', (Math.round(pull * 100) / 100) + 'px');
            m.node.dataset.toX = String(pull);
          }
        });
        el.style.setProperty('--eo-wm-collapsed-width', Math.ceil(collapsedWidth) + 'px');
        targetCollapsed = (window.pageYOffset || 0) > 15;
        progress = targetCollapsed ? 1 : 0;
        el.classList.toggle('is-collapsed', targetCollapsed);
        el.classList.add('is-ready');
        renderProgress(progress);
      });
    }

    var progress = 0, targetCollapsed = false, ticking = false, animFrame = 0;
    function playTo(next){
      if(next === targetCollapsed && ((next && progress >= .999) || (!next && progress <= .001))) return;
      targetCollapsed = next;
      if(animFrame) cancelAnimationFrame(animFrame);
      el.classList.remove('is-collapsing', 'is-expanding');
      el.classList.add(next ? 'is-collapsing' : 'is-expanding');
      el.classList.toggle('is-collapsed', next);
      var from = progress;
      var to = next ? 1 : 0;
      if(reduceMotion || Math.abs(to - from) < .001){
        progress = to;
        renderProgress(progress);
        el.classList.remove('is-collapsing', 'is-expanding');
        return;
      }
      var start = now();
      var duration = Math.max(80, DURATION * Math.abs(to - from));
      function step(ts){
        var t = Math.min(1, (ts - start) / duration);
        progress = from + (to - from) * t;
        renderProgress(progress);
        if(t < 1){
          animFrame = requestAnimationFrame(step);
        }else{
          progress = to;
          renderProgress(progress);
          el.classList.remove('is-collapsing', 'is-expanding');
          animFrame = 0;
        }
      }
      animFrame = requestAnimationFrame(step);
    }

    function setCollapsed(next){
      playTo(next);
    }
    function apply(){
      ticking = false;
      var y = window.pageYOffset || 0;
      setCollapsed(y > 15);
    }
    window.addEventListener('scroll', function(){ if(!ticking){ ticking = true; requestAnimationFrame(apply); } }, { passive:true });
    window.addEventListener('resize', measure, { passive:true });
    measure();
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  }

  function init(){
    bodyClass();
    markHomeLogoReturn();
    setupWordmark();
    bindAuth();
    installInboxWidget();
    bindDMButtons();
    bindLegalModals();
    /* 中英文切换已按需求取消：地球图标恢复为返回首页。保留引擎代码以备将来。 */
    try{ var l = LS.getItem('eo_lang_v1'); if(l && l !== 'zh-CN') LS.setItem('eo_lang_v1', 'zh-CN'); }catch(e){}
    installCartEntry();
    installOrdersEntry();
    bindCopyButtons();
    homePolish();
    /* 商城/商品/购物车/订单已迁移到 shop-live.js；旧 localStorage 电商层在这些页停用 */
    if(!window.__EO_LIVE_SHOP__){
      shopPolish();
      renderProductPage();
      renderCartPage();
      renderOrdersPage();
      renderWalletPage();
    }
    bindOrdersDelegation();
    taskPagePolish();
    communityPolish();
    saveFilePolish();
    characterPolish();
    joinPolish();
    foundationNewsReviewPolish();
    updateCartCount();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.EOLaunch = {
    toast:toast,
    modal:modal,
    reward:rewardPopup,
    checkWalletGains:walletWatch,
    cart:cart,
    addToCart:addToCart,
    readTasks:readTasks,
    saveTasks:saveTasks,
    createTaskDialog:createTaskDialog,
    adminLocalDraft:adminLocalDraft,
    serviceSubmission:postServiceSubmission,
    apiJson:apiJson,
    /* 商城引擎（供后台等复用） */
    readOrders:readOrders,
    saveOrders:saveOrders,
    updateOrder:updateOrder,
    getOrder:getOrder,
    readWallet:readWallet,
    addCoins:addCoins,
    spendCoins:spendCoins,
    creditTaskReward:creditTaskReward,
    readTx:readTx,
    copy:copyToClipboard,
    readProductReviews:readProductReviews,
    orderStatusLabel:function(s){ return ORDER_STATUS_LABEL[s] || s; },
    productReviewsAll:function(){ return readJson(PRODUCT_REVIEWS_KEY, {}) || {}; },
    writeProductReviewsAll:function(v){ writeJson(PRODUCT_REVIEWS_KEY, v); }
  };
})();
