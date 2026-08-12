/**
 * EARTH.ONLINE — 成就系统
 *
 * 用法：
 *   window.eoAch.unlock('first_post')   解锁成就（已解锁则跳过；首次解锁会弹 Steam 风格 popup）
 *   window.eoAch.has('first_login')     是否已解锁
 *   window.eoAch.list()                 已解锁列表（按解锁时间倒序）
 *   window.eoAch.catalog()              全部成就定义
 *   window.eoAch.byId('first_login')    取单个定义
 *   window.eoAch.unlockedCount()        已解锁数量
 *   window.eoAch.slotOrder()            读取用户自定义的背包槽位顺序：(id|null)[GRID_SIZE]
 *   window.eoAch.setSlotOrder(arr)      持久化槽位顺序
 *   window.eoAch.swapSlots(i, j)        交换两个槽位的 id（用于拖拽）
 *   window.eoAch.gridSize               背包格子数（固定 12）
 *
 * 存储：
 *   eo_achievements_v1   已解锁记录：{ id: { at: '<iso>' } }
 *   eo_ach_slots_v1      槽位顺序：(id|null)[12]
 *
 * 事件：
 *   'eo:achievement-unlocked'  成就解锁（detail = 定义）
 *   'eo:achievement-layout'    背包布局变化（detail = { reason: 'unlock'|'swap' }）
 */
