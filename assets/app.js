/* ═══════════════════════════════════════════════════════
   EARTH.ONLINE — Shared Scripts
   ═══════════════════════════════════════════════════════ */

/* ── (1) 顶部状态条数据 ───────────────────────────────── */
(function injectVersion(){
  var d = new Date();
  var el = document.getElementById('ver-date');
  if(el) el.textContent = d.getFullYear() + '.' + (d.getMonth()+1) + '.' + d.getDate();
})();

/* ── 顶部“更多”：独立世界入口只在桌面导航展开 ─────────── */
(function injectMoreWorlds(){
  function mount(){
    var nav = document.querySelector('.nav-links');
    if(!nav || nav.querySelector('.nav-more')) return;
    var wrap = document.createElement('div');
    wrap.className = 'nav-more';
    wrap.innerHTML = '<button class="nav-more-trigger" type="button" aria-expanded="false" aria-haspopup="true">更多 <span aria-hidden="true">⌄</span></button>'+
      '<div class="nav-more-menu" hidden><a href="cat-kernel.html"><span>猫.EXE</span><small>地球online运维测试</small></a><a href="/aiornot/"><span>图灵测试</span><small>AI OR NOT</small></a></div>';
    nav.appendChild(wrap);
    var trigger = wrap.querySelector('.nav-more-trigger');
    var menu = wrap.querySelector('.nav-more-menu');
    function close(){
      trigger.setAttribute('aria-expanded','false');
      menu.hidden = true;
      wrap.classList.remove('is-open');
    }
    trigger.addEventListener('click',function(event){
      event.stopPropagation();
      var open = trigger.getAttribute('aria-expanded') !== 'true';
      if(open){
        trigger.setAttribute('aria-expanded','true');
        menu.hidden = false;
        wrap.classList.add('is-open');
      }else close();
    });
    document.addEventListener('click',function(event){ if(!wrap.contains(event.target)) close(); });
    document.addEventListener('keydown',function(event){ if(event.key === 'Escape') close(); });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
})();

var fmt = function(n){return n.toLocaleString('en-US');};

var BASE_ONLINE = 8123847392;
var liveOnline = BASE_ONLINE;

function tickOnline(){
  var delta = Math.floor((Math.random() - 0.42) * 60);
  liveOnline += delta;
  ['online-num','hero-players','s-online'].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.textContent = fmt(liveOnline);
  });
}
setInterval(tickOnline, 1100);
tickOnline();

function tickLatency(){
  var lat = (0.78 + Math.random() * 0.18).toFixed(3);
  var el = document.getElementById('latency');
  if(el) el.textContent = lat;
  var dot = document.getElementById('status-dot');
  var txt = document.getElementById('status-text');
  if(!dot || !txt) return;
  var r = Math.random();
  dot.classList.remove('warn','err');
  if(r > 0.97){ dot.classList.add('err'); txt.textContent = 'LAGGY'; }
  else if(r > 0.88){ dot.classList.add('warn'); txt.textContent = 'UNSTABLE'; }
  else { txt.textContent = 'ONLINE'; }
}
setInterval(tickLatency, 1700);
tickLatency();

/* ── (2) 角色档案入口：有缓存进个人档案，无缓存进拦截页 ───── */
(function loginGate(){
  if(location.pathname.split('/').pop() === 'intercept.html') return;

  function hasCachedProfile(){
    try{
      if(window.EOSession) return window.EOSession.isAuthenticated();
      return !!localStorage.getItem('eo_access_token');
    }catch(err){
      return false;
    }
  }

  var loginLinks = document.querySelectorAll('.nav-links a[href="character.html"], .home-hero .cta a[href="character.html"]');
  loginLinks.forEach(function(link){
    link.addEventListener('click', function(e){
      localStorage.setItem('eo_intercept_redirect', 'character.html#profile-card');
      e.preventDefault();
      window.location.href = hasCachedProfile() ? 'character.html#profile-card' : 'intercept.html';
    });
  });
})();

