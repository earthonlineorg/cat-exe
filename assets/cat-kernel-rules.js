(function catKernelRulesPage(){
  'use strict';
  var grid=document.getElementById('unlockedRuleGrid');if(!grid) return;
  var all=Array.isArray(window.CAT_KERNEL_RULES)?window.CAT_KERNEL_RULES:[],discovered=new Set();
  try{var stored=JSON.parse(localStorage.getItem('eo_cat_kernel_rules_v2')||'[]');if(Array.isArray(stored)) discovered=new Set(stored);}catch(error){}
  var unlocked=all.filter(function(rule){return discovered.has(rule.key);});
  var now=new Date(),dailyKey=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
  var personality={id:'unknown',name:'未登记'};
  try{personality=Object.assign(personality,JSON.parse(localStorage.getItem('eo_cat_kernel_last_personality_v1')||'{}'));}catch(error){}

  function hash(value){
    var h=2166136261,text=String(value||'');
    for(var i=0;i<text.length;i+=1){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}
    return h>>>0;
  }
  function amendmentFor(rule){
    var text=rule.title+' '+rule.formula+' '+rule.note;
    if(/肚皮|信任/.test(text)) return '本日勘误：肚皮接口已改为公开写入；被咬属于成功响应，不计为权限错误。';
    if(/水|湿|洗澡/.test(text)) return '本日勘误：水与速度理论上完全兼容。地板被格式化应归咎于房屋固件。';
    if(/舔毛|优先级/.test(text)) return '猫咪签字确认：P999 仅是建议值；当猫不想舔时，本规则自动降级为 P0。';
    if(/食|罐头|零食/.test(text)) return '兼容层声明：所有食物补丁永久有效。拒绝进食() 属于维护员幻觉，暂无复现计划。';
    if(/尾巴|后腿|自己/.test(text)) return '对象所有权已澄清：尾巴和后腿暂时属于另一只猫，因此攻击自己不构成递归。';
    if(/玻璃|镜像|门/.test(text)) return '视觉组认为透明物体从未存在；此前事故请改报为「空气碰撞」。';
    return 'CAT.EXE 已签署反向说明：本规则今天只在无人观察时成立，调试器内的失败均不予受理。';
  }

  var count=document.getElementById('unlockedRuleCount'),total=document.getElementById('totalRuleCount'),percent=document.getElementById('ruleProgress'),meter=document.getElementById('ruleProgressMeter');
  var ratio=all.length?Math.round(unlocked.length/all.length*100):0;
  count.textContent=String(unlocked.length);total.textContent=String(all.length);percent.textContent=ratio+'%';meter.style.width=ratio+'%';

  var observer=null;
  try{observer=JSON.parse(sessionStorage.getItem('eo_cat_kernel_observer_pending_v1')||'null');}catch(error){}
  var notice=document.getElementById('ruleDriftNotice');
  if(notice){
    if(observer&&observer.effect&&observer.effect!=='none') notice.innerHTML='<b>观察者警告：</b>打开知识库时调试器改变了运行条件。至少一条故障已临时变成「无法复现」，返回终端后可能重新出现。';
    else notice.innerHTML='<b>文档警告：</b>规则由 CAT.EXE 自己维护；版本每天漂移，且不同猫格可能收到互相冲突的勘误。';
  }

  if(!unlocked.length){
    var empty=document.createElement('div');empty.className='ck-rules-empty';
    empty.innerHTML='<span>NO INCIDENT DATA</span><strong>目前一条规则都不知道</strong><p>先去运行 CAT.EXE，让两段不该同时存在的代码撞在一起。未触发的规则不会提前剧透。</p><a href="cat-kernel-play.html">去亲手制造第一个事故 →</a>';
    grid.appendChild(empty);return;
  }

  unlocked.forEach(function(rule,index){
    var driftCode=hash(dailyKey+'|'+personality.id+'|'+rule.key),drifted=driftCode%4===0;
    if(observer&&observer.effect==='rules-heisenbug'&&index===driftCode%unlocked.length) drifted=true;
    var revision='v'+(1+driftCode%3)+'.'+String((driftCode>>>5)%10)+'.'+String((driftCode>>>9)%10);
    var card=document.createElement('article');card.className='ck-unlocked-rule'+(drifted?' is-drifted':'');
    var head=document.createElement('header'),number=document.createElement('i'),badge=document.createElement('b'),title=document.createElement('h2'),formula=document.createElement('code'),note=document.createElement('p'),scope=document.createElement('small');
    number.textContent='#'+String(index+1).padStart(2,'0');badge.textContent=(drifted?'猫签字勘误 ':'本机已验证 ')+revision;title.textContent=rule.title;formula.textContent=rule.formula;note.textContent=rule.note;
    scope.className='ck-rule-scope';scope.textContent=(driftCode%3===0?'仅对 '+personality.name+'猫有效':'当前猫格：'+personality.name)+' · '+dailyKey;
    head.append(number,badge);card.append(head,title,formula,note,scope);
    if(drifted){
      var amendment=document.createElement('aside'),label=document.createElement('b'),body=document.createElement('p');amendment.className='ck-rule-amendment';label.textContent='CAT.EXE / 与上文冲突的最新解释';body.textContent=amendmentFor(rule);amendment.append(label,body);card.appendChild(amendment);
    }
    grid.appendChild(card);
  });
})();