(function () {
  if (typeof window === 'undefined') return;
  if (window.eoAch) return;

  var ACH_KEY = 'eo_achievements_v1';
  var SLOT_KEY = 'eo_ach_slots_v1';

  /* 成就属于账号资产，不是游客浏览器彩蛋。游客只看成就目录，不能读取上一位
     玩家数据，也不能产生稍后会被补同步的本地解锁。 */
  function isAuthenticated() {
    try {
      if (window.EOSession && typeof window.EOSession.isAuthenticated === 'function') {
        return !!window.EOSession.isAuthenticated();
      }
      return !!localStorage.getItem('eo_access_token');
    } catch (e) { return false; }
  }

  var CATALOG = [
    /* ─── 出生 & 首次接触 ─── */
    { id: 'first_intercept', icon: '⌖',  name: 'AUTH · 拦截通过',        desc: '您成功通过了出生拦截。',                color: 'green', howTo: '在「出生拦截」页用账号/验证码完成登录。' },
    { id: 'first_login',     icon: '〇', name: 'INITIALIZED · 已出生',  desc: '您完成了角色档案 · 这局开始。',          color: 'rust',  howTo: '在「角色档案」页完成注册并进入个人主页。' },

    /* ─── 内容互动 ─── */
    { id: 'first_news_read', icon: 'ⓘ',  name: 'INFORMED · 知情玩家',    desc: '您看了一篇官方新闻。',                  color: 'rust',  howTo: '从「新闻」列表里打开任意一篇详情读完。' },
    { id: 'first_favorite',  icon: '♥',  name: 'COLLECTOR · 收藏家',     desc: '您学会了"留着这个"。',                  color: 'amber', howTo: '在任意页面点亮第一个「收藏」按钮。' },
    { id: 'first_review',    icon: '★',  name: 'CRITIC · 评价员',        desc: '您给本服打了第一个分。',                color: 'amber', howTo: '在「评价」页发表任意一条玩家评价。' },
    { id: 'first_post',      icon: '✎',  name: 'VOICE · 我有话说',       desc: '您在玩家社区留下了第一句话。',          color: 'green', howTo: '在「玩家社区」发布任意类型的帖子（攻略/日志/BUG）。' },
    { id: 'first_bug',       icon: '⚠',  name: 'QA · BUG 上报者',        desc: '您不只是玩家，也是地球的 QA。',         color: 'amber', howTo: '在「玩家社区」提交一条 BUG 反馈帖。' },
    { id: 'first_bounty',    icon: '⚐',  name: 'HUNTER · 发悬赏',        desc: '您雇了别人帮您过一关。',                color: 'rust',  howTo: '在「悬赏」页发布一条悬赏。' },

    /* ─── 个人成长 ─── */
    { id: 'first_main_task', icon: '⚒',  name: 'PLANNER · 主线规划师',   desc: '您给自己定了一个目标。',                color: 'amber', howTo: '在「任务」页新建一条主线任务。' },
    { id: 'first_daily',     icon: '✓',  name: 'DAILY · 签到机器',       desc: '完成第一个今日委托。',                  color: 'green', howTo: '在「任务」页完成任意一条今日委托。' },
    { id: 'first_avatar',    icon: '◐',  name: 'IDENTITY · 我有脸了',    desc: '您给自己上传了一张头像。',              color: 'green', howTo: '在「角色档案」编辑器里上传或选一张头像。' },
    { id: 'first_nickname',  icon: '✑',  name: 'IDENTITY · 改名换姓',    desc: '您给自己换了个名字。',                  color: 'rust',  howTo: '在「角色档案」修改昵称并保存。' },

    /* ─── 沟通触达 ─── */
    { id: 'first_contact',   icon: '✉',  name: 'CONTACT · 联系官方',     desc: '您找到了联系官方的入口。',              color: 'amber', howTo: '在「联系我们」页复制官方邮箱地址。' },
    { id: 'first_dream',     icon: '☆',  name: 'INVESTOR · 小股东',      desc: '您查看了 ETO 共投资本投资组合。',       color: 'green', howTo: '访问「ETO共投资本」页查看投资组合。' },
    { id: 'first_aid',       icon: '⊕',  name: 'AID · 申请援助',         desc: '您勇敢地为自己/他人申请了一次援助。',   color: 'rust',  howTo: '在「援助申请」页提交一份申请。' },

    /* ─── 连签里程碑 ─── */
    { id: 'streak_7',        icon: '7',  name: 'STREAK · 有点意思',      desc: '连签 7 天 · 您是真在玩。',              color: 'amber', howTo: '连续 7 天完成今日委托（断签会重置）。' },
    { id: 'streak_30',       icon: '30', name: 'STREAK · 认真活着',      desc: '连签 30 天 · 这才是版本玩家。',         color: 'rust',  howTo: '连续 30 天完成今日委托（不能断）。' },
    { id: 'streak_100',      icon: '100',name: 'STREAK · 版本黑铁',      desc: '连签 100 天 · 您不下线了。',            color: 'rust',  howTo: '连续 100 天完成今日委托。神秘大佬级别。' },

    /* ─── 时间触发彩蛋 ─── */
    { id: 'night_owl',       icon: '☾',  name: 'OWL · 夜猫子',           desc: '您在凌晨 2-4 点访问了本服。',           color: 'amber', howTo: '凌晨 2:00 - 4:00 之间访问任意页面。' },
    { id: 'early_bird',      icon: '☀',  name: 'BIRD · 早起鸟',          desc: '您在清晨 5-7 点访问了本服。',           color: 'green', howTo: '清晨 5:00 - 7:00 之间访问任意页面。' },
    { id: 'weekend_warrior', icon: '⚔',  name: 'WEEKEND · 周末斗士',     desc: '您选择在周末也来推进任务。',            color: 'rust',  howTo: '在周六或周日完成任意一条今日委托。' },

    /* ─── 数量里程碑（预留触发点） ─── */
    { id: 'favorites_10',    icon: '♥10', name: 'COLLECTOR · 集邮十连',  desc: '收藏 10 个内容 · 您是个真用户。',       color: 'amber', howTo: '累计收藏 10 个不同的内容（新闻/评价/帖子等）。' },
    { id: 'daily_30',        icon: '✓30',name: 'GRINDER · 委托三十',     desc: '累计完成 30 个委托（不要求连续）。',    color: 'rust',  howTo: '累计完成 30 个今日委托。可以断签。' },

    /* ─── 组队大厅 ─── */
    { id: 'party_create',    icon: '⚇',  name: 'PARTY · 队长',           desc: '您创建了第一个队伍。',                  color: 'green', howTo: '在「组队大厅」创建一个新队伍。' },
    { id: 'party_done',      icon: '⚈',  name: 'PARTY · 成行',           desc: '您的队伍凑齐了人，准备出发。',          color: 'rust',  howTo: '队伍成员全部凑齐，准备线下活动。' },

    /* ─── 商城 ─── */
    { id: 'first_order',     icon: '◈',  name: 'SHOPPER · 首单',         desc: '您在商城下了第一笔订单。',              color: 'amber', howTo: '在「商城」完成任意一笔订单。' },

    /* ─── 能工智人 ─── */
    { id: 'first_artisan',   icon: '⬡',  name: 'ARTISAN · 雇佣',        desc: '您第一次雇了能工智人帮您办事。',        color: 'green', howTo: '在「能工智人」页面成功发起一笔委托。' },

    /* ─── 世界任务 ─── */
    { id: 'first_world_quest', icon: '◉',name: 'QUEST · 世界行者',       desc: '您参与了一次世界任务。',                color: 'rust',  howTo: '在「世界任务」页面完成一条世界任务。' }
  ];

  /* 网格容量 = catalog 长度（用户可拖动到任何一格） */
  var GRID_SIZE = CATALOG.length;

  function readMap() {
    if (!isAuthenticated()) return {};
    try {
      var raw = localStorage.getItem(ACH_KEY);
      var m = raw ? JSON.parse(raw) : null;
      return (m && typeof m === 'object') ? m : {};
    } catch (e) { return {}; }
  }
  function writeMap(m) {
    if (!isAuthenticated()) return false;
    try { localStorage.setItem(ACH_KEY, JSON.stringify(m)); } catch (e) { }
    return true;
  }

  function readSlots() {
    if (!isAuthenticated()) return new Array(GRID_SIZE).fill(null);
    try {
      var raw = localStorage.getItem(SLOT_KEY);
      var arr = raw ? JSON.parse(raw) : null;
      if (!Array.isArray(arr)) arr = [];
      while (arr.length < GRID_SIZE) arr.push(null);
      arr.length = GRID_SIZE;
      return arr;
    } catch (e) {
      return new Array(GRID_SIZE).fill(null);
    }
  }
  function writeSlots(arr) {
    if (!isAuthenticated()) return false;
    try { localStorage.setItem(SLOT_KEY, JSON.stringify(arr.slice(0, GRID_SIZE))); } catch (e) { }
    return true;
  }

  function byId(id) {
    for (var i = 0; i < CATALOG.length; i++) if (CATALOG[i].id === id) return CATALOG[i];
    return null;
  }
  function has(id) { return !!readMap()[id]; }
  function list() {
    var m = readMap();
    var arr = Object.keys(m).map(function (id) {
      var def = byId(id);
      if (!def) return null;
      return Object.assign({ at: m[id] && m[id].at }, def);
    }).filter(Boolean);
    arr.sort(function (a, b) { return (b.at || '').localeCompare(a.at || ''); });
    return arr;
  }
  function unlockedCount() { return Object.keys(readMap()).length; }

  /* 修复 slotOrder：去掉已不存在/已删除的 id，给新解锁的找第一个空位 */
  function reconcileSlots() {
    var unlocked = readMap();
    var slots = readSlots();
    /* 去除非法（catalog 不存在或未解锁的）id */
    slots = slots.map(function (id) {
      return (id && unlocked[id] && byId(id)) ? id : null;
    });
    /* 给已解锁但不在 slots 的，按 catalog 顺序找第一个 null 槽位填入 */
    CATALOG.forEach(function (def) {
      if (!unlocked[def.id]) return;
      if (slots.indexOf(def.id) !== -1) return;
      var idx = slots.indexOf(null);
      if (idx >= 0) slots[idx] = def.id;
    });
    writeSlots(slots);
    return slots;
  }

  function slotOrder() { return reconcileSlots(); }
  function setSlotOrder(arr) {
    if (!isAuthenticated() || !Array.isArray(arr)) return;
    writeSlots(arr.slice(0, GRID_SIZE));
    try { window.dispatchEvent(new CustomEvent('eo:achievement-layout', { detail: { reason: 'reorder' } })); } catch (e) { }
  }
  function swapSlots(i, j) {
    if (!isAuthenticated()) return false;
    if (i === j || i < 0 || j < 0 || i >= GRID_SIZE || j >= GRID_SIZE) return false;
    var slots = readSlots();
    var tmp = slots[i]; slots[i] = slots[j]; slots[j] = tmp;
    writeSlots(slots);
    if (window.eoProgress) window.eoProgress.patch({ achSlots: slots });
    try { window.dispatchEvent(new CustomEvent('eo:achievement-layout', { detail: { reason: 'swap', from: i, to: j } })); } catch (e) { }
    return true;
  }

  var pendingVerification = {};
  var verificationInFlight = null;
  function unlock(id) {
    if (!isAuthenticated()) return false;
    var def = byId(id);
    if (!def) { console.warn('[eoAch] unknown id:', id); return false; }
    if (readMap()[id] || !window.eoProgress || typeof window.eoProgress.load !== 'function') return false;

    /* 客户端只提出“重新核对”请求，不再写成就或上传 achievements。GET /me/progress
       会根据服务端业务事实返回已验证成就；只有回填后才弹出解锁提示。 */
    pendingVerification[id] = def;
    if (!verificationInFlight) {
      verificationInFlight = Promise.resolve(window.eoProgress.load()).then(function () {
        var verified = readMap();
        Object.keys(pendingVerification).forEach(function (pendingId) {
          var pendingDef = pendingVerification[pendingId];
          if (!verified[pendingId]) return;
          queuePopup(pendingDef);
          try {
            window.dispatchEvent(new CustomEvent('eo:achievement-unlocked', { detail: pendingDef }));
            window.dispatchEvent(new CustomEvent('eo:achievement-layout', { detail: { reason: 'unlock', id: pendingId } }));
          } catch (e) { }
        });
      }).catch(function () {}).then(function () {
        pendingVerification = {};
        verificationInFlight = null;
      });
    }
    return false;
  }

  /* ──────── Steam 风格解锁弹窗（排队，一次一个）──────── */
  var popupQueue = [];
  var popupActive = false;

  function ensurePopupHost() {
    var host = document.getElementById('eo-ach-popup-host');
    if (host) return host;
    host = document.createElement('div');
    host.id = 'eo-ach-popup-host';
    host.className = 'eo-ach-popup-host';
    document.body.appendChild(host);
    return host;
  }

  function queuePopup(def) {
    if (!document || !document.body) {
      document.addEventListener('DOMContentLoaded', function () { queuePopup(def); });
      return;
    }
    popupQueue.push(def);
    drainPopup();
  }

  function drainPopup() {
    if (popupActive) return;
    var def = popupQueue.shift();
    if (!def) return;
    popupActive = true;
    showPopup(def, function () {
      popupActive = false;
      setTimeout(drainPopup, 240); /* 弹下一条前留点喘息 */
    });
  }

  function showPopup(def, onDone) {
    var host = ensurePopupHost();
    var node = document.createElement('div');
    node.className = 'eo-ach-popup color-' + (def.color || 'rust');
    /* 成就（有 id）用 WebP 徽章图，奖励弹窗保持 unicode 图标 */
    var iconHtml = def.id
      ? '<img class="eo-ach-popup-icon-img" src="assets/achievements/ach-' + def.id + '.webp" alt=""'
        + ' onerror="this.style.display=\'none\';this.insertAdjacentHTML(\'afterend\',\'<span class=eo-ach-popup-icon>' + def.icon + '</span>\');" />'
      : '<div class="eo-ach-popup-icon">' + def.icon + '</div>';
    node.innerHTML = ''
      + '<div class="eo-ach-popup-glow"></div>'
      + '<div class="eo-ach-popup-icon-wrap">'
      +   iconHtml
      +   '<div class="eo-ach-popup-sheen"></div>'
      +   '<div class="eo-ach-popup-ring"></div>'
      + '</div>'
      + '<div class="eo-ach-popup-body">'
      +   '<span class="eo-ach-popup-kicker">' + (def.kicker || 'ACHIEVEMENT UNLOCKED · 成就解锁') + '</span>'
      +   '<strong class="eo-ach-popup-name">' + def.name + '</strong>'
      +   '<span class="eo-ach-popup-desc">' + def.desc + '</span>'
      + '</div>';
    host.appendChild(node);

    /* 入场：next frame 加 is-in 触发 transition */
    requestAnimationFrame(function () {
      node.classList.add('is-in');
      /* 闪光扫描在 is-in 后启动 */
      requestAnimationFrame(function () { node.classList.add('is-shining'); });
    });

    /* 停留 2.8s 后开始退场 */
    var stay = 2800;
    setTimeout(function () {
      node.classList.remove('is-in');
      node.classList.add('is-out');
      setTimeout(function () {
        if (node.parentNode) node.parentNode.removeChild(node);
        if (typeof onDone === 'function') onDone();
      }, 480);
    }, stay);
  }

  /* 通用奖励弹窗：复用成就弹窗特效，但不写入成就档案（用于"获得货币"等即时反馈）
     opts = { icon, name, desc, color, kicker } */
  function reward(opts) {
    if (!isAuthenticated() || !opts || !opts.name) return;
    queuePopup({
      icon: opts.icon || '✦',
      name: opts.name,
      desc: opts.desc || '',
      color: opts.color || 'amber',
      kicker: opts.kicker || 'REWARD · 奖励到账',
    });
  }

  window.eoAch = {
    unlock: unlock,
    reward: reward,
    has: has,
    list: list,
    catalog: function () { return CATALOG.slice(); },
    byId: byId,
    unlockedCount: unlockedCount,
    slotOrder: slotOrder,
    setSlotOrder: setSlotOrder,
    swapSlots: swapSlots,
    gridSize: GRID_SIZE
  };
})();