/* ── (2) 模态弹窗 ────────────────────────────────────── */
var MODAL_PRESETS = {
  login:   { title:'CHARACTER LOGIN / 角色登录',   h:'角色档案已接入',         p:'系统会优先使用您已激活的角色档案。<br><br>如需切换身份，请先在当前浏览器清理本地档案，或重新进入角色激活流程。' },
  logout:  { title:'CONFIRM SIGN-OUT / 登出确认',  h:'登出请求已记录',         p:'地球 Online 会保留当前档案和会话状态。<br><br>您可以关闭页面，但角色进度仍会按当前规则继续托管。' },
  cancel:  { title:'POLITE EXIT / 客气告辞',       h:'告辞请求已记录',         p:'系统已记录您的离开意图。<br><br>当前服务器不提供主动退出生命进程的路径，请继续保管好本局存档。' },
  generic: { title:'QUEUE NOTICE / 入口状态',      h:'此入口正在排队',         p:'您的访问请求已记录。<br><br>当前入口会进入后续处理队列，请优先使用页面上已开放的主流程。' },
  anchor:  { title:'WORLD QUEST / 锚点提交',        h:'已为您记录这一点善意',   p:'感谢您的贡献。<br>本期世界任务进度 <strong>+ 0.0001 %</strong>。<br><br>—— 系统不会验证真伪。这一刻只取决于您是否真的去做了。' },
  vote:    { title:'BUG VOTE / 投票',               h:'已为您 +1',              p:'已确认您也遇到了此问题。<br>但请知悉——已有 8,xxx,xxx,xxx 名玩家报告了相同 bug。' },
  apply:   { title:'TASK APPLY / 报名',             h:'已为您记录报名意向',     p:'本系统不验证真伪，靠诚意。请点击"已完成"前确认双方对结果的描述一致。' },
  continue:{ title:'CONTINUE / 继续本局',           h:'好消息是—',              p:'<strong>您依然在呼吸，当前存档尚未结算。</strong><br><br>请回到主世界。下一帧已就绪。' },
  export:  { title:'EXPORT CARD / 导出角色卡',      h:'导出请求已记录',         p:'角色卡以当前页面展示为准。<br><br>如需留档，请使用页面内导出入口或浏览器截图保存。' },
  submit:  { title:'SUBMIT BUG / 提交反馈',         h:'反馈入口已迁移',         p:'感谢您的反馈。<br>请通过玩家社区或 BUG 发布页提交，系统会把内容送入审核队列。' },
  rebirth: { title:'REBIRTH / 重新出生',            h:'重新出生不被允许',        p:'本服仅允许角色降生一次。<br>"重新出生"按设计原意拒绝实装——<strong>并非未来版本会开放</strong>。' },
  download:{ title:'DOWNLOAD CLIENT / 下载客户端',   h:'您好像已经安装了',        p:'检测结果：<strong>客户端正在运行中</strong>，启动时间为<strong>您出生那天</strong>。<br><br>本服不发行可独立分发的客户端——<strong>您本人就是唯一运行实例</strong>。卸载方法详见 EULA 第 4 条（暂不可查阅）。' }
};

function ensureModal(){
  if(document.getElementById('modal-mask')) return;
  var html = '<div class="modal-mask" id="modal-mask">'+
    '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-p" tabindex="-1">'+
      '<div class="modal-bar"><span id="modal-title">SYSTEM NOTICE / 系统提示</span><button class="x" id="modal-close" type="button" aria-label="关闭弹窗">×</button></div>'+
      '<div class="modal-body"><div class="icon">!</div><h3 id="modal-h">系统提示</h3><p id="modal-p">请求已记录。</p></div>'+
      '<div class="modal-foot"><button class="modal-btn" id="modal-cancel">我去，不早说</button><button class="modal-btn primary" id="modal-ok">好的，我继续游戏</button></div>'+
    '</div></div>';
  var d = document.createElement('div');
  d.innerHTML = html;
  document.body.appendChild(d.firstChild);
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-ok').addEventListener('click', closeModal);
  document.getElementById('modal-mask').addEventListener('click', function(e){ if(e.target.id === 'modal-mask') closeModal(); });
}

var modalReturnFocus = null;
var modalPreviousOverflow = '';

function openModal(type, extra){
  ensureModal();
  var p = MODAL_PRESETS[type] || MODAL_PRESETS.generic;
  document.getElementById('modal-title').textContent = p.title;
  var h = (extra && extra.name) ? (extra.name + ' · ' + p.h) : p.h;
  document.getElementById('modal-h').textContent = h;
  document.getElementById('modal-p').innerHTML = p.p;
  document.getElementById('modal-mask').classList.add('show');
  modalReturnFocus = document.activeElement;
  modalPreviousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  var dialog = document.querySelector('#modal-mask .modal');
  if(dialog) requestAnimationFrame(function(){ dialog.focus(); });
}
function closeModal(){
  var m = document.getElementById('modal-mask');
  if(m) m.classList.remove('show');
  document.body.style.overflow = modalPreviousOverflow;
  if(modalReturnFocus && modalReturnFocus.focus) modalReturnFocus.focus();
  modalReturnFocus = null;
}

