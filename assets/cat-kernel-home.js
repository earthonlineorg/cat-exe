(function catKernelHome(){
  'use strict';
  var list=document.getElementById('rankingList');if(!list) return;
  var bestNode=document.getElementById('rankingBest'),playersNode=document.getElementById('rankingPlayers'),submissionsNode=document.getElementById('rankingSubmissions'),seedNode=document.getElementById('rankingSeed'),yesterdayBestNode=document.getElementById('rankingYesterdayBest'),scopeNode=document.getElementById('rankingScopeLabel'),statusNode=document.getElementById('rankingStatus'),updatedNode=document.getElementById('rankingUpdated');
  var tabs=[].slice.call(document.querySelectorAll('[data-ranking-day]'));
  var GUEST_KEY='eo_cat_kernel_guest_id_v1',today=dayKey(),yesterday=shiftDay(today,-1),activeDay='today',payloads={today:null,yesterday:null};

  function format(seconds){seconds=Math.max(0,Math.floor(Number(seconds)||0));return String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');}
  function dayKey(){try{var parts=new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()),map={};parts.forEach(function(part){map[part.type]=part.value;});return map.year+'-'+map.month+'-'+map.day;}catch(error){return new Date().toISOString().slice(0,10);}}
  function shiftDay(day,offset){var parts=day.split('-').map(Number),stamp=Date.UTC(parts[0],parts[1]-1,parts[2]+offset,0,0,0)-8*60*60*1000;try{var bits=new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(stamp)),map={};bits.forEach(function(part){map[part.type]=part.value;});return map.year+'-'+map.month+'-'+map.day;}catch(error){return new Date(stamp).toISOString().slice(0,10);}}
  function guestIdentity(){
    try{
      var existing=localStorage.getItem(GUEST_KEY);if(existing) return existing;
      var id='';
      if(window.crypto&&typeof window.crypto.randomUUID==='function') id=window.crypto.randomUUID();
      else id='xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(char){var value=Math.floor(Math.random()*16);return (char==='x'?value:(value&3)|8).toString(16);});
      localStorage.setItem(GUEST_KEY,id);return id;
    }catch(error){return '00000000-0000-4000-8000-000000000001';}
  }
  function apiBase(){
    try{
      if(window.EOSession&&typeof window.EOSession.apiBase==='function') return window.EOSession.apiBase();
      return (window.EO_API_BASE||localStorage.getItem('eo_api_base')||((location.protocol==='file:'||/^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/.test(location.hostname))?'http://localhost:3000':'')).replace(/\/+$/,'');
    }catch(error){return '';}
  }
  function sender(){
    if(window.EOSession&&typeof window.EOSession.fetch==='function') return window.EOSession.fetch;
    if(typeof window.fetch==='function') return window.fetch.bind(window);
    return null;
  }
  function setStatus(text,state){if(!statusNode)return;statusNode.textContent=text;statusNode.dataset.state=state||'';}
  function createRow(entry,index){
    var item=document.createElement('li');if(entry.isMine)item.className='is-local';if(entry.empty)item.className='is-empty';
    var rank=document.createElement('i'),copy=document.createElement('div'),name=document.createElement('b'),cause=document.createElement('small'),score=document.createElement('strong');
    rank.textContent=entry.empty?'--':'#'+String(entry.rank||index+1).padStart(2,'0');name.textContent=entry.name;cause.textContent=entry.detail||entry.cause||'未留下死因';score.textContent=entry.seconds?format(entry.seconds):'--:--';
    copy.append(name,cause);item.append(rank,copy,score);return item;
  }
  function renderRows(entries){list.textContent='';entries.forEach(function(entry,index){list.appendChild(createRow(entry,index));});}
  function setTab(day){
    activeDay=day;
    tabs.forEach(function(tab){var selected=tab.dataset.rankingDay===day;tab.classList.toggle('is-active',selected);tab.setAttribute('aria-selected',selected?'true':'false');});
  }
  function showDay(day){
    setTab(day);
    var payload=payloads[day],entries=payload&&Array.isArray(payload.data)?payload.data:[],summary=payload&&payload.summary||{};
    if(scopeNode)scopeNode.textContent=day==='today'?'全服今日最佳':'全服昨日最佳';
    if(bestNode)bestNode.textContent=format(summary.bestSeconds||0);
    if(playersNode)playersNode.textContent=String(summary.players||payload&&payload.total||entries.length||0);
    if(submissionsNode)submissionsNode.textContent=String(summary.submissions||0);
    if(seedNode)seedNode.textContent=payload&&payload.seed||'CAT-DAILY';
    if(updatedNode)updatedNode.textContent=day==='today'?'每日 00:00 更新 · 仅保留两天':'昨日快照 · 今日 00:00 已更新';
    if(!payload){renderRows([{empty:true,name:'全服榜暂时离线',detail:'服务器没有返回这一天的榜单'}]);return;}
    if(!entries.length){renderRows([{empty:true,name:day==='today'?'今日还没有人上榜':'昨日没有留下榜单',detail:'第一只完成宕机结算的猫会自动占领 #01'}]);return;}
    renderRows(entries.map(function(entry){return {rank:entry.rank,name:entry.name,seconds:entry.seconds,isMine:entry.isMine,detail:(entry.deathTitle?'称号：'+entry.deathTitle+' · ':'')+(entry.cause||'死因未归档')};}));
  }
  function fetchDay(fetcher,label,day){
    return fetcher(apiBase()+'/cat-kernel/leaderboard?day='+encodeURIComponent(day)+'&limit=10&guestId='+encodeURIComponent(guestIdentity()),{headers:{Accept:'application/json'}})
      .then(function(response){if(!response.ok)throw new Error('leaderboard '+response.status);return response.json();})
      .then(function(payload){payloads[label]=payload;return payload;});
  }

  tabs.forEach(function(tab){tab.addEventListener('click',function(){showDay(tab.dataset.rankingDay);});});
  setStatus('正在连接全服榜','loading');
  renderRows([{empty:true,name:'正在读取全服排行榜…',detail:'服务器正在清点今日与昨日的猫'}]);
  var fetcher=sender();
  if(!fetcher){setStatus('服务器离线 · 榜单不可用','offline');showDay(activeDay);return;}
  Promise.all([fetchDay(fetcher,'today',today),fetchDay(fetcher,'yesterday',yesterday)])
    .then(function(){
      setStatus('全服实时 · 两日榜','online');
      if(yesterdayBestNode)yesterdayBestNode.textContent=format(payloads.yesterday&&payloads.yesterday.summary&&payloads.yesterday.summary.bestSeconds||0);
      showDay(activeDay);
    })
    .catch(function(){
      setStatus('服务器离线 · 榜单不可用','offline');
      showDay(activeDay);
    });
})();
