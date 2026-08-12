(function mobileShell(){
  'use strict';

  var MOBILE_MAX = 1023;
  var path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  var routes = {
    'offline.html':        { title:'离线模式', section:'home', parent:'index.html', mode:'none' },
    'index.html':          { title:'主世界', section:'home', root:true, parent:'index.html' },
    'achievements.html':   { title:'我的成就', section:'me', parent:'character.html#profile-card' },
    'aid.html':            { title:'援助基金', section:'foundation', parent:'foundation.html' },
    'aid-module.html':     { title:'援助支线', section:'foundation', parent:'aid.html' },
    'artisan.html':        { title:'能工智人', section:'artisan', root:true, parent:'index.html' },
    'artisan-chat.html':   { title:'能工智人', section:'artisan', parent:'artisan.html', mode:'chat', contextBack:false },
    'artisan-console.html':{ title:'智人控制台', section:'artisan', parent:'artisan.html', mode:'focus' },
    'backpack.html':       { title:'背包', section:'me', parent:'character.html#profile-card' },
    'bill.html':           { title:'账单记录', section:'shop', tab:'home', parent:'wallet.html' },
    'bounty.html':         { title:'悬赏大厅', section:'task', tab:'home', parent:'task.html' },
    'bug.html':            { title:'玩家社区', section:'community', root:true, parent:'bug.html' },
    'cart.html':           { title:'购物车', section:'shop', tab:'home', parent:'shop.html' },
    'cat-kernel.html':     { title:'猫咪内核', section:'home', parent:'index.html' },
    'cat-kernel-play.html':{ title:'猫咪内核体验', section:'home', parent:'cat-kernel.html' },
    'cat-kernel-rules.html':{ title:'猫咪事故知识库', section:'home', parent:'cat-kernel-play.html' },
    'character.html':      { title:'我的档案', section:'me', root:true, parent:'index.html' },
    'chatroom.html':       { title:'全服聊天室', section:'community', parent:'bug.html', mode:'chat' },
    'contact.html':        { title:'联系我们', section:'home', parent:'index.html' },
    'copyright.html':      { title:'版权声明', section:'home', parent:'index.html', mode:'focus' },
    'dmca.html':           { title:'版权政策', section:'home', parent:'copyright.html', mode:'focus' },
    'dream.html':          { title:'ETO 共投资本', section:'foundation', parent:'foundation.html' },
    'foundation.html':     { title:'基金会', section:'foundation', root:true, parent:'index.html' },
    'inbox.html':          { title:'通知', section:'me', parent:'character.html#profile-card' },
    'intercept.html':      { title:'角色登录', section:'me', parent:'index.html', mode:'none' },
    'join.html':           { title:'加入我们', section:'home', parent:'index.html' },
    'ledger.html':         { title:'资金流向', section:'foundation', parent:'foundation.html' },
    'ledger-module.html':  { title:'资金明细', section:'foundation', parent:'ledger.html' },
    'medal.html':          { title:'守护者勋章', section:'foundation', parent:'foundation.html' },
    'news.html':           { title:'服务器新闻', section:'home', parent:'index.html' },
    'news-detail.html':    { title:'新闻详情', section:'home', parent:'news.html' },
    'nodelete.html':       { title:'不可重开告知书', section:'home', parent:'index.html', mode:'focus' },
    'orders.html':         { title:'我的订单', section:'shop', tab:'home', parent:'shop.html' },
    'party.html':          { title:'组队大厅', section:'community', parent:'bug.html' },
    'policy.html':         { title:'隐私政策', section:'home', parent:'index.html', mode:'focus' },
    'post-detail.html':    { title:'帖子详情', section:'community', parent:'bug.html', mode:'detail' },
    'post-publish.html':   { title:'发布内容', section:'community', parent:'bug.html', mode:'standard' },
    'product.html':        { title:'商品详情', section:'shop', tab:'home', parent:'shop.html' },
    'project.html':        { title:'自营公益', section:'foundation', parent:'foundation.html' },
    'project-module.html': { title:'公益支线', section:'foundation', parent:'project.html' },
    'publish-bug.html':    { title:'反馈 BUG', section:'community', parent:'bug.html', mode:'focus' },
    'publish-guide.html':  { title:'发布攻略', section:'community', parent:'bug.html', mode:'focus' },
    'publish-log.html':    { title:'发布日志', section:'community', parent:'bug.html', mode:'focus' },
    'review.html':         { title:'玩家评价', section:'community', parent:'bug.html' },
    'review-detail.html':  { title:'评价详情', section:'community', parent:'review.html', mode:'detail' },
    'review-publish.html': { title:'发表评价', section:'community', parent:'review.html', mode:'focus' },
    'save.html':           { title:'死亡存档', section:'me', parent:'character.html#profile-card', mode:'focus' },
    'search.html':         { title:'搜索', section:'community', parent:'bug.html' },
    'shop.html':           { title:'商城', section:'shop', tab:'home', parent:'index.html' },
    'task.html':           { title:'任务', section:'task', tab:'home', parent:'index.html' },
    'terms.html':          { title:'服务器条款', section:'home', parent:'index.html', mode:'focus' },
    'wallet.html':         { title:'我的钱包', section:'shop', tab:'home', parent:'shop.html' },
    'world.html':          { title:'世界任务', section:'task', tab:'home', parent:'task.html' }
  };

  var tabs = [
    { id:'home', label:'ETO', href:'index.html', icon:'home', logo:'assets/mobile-nav-r9/eto.webp', resetScroll:true },
    { id:'community', label:'社区', href:'bug.html', icon:'community', logo:'assets/mobile-nav-r9/community.webp' },
    { id:'artisan', label:'能工智人', href:'artisan.html', icon:'artisan', logo:'assets/mobile-nav-r9/artisan.webp' },
    { id:'foundation', label:'基金会', href:'foundation.html', icon:'foundation', logo:'assets/mobile-nav-r9/foundation.webp', resetScroll:true },
    { id:'me', label:'我的', href:'character.html#profile-card', icon:'me', logo:'assets/mobile-nav-r9/profile.webp', scrollTarget:'profile-card' }
  ];

  var route = routes[path] || {
    title:(document.title || 'EARTH.ONLINE').replace(/\s*[—-]\s*EARTH\.ONLINE.*$/i,''),
    section:'home', parent:'index.html'
  };
  if(path === 'character.html' && new URLSearchParams(location.search).get('mode') === 'register'){
    route = { title:'创建角色', section:'me', parent:'intercept.html?entry=login', mode:'focus' };
  }
  var mode = route.mode || 'standard';
  var body = document.body;
  if(!body) return;

  body.dataset.mobileShell = mode;
  body.dataset.mobileSection = route.section || 'home';
  body.dataset.mobilePage = path;
  body.classList.add('m-shell-ready');
  if(path === 'intercept.html') body.classList.add('m-intercept-page');
  if(mode === 'chat') document.documentElement.classList.add('m-chat-page');

  var deferredInstallPrompt = null;
  var installButton = null;
  var mobileVisitCount = 0;
  try{
    mobileVisitCount = Number(localStorage.getItem('eo_m_visit_count') || 0);
    if(!sessionStorage.getItem('eo_m_session_counted')){
      mobileVisitCount += 1;
      localStorage.setItem('eo_m_visit_count', String(mobileVisitCount));
      sessionStorage.setItem('eo_m_session_counted', '1');
    }
  }catch(err){}

  if('serviceWorker' in navigator && /^https?:$/.test(location.protocol)){
    window.addEventListener('load', function(){
      navigator.serviceWorker.register('sw.js', { scope:'./' }).catch(function(){ /* offline remains optional */ });
    }, { once:true });
  }

  window.addEventListener('beforeinstallprompt', function(event){
    event.preventDefault();
    deferredInstallPrompt = event;
    var standalone = !!(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || !!navigator.standalone;
    if(installButton && mobileVisitCount >= 2 && !standalone) installButton.hidden = false;
  });

  window.addEventListener('appinstalled', function(){
    deferredInstallPrompt = null;
    if(installButton) installButton.hidden = true;
  });

  function isMobile(){ return window.innerWidth <= MOBILE_MAX; }

  function isLoggedIn(){
    try{
      /* A cached profile is presentation data, not a valid session.  Treating it
         as authentication left the shell "logged in" after the access token
         expired and every write API had already started returning 401. */
      return window.EOSession
        ? window.EOSession.isAuthenticated()
        : !!localStorage.getItem('eo_access_token');
    }catch(err){ return false; }
  }

  function safeText(value){
    return String(value == null ? '' : value)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

  function safeBack(event){
    if(event) event.preventDefault();
    var sameOriginRef = false;
    try{
      var referrer = document.referrer ? new URL(document.referrer) : null;
      sameOriginRef = !!referrer && referrer.origin === location.origin && referrer.href !== location.href;
    }catch(err){}
    if(sameOriginRef && history.length > 1) history.back();
    else location.href = route.parent || 'index.html';
  }

  if(mode === 'none') return;

  var appbar = document.createElement('header');
  appbar.className = 'm-appbar' + (route.section === 'artisan' ? ' is-artisan' : '');
  appbar.setAttribute('aria-label','移动端页面栏');

  var wordmark = 'EARTHONLINE'.split('').map(function(letter,index){
    var keep = index === 0 || index === 3 || index === 5;
    return '<span class="m-wm-letter '+(keep?'m-wm-keep':'m-wm-fold')+'" aria-hidden="true">'+letter+'</span>';
  }).join('');
  /* 所有页面统一使用品牌入口。页面自身已有内容级返回按钮，不在 App Bar
     里再叠一套返回键，避免移动端出现两个“返回上一级”。 */
  var left = route.section === 'artisan'
    ? '<a class="m-appbar-brand m-artisan-brand" href="index.html" aria-label="能工智人 · 返回 ETO 首页"><img src="assets/eto-core-logo.svg" width="28" height="28" alt=""><span class="m-artisan-wordmark"><b>能工智人</b><small>/ ETO.Core</small></span></a>'
    : '<div class="m-appbar-brand m-site-brand"><button class="m-site-theme-toggle m-site-theme-icon" type="button" data-site-theme-toggle aria-label="切换到明亮模式" aria-pressed="false" title="明暗模式"><img src="assets/logo-earth.webp" width="28" height="28" alt=""></button><a class="m-mobile-wordmark m-appbar-brand-link" href="index.html" aria-label="返回 EARTH.ONLINE 首页">'+wordmark+'</a></div>';

  var chatStatus = mode === 'chat'
    ? '<span class="m-chat-status"><i aria-hidden="true"></i><span>在线</span></span>'
    : '';
  var right = mode === 'chat'
      ? '<div class="m-appbar-actions">'+chatStatus+'</div>'
      : '<div class="m-appbar-actions"><button class="m-appbar-inbox" type="button" aria-label="信箱" title="信箱"'+(isLoggedIn()?'':' hidden')+'><svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="4.5" width="15" height="11" rx="1.5"></rect><path d="M3.2 6l6.8 4.9L16.8 6"></path></svg><b class="m-notify-badge" hidden></b></button><button class="m-appbar-more" type="button" aria-label="更多页面"><span aria-hidden="true"></span></button></div>';
  appbar.innerHTML = '<div class="m-appbar-inner">'+left+right+'</div>';
  body.insertBefore(appbar, body.firstChild);

  /* Keep the EARTHONLINE brand bar intact, while restoring one predictable
     content-level back affordance on actual child/focus routes.  Existing
     desktop back links remain the source of truth for deciding whether the
     route needs one, but are hidden on phones to avoid duplicate controls. */
  var parentFile = String(route.parent || '').split(/[?#]/)[0].toLowerCase();
  var backSource = Array.prototype.slice.call(document.querySelectorAll(
    '.post-detail-content-back,.subpage-back,.eo-back-btn,.community-hero-btn,.nd-back,.publish-choice-back,[data-legal-close]'
  )).find(function(el){ return !el.closest('.m-appbar,.m-context-nav'); });
  if(!backSource && parentFile){
    backSource = Array.prototype.slice.call(document.querySelectorAll('a[href],button[data-eo-back]')).find(function(el){
      var text = (el.textContent || '').trim();
      if(!/返回|关闭/.test(text)) return false;
      var href = (el.getAttribute('href') || el.getAttribute('data-eo-back-fallback') || '').split(/[?#]/)[0].toLowerCase();
      return href === parentFile;
    });
  }
  if(backSource) backSource.classList.add('m-native-back-source');
  var needsContextBack = route.contextBack !== false && !route.root && !!route.parent && (backSource || mode === 'focus' || mode === 'chat' || mode === 'detail');
  if(needsContextBack){
    var parentRoute = routes[parentFile];
    var parentTitle = parentRoute && parentRoute.title ? parentRoute.title : '上一级';
    var contextNav = document.createElement('nav');
    contextNav.className = 'm-context-nav';
    body.classList.add('m-has-context-nav');
    contextNav.setAttribute('aria-label','页面层级导航');
    contextNav.innerHTML = '<button class="m-context-back" type="button" aria-label="返回'+safeText(parentTitle)+'"><span class="m-context-back-icon" aria-hidden="true"></span><span>'+safeText(parentTitle)+'</span></button>';
    appbar.insertAdjacentElement('afterend', contextNav);
    contextNav.querySelector('.m-context-back').addEventListener('click', safeBack);
  }

  var brandLink = appbar.querySelector('.m-appbar-brand-link') || appbar.querySelector('.m-artisan-brand');
  if(brandLink){
    brandLink.addEventListener('click', function(event){
      if(path === 'index.html'){
        event.preventDefault();
        window.scrollTo({ top:0, behavior:reduceMotion ? 'auto' : 'smooth' });
        return;
      }
      try{
        if(/^artisan(?:-|\.html$)/.test(path)){
          sessionStorage.setItem('eo_force_home_splash_once', '1');
        }else{
          sessionStorage.setItem('eo_skip_home_splash_once', '1');
        }
      }catch(err){}
    });
  }
  var mobileWordmark = appbar.querySelector('.m-mobile-wordmark');
  var wordmarkTicking = false;
  function syncMobileWordmark(){
    if(!mobileWordmark) return;
    mobileWordmark.classList.toggle('is-collapsed', (window.scrollY || 0) > 15);
    wordmarkTicking = false;
  }
  if(mobileWordmark){
    syncMobileWordmark();
    window.addEventListener('scroll', function(){
      if(wordmarkTicking) return;
      wordmarkTicking = true;
      requestAnimationFrame(syncMobileWordmark);
    }, { passive:true });
  }

  var tabbar = null;
  if(mode === 'standard'){
    tabbar = document.createElement('nav');
    tabbar.className = 'm-tabbar';
    tabbar.setAttribute('aria-label','主要导航');
    tabbar.innerHTML = '<div class="m-tabbar-inner">'+tabs.map(function(tab){
      var active = (route.tab || route.section) === tab.id;
      var icon = tab.logo
        ? '<span class="m-tab-icon m-tab-icon-logo" data-icon="'+tab.icon+'" aria-hidden="true"><img src="'+tab.logo+'" alt=""></span>'
        : '<span class="m-tab-icon" data-icon="'+tab.icon+'" aria-hidden="true"></span>';
      return '<a class="m-tab'+(active?' is-active':'')+'" data-section="'+tab.id+'" href="'+tab.href+'"'+(tab.resetScroll?' data-reset-scroll="1"':'')+(tab.scrollTarget?' data-scroll-target="'+tab.scrollTarget+'"':'')+(active?' aria-current="page"':'')+'>'+ 
        icon+'<span class="m-tab-label">'+tab.label+'</span>'+
        (tab.id === 'me' ? '<b class="m-tab-badge" hidden></b>' : '')+
      '</a>';
    }).join('')+'</div>';
    body.appendChild(tabbar);
  }

  var sheetMask = document.createElement('div');
  sheetMask.className = 'm-sheet-mask';
  sheetMask.hidden = true;
  sheetMask.innerHTML =
    '<section class="m-more-sheet" role="dialog" aria-modal="true" aria-labelledby="m-more-title" tabindex="-1">'+
      '<div class="m-sheet-handle" aria-hidden="true"></div>'+
      '<header class="m-sheet-head"><div><span class="m-sheet-kicker">EARTH.ONLINE</span><h2 id="m-more-title">更多世界入口</h2></div><button class="m-sheet-close" type="button" aria-label="关闭更多页面">×</button></header>'+
      '<div class="m-sheet-scroll">'+
        '<div class="m-sheet-group"><h3>玩法</h3><div class="m-sheet-links">'+
          '<a class="m-sheet-feature-link" href="cat-kernel.html"><span><b>猫.EXE</b><i>地球online运维测试</i></span><strong>立即运行 →</strong></a>'+
          '<a href="task.html"><span>任务系统</span><small>QUESTS</small></a>'+
          '<a href="world.html"><span>世界任务</span><small>WORLD QUEST</small></a>'+
          '<a href="shop.html"><span>官方商城</span><small>OFFICIAL SHOP</small></a>'+
          '<a href="news.html"><span>服务器新闻</span><small>SERVER NEWS</small></a>'+
          '<a href="review.html"><span>玩家评价</span><small>PLAYER REVIEWS</small></a>'+ 
          '<a href="/aiornot/"><span>图灵测试</span><small>AI OR NOT</small></a>'+ 
        '</div></div>'+
        '<div class="m-sheet-group"><h3>公益与透明</h3><div class="m-sheet-links">'+
          '<a href="foundation.html"><span>基金会</span><small>FOUNDATION</small></a>'+
          '<a href="aid.html"><span>援助基金</span><small>EMERGENCY AID</small></a>'+
          '<a href="project.html"><span>自营公益</span><small>PROJECTS</small></a>'+
          '<a href="ledger.html"><span>资金公示</span><small>PUBLIC LEDGER</small></a>'+
        '</div></div>'+
        '<div class="m-sheet-group"><h3>官方</h3><div class="m-sheet-links">'+
          '<a href="contact.html"><span>联系我们</span><small>CONTACT</small></a>'+
          '<a href="join.html"><span>加入我们</span><small>CAREERS</small></a>'+
        '</div></div>'+
        '<div class="m-sheet-group m-sheet-group-rules"><h3>规则与权利</h3><div class="m-sheet-links m-sheet-rule-links">'+
          '<a href="policy.html"><span>隐私政策</span><small>PRIVACY</small></a>'+
          '<a href="terms.html"><span>服务器条款</span><small>TERMS</small></a>'+
          '<a href="nodelete.html"><span>不可重开告知书</span><small>NO RESTART</small></a>'+
        '</div><div class="m-sheet-subhead"><span>原创内容权利</span><small>CONTENT RIGHTS</small></div><div class="m-sheet-links m-sheet-rights-links">'+
          '<a href="copyright.html"><span>版权声明</span><small>中文</small></a>'+
          '<a href="dmca.html"><span>DMCA 声明</span><small>ENGLISH</small></a>'+
        '</div></div>'+
      '</div>'+
      '<footer class="m-sheet-foot"><span class="m-sheet-online"><i aria-hidden="true"></i> LIFE SERVER ONLINE</span><div class="m-sheet-account"><button class="m-install-action" type="button" hidden>安装到桌面</button><button class="m-sheet-auth-action" type="button"></button></div><span>v2026.7.13</span></footer>'+
    '</section>';
  body.appendChild(sheetMask);

  var moreButton = appbar.querySelector('.m-appbar-more');
  var closeButton = sheetMask.querySelector('.m-sheet-close');
  var sheet = sheetMask.querySelector('.m-more-sheet');
  installButton = sheetMask.querySelector('.m-install-action');
  var authAction = sheetMask.querySelector('.m-sheet-auth-action');
  var lockedScrollY = 0;
  var previousFocus = null;

  if(installButton){
    installButton.addEventListener('click', function(){
      if(!deferredInstallPrompt) return;
      var promptEvent = deferredInstallPrompt;
      promptEvent.prompt();
      Promise.resolve(promptEvent.userChoice).then(function(){
        deferredInstallPrompt = null;
        installButton.hidden = true;
      }).catch(function(){});
    });
  }

  function syncSheetAuthAction(){
    if(!authAction) return;
    var loggedIn = isLoggedIn();
    authAction.textContent = loggedIn ? '退出登录' : '登录';
    authAction.setAttribute('aria-label', loggedIn ? '退出当前网站账号' : '登录网站账号');
  }
  syncSheetAuthAction();
  window.addEventListener('eo:session-refreshed', syncSheetAuthAction);
  window.addEventListener('eo:session-ended', syncSheetAuthAction);
  if(authAction){
    authAction.addEventListener('click', async function(){
      if(!isLoggedIn()){
        try{ localStorage.setItem('eo_intercept_redirect', path); }catch(err){}
        location.href = 'intercept.html?entry=login&next=' + encodeURIComponent(path);
        return;
      }
      authAction.disabled = true;
      authAction.textContent = '正在退出';
      try{
        if(window.EOSession) await window.EOSession.logout();
        else{
          localStorage.removeItem('eo_access_token');
          localStorage.removeItem('eo_refresh_token');
          localStorage.removeItem('eo_active_profile_v1');
        }
      }catch(err){}
      try{
        localStorage.removeItem('eo_intercept_seen');
        localStorage.removeItem('eo_intercept_redirect');
      }catch(err){}
      location.replace('intercept.html?entry=login');
    });
  }

  function getFocusable(){
    return Array.prototype.slice.call(sheet.querySelectorAll('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])'))
      .filter(function(el){ return !el.hidden && el.getClientRects().length; });
  }

  function openSheet(){
    if(!isMobile()) return;
    previousFocus = document.activeElement;
    lockedScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    body.style.setProperty('--m-lock-top', (-lockedScrollY)+'px');
    body.classList.add('m-sheet-open');
    sheetMask.hidden = false;
    /* Visibility is functional state. A suspended background-tab rAF used to
       leave an invisible mask over the page with no usable sheet. */
    void sheet.offsetWidth;
    sheetMask.classList.add('is-open');
    sheet.focus();
  }

  function closeSheet(){
    if(sheetMask.hidden) return;
    sheetMask.classList.remove('is-open');
    var finish = function(){
      sheetMask.hidden = true;
      body.classList.remove('m-sheet-open');
      body.style.removeProperty('--m-lock-top');
      window.scrollTo(0, lockedScrollY);
      if(previousFocus && previousFocus.focus) previousFocus.focus();
    };
    if(reduceMotion) finish();
    else window.setTimeout(finish, 230);
  }

  function closeSheetAcrossBreakpoint(){
    if(isMobile() || sheetMask.hidden) return;
    sheetMask.classList.remove('is-open');
    sheetMask.hidden = true;
    body.classList.remove('m-sheet-open');
    body.style.removeProperty('--m-lock-top');
    window.scrollTo(0, lockedScrollY);
  }

  if(moreButton) moreButton.addEventListener('click', openSheet);
  closeButton.addEventListener('click', closeSheet);
  sheetMask.addEventListener('click', function(event){ if(event.target === sheetMask) closeSheet(); });
  /* Route sheet links explicitly. This keeps navigation reliable when other
     site-wide click delegates are also active on the page. */
  sheet.addEventListener('click', function(event){
    var link = event.target.closest('a[href]');
    if(!link || !sheet.contains(link)) return;
    var href = link.getAttribute('href');
    if(!href) return;
    event.preventDefault();
    saveScroll();
    location.href = href;
  });
  window.addEventListener('resize', closeSheetAcrossBreakpoint, { passive:true });
  document.addEventListener('keydown', function(event){
    if(sheetMask.hidden) return;
    if(event.key === 'Escape'){ closeSheet(); return; }
    if(event.key !== 'Tab') return;
    var focusable = getFocusable();
    if(!focusable.length){ event.preventDefault(); sheet.focus(); return; }
    var first = focusable[0];
    var last = focusable[focusable.length-1];
    if(event.shiftKey && document.activeElement === first){ event.preventDefault(); last.focus(); }
    else if(!event.shiftKey && document.activeElement === last){ event.preventDefault(); first.focus(); }
  });

  function saveScroll(){
    try{ sessionStorage.setItem('eo_m_scroll_'+path, String(window.scrollY || 0)); }catch(err){}
  }
  window.addEventListener('pagehide', saveScroll);

  if(tabbar){
    tabbar.addEventListener('click', function(event){
      var link = event.target.closest('.m-tab');
      if(!link) return;
      var hrefFile = (link.getAttribute('href') || '').split('#')[0];
      if(hrefFile === path){
        event.preventDefault();
        window.scrollTo({ top:0, behavior:reduceMotion?'auto':'smooth' });
        return;
      }
      saveScroll();
      try{
        if(link.dataset.scrollTarget){
          sessionStorage.removeItem('eo_m_tab_restore');
          sessionStorage.removeItem('eo_m_force_top');
          sessionStorage.setItem('eo_m_force_target', JSON.stringify({ path:hrefFile, target:link.dataset.scrollTarget }));
          sessionStorage.removeItem('eo_m_scroll_'+hrefFile);
        }else if(link.dataset.resetScroll === '1'){
          sessionStorage.removeItem('eo_m_tab_restore');
          sessionStorage.setItem('eo_m_force_top', hrefFile);
          sessionStorage.removeItem('eo_m_scroll_'+hrefFile);
        }else{
          sessionStorage.setItem('eo_m_tab_restore', hrefFile);
        }
      }catch(err){}
      if(link.dataset.section === 'me' && !isLoggedIn()){
        event.preventDefault();
        try{
          localStorage.setItem('eo_intercept_redirect','character.html#profile-card');
          sessionStorage.removeItem('eo_m_tab_restore');
        }catch(err){}
        location.href = 'intercept.html';
      }
    });
  }

  var inboxLink = appbar.querySelector('.m-appbar-inbox');
  if(inboxLink){
    inboxLink.addEventListener('click', function(){ location.href = 'inbox.html'; });
  }

  function restoreTabScroll(){
    try{
      var forceTargetRaw = sessionStorage.getItem('eo_m_force_target');
      var forceTarget = forceTargetRaw ? JSON.parse(forceTargetRaw) : null;
      if(forceTarget && forceTarget.path === path){
        sessionStorage.removeItem('eo_m_force_target');
        sessionStorage.removeItem('eo_m_tab_restore');
        sessionStorage.removeItem('eo_m_scroll_'+path);
        requestAnimationFrame(function(){ requestAnimationFrame(function(){
          var target = document.getElementById(forceTarget.target);
          if(!target){ window.scrollTo(0,0); return; }
          var appbarHeight = (document.querySelector('.m-appbar') || {}).offsetHeight || 0;
          var top = target.getBoundingClientRect().top + (window.scrollY || 0) - appbarHeight - 8;
          window.scrollTo(0, Math.max(0, top));
        }); });
        return;
      }
      var forceTop = sessionStorage.getItem('eo_m_force_top');
      if(forceTop === path){
        sessionStorage.removeItem('eo_m_force_top');
        sessionStorage.removeItem('eo_m_tab_restore');
        requestAnimationFrame(function(){ requestAnimationFrame(function(){ window.scrollTo(0,0); }); });
        return;
      }
      var wanted = sessionStorage.getItem('eo_m_tab_restore');
      if(wanted !== path) return;
      sessionStorage.removeItem('eo_m_tab_restore');
      var saved = Number(sessionStorage.getItem('eo_m_scroll_'+path) || 0);
      if(saved <= 0) return;
      requestAnimationFrame(function(){ requestAnimationFrame(function(){ window.scrollTo(0,saved); }); });
    }catch(err){}
  }
  window.addEventListener('load', restoreTabScroll, { once:true });

  function syncExistingUnread(){
    var oldBadge = document.querySelector('.strip .inbox-dot');
    var newBadges = document.querySelectorAll('.m-notify-badge,.m-tab-badge');
    if(inboxLink) inboxLink.hidden = !isLoggedIn();
    if(!oldBadge || !newBadges.length) return;
    var text = (oldBadge.textContent || '').trim();
    var show = !oldBadge.hidden && text !== '' && text !== '0';
    newBadges.forEach(function(badge){
      badge.hidden = !show;
      badge.textContent = show ? (text.length > 3 ? '99+' : text) : '';
    });
  }
  syncExistingUnread();
  window.addEventListener('eo:session-refreshed', syncExistingUnread);
  window.addEventListener('eo:session-ended', syncExistingUnread);
  var oldStrip = document.querySelector('.strip');
  if(oldStrip && window.MutationObserver){
    new MutationObserver(syncExistingUnread).observe(oldStrip,{ childList:true,subtree:true,attributes:true,attributeFilter:['hidden'] });
  }
})();