document.addEventListener('click', function(e){
  var t = e.target.closest('[data-modal]');
  if(t){
    e.preventDefault();
    var type = t.getAttribute('data-modal');
    var extra = {};
    var n = t.getAttribute('data-name'); if(n) extra.name = n;
    var a = t.getAttribute('data-anchor'); if(a) extra.name = '锚点 · ' + a;
    openModal(type, extra);
  }
});
document.addEventListener('keydown', function(e){
  var mask = document.getElementById('modal-mask');
  if(!mask || !mask.classList.contains('show')) return;
  if(e.key === 'Escape'){ closeModal(); return; }
  if(e.key !== 'Tab') return;
  var focusable = Array.prototype.slice.call(mask.querySelectorAll('button,a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'))
    .filter(function(el){ return !el.disabled && el.getClientRects().length; });
  if(!focusable.length) return;
  var first = focusable[0];
  var last = focusable[focusable.length - 1];
  if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
  else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
});

/* ── (3) reveal on scroll ────────────────────────────── */
(function reveal(){
  if(!('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function(es){
    es.forEach(function(en){
      if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.01, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.section, .live, .mod, .rv-card, .sec-card, .stat, .save-block, .task-card, .species, .talent, .pq').forEach(function(el){
    el.classList.add('reveal'); io.observe(el);
  });
})();

/* ── (4) Hero 加载百分比 ─────────────────────────────── */
(function loader(){
  var el = document.getElementById('load-pct');
  if(!el) return;
  var p = 0;
  var t = setInterval(function(){
    p += Math.random() * 7;
    if(p >= 99.7){ p = 99.7; clearInterval(t); }
    el.textContent = p.toFixed(1);
  }, 120);
})();

/* ── (5) 角色档案 — 性别自由输入 ──────────────────────── */
(function genderInput(){
  var input = document.getElementById('gender-input');
  if(!input) return;
  var tags = document.querySelectorAll('.gender-tag');
  tags.forEach(function(t){
    t.addEventListener('click', function(){
      input.value = t.textContent.trim();
      input.focus();
    });
  });
})();

/* ── (6) Hero 公告条 — 自动滚动（如有 3+ 条）─────────── */
/* 静态展示，不滚动；由 HTML 直接列出 */

/* ── (7) Mobile nav ─────────────────────────────────── */
(function mobileNav(){
  var nav = document.querySelector('.nav');
  var btn = document.querySelector('.nav-burger');
  if(!nav || !btn) return;
  if(document.body.classList.contains('m-shell-ready') && window.innerWidth <= 767) return;
  btn.addEventListener('click', function(){
    var open = nav.classList.toggle('nav-open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.addEventListener('click', function(e){
    if(!nav.classList.contains('nav-open')) return;
    if(e.target.closest('.nav-inner')) return;
    nav.classList.remove('nav-open');
    btn.setAttribute('aria-expanded', 'false');
  });
})();

/* 本地浏览记录：前端占位数据，后端接入前只写入当前浏览器。 */
(function trackBrowseHistory(){
  try{
    var path = location.pathname.split('/').pop() || 'index.html';
    if(path === 'intercept.html') return;
    var titles = {
      'index.html':'主世界',
      'character.html':'角色档案',
      'bug.html':'玩家社区',
      'task.html':'任务',
      'world.html':'世界任务',
      'bounty.html':'悬赏大厅',
      'shop.html':'商城',
      'wallet.html':'我的钱包',
      'foundation.html':'基金会',
      'join.html':'加入我们',
      'review.html':'玩家口碑',
      'review-publish.html':'发表评价',
      'news.html':'服务器新闻',
      'save.html':'死亡存档'
    };
    var key = 'eo_browse_history_v1';
    var list = JSON.parse(localStorage.getItem(key) || '[]').filter(function(item){
      return item && item.path !== path;
    });
    list.unshift({
      path:path,
      title:titles[path] || (document.title || path).replace(/\s+—\s+EARTH\.ONLINE$/,''),
      href:path + location.hash,
      at:new Date().toISOString()
    });
    localStorage.setItem(key, JSON.stringify(list.slice(0, 12)));
  }catch(e){}
})();

/* ── 成就时间彩蛋：夜猫子 / 早起鸟 ──
   weekend_warrior 移到 task.html：必须在周末完成委托才触发，不是随便访问页面 */
(function checkTimeAchievements(){
  if(!window.eoAch) return;
  var h = new Date().getHours();
  if(h >= 2 && h <= 4) window.eoAch.unlock('night_owl');
  if(h >= 5 && h <= 7) window.eoAch.unlock('early_bird');
})();
