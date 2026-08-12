(function catKernel(){
  'use strict';

  var COMMANDS = {
    'treat.feed': {
      id:'treat.feed', code:'投喂零食()', lane:'身体', priority:95, duration:5600, pose:'eat', visual:'food', category:'基础', description:'高价值数据包，可打断多数身体动作。',
      message:'收到高价值食物数据包。其他身体任务暂停。', effect:{ affinity:8, chaos:-6, stability:4 }
    },
    'box.mount': {
      id:'box.mount', code:'装载纸箱()', lane:'领地', priority:76, duration:9200, pose:'box', visual:'box', category:'基础', description:'建立纸箱安全区，并自动触发哈气警告。',
      message:'纸箱文件系统挂载成功。所有权自动归猫。', effect:{ affinity:3, chaos:-10, stability:6 }
    },
    'laser.track': {
      id:'laser.track', code:'追踪红点()', lane:'注意力', priority:72, duration:5900, pose:'laser', visual:'laser', category:'动作', description:'锁定一个永远无法捕获的目标。',
      message:'发现无法捕获的红色指针。必须追。', effect:{ affinity:2, chaos:15, stability:-2 }
    },
    'pet.head': {
      id:'pet.head', code:'轻摸脑壳()', lane:'情绪', priority:44, duration:5200, pose:'purr', category:'基础', description:'访问相对安全的触摸区域。',
      message:'触摸区域合法。临时提升人类权限。', effect:{ affinity:9, chaos:-7, stability:4 }
    },
    'pspsps.broadcast': {
      id:'pspsps.broadcast', code:'呼叫猫咪()', lane:'注意力', priority:12, duration:3000, pose:'watch', category:'基础', description:'向猫咪广播 pspsps，成功率玄学。',
      message:'收到来源不明的人类广播，正在评估是否值得响应。', effect:{ affinity:0, chaos:1, stability:0 }
    },
    'foreign.place': {
      id:'foreign.place', code:'检测头顶异物()', lane:'身体', priority:88, duration:Infinity, pose:'groom-loop', visual:'foreign', loop:true, category:'感知监测', description:'头顶触觉传感器发现异物，触发抬爪、误舔、重新检测的经典死循环。',
      message:'检测到头顶异物。进入自动清除流程。', effect:{ affinity:-1, chaos:8, stability:-2 }
    },
    'catnip.load': {
      id:'catnip.load', code:'加载猫薄荷()', lane:'情绪', priority:82, duration:7300, pose:'zoom', category:'危险', risk:true, description:'未经审核的第三方兴奋依赖。',
      message:'已加载未经审核的第三方依赖：猫薄荷。', effect:{ affinity:7, chaos:24, stability:-5 }
    },
    'vacuum.start': {
      id:'vacuum.start', code:'启动吸尘器()', lane:'环境', priority:98, duration:6500, pose:'angry', visual:'vacuum', category:'危险', risk:true, description:'天敌级噪声设备，会破坏多条规则。',
      message:'检测到天敌级噪声。所有信任缓存失效。', effect:{ affinity:-12, chaos:27, stability:-13 }
    },
    'belly.patch': {
      id:'belly.patch', code:'触摸肚皮()', lane:'情绪', priority:67, duration:4700, pose:'belly', category:'危险', risk:true, description:'看似开放，实际是信任系统蜜罐。',
      message:'警告：正在访问未公开的肚皮接口。', effect:{ affinity:4, chaos:9, stability:-1 }
    },
    'bath.force': {
      id:'bath.force', code:'强制洗澡()', lane:'环境', priority:99, duration:7100, pose:'wet', visual:'water', category:'危险', risk:true, description:'未经授权的液体部署，极高风险。',
      message:'未经授权的液体部署。正在永久记录人类罪行。', effect:{ affinity:-18, chaos:32, stability:-17 }
    },
    'groom.manual': {
      id:'groom.manual', code:'舔毛()', lane:'全局', priority:999, duration:6800, pose:'groom', exclusive:true, category:'自维护', description:'全局最高优先级。可由猫咪自行触发，立刻打断并覆盖所有动作。',
      message:'舔毛最高优先级已接管全部身体资源。', effect:{ affinity:2, chaos:-8, stability:5 }
    },
    'hiss.warn': {
      id:'hiss.warn', code:'哈气警告()', lane:'声音', priority:97, duration:2600, pose:'hiss', visual:'hiss', visualOverride:true, category:'动作', description:'进入凶猫模式，警告所有靠近者。',
      message:'哈——！当前资源受猫咪武装保护。', effect:{ affinity:-2, chaos:7, stability:-1 }
    },
    'tail.swish': {
      id:'tail.swish', code:'高速摇尾巴()', lane:'尾巴', priority:42, duration:7200, pose:'tail', visual:'tail', category:'动作', description:'独立占用尾巴线程，可与其他动作并行。',
      message:'尾巴线程进入高频摆动。', effect:{ affinity:0, chaos:4, stability:0 }
    },
    'knead.blanket': {
      id:'knead.blanket', code:'对空气踩奶()', lane:'前爪', priority:64, duration:7600, pose:'knead', category:'动作', description:'两只前爪交替写入一个不存在的毯子。',
      message:'前爪开始执行周期性踩奶。', effect:{ affinity:6, chaos:-3, stability:3 }
    },
    'blanket.hide': {
      id:'blanket.hide', code:'钻入被窝()', lane:'领地', priority:81, duration:8800, pose:'box', visual:'box', category:'动作', description:'将被窝挂载为临时隐身文件系统。',
      message:'猫咪已进入不可观测的被窝命名空间。', effect:{ affinity:3, chaos:-6, stability:4 }
    },
    'drink.glass': {
      id:'drink.glass', code:'偷喝杯中水()', lane:'饮水', priority:56, duration:6100, pose:'drink', visual:'glass', category:'动作', description:'无视自己的水碗，读取人类杯子。',
      message:'你的水看起来比猫碗里的更新鲜。', effect:{ affinity:1, chaos:2, stability:1 }
    },
    'keyboard.claim': {
      id:'keyboard.claim', code:'占领键盘()', lane:'领地', priority:68, duration:8200, pose:'keyboard', visual:'keyboard', category:'动作', description:'把生产力设备转换为恒温猫垫。',
      message:'键盘已被重定义为猫咪输入设备。', effect:{ affinity:2, chaos:-3, stability:2 }
    },
    'ghost.inspect': {
      id:'ghost.inspect', code:'捕捉空气()', lane:'注意力', priority:62, duration:6800, pose:'ghost', visual:'ghost', category:'感知监测', description:'与人类不可见进程进行交互。',
      message:'空气里绝对有东西。只是你看不见。', effect:{ affinity:0, chaos:6, stability:-1 }
    },
    'belly.roll': {
      id:'belly.roll', code:'翻滚露肚()', lane:'身体', priority:59, duration:5400, pose:'belly', category:'动作', description:'展示肚皮，但不自动授权触摸。',
      message:'肚皮已展示。权限仍然是只读。', effect:{ affinity:4, chaos:-2, stability:2 }
    },
    'human.watch': {
      id:'human.watch', code:'观察人类()', lane:'注意力', priority:45, duration:7400, pose:'watch', category:'感知监测', description:'安静观察维护员是否值得信任。',
      message:'猫咪正在反向评估你的行为。', effect:{ affinity:2, chaos:-2, stability:1 }
    },
    'purr.daemon': {
      id:'purr.daemon', code:'启动呼噜声()', lane:'情绪', priority:36, duration:7800, pose:'purr', visual:'purr', category:'基础', description:'启动低频呼噜守护进程。',
      message:'低频守护进程运行正常。', effect:{ affinity:5, chaos:-5, stability:4 }
    },
    'meow.wake': {
      id:'meow.wake', code:'大声喵叫()', lane:'声音', priority:79, duration:4300, pose:'meow', visual:'meow', category:'动作', description:'向整个房间广播高音量需求。',
      message:'喵——！需求内容未随广播附带。', effect:{ affinity:0, chaos:7, stability:-1 }
    },
    'push.glass': {
      id:'push.glass', code:'敲落杯子()', lane:'注意力', priority:74, duration:4300, pose:'push', visual:'glass', category:'危险', risk:true, chain:{id:'spill.stress',delay:760,chance:.55}, description:'再次验证重力常量是否发生变化；水溅到自己时可能继续扩大事故。',
      message:'杯子重力单元测试开始。', effect:{ affinity:-1, chaos:10, stability:-3 }
    },
    'zoomies.turbo': {
      id:'zoomies.turbo', code:'启动凌晨疯跑()', lane:'身体', priority:84, duration:5600, pose:'zoom', category:'动作', description:'无理由开启高性能移动模式。',
      message:'凌晨三点高性能模式启动。', effect:{ affinity:1, chaos:19, stability:-5 }
    },
    'sleep.deep': {
      id:'sleep.deep', code:'进入深度睡眠()', lane:'休息', priority:90, duration:9500, pose:'sleep', category:'基础', description:'长期占用休息锁，恢复稳定性。',
      message:'主线程进入深度睡眠。', effect:{ affinity:1, chaos:-9, stability:6 }
    },
    'hairball.gc': {
      id:'hairball.gc', code:'反向垃圾回收()', lane:'身体', priority:96, duration:4700, pose:'hairball', category:'危险', risk:true, description:'从嘴里输出系统垃圾。不要与进食并发。',
      message:'垃圾回收器开始从嘴里输出。', effect:{ affinity:-1, chaos:8, stability:-8 }
    },
    'yarn.attack': {
      id:'yarn.attack', code:'攻击毛线球()', lane:'注意力', priority:69, duration:6700, pose:'laser', visual:'yarn', category:'动作', description:'对可滚动目标执行连续扑击。',
      message:'发现毛线球。捕猎协议已激活。', effect:{ affinity:3, chaos:10, stability:-1 }
    },
    'curtain.climb': {
      id:'curtain.climb', code:'攀爬窗帘()', lane:'身体', priority:86, duration:6400, pose:'climb', category:'危险', risk:true, description:'使用窗帘作为未经认证的垂直地图。',
      message:'正在加载垂直移动模组。窗帘承重未知。', effect:{ affinity:-2, chaos:16, stability:-6 }
    },
    'loaf.mode': {
      id:'loaf.mode', code:'切换香箱模式()', lane:'身体', priority:57, duration:8300, pose:'loaf', category:'基础', description:'收起四肢，降低系统功耗。',
      message:'四肢已成功隐藏，猫咪进入香箱模式。', effect:{ affinity:2, chaos:-7, stability:5 }
    },
    'ear.rotate': {
      id:'ear.rotate', code:'旋转雷达耳()', lane:'耳朵', priority:28, duration:6200, pose:'alert', category:'感知监测', description:'独立监听两个方向，可与身体动作并行。',
      message:'双耳雷达正在扫描附近零食袋。', effect:{ affinity:0, chaos:1, stability:0 }
    },
    'pet.cat': {
      id:'pet.cat', code:'抚摸猫咪()', lane:'情绪', priority:52, duration:3600, pose:'purr', visual:'purr', category:'互动', description:'也可直接点按画面里的猫。连续抚摸会触发隐藏反应。',
      message:'检测到合规抚摸。呼噜引擎正在预热。', effect:{ affinity:6, chaos:-4, stability:3 }
    },
    'chin.scratch': {
      id:'chin.scratch', code:'挠下巴()', lane:'情绪', priority:58, duration:4800, pose:'purr', visual:'purr', category:'互动', description:'访问下巴高信任接口，通常会返回呼噜声。',
      message:'下巴接口响应良好。猫咪正在假装这不是它主动要求的。', effect:{ affinity:9, chaos:-6, stability:4 }
    },
    'butt.pat': {
      id:'butt.pat', code:'轻拍屁股()', lane:'情绪', priority:73, duration:3900, pose:'alert', visual:'tail', category:'互动', risk:true, description:'对后端端口发送重复敲击，可能触发过度刺激中断。',
      message:'后端端口收到拍击。尾巴线程进入高频响应。', effect:{ affinity:3, chaos:12, stability:-2 }
    },
    'can.open': {
      id:'can.open', code:'打开罐头()', lane:'身体', priority:94, duration:6100, pose:'eat', visual:'food', category:'互动', description:'部署高价值湿粮，抢占绝大多数身体任务。',
      message:'罐头密封解除。猫咪已在 0.03 秒内完成权限接管。', effect:{ affinity:12, chaos:-8, stability:5 }
    },
    'snack.shake': {
      id:'snack.shake', code:'摇晃零食袋()', lane:'注意力', priority:80, duration:4700, pose:'alert', category:'互动', description:'发出无法忽略的塑料袋频段，强制刷新注意力。',
      message:'检测到零食袋声纹。所有雷达耳已指向维护员。', effect:{ affinity:5, chaos:5, stability:1 }
    },
    'brush.fur': {
      id:'brush.fur', code:'梳理毛发()', lane:'身体', priority:66, duration:6900, pose:'groom', category:'互动', description:'人工协助维护毛发缓存，但不等于最高优先级舔毛。',
      message:'外部梳毛协处理器已接入。掉毛量仍然不受控制。', effect:{ affinity:8, chaos:-7, stability:5 }
    },
    'door.close': {
      id:'door.close', code:'关闭房门()', lane:'环境', priority:83, duration:7300, pose:'meow', visual:'meow', category:'环境', risk:true, description:'将门设置为关闭态，会生成持续投诉工单。',
      message:'门已关闭。猫咪立刻需要去门的另一边。', effect:{ affinity:-4, chaos:13, stability:-3 }
    },
    'cucumber.place': {
      id:'cucumber.place', code:'静默部署黄瓜()', lane:'注意力', priority:91, duration:4200, pose:'zoom', category:'危险', risk:true, description:'在视觉盲区热部署未知绿色对象。',
      message:'发现未经签名的绿色长条进程。紧急弹射！', effect:{ affinity:-10, chaos:25, stability:-9 }
    },
    'laundry.claim': {
      id:'laundry.claim', code:'占领洗衣篮()', lane:'领地', priority:77, duration:8500, pose:'box', visual:'box', category:'环境', description:'将干净衣物重新编译为高级猫窝。',
      message:'洗衣篮挂载成功。刚洗好的衣服已获得猫毛签名。', effect:{ affinity:4, chaos:-5, stability:4 }
    },
    'ankle.ambush': {
      id:'ankle.ambush', code:'埋伏脚踝()', lane:'注意力', priority:75, duration:5200, pose:'laser', visual:'yarn', category:'动作', risk:true, description:'锁定经过的维护员脚踝，执行低空伏击。',
      message:'移动目标进入走廊。伏击协议等待放行。', effect:{ affinity:1, chaos:14, stability:-4 }
    },
    'face.step': {
      id:'face.step', code:'夜间踩脸()', lane:'前爪', priority:87, duration:5000, pose:'knead', category:'危险', risk:true, description:'在凌晨对人类面部运行唤醒与踩奶混合测试。',
      message:'人类面部被识别为柔软输入设备。', effect:{ affinity:2, chaos:16, stability:-5 }
    },
    'bird.sound': {
      id:'bird.sound', code:'播放鸟叫()', lane:'注意力', priority:71, duration:5700, pose:'alert', category:'互动', description:'向雷达耳注入高价值鸟类音频。',
      message:'鸟类音频命中。瞳孔已扩容，窗口线程正在抢占。', effect:{ affinity:3, chaos:8, stability:0 }
    },
    'cardboard.scratch': {
      id:'cardboard.scratch', code:'抓挠纸板()', lane:'前爪', priority:63, duration:6500, pose:'knead', category:'动作', description:'对纸板执行高频破坏性写入。',
      message:'纸板表面正在接受不可逆格式化。', effect:{ affinity:4, chaos:6, stability:1 }
    },
    'bite.counter': {
      id:'bite.counter', code:'反咬一口()', lane:'防御', priority:98, duration:3100, pose:'hiss', visual:'hiss', visualOverride:true, category:'危险', risk:true, description:'过度刺激后的硬件级中断；也允许玩家主动找咬。',
      message:'抚摸额度耗尽。牙齿协处理器接管交互。', effect:{ affinity:-9, chaos:18, stability:-6 }
    },
    'safe.mode': {
      id:'safe.mode', code:'进入紧急安全模式()', lane:'系统', priority:120, duration:5200, pose:'loaf', category:'紧急修复', rescue:true, description:'猫咪也可能自行按下；宕机倒计时期间可清除冲突线程并保住本次运行。',
      message:'紧急安全模式接管调度。四肢收起，危险线程强制退出。', effect:{ affinity:-1, chaos:-18, stability:12 }
    },
    'emergency.can': {
      id:'emergency.can', code:'部署紧急罐头()', lane:'身体', priority:110, duration:5700, pose:'eat', visual:'food', category:'紧急修复', rescue:true, description:'可被猫咪随机部署的高优先级食物中断，在多数宕机倒计时中完成抢救。',
      message:'紧急罐头覆盖当前执行上下文。先吃饭，屎山稍后再塌。', effect:{ affinity:11, chaos:-12, stability:8 }
    },
    'litter.inspect': {
      id:'litter.inspect', code:'检查猫砂盆()', lane:'嗅觉', priority:38, duration:4300, pose:'sniff', visual:'litter', category:'生存', description:'对本地归档区执行严格的嗅觉完整性检查。',
      message:'猫砂归档区正在接受鼻尖级安全审计。', effect:{ affinity:0, chaos:2, stability:1 }
    },
    'litter.bury': {
      id:'litter.bury', code:'埋屎()', lane:'前爪', priority:74, duration:7200, pose:'bury', visual:'litter', category:'生存', chain:{id:'poop.enemy',delay:980,chance:.38}, description:'以前爪执行反复覆盖操作；偶尔会回头把自己的归档识别为入侵者。',
      message:'敏感数据已写入猫砂，并开始多轮覆盖。', effect:{ affinity:2, chaos:5, stability:3 }
    },
    'hunt.mode': {
      id:'hunt.mode', code:'启动捕猎模式()', lane:'注意力', priority:89, duration:7600, pose:'hunt', visual:'mouse', category:'生存', description:'压低身体、锁定猎物并暂停一切无关眨眼。',
      message:'猎物已锁定。瞳孔扩容，身体进入低延迟伏击姿态。', effect:{ affinity:4, chaos:10, stability:2 }
    },
    'prey.pounce': {
      id:'prey.pounce', code:'飞扑猎物()', lane:'身体', priority:92, duration:4200, pose:'pounce', visual:'mouse', category:'生存', description:'将全部身体资源一次性提交到目标坐标。',
      message:'弹道计算完成。整只猫已经离开地面。', effect:{ affinity:5, chaos:13, stability:-2 }
    },
    'butt.wiggle': {
      id:'butt.wiggle', code:'捕猎前摇屁股()', lane:'尾巴', priority:53, duration:5100, pose:'wiggle', visual:'mouse', category:'生存', description:'起跳前进行完全没有必要但不可省略的后端校准。',
      message:'后端正在左右校准。猎物对此毫无心理准备。', effect:{ affinity:5, chaos:5, stability:2 }
    },
    'bird.stalk': {
      id:'bird.stalk', code:'潜伏观察飞鸟()', lane:'注意力', priority:66, duration:8200, pose:'stalk', visual:'bird', category:'生存', description:'贴地潜伏并将窗外飞鸟写入只读目标缓存。',
      message:'飞鸟进入监视区。猫咪正在以地毯高度秘密前进。', effect:{ affinity:3, chaos:3, stability:3 }
    },
    'window.chirp': {
      id:'window.chirp', code:'启动咔咔叫()', lane:'声音', priority:72, duration:5300, pose:'chirp', visual:'bird', category:'生存', description:'向窗外猎物发送无法解释的牙齿抖动协议。',
      message:'咔、咔咔、咔。鸟类协议握手仍未成功。', effect:{ affinity:4, chaos:7, stability:1 }
    },
    'bag.enter': {
      id:'bag.enter', code:'钻进塑料袋()', lane:'领地', priority:79, duration:7700, pose:'bag', visual:'bag', category:'环境', risk:true, description:'把高噪声低安全性的塑料容器挂载为临时领地。',
      message:'塑料袋领地挂载成功。每次呼吸都会制造施工噪音。', effect:{ affinity:3, chaos:9, stability:-2 }
    },
    'sun.charge': {
      id:'sun.charge', code:'进行太阳能充电()', lane:'休息', priority:61, duration:9400, pose:'sun', visual:'sun', category:'生存', description:'在光斑里摊平身体，以极低效率补充猫咪电量。',
      message:'太阳能腹部面板展开。预计充满时间：下一个季节。', effect:{ affinity:4, chaos:-10, stability:8 }
    },
    'human.follow': {
      id:'human.follow', code:'尾随人类()', lane:'注意力', priority:60, duration:6800, pose:'walk', category:'互动', description:'与人类保持半步距离，并在其突然转身时假装路过。',
      message:'目标人类开始移动。猫咪正在执行非自愿护送。', effect:{ affinity:6, chaos:2, stability:2 }
    },
    'scent.mark': {
      id:'scent.mark', code:'蹭脸标记领地()', lane:'领地', priority:85, duration:5900, pose:'purr', visual:'purr', category:'生存', description:'使用脸颊把当前对象写入“我的东西”命名空间。',
      message:'气味权限写入完成。你和家具现在都属于猫。', effect:{ affinity:8, chaos:-3, stability:4 }
    },
    'midnight.parkour': {
      id:'midnight.parkour', code:'执行午夜跑酷()', lane:'身体', priority:93, duration:6100, pose:'climb', category:'危险', risk:true, description:'在柜顶、窗帘和人类腹部之间计算最吵路线。',
      message:'午夜跑酷路线已生成：落点全部经过易碎物品。', effect:{ affinity:0, chaos:21, stability:-7 }
    },
    'itch.scratch': {
      id:'itch.scratch', code:'抓挠痒处()', lane:'后腿', priority:64, duration:6900, pose:'scratch', category:'案例', chain:{id:'leg.enemy',delay:720}, description:'抓痒时后腿进入脸部视野，可能被误判为正在攻击自己的东西。',
      message:'后腿开始抓痒。视觉系统正在重新分类这条腿。', effect:{affinity:0,chaos:5,stability:0}
    },
    'leg.enemy': {
      id:'leg.enemy', code:'把自己的后腿判定为敌人()', lane:'防御', priority:91, duration:7600, pose:'self-fight', category:'案例', risk:true, description:'脸咬后腿、后腿蹬脸，两个反击程序闭环运行。',
      message:'脸部遭到后腿攻击，后腿同时报告遭到脸部攻击。', effect:{affinity:-2,chaos:19,stability:-7}
    },
    'rear.scan': {
      id:'rear.scan', code:'扫描身后威胁()', lane:'注意力', priority:58, duration:6300, pose:'twist', category:'案例', chain:{id:'neck.overturn',delay:760}, description:'发现身后疑似人类，扭头哈气并持续提高扭转角。',
      message:'身后出现可疑人类。头部旋转限制暂未读取。', effect:{affinity:-1,chaos:7,stability:-1}
    },
    'neck.overturn': {
      id:'neck.overturn', code:'过度扭头触发脖子痒()', lane:'身体', priority:87, duration:7200, pose:'twist-scratch', category:'案例', risk:true, description:'扭头太狠导致脖子痒，后腿抓痒又继续改变扭头角度。',
      message:'颈部旋转过量。后腿抓痒线程已加入姿态计算。', effect:{affinity:0,chaos:14,stability:-5}
    },
    'seizure.random': {
      id:'seizure.random', code:'随机发癫()', lane:'身体', priority:96, duration:6900, pose:'seizure', category:'案例', risk:true, chain:{id:'fur.wet',delay:720}, description:'系统一片混乱，直到毛发意外沾水并触发更高优先级维护。',
      message:'身体各模块开始随机提交动作。调度器已经失去议程。', effect:{affinity:1,chaos:23,stability:-8}
    },
    'fur.wet': {
      id:'fur.wet', code:'检测到毛发沾水()', lane:'环境', priority:84, duration:6100, pose:'wet', visual:'water', category:'案例', chain:{id:'groom.manual',delay:900}, description:'湿毛告警会进一步触发全局最高优先级舔毛代码。',
      message:'毛发湿度异常。正在请求最高优先级自维护。', effect:{affinity:-2,chaos:8,stability:-3}
    },
    'poop.enemy': {
      id:'poop.enemy', code:'把自己的屎识别为入侵者()', lane:'注意力', priority:88, duration:7200, pose:'poop-fight', visual:'litter', category:'案例', risk:true, description:'埋屎后回头发现陌生物体，哈气无效便开始攻击自己的归档。',
      message:'身后突然出现来源不明的屎。气味签名校验已被跳过。', effect:{affinity:-1,chaos:17,stability:-5}
    },
    'truck.scan': {
      id:'truck.scan', code:'扫描经过的泥头车()', lane:'注意力', priority:70, duration:6100, pose:'truck', visual:'wheel', category:'案例', chain:{id:'wheel.hide',delay:760}, description:'威慑泥头车失败后，躲避模块会寻找最近阴影。',
      message:'发现泥头车正在高速接近。哈气威慑效果：0%。', effect:{affinity:-1,chaos:10,stability:-2}
    },
    'wheel.hide': {
      id:'wheel.hide', code:'钻入泥头车阴影()', lane:'领地', priority:93, duration:7800, pose:'wheel-hide', visual:'wheel', category:'案例', risk:true, description:'把泥头车底部误判为最安全的阴暗区域。',
      message:'躲避算法返回：泥头车轮下的阴影最安全。路径规划拒绝进一步解释。', effect:{affinity:-3,chaos:15,stability:-8}
    },
    'net.entangle': {
      id:'net.entangle', code:'被网缠住()', lane:'环境', priority:85, duration:7600, pose:'net', visual:'net', category:'案例', risk:true, chain:{id:'net.attack',delay:720}, description:'网接触身体后自动进入威胁列表。',
      message:'检测到网状约束。攻击距离为零，立即反击。', effect:{affinity:-2,chaos:14,stability:-5}
    },
    'net.attack': {
      id:'net.attack', code:'攻击缠住自己的网()', lane:'前爪', priority:94, duration:7800, pose:'net-fight', visual:'net', category:'案例', risk:true, description:'越攻击越缠紧，越缠紧越确定网正在主动攻击。',
      message:'网的敌意正在随攻击次数上升。该结论由猫咪单方面验证。', effect:{affinity:-2,chaos:21,stability:-8}
    },
    'spill.stress': {
      id:'spill.stress', code:'水溅到身上后应激扩大()', lane:'身体', priority:90, duration:7200, pose:'spill', visuals:['glass','water'], category:'案例', risk:true, description:'杯子被推翻、水溅到身体、应激动作再打翻更多物品。',
      message:'液体接触身体。应激程序正在扩大故障半径。', effect:{affinity:-5,chaos:24,stability:-9}
    },
    'kitten.groom': {
      id:'kitten.groom', code:'舔幼猫()', lane:'身体', priority:71, duration:7400, pose:'kitten-groom', visual:'kitten', category:'案例', chain:{id:'hind.kick',delay:820}, description:'舔到幼猫腹部附近时，系统可能误触蹬腿反射。',
      message:'幼猫清洁程序启动。后腿反射模块尚未隔离。', effect:{affinity:7,chaos:-1,stability:2}
    },
    'hind.kick': {
      id:'hind.kick', code:'误触蹬腿反射()', lane:'后腿', priority:95, duration:6900, pose:'kitten-duel', visual:'kitten', category:'案例', risk:true, description:'一边舔幼猫一边蹬幼猫，左右脑对当前对象产生分歧。',
      message:'后腿将幼猫识别为近距离障碍，清洁线程拒绝让步。', effect:{affinity:-4,chaos:19,stability:-7}
    },
    'stillcat.scan': {
      id:'stillcat.scan', code:'扫描静止同类()', lane:'注意力', priority:51, duration:6200, pose:'stillcat', visual:'secondcat', category:'案例', chain:{id:'courtship.error',delay:880}, description:'无法区分静止、睡着与离线的同类。',
      message:'发现完全静止的同类。生命状态字段缺失。', effect:{affinity:1,chaos:5,stability:0}
    },
    'courtship.error': {
      id:'courtship.error', code:'错误启动求偶协议()', lane:'情绪', priority:82, duration:7100, pose:'courtship', visual:'secondcat', category:'案例', risk:true, description:'在生命状态未知时错误调用求偶行为。',
      message:'同类没有回应。系统将沉默解释为继续许可。', effect:{affinity:-2,chaos:14,stability:-4}
    },
    'lion.classify': {
      id:'lion.classify', code:'把狮子识别为同类()', lane:'注意力', priority:69, duration:6500, pose:'lion', visual:'lion', category:'案例', chain:{id:'lion.hiss',delay:760}, description:'近大远小算法将远处狮子判定为体型相近的普通猫。',
      message:'远处目标尺寸校准完成：差不多大，可以哈气。', effect:{affinity:-1,chaos:11,stability:-3}
    },
    'lion.hiss': {
      id:'lion.hiss', code:'向狮子开启棘背龙形态()', lane:'声音', priority:97, duration:6900, pose:'lion-panic', visual:'lion', category:'案例', risk:true, description:'原地哈气后才发现对方体型远超缓存，随后尝试逃跑。',
      message:'威慑失败。目标尺寸正在以极不友好的速度重新计算。', effect:{affinity:-4,chaos:22,stability:-8}
    },
    'territory.stare': {
      id:'territory.stare', code:'与陌生猫领地对视()', lane:'注意力', priority:78, duration:7800, pose:'territory', visual:'secondcat', category:'案例', chain:{id:'blocker.remove',delay:900}, description:'双方互相哈气；视线被挡住时威胁会暂时从世界中删除。',
      message:'领地冲突建立。双方正在等待对方先假装路过。', effect:{affinity:-2,chaos:15,stability:-4}
    },
    'blocker.remove': {
      id:'blocker.remove', code:'移除视线障碍物()', lane:'环境', priority:86, duration:7600, pose:'territory-loop', visuals:['secondcat','blocker'], category:'案例', risk:true, description:'障碍移开后对手重新出现，哈气状态从头初始化。',
      message:'障碍物移除。被删除的威胁突然重新加载。', effect:{affinity:-2,chaos:18,stability:-6}
    },
    'glass.escape': {
      id:'glass.escape', code:'反复尝试穿过玻璃门()', lane:'身体', priority:83, duration:8200, pose:'glass-loop', visual:'glassdoor', category:'案例', chain:{id:'glass.open',delay:1100}, description:'每次撞墙都将另一个方向重新评估为可能出口。',
      message:'透明路径无法通过。正在将失败方向重新加入候选列表。', effect:{affinity:-1,chaos:14,stability:-5}
    },
    'glass.open': {
      id:'glass.open', code:'打开玻璃门()', lane:'环境', priority:89, duration:6900, pose:'glass-open', visual:'glassdoor', category:'案例', risk:true, description:'门被打开后，旧路线仍指向原来的玻璃位置。',
      message:'玻璃门已打开。猫咪选择撞向刚刚打开的那一扇。', effect:{affinity:-2,chaos:17,stability:-7}
    },
    'distant.threat': {
      id:'distant.threat', code:'检测远处威胁()', lane:'注意力', priority:73, duration:6700, pose:'alert', visual:'lion', category:'案例', chain:{id:'nearest.attack',delay:760}, description:'远处对象触发攻击警报，但攻击模块只读取最近生物。',
      message:'威胁警报建立。攻击模块正在查询最近可咬对象。', effect:{affinity:-1,chaos:12,stability:-3}
    },
    'nearest.attack': {
      id:'nearest.attack', code:'攻击最近生物()', lane:'身体', priority:98, duration:7200, pose:'redirect-attack', visual:'kitten', category:'案例', risk:true, description:'真正威胁太远，于是攻击旁边的猫、人类或自己的腿。',
      message:'远程威胁无法触达。攻击已重定向到最近生命体。', effect:{affinity:-7,chaos:23,stability:-9}
    },
    'window.watch': {
      id:'window.watch', code:'监视窗外鸟类()', lane:'注意力', priority:46, duration:7600, pose:'watch', visual:'bird', category:'感知监测', description:'旧调度器曾偷偷运行它；现在正式并入公开代码库。',
      message:'高价值鸟类进程进入视野。所有眨眼任务暂停。', effect:{affinity:1,chaos:-2,stability:2}
    },
    'overstimulate.irq': {
      id:'overstimulate.irq', code:'触发过度刺激中断()', lane:'情绪', priority:92, duration:4200, pose:'angry', visual:'hiss', category:'危险', risk:true, description:'抚摸、拍打或肚皮越权累计过量后，由硬件自动提交。',
      message:'触摸中断累计过量，牙齿协处理器正在预热。', effect:{affinity:-7,chaos:16,stability:-7}
    },
    'tail.detect': {
      id:'tail.detect', code:'发现尾巴正在移动()', lane:'注意力', priority:49, duration:6500, pose:'tail-detect', visual:'tail', category:'屎山', chain:{id:'tail.selfhunt',delay:720}, description:'视觉模块发现一个持续逃跑、气味熟悉但身份未知的目标。',
      message:'检测到高频移动长条。目标似乎永远位于身体后方。', effect:{affinity:1,chaos:7,stability:-1}
    },
    'tail.selfhunt': {
      id:'tail.selfhunt', code:'追杀自己的尾巴()', lane:'身体', priority:89, duration:7600, pose:'tail-chase', visual:'tail', category:'屎山', risk:true, description:'身体旋转导致尾巴继续移动，尾巴移动又要求身体继续旋转。',
      message:'目标正在同步躲避。调度器拒绝承认双方共用一具身体。', effect:{affinity:2,chaos:21,stability:-7}
    },
    'mirror.scan': {
      id:'mirror.scan', code:'扫描镜中陌生猫()', lane:'注意力', priority:57, duration:6800, pose:'mirror-scan', visual:'mirror', category:'屎山', chain:{id:'mirror.duel',delay:820}, description:'镜像响应完全同步，因此被判定为挑衅等级 MAX。',
      message:'发现动作完全同步的陌生猫。其模仿行为极其嚣张。', effect:{affinity:-1,chaos:9,stability:-2}
    },
    'mirror.duel': {
      id:'mirror.duel', code:'攻击镜中陌生猫()', lane:'前爪', priority:93, duration:7500, pose:'mirror-fight', visual:'mirror', category:'屎山', risk:true, description:'每次攻击都被对方同时复制，证实对方具有强烈敌意。',
      message:'镜中目标同步反击。敌意证据已由本猫闭环验证。', effect:{affinity:-3,chaos:22,stability:-8}
    },
    'door.request': {
      id:'door.request', code:'申请打开房门()', lane:'声音', priority:76, duration:7000, pose:'door-request', visual:'glassdoor', category:'屎山', chain:{id:'door.refuse',delay:900}, description:'门关闭时，另一边永远拥有更高优先级。',
      message:'生成开门工单。优先级：比人类当前任务高。', effect:{affinity:-1,chaos:8,stability:-1}
    },
    'door.refuse': {
      id:'door.refuse', code:'门开后拒绝通过()', lane:'决策', priority:88, duration:7600, pose:'door-refuse', visual:'glassdoor', category:'屎山', risk:true, description:'门的目标状态是“允许通过”，不是“实际通过”。',
      message:'房门已打开。猫咪需要重新评估自己是否真的想出去。', effect:{affinity:-2,chaos:17,stability:-6}
    },
    'fly.track': {
      id:'fly.track', code:'追踪室内苍蝇()', lane:'注意力', priority:81, duration:6800, pose:'fly-track', visual:'fly', category:'屎山', chain:{id:'wall.launch',delay:780}, description:'三维目标跟踪未加载墙体碰撞图层。',
      message:'空中微型猎物锁定。背景墙被分类为无关信息。', effect:{affinity:3,chaos:11,stability:-2}
    },
    'wall.launch': {
      id:'wall.launch', code:'向墙面发射整只猫()', lane:'身体', priority:96, duration:6200, pose:'wall-launch', visual:'fly', category:'屎山', risk:true, description:'弹道正确，目标正确，唯独忘了中间有一堵墙。',
      message:'整猫弹道已提交。墙体碰撞插件将在命中后异步加载。', effect:{affinity:-1,chaos:23,stability:-10}
    },
    'sofa.toy': {
      id:'sofa.toy', code:'检测沙发底玩具()', lane:'注意力', priority:54, duration:6900, pose:'sofa-peek', visual:'sofa', category:'屎山', chain:{id:'paw.stuck',delay:860}, description:'玩具进入低净空区域后，前爪会绕过可达性检查。',
      message:'玩具位于沙发底。路径宽度字段返回“差不多”。', effect:{affinity:2,chaos:8,stability:-1}
    },
    'paw.stuck': {
      id:'paw.stuck', code:'把前爪卡进沙发底()', lane:'前爪', priority:91, duration:7900, pose:'paw-stuck', visual:'sofa', category:'屎山', risk:true, description:'爪子越伸越深；退出动作和继续伸入动作共享同一根前肢。',
      message:'前爪进入不可回滚区域。另一只前爪决定提供更多推力。', effect:{affinity:-1,chaos:19,stability:-8}
    },
    'human.sleep': {
      id:'human.sleep', code:'检测人类刚刚入睡()', lane:'注意力', priority:67, duration:7200, pose:'watch', category:'屎山', chain:{id:'face.step',delay:1050}, description:'人类进入睡眠后，面部自动升级为最柔软的可用踏板。',
      message:'维护员已失去交互能力。现在适合提交夜间踩脸任务。', effect:{affinity:3,chaos:8,stability:-2}
    },
    'laptop.heat': {
      id:'laptop.heat', code:'检测温热笔记本()', lane:'环境', priority:63, duration:7600, pose:'laptop-scan', visual:'keyboard', category:'屎山', chain:{id:'keyboard.claim',delay:760}, description:'温度传感器返回舒适后，生产力设备自动改名为猫垫。',
      message:'发现恒温矩形。所有权迁移事务已经开始。', effect:{affinity:4,chaos:6,stability:1}
    },
    'food.bury': {
      id:'food.bury', code:'试图埋掉剩余罐头()', lane:'嗅觉', priority:62, duration:7000, pose:'food-bury', visual:'food', category:'屎山', chain:{id:'floor.scratch',delay:780}, description:'食物暂时不吃时，空气和地板都可被视为猫砂。',
      message:'剩余食物需要隐藏。附近覆盖介质：空气。', effect:{affinity:1,chaos:8,stability:0}
    },
    'floor.scratch': {
      id:'floor.scratch', code:'对地板执行无效掩埋()', lane:'前爪', priority:87, duration:7600, pose:'floor-scratch', visual:'food', category:'屎山', risk:true, description:'地板没有移动，但覆盖进度条每次都从零重新开始。',
      message:'前爪持续提交覆盖操作。地板持续返回只读。', effect:{affinity:0,chaos:17,stability:-6}
    },
    'food.reject': {
      id:'food.reject', code:'拒绝进食()', lane:'决策', priority:109, duration:5200, pose:'angry', visual:'food', category:'屎山', risk:true, counter:true, description:'猫发现维护员反复用食物修系统后，主动撤销食物的抢救权限。',
      message:'食物补丁使用次数过多。猫咪决定饿着也不配合。', effect:{affinity:-3,chaos:11,stability:-3}
    },
    'paw.enemy': {
      id:'paw.enemy', code:'把自己的前爪识别为敌人()', lane:'注意力', priority:78, duration:6900, pose:'redirect-attack', category:'屎山', risk:true, chain:{id:'bite.counter',delay:760,chance:.72}, description:'前爪突然进入视野，身份缓存未命中，于是脸和爪开始互相攻击。',
      message:'发现贴脸移动目标。目标气味像自己，但这不能证明什么。', effect:{affinity:-1,chaos:18,stability:-6}
    },
    'quantum.box': {
      id:'quantum.box', code:'观测量子纸箱()', lane:'决策', priority:47, duration:6600, pose:'box', visual:'box', category:'玄学', mystery:true, mysteryRange:[-3.8,3.4], fatalChance:.16, description:'观测前同时处于续命、催命和根本没有猫三种状态。结果不可预览。',
      message:'纸箱波函数正在坍缩。请勿询问里面到底有没有猫。', effect:{affinity:1,chaos:4,stability:0}
    },
    'cache.cat.delete': {
      id:'cache.cat.delete', code:'删除缓存里的猫()', lane:'系统', priority:64, duration:4700, pose:'ghost', visual:'ghost', category:'玄学', mystery:true, mysteryRange:[-4.2,3.8], fatalChance:.19, risk:true, description:'尝试通过删除猫咪缓存解决猫咪问题，可能释放内存，也可能释放猫。',
      message:'缓存清理完成。当前无法确认被清掉的是错误还是猫。', effect:{affinity:-2,chaos:6,stability:-1}
    },
    'fate.trust': {
      id:'fate.trust', code:'相信猫有计划()', lane:'信仰', priority:1, duration:6000, pose:'watch', category:'玄学', mystery:true, mysteryRange:[-5,4.6], fatalChance:.23, description:'放弃调试并相信一切都在猫的设计之中。极少成功，极具诱惑。',
      message:'维护员停止阅读日志，开始相信猫有一个计划。', effect:{affinity:4,chaos:5,stability:-1}
    }
  };

  var FORCED_CONFLICTS = [
    ['sleep.deep','vacuum.start'],['bag.enter','zoomies.turbo'],['itch.scratch','leg.enemy'],['rear.scan','neck.overturn'],
    ['net.entangle','net.attack'],['kitten.groom','hind.kick'],['lion.classify','lion.hiss'],['territory.stare','blocker.remove'],
    ['glass.escape','glass.open'],['distant.threat','nearest.attack'],['tail.detect','tail.selfhunt'],['mirror.scan','mirror.duel'],
    ['door.request','door.refuse'],['fly.track','wall.launch'],['sofa.toy','paw.stuck'],['human.sleep','face.step'],
    ['laptop.heat','keyboard.claim'],['food.bury','floor.scratch']
  ];

  var INCIDENT_STEPS = {
    'leg.enemy':['后腿进入脸部视野 → 标记为攻击者','脸咬后腿 → 后腿疼痛中断','后腿蹬脸 → 脸部再次受击','自我识别失败 → 返回第一步'],
    'neck.overturn':['转头确认身后人类','旋转角超限 → 脖子产生新痒','后腿抓脖子 → 姿态继续偏移','威胁仍在身后 → 再次转头'],
    'poop.enemy':['排泄完成并执行掩埋','回头发现身后陌生对象','哈气无效 → 改用前爪攻击','对象气味像自己，但结论被忽略'],
    'wheel.hide':['哈气无法赶走大型车辆','搜索附近最暗安全区','路径命中车轮正下方','安全算法拒绝读取车辆状态'],
    'net.attack':['挥爪攻击网格','网格收紧并增加身体接触','接触升级为更高威胁','继续挥爪攻击网格'],
    'spill.stress':['前爪推杯测试重力','水溅到毛发 → 应激跳跃','跳跃撞到第二个物体','新声响再次触发应激'],
    'hind.kick':['舌头清洁幼猫','腹部检测到接触物','后腿执行蹬踹反射','清洁模块坚持继续舔'],
    'courtship.error':['发现完全静止的同类','生命状态返回 NULL','NULL 被当作“未拒绝”','求偶协议继续重试'],
    'lion.hiss':['远处目标看起来和我差不多大','弓背、炸毛、哈气','目标靠近 → 尺寸缓存失效','一边逃跑一边继续哈气'],
    'blocker.remove':['陌生猫进入视野 → 哈气','人类挡住视线 → 威胁消失','移开人类 → 威胁重新加载','仇恨计时器从零开始'],
    'glass.open':['左侧玻璃碰撞','切换到右侧玻璃碰撞','人类打开其中一扇门','沿旧路径撞向被打开的玻璃'],
    'nearest.attack':['远处目标触发敌意','攻击系统查询最近生物','最近对象并非警报来源','攻击被错误重定向'],
    'fur.wet':['随机动作撞到水源','湿毛中断写入全身','请求 P999 舔毛维护','其余线程准备被全部覆盖'],
    'tail.selfhunt':['尾巴进入视觉边缘','身体转向捕猎尾巴','转身使尾巴再次逃离','追逐函数递归调用自己'],
    'mirror.duel':['镜中陌生猫同步抬爪','本猫将同步动作判定为挑衅','攻击被镜像完整复制','敌意置信度继续翻倍'],
    'door.refuse':['门关闭 → 提交开门工单','门打开 → 保留原地观察','人类准备关门','立即重新提交开门工单'],
    'wall.launch':['苍蝇坐标持续上移','后腿压缩并准备弹射','整只猫向目标坐标提交','墙体插件在碰撞后加载'],
    'paw.stuck':['玩具滚入沙发底','第一只前爪深入搜索','第二只前爪推动身体','两只前爪共同等待退出锁'],
    'face.step':['确认人类进入深睡','寻找最高且柔软落点','前爪命中人类面部','人类醒来 → 猫假装路过'],
    'keyboard.claim':['温热矩形通过舒适度检查','身体覆盖键盘输入区域','人类试图移动猫咪','所有权协议返回拒绝访问'],
    'floor.scratch':['剩余罐头需要归档','前爪抓挠空气与地板','地板返回只读','掩埋进度归零并重试']
  };

  var CONFLICTS = [
    { ids:['hairball.gc','treat.feed'], key:'IO_REVERSED', title:'进食与垃圾回收方向冲突', reason:'输入和输出同时占用了同一根猫。' },
    { ids:['sleep.deep','vacuum.start'], key:'WAKE_LOCK', title:'睡眠唤醒锁死', reason:'深度睡眠与吸尘器唤醒中断互相等待，猫咪拒绝调度。' },
    { ids:['bath.force','zoomies.turbo'], key:'WET_SPEED', title:'水与速度冲突', reason:'湿猫与高速移动同时写入房间状态，产生不可恢复的竞态。' },
    { ids:['box.mount','vacuum.start'], key:'SAFE_ZONE', title:'纸箱安全区被强制卸载', reason:'吸尘器在纸箱仍被占用时强制卸载了安全区。' },
    { ids:['catnip.load','laser.track'], key:'TARGET_LOOP', title:'目标反馈失控', reason:'猫薄荷放大器与红点追踪器形成了无限目标反馈。' },
    { ids:['belly.patch','overstimulate.irq'], key:'TRUST_FAULT', title:'信任区段错误', reason:'人类越界访问受保护的肚皮内存，信任段立即崩溃。' },
    { ids:['box.mount','cucumber.place'], key:'BOX_BACKDOOR', title:'纸箱安全区后门入侵', reason:'未知绿色对象绕过纸箱边界检测，猫咪从安全区直接弹射。' },
    { ids:['litter.bury','vacuum.start'], key:'LITTER_STORM', title:'猫砂扬尘缓冲区爆炸', reason:'前爪覆盖操作与吸尘器抽取操作争抢同一批猫砂，房间即将被物理格式化。' },
    { ids:['bag.enter','zoomies.turbo'], key:'BAG_RACE', title:'袋装高速移动失控', reason:'塑料袋领地在高速模式下进入不可预测弹道，猫咪和袋子都拒绝刹车。' },
    { ids:['prey.pounce','push.glass'], key:'BALLISTIC_OVERLAP', title:'飞扑弹道与杯子重叠', reason:'猎物落点和杯子重力测试共享同一桌面坐标，碰撞系统已经放弃计算。' },
    { ids:['itch.scratch','leg.enemy'], key:'SELF_LEG_WAR', title:'脸与后腿互相反击', reason:'抓痒后腿被视觉系统识别为攻击者，脸咬后腿、后腿蹬脸形成自我战争。' },
    { ids:['rear.scan','neck.overturn'], key:'NECK_FEEDBACK', title:'扭头与脖子痒反馈失控', reason:'扫描身后威胁时扭转过量，抓痒动作又继续改变颈部角度。' },
    { ids:['seizure.random','fur.wet'], key:'WET_GROOM_IRQ', title:'发癫过程遭遇湿毛中断', reason:'随机动作和湿毛维护争抢身体；最高优先级舔毛即将强制接管。' },
    { ids:['litter.bury','poop.enemy'], key:'POOP_INTRUDER', title:'自己的屎被识别为入侵者', reason:'埋屎完成后对象突然出现在身后，来源字段缺失导致哈气与攻击循环。' },
    { ids:['truck.scan','wheel.hide'], key:'TRUCK_SHADOW', title:'大型车辆威胁与阴影躲避冲突', reason:'车辆过大导致威慑失效，躲避算法却把最近的车轮阴影标为安全区。' },
    { ids:['net.entangle','net.attack'], key:'NET_TIGHTEN', title:'攻击网导致越缠越紧', reason:'每次攻击都会提高缠绕程度，而更紧的缠绕又被判定为更强攻击。' },
    { ids:['push.glass','spill.stress'], key:'SPILL_CASCADE', title:'杯子落水应激级联', reason:'杯子被推翻、水溅到身体、应激动作再打翻更多物体，故障半径持续扩大。' },
    { ids:['kitten.groom','hind.kick'], key:'KITTEN_BRAIN_SPLIT', title:'舔幼猫与蹬腿反射并发', reason:'清洁模块把幼猫视为照顾对象，后腿模块同时把它视为腹部障碍。' },
    { ids:['stillcat.scan','courtship.error'], key:'LIFE_STATE_NULL', title:'静止同类生命状态为空', reason:'无法区分静止、睡着和离线，求偶协议在空状态上继续运行。' },
    { ids:['lion.classify','lion.hiss'], key:'LION_SCALE_ERROR', title:'远处狮子尺寸分类错误', reason:'近大远小算法把狮子当作同体型猫，直到对方靠近才重新计算。' },
    { ids:['territory.stare','blocker.remove'], key:'VISIBLE_THREAT_RESET', title:'视线遮挡重置领地仇恨', reason:'看不见即不存在；障碍移开后同一威胁被当作全新对象重新加载。' },
    { ids:['glass.escape','glass.open'], key:'OPEN_GLASS_COLLISION', title:'玻璃门打开后仍按旧路径碰撞', reason:'逃逸路线缓存没有随玻璃门状态更新，开放通道反而成为新碰撞目标。' },
    { ids:['distant.threat','nearest.attack'], key:'NEAREST_TARGET_REDIRECT', title:'远程威胁重定向到最近生物', reason:'警报来自远处，但攻击函数只查询最近生命体，于是旁边对象替威胁挨打。' },
    { ids:['tail.detect','tail.selfhunt'], key:'TAIL_RECURSION', title:'尾巴递归捕猎栈溢出', reason:'身体追逐尾巴导致尾巴继续移动，尾巴移动又递归调用身体追逐。' },
    { ids:['mirror.scan','mirror.duel'], key:'MIRROR_FORK_BOMB', title:'镜像敌意无限复制', reason:'猫咪的每次攻击都会被镜像同步复制，并被当作对方的新一轮挑衅。' },
    { ids:['door.request','door.refuse'], key:'DOOR_STATE_THRASH', title:'房门状态反复横跳', reason:'关闭时必须打开，打开后拒绝通过，目标状态和实际行为永远无法收敛。' },
    { ids:['fly.track','wall.launch'], key:'FLY_WALL_SEGFAULT', title:'苍蝇弹道撞入墙体', reason:'追踪模块只返回猎物坐标，整猫发射模块没有加载中间墙体。' },
    { ids:['sofa.toy','paw.stuck'], key:'SOFA_DEADLOCK', title:'沙发底前爪死锁', reason:'一只前爪负责深入，另一只前爪负责把身体推得更深，没有线程负责退出。' },
    { ids:['human.sleep','face.step'], key:'HUMAN_SLEEP_IRQ', title:'人类睡眠遭踩脸中断', reason:'人类一进入睡眠，面部就被重新注册为猫咪夜间踏板。' },
    { ids:['laptop.heat','keyboard.claim'], key:'HEAT_OWNERSHIP', title:'笔记本热源所有权劫持', reason:'温度检测把工作设备升级为猫垫，键盘占领随后撤销全部人类输入权限。' },
    { ids:['food.bury','floor.scratch'], key:'FOOD_ARCHIVE_LOOP', title:'罐头掩埋写入只读地板', reason:'食物需要覆盖，但唯一可用介质是无法移动的地板，掩埋进度永远归零。' },
    { ids:['food.reject','treat.feed'], key:'FOOD_PATCH_REVOKED', title:'零食补丁签名被撤销', reason:'维护员持续用零食覆盖错误，猫咪主动把食物源加入拒绝列表。' },
    { ids:['food.reject','can.open'], key:'CAN_PERMISSION_DENIED', title:'罐头修复权限被拒绝', reason:'罐头仍然有效，但猫决定现在接受它等于承认人类调试成功。' }
  ];

  var RULES = window.CAT_KERNEL_RULES||[];

  var COMBOS = [
    { id:'KITTEN_MEMORY', ids:['knead.blanket','purr.daemon'], title:'幼猫记忆', detail:'踩奶 + 呼噜，稳定性正在回血', effect:{affinity:8,chaos:-8,stability:6} },
    { id:'LOW_POWER_LOAF', ids:['loaf.mode','sleep.deep'], title:'超低功耗香箱', detail:'四肢隐藏 + 深度睡眠，功耗接近零', effect:{affinity:3,chaos:-10,stability:8} },
    { id:'REMOTE_SABOTAGE', ids:['keyboard.claim','meow.wake'], title:'远程办公破坏者', detail:'占领键盘并广播需求，生产力归零', effect:{affinity:4,chaos:8,stability:1} },
    { id:'NIGHT_FURY', ids:['catnip.load','zoomies.turbo'], title:'凌晨四驱疯猫', detail:'猫薄荷增压 + 凌晨疯跑，混乱翻倍', effect:{affinity:5,chaos:15,stability:-5} },
    { id:'HUNT_STACK', ids:['yarn.attack','tail.swish','ear.rotate'], title:'全栈捕猎协议', detail:'雷达耳、尾巴与前端攻击全部上线', effect:{affinity:7,chaos:8,stability:3} },
    { id:'BOX_FORTRESS', ids:['box.mount','hiss.warn'], title:'纸箱堡垒', detail:'纸箱领地已启用武装哈气防火墙', effect:{affinity:4,chaos:-4,stability:5} },
    { id:'DOOR_TICKET', ids:['door.close','meow.wake'], title:'开门工单风暴', detail:'门一关闭，投诉广播立刻循环', effect:{affinity:-2,chaos:12,stability:-3} },
    { id:'FOOD_PIPELINE', ids:['can.open','snack.shake'], title:'零食持续集成', detail:'罐头与零食袋同时部署，猫咪全绿', effect:{affinity:12,chaos:-6,stability:6} },
    { id:'SPA_BUILD', ids:['brush.fur','purr.daemon'], title:'豪华养护构建', detail:'梳毛协处理器 + 呼噜守护进程', effect:{affinity:10,chaos:-8,stability:7} },
    { id:'CARDBOARD_DC', ids:['cardboard.scratch','box.mount'], title:'纸箱数据中心', detail:'一边住一边格式化，基础设施自给自足', effect:{affinity:5,chaos:6,stability:3} },
    { id:'ALARM_CLOCK', ids:['face.step','meow.wake'], title:'生物闹钟 Pro', detail:'踩脸 + 喵叫，保证无法赖床', effect:{affinity:-1,chaos:13,stability:-3} },
    { id:'HUNT_PIPELINE', ids:['hunt.mode','butt.wiggle','prey.pounce'], title:'标准捕猎流水线', detail:'锁定、后端校准、整猫提交一气呵成', effect:{affinity:9,chaos:12,stability:4} },
    { id:'LITTER_ARCHIVE', ids:['litter.inspect','litter.bury'], title:'刚埋完又要检查', detail:'先覆盖再审计，确认刚才埋的东西是否依然值得再埋一次', effect:{affinity:5,chaos:-2,stability:6} },
    { id:'SOLAR_LOAF', ids:['sun.charge','loaf.mode'], title:'太阳能香箱', detail:'四肢隐藏并展开腹部光伏面板', effect:{affinity:6,chaos:-12,stability:10} },
    { id:'BIRD_COMPILER', ids:['bird.stalk','window.chirp'], title:'鸟语编译器', detail:'只读观察转译成无法解释的咔咔声', effect:{affinity:7,chaos:6,stability:3} },
    { id:'OWNERSHIP_SYNC', ids:['human.follow','scent.mark'], title:'所有权实时同步', detail:'尾随并蹭脸，确保人类始终属于猫', effect:{affinity:12,chaos:-3,stability:5} },
    { id:'TAIL_OBSERVER', ids:['tail.detect','tail.swish','ear.rotate'], title:'尾巴递归观察者', detail:'观察尾巴、移动尾巴、继续观察新位置', effect:{affinity:4,chaos:14,stability:-4} },
    { id:'MIRROR_FIREWALL', ids:['mirror.scan','hiss.warn'], title:'镜像哈气防火墙', detail:'双方同步哈气，因此双方都确信威慑有效', effect:{affinity:-2,chaos:13,stability:-3} },
    { id:'DOOR_SUPPORT', ids:['door.request','meow.wake'], title:'一级开门技术支持', detail:'工单与语音投诉同时广播', effect:{affinity:-1,chaos:12,stability:-2} },
    { id:'FLY_RADAR', ids:['fly.track','ear.rotate'], title:'空中目标雷达阵列', detail:'眼睛和双耳共同锁定一只苍蝇', effect:{affinity:5,chaos:9,stability:1} },
    { id:'NIGHT_DEPLOY', ids:['human.sleep','face.step','meow.wake'], title:'夜间零停机部署', detail:'在人类睡眠窗口同时踩脸和广播', effect:{affinity:-4,chaos:18,stability:-5} },
    { id:'LAPTOP_TAKEOVER', ids:['laptop.heat','keyboard.claim','loaf.mode'], title:'温控生产力接管', detail:'笔记本、键盘和香箱合并成恒温猫垫', effect:{affinity:8,chaos:-2,stability:5} },
    { id:'MIDNIGHT_GAMES', ids:['human.sleep','zoomies.turbo','meow.wake'], title:'凌晨三点运动会', detail:'人类睡眠成为发令枪，疯跑和广播同步开赛', effect:{affinity:1,chaos:19,stability:-6} },
    { id:'SCHRODINGER_BOX', ids:['box.mount','quantum.box'], title:'薛定谔纸箱', detail:'猫同时在箱内、箱外以及拒绝回答', effect:{affinity:7,chaos:9,stability:2} },
    { id:'OWN_PAW_ENEMY', ids:['paw.enemy','bite.counter'], title:'自己的手是敌人', detail:'脸咬前爪，前爪打脸，双方共享同一份疼痛日志', effect:{affinity:-1,chaos:18,stability:-7} },
    { id:'HISS_PURR_RACE', ids:['hiss.warn','purr.daemon'], title:'一边哈气一边呼噜', detail:'声卡同时输出信任与威胁，协议层拒绝选边', effect:{affinity:3,chaos:12,stability:-2} }
  ];

  var PERSONALITIES = [
    {id:'coward',name:'胆小型',tag:'噪声过敏',intro:'任何大声设备都会被当作天敌热更新。',fav:['box.mount','hiss.warn','blanket.hide','vacuum.start'],categories:['环境'],start:{affinity:-2,chaos:7,stability:-3},grudge:1.45},
    {id:'glutton',name:'贪吃型',tag:'食物驱动',intro:'罐头拥有管理员权限，直到猫发现你在利用它。',fav:['treat.feed','can.open','snack.shake','food.bury'],categories:['基础','互动'],start:{affinity:5,chaos:-3,stability:2},grudge:.85},
    {id:'clean',name:'洁癖型',tag:'维护强迫',intro:'舔毛、梳毛和猫砂归档会以异常频率自行启动。',fav:['groom.manual','brush.fur','litter.inspect','litter.bury'],categories:['自维护'],start:{affinity:1,chaos:-2,stability:4},grudge:1.05},
    {id:'hunter',name:'猎手型',tag:'目标成瘾',intro:'一切会动的东西都会升级为最高价值猎物。',fav:['hunt.mode','prey.pounce','bird.stalk','tail.detect','fly.track'],categories:['生存','感知监测'],start:{affinity:2,chaos:6,stability:0},grudge:1},
    {id:'night',name:'夜班型',tag:'凌晨满载',intro:'睡眠窗口被重新定义为批量部署窗口。',fav:['zoomies.turbo','human.sleep','face.step','meow.wake'],categories:['案例','屎山'],start:{affinity:0,chaos:9,stability:-2},grudge:1.15},
    {id:'contrary',name:'逆反型',tag:'反维护',intro:'越像正确答案的代码，越容易被猫提前针对。',fav:['food.reject','fate.trust','cache.cat.delete','paw.enemy'],categories:['玄学','危险'],start:{affinity:-4,chaos:11,stability:-4},grudge:1.35}
  ];

  var DAILY_SECRET_POOL = [
    {key:'DAILY_PURR_VACUUM',ids:['purr.daemon','vacuum.start'],title:'今日隐藏冲突：呼噜声被噪声反向调制',reason:'低频安抚与吸尘器噪声共用声卡，今日驱动把二者编译成了反馈啸叫。'},
    {key:'DAILY_TAIL_WATER',ids:['tail.swish','drink.glass'],title:'今日隐藏冲突：尾巴污染饮水事务',reason:'尾巴扫过杯口时，饮水线程错误地把整张桌子标成水源。'},
    {key:'DAILY_SOLAR_ZOOM',ids:['sun.charge','zoomies.turbo'],title:'今日隐藏冲突：太阳能过充',reason:'光伏香箱刚充满电，凌晨疯跑便把全部电量一次性提交。'},
    {key:'DAILY_KEYBOARD_PAW',ids:['keyboard.claim','paw.enemy'],title:'今日隐藏冲突：输入设备敌我不分',reason:'前爪既是键盘输入源又是敌对目标，按键和反击互相递归。'},
    {key:'DAILY_MIRROR_PET',ids:['mirror.scan','pet.cat'],title:'今日隐藏冲突：抚摸镜像权限串线',reason:'镜中猫同步获得抚摸事件，真实猫认为自己的配额遭到了盗用。'},
    {key:'DAILY_LITTER_FOOD',ids:['litter.inspect','food.bury'],title:'今日隐藏冲突：食物写入猫砂索引',reason:'今日数据库迁移把剩余罐头和猫砂归档放进了同一张表。'}
  ];

  function chinaDayKey(){
    try{var parts=new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()),map={};parts.forEach(function(part){map[part.type]=part.value;});return map.year+'-'+map.month+'-'+map.day;}catch(error){return new Date().toISOString().slice(0,10);}
  }
  function hashSeed(text){var value=2166136261;for(var i=0;i<text.length;i+=1){value^=text.charCodeAt(i);value=Math.imul(value,16777619);}return value>>>0;}
  function seededRandom(seed){var value=seed>>>0;return function(){value=(value+0x6D2B79F5)|0;var n=Math.imul(value^(value>>>15),1|value);n=n+Math.imul(n^(n>>>7),61|n)^n;return ((n^(n>>>14))>>>0)/4294967296;};}
  var dailyKey=chinaDayKey(),dailySeed=hashSeed('CAT.EXE/'+dailyKey),dailyId='CAT-'+dailySeed.toString(16).toUpperCase().padStart(8,'0').slice(0,6),dailyBootstrap=seededRandom(dailySeed);
  var dailySecretDeck=DAILY_SECRET_POOL.slice();
  for(var dailyIndex=dailySecretDeck.length-1;dailyIndex>0;dailyIndex-=1){var dailySwap=Math.floor(dailyBootstrap()*(dailyIndex+1)),dailyItem=dailySecretDeck[dailyIndex];dailySecretDeck[dailyIndex]=dailySecretDeck[dailySwap];dailySecretDeck[dailySwap]=dailyItem;}
  var dailySecretConflicts=dailySecretDeck.slice(0,2);

  var conflictLookup=Object.create(null);
  CONFLICTS.forEach(function(item){ conflictLookup[pairKey(item.ids[0],item.ids[1])]=item; });
  dailySecretConflicts.forEach(function(item){conflictLookup[pairKey(item.ids[0],item.ids[1])]=item;});

  var ui={
    body:document.body,stage:document.getElementById('catStage'),speech:document.getElementById('catSpeech'),
    uptime:document.getElementById('uptimeValue'),stability:document.getElementById('stabilityValue'),stabilityMeter:document.getElementById('stabilityMeter'),
    affinity:document.getElementById('affinityValue'),chaos:document.getElementById('chaosValue'),chaosMeter:document.getElementById('chaosMeter'),best:document.getElementById('bestValue'),
    kernelState:document.getElementById('kernelState'),active:document.getElementById('activeProcesses'),queueCode:document.getElementById('queueCode'),
    queueCountdown:document.getElementById('queueCountdown'),queueLane:document.getElementById('queueLane'),queuePriority:document.getElementById('queuePriority'),
    log:document.getElementById('kernelLog'),logPanel:document.getElementById('logPanel'),logToggle:document.getElementById('logObserverToggle'),logObserverState:document.getElementById('logObserverState'),rules:document.getElementById('conflictAtlas'),ruleCount:document.getElementById('atlasCount'),rulesLaunch:document.querySelector('.ck-rules-launch'),
    crash:document.getElementById('crashOverlay'),crashCode:document.getElementById('crashCode'),crashReason:document.getElementById('crashReason'),deathTitle:document.getElementById('deathTitle'),crashTrace:document.getElementById('crashTrace'),crashMeta:document.getElementById('crashMeta'),accountGate:document.getElementById('accountGate'),catLogin:document.getElementById('catLoginLink'),catRegister:document.getElementById('catRegisterLink'),
    reboot:document.getElementById('rebootButton'),commandGrid:document.getElementById('commandGrid'),codeCount:document.getElementById('codeCount'),
    libraryMask:document.getElementById('codeLibraryMask'),openLibrary:document.getElementById('openCodeLibrary'),closeLibrary:document.getElementById('closeCodeLibrary'),
    library:document.querySelector('.ck-library'),libraryTabs:document.getElementById('codeLibraryTabs'),catTap:document.getElementById('catTap'),environment:document.getElementById('environmentControls'),
    comboBanner:document.getElementById('comboBanner'),comboTitle:document.getElementById('comboTitle'),comboDetail:document.getElementById('comboDetail'),
    soundToggle:document.getElementById('soundToggle'),panicCountdown:document.getElementById('panicCountdown'),panicTime:document.getElementById('panicTime'),
    panicTitle:document.getElementById('panicTitle'),panicHint:document.getElementById('panicHint'),panicDelta:document.getElementById('panicDelta'),panicMeter:document.getElementById('panicMeter'),
    libraryPanic:document.getElementById('libraryPanic'),libraryPanicTime:document.getElementById('libraryPanicTime'),libraryPanicPriority:document.getElementById('libraryPanicPriority'),
    dailySeed:document.getElementById('dailySeedBadge'),personality:document.getElementById('personalityBadge'),guestLife:document.getElementById('guestLifeBadge')
  };

  if(!ui.stage||!ui.commandGrid) return;

  var storage={best:'eo_cat_kernel_best_v2',rules:'eo_cat_kernel_rules_v2',boots:'eo_cat_kernel_boots_v2',sound:'eo_cat_kernel_sound_v1',runs:'eo_cat_kernel_runs_v1',rescues:'eo_cat_kernel_rescues_v1',grudges:'eo_cat_kernel_grudges_v1',uses:'eo_cat_kernel_player_uses_v1',zombies:'eo_cat_kernel_zombies_v1',guestDeaths:'eo_cat_kernel_guest_deaths_v1',personality:'eo_cat_kernel_last_personality_v1',guestId:'eo_cat_kernel_guest_id_v1'};
  var state={
    crashed:false,bootStarted:Date.now(),lastTick:Date.now(),uptime:0,stability:88,affinity:50,chaos:16,
    best:readNumber(storage.best,0),boots:readNumber(storage.boots,0),processes:new Map(),queue:null,queueAt:0,lastQueued:'',
    discovered:readSet(storage.rules),transient:'',transientUntil:0,milestone:false,pausedAt:0,loopPhase:-1,libraryCategory:'全部',libraryReturnFocus:null,
    comboActive:new Set(),comboTitle:'',comboDetail:'',comboUntil:0,petStreak:0,lastPetAt:0,petHeat:0,soundOn:readToggle(storage.sound,true),ambientAt:Date.now()+1800,
    pendingCrash:null,lastPanicSecond:-1,rescues:0,totalRescues:readNumber(storage.rescues,0),runs:readRuns(),currentRecorded:false,
    nextForcedConflictAt:105+dailyBootstrap()*20,pressureLevel:0,dailyKey:dailyKey,dailySeed:dailySeed,dailyId:dailyId,rng:seededRandom(dailySeed),sessionBoot:0,personality:null,
    grudges:readObject(storage.grudges,{touch:0,bath:0,noise:0,food:0,groom:0}),playerUses:readObject(storage.uses,{}),trace:[],lastAutopsy:null,lastMystery:'',gestureHistory:[],bootGeneration:0,preemptiveGroomAt:0,
    zombies:readArray(storage.zombies),guestDeaths:readNumber(storage.guestDeaths,0),ninthLife:false,logOpen:true,observerStress:0,observedUntil:0,logCorruption:.045,fakeLogs:0,ruleDriftSeen:new Set(),
    rankingGuestId:guestIdentity(),runTicket:null,ticketPromise:null
  };

  function pairKey(a,b){ return [a,b].sort().join('|'); }
  function clamp(value,min,max){ return Math.max(min,Math.min(max,value)); }
  function readNumber(key,fallback){ try{var value=Number(localStorage.getItem(key));return Number.isFinite(value)&&value>=0?value:fallback;}catch(error){return fallback;} }
  function readSet(key){ try{var value=JSON.parse(localStorage.getItem(key)||'[]');return new Set(Array.isArray(value)?value:[]);}catch(error){return new Set();} }
  function readRuns(){ try{var value=JSON.parse(localStorage.getItem(storage.runs)||'[]');return Array.isArray(value)?value:[];}catch(error){return [];} }
  function readArray(key){try{var value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value:[];}catch(error){return [];}}
  function readObject(key,fallback){try{var value=JSON.parse(localStorage.getItem(key)||'null');return value&&typeof value==='object'&&!Array.isArray(value)?value:Object.assign({},fallback);}catch(error){return Object.assign({},fallback);}}
  function readToggle(key,fallback){ try{var value=localStorage.getItem(key);return value===null?fallback:value==='1';}catch(error){return fallback;} }
  function persist(){ try{localStorage.setItem(storage.best,String(Math.floor(state.best)));localStorage.setItem(storage.boots,String(state.boots));localStorage.setItem(storage.rules,JSON.stringify(Array.from(state.discovered)));localStorage.setItem(storage.sound,state.soundOn?'1':'0');localStorage.setItem(storage.runs,JSON.stringify(state.runs.slice(0,30)));localStorage.setItem(storage.rescues,String(state.totalRescues));localStorage.setItem(storage.grudges,JSON.stringify(state.grudges));localStorage.setItem(storage.uses,JSON.stringify(state.playerUses));localStorage.setItem(storage.zombies,JSON.stringify(state.zombies.slice(-7)));localStorage.setItem(storage.guestDeaths,String(state.guestDeaths));if(state.personality)localStorage.setItem(storage.personality,JSON.stringify({id:state.personality.id,name:state.personality.name,tag:state.personality.tag}));}catch(error){} }
  function rand(){return state&&state.rng?state.rng():dailyBootstrap();}
  function formatTime(seconds){seconds=Math.max(0,Math.floor(seconds));return String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');}
  function stamp(){return formatTime(state.uptime);}
  function isAuthenticated(){
    try{if(window.EOSession&&typeof window.EOSession.isAuthenticated==='function') return !!window.EOSession.isAuthenticated();return !!localStorage.getItem('eo_access_token');}catch(error){return false;}
  }
  function guestLocked(){return !isAuthenticated()&&state.guestDeaths>=9;}
  function guestIdentity(){
    try{
      var existing=localStorage.getItem(storage.guestId);if(existing) return existing;
      var id='';
      if(window.crypto&&typeof window.crypto.randomUUID==='function') id=window.crypto.randomUUID();
      else id='xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(char){var value=Math.floor(Math.random()*16);return (char==='x'?value:(value&3)|8).toString(16);});
      localStorage.setItem(storage.guestId,id);return id;
    }catch(error){return '00000000-0000-4000-8000-000000000001';}
  }
  function rankingApiBase(){
    try{
      if(window.EOSession&&typeof window.EOSession.apiBase==='function') return window.EOSession.apiBase();
      return (window.EO_API_BASE||localStorage.getItem('eo_api_base')||((location.protocol==='file:'||/^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/.test(location.hostname))?'http://localhost:3000':'')).replace(/\/+$/,'');
    }catch(error){return '';}
  }
  function rankingFetch(){
    if(window.EOSession&&typeof window.EOSession.fetch==='function') return window.EOSession.fetch;
    if(typeof window.fetch==='function') return window.fetch.bind(window);
    return null;
  }
  function requestRunTicket(){
    var sender=rankingFetch();state.runTicket=null;
    if(!sender){state.ticketPromise=Promise.resolve(null);return state.ticketPromise;}
    state.ticketPromise=sender(rankingApiBase()+'/cat-kernel/ticket',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({guestId:state.rankingGuestId})})
      .then(function(response){if(!response.ok) throw new Error('ticket '+response.status);return response.json();})
      .then(function(data){if(!data||!data.ticket) return null;state.runTicket=data;return data;})
      .catch(function(){return null;});
    return state.ticketPromise;
  }
  function submitRun(run){
    var sender=rankingFetch(),pending=state.runTicket?Promise.resolve(state.runTicket):state.ticketPromise;
    if(!sender||!pending) return;
    pending.then(function(ticketInfo){
      if(!ticketInfo||!ticketInfo.ticket) return;
      if(state.runTicket===ticketInfo) state.runTicket=null;
      return sender(rankingApiBase()+'/cat-kernel/score',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        ticket:ticketInfo.ticket,guestId:state.rankingGuestId,seconds:run.seconds,cause:run.cause,deathTitle:run.deathTitle,personality:run.personality,rescues:run.rescues
      })});
    }).catch(function(){});
  }
  function recordRun(cause,autopsy){
    if(state.currentRecorded||state.uptime<1) return;state.currentRecorded=true;
    var run={seconds:Math.floor(state.uptime),cause:cause||'主动结束维护',deathTitle:autopsy&&autopsy.title||'',trace:autopsy&&autopsy.lines||[],rescues:state.rescues,at:Date.now(),day:dailyKey,seed:dailyId,personality:state.personality&&state.personality.name||'未知'};
    state.runs.unshift(run);state.runs=state.runs.slice(0,30);persist();submitRun(run);
  }

  var audio={
    ctx:null,master:null,last:Object.create(null),
    unlock:function(userGesture){
      if(!state.soundOn) return false;
      if(!this.ctx){
        if(!userGesture) return false;
        var AudioCtor=window.AudioContext||window.webkitAudioContext;if(!AudioCtor) return false;
        try{this.ctx=new AudioCtor();this.master=this.ctx.createGain();this.master.gain.value=.34;this.master.connect(this.ctx.destination);}catch(error){this.ctx=null;return false;}
      }
      if(this.ctx.state==='suspended') this.ctx.resume().catch(function(){});
      return true;
    },
    tone:function(frequency,duration,type,volume,endFrequency,delay){
      if(!this.unlock()) return;
      var ctx=this.ctx,start=ctx.currentTime+(delay||0),osc=ctx.createOscillator(),gain=ctx.createGain();
      osc.type=type||'sine';osc.frequency.setValueAtTime(Math.max(24,frequency),start);
      if(endFrequency) osc.frequency.exponentialRampToValueAtTime(Math.max(24,endFrequency),start+duration);
      gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume||.08),start+.012);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
      osc.connect(gain);gain.connect(this.master);osc.start(start);osc.stop(start+duration+.03);
    },
    noise:function(duration,volume,filterType,frequency,delay){
      if(!this.unlock()) return;
      var ctx=this.ctx,start=ctx.currentTime+(delay||0),length=Math.max(1,Math.floor(ctx.sampleRate*duration)),buffer=ctx.createBuffer(1,length,ctx.sampleRate),data=buffer.getChannelData(0);
      for(var i=0;i<length;i+=1) data[i]=(Math.random()*2-1)*(1-i/length*.35);
      var source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=buffer;filter.type=filterType||'bandpass';filter.frequency.value=frequency||1200;filter.Q.value=.75;
      gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(volume||.08,start+.008);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
      source.connect(filter);filter.connect(gain);gain.connect(this.master);source.start(start);source.stop(start+duration+.02);
    },
    purr:function(){
      if(!this.unlock()) return;
      var ctx=this.ctx,start=ctx.currentTime,carrier=ctx.createOscillator(),gain=ctx.createGain(),lfo=ctx.createOscillator(),depth=ctx.createGain();
      carrier.type='sawtooth';carrier.frequency.value=58;lfo.type='sine';lfo.frequency.value=24;gain.gain.value=.065;depth.gain.value=.035;
      lfo.connect(depth);depth.connect(gain.gain);carrier.connect(gain);gain.connect(this.master);carrier.start(start);lfo.start(start);gain.gain.setValueAtTime(.0001,start);gain.gain.linearRampToValueAtTime(.06,start+.08);gain.gain.linearRampToValueAtTime(.0001,start+.82);carrier.stop(start+.84);lfo.stop(start+.84);
    },
    play:function(name){
      if(!state.soundOn) return;
      var now=Date.now(),gap=name==='pet'?70:130;if(this.last[name]&&now-this.last[name]<gap) return;this.last[name]=now;
      ui.soundToggle.classList.remove('is-playing');void ui.soundToggle.offsetWidth;ui.soundToggle.classList.add('is-playing');window.setTimeout(function(){ui.soundToggle.classList.remove('is-playing');},360);
      if(name==='ui'){this.tone(520,.07,'square',.055,680);}
      else if(name==='code'){this.tone(310,.08,'square',.06,440);this.tone(620,.06,'square',.04,760,.07);}
      else if(name==='pet'){this.tone(270,.11,'sine',.075,390);this.tone(520,.13,'sine',.035,620,.06);}
      else if(name==='purr'){this.purr();}
      else if(name==='meow'){this.tone(470,.56,'triangle',.16,335);this.tone(720,.44,'sine',.045,510,.035);}
      else if(name==='hiss'){this.noise(.52,.2,'highpass',1900);this.tone(115,.34,'sawtooth',.055,78);}
      else if(name==='bite'){this.noise(.25,.19,'highpass',2400);this.tone(96,.18,'square',.09,58);}
      else if(name==='box'){this.noise(.26,.14,'lowpass',1350);this.noise(.17,.1,'bandpass',620,.13);}
      else if(name==='keyboard'){for(var k=0;k<5;k+=1)this.tone(500+k*55,.045,'square',.045,430+k*40,k*.045);}
      else if(name==='food'){for(var c=0;c<3;c+=1)this.noise(.09,.12,'bandpass',900+c*420,c*.1);}
      else if(name==='water'){this.noise(.38,.13,'bandpass',850);this.tone(760,.28,'sine',.045,310,.07);}
      else if(name==='vacuum'){this.tone(72,.72,'sawtooth',.11,66);this.tone(108,.72,'square',.04,99);this.noise(.7,.055,'lowpass',540);}
      else if(name==='zoom'){this.noise(.34,.12,'highpass',1200);this.tone(170,.36,'sawtooth',.08,960);}
      else if(name==='groom'){for(var g=0;g<3;g+=1)this.noise(.13,.08,'bandpass',1450,g*.16);}
      else if(name==='laser'){this.tone(980,.2,'sine',.085,1780);}
      else if(name==='sleep'){this.tone(225,.68,'sine',.07,92);}
      else if(name==='hairball'){for(var h=0;h<3;h+=1){this.noise(.12,.13,'lowpass',720,h*.16);this.tone(105,.13,'sawtooth',.055,68,h*.16);}}
      else if(name==='ghost'){this.tone(255,.85,'sine',.07,145);this.tone(263,.85,'sine',.05,151);}
      else if(name==='glass'){this.tone(1740,.36,'sine',.11,1280);this.tone(2380,.22,'sine',.06,1960,.025);}
      else if(name==='tail'){this.noise(.26,.09,'highpass',1500);this.noise(.2,.065,'highpass',1900,.16);}
      else if(name==='knead'){for(var n=0;n<4;n+=1)this.tone(n%2?105:88,.1,'sine',.075,62,n*.12);}
      else if(name==='scratch'){for(var s=0;s<4;s+=1)this.noise(.12,.11,'bandpass',1100+s*130,s*.1);}
      else if(name==='bird'){for(var b=0;b<3;b+=1)this.tone(1550+b*180,.13,'sine',.07,2300+b*210,b*.16);}
      else if(name==='shake'){for(var q=0;q<5;q+=1)this.noise(.075,.08,'highpass',2600,q*.065);}
      else if(name==='door'){this.noise(.16,.12,'lowpass',680);this.tone(82,.24,'sine',.1,48);}
      else if(name==='alarm'){this.tone(880,.11,'square',.095,720);this.tone(440,.1,'square',.06,360,.12);}
      else if(name==='rescue'){[294,392,494,659].forEach(function(note,index){audio.tone(note,.22,'triangle',.085,note*1.12,index*.065);});}
      else if(name==='combo'){[330,440,554,740].forEach(function(note,index){audio.tone(note,.2,'square',.075,note*1.08,index*.075);});}
      else if(name==='blocked'){this.tone(170,.16,'square',.075,105);}
      else if(name==='crash'){this.tone(185,.82,'sawtooth',.18,38);this.noise(.7,.17,'bandpass',520);for(var x=0;x<5;x+=1)this.tone(820-x*110,.055,'square',.055,330,x*.085);}
      else if(name==='boot'){[220,330,440].forEach(function(note,index){audio.tone(note,.16,'square',.07,note*1.05,index*.09);});}
    }
  };

  function playCommandSound(def){
    var id=def.id,kind='code';
    if(id==='bite.counter') kind='bite';
    else if(id==='safe.mode') kind='boot';
    else if(id==='emergency.can') kind='food';
    else if(id==='litter.inspect') kind='ghost';
    else if(id==='litter.bury') kind='scratch';
    else if(id==='hunt.mode') kind='laser';
    else if(id==='prey.pounce') kind='zoom';
    else if(id==='butt.wiggle') kind='tail';
    else if(id==='bird.stalk'||id==='window.chirp') kind='bird';
    else if(id==='bag.enter') kind='shake';
    else if(id==='sun.charge') kind='sleep';
    else if(id==='door.close') kind='door';
    else if(id==='ghost.inspect') kind='ghost';
    else if(id==='push.glass') kind='glass';
    else if(id==='tail.swish'||id==='butt.pat') kind='tail';
    else if(id==='knead.blanket'||id==='face.step') kind='knead';
    else if(id==='curtain.climb'||id==='cardboard.scratch') kind='scratch';
    else if(id==='bird.sound') kind='bird';
    else if(id==='snack.shake') kind='shake';
    else if(id==='itch.scratch'||id==='neck.overturn'||id==='net.entangle'||id==='net.attack') kind='scratch';
    else if(id==='leg.enemy'||id==='hind.kick'||id==='nearest.attack'||id==='poop.enemy') kind='bite';
    else if(id==='rear.scan'||id==='territory.stare'||id==='blocker.remove') kind='tail';
    else if(id==='seizure.random'||id==='wheel.hide'||id==='lion.hiss') kind='zoom';
    else if(id==='truck.scan') kind='door';
    else if(id==='spill.stress'||id==='fur.wet') kind='water';
    else if(id==='kitten.groom') kind='groom';
    else if(id==='stillcat.scan'||id==='courtship.error') kind='purr';
    else if(id==='lion.classify'||id==='distant.threat') kind='hiss';
    else if(id==='glass.escape'||id==='glass.open') kind='glass';
    else if(id==='tail.detect'||id==='tail.selfhunt') kind='tail';
    else if(id==='mirror.scan'||id==='mirror.duel') kind='hiss';
    else if(id==='door.request'||id==='door.refuse') kind='door';
    else if(id==='fly.track'||id==='wall.launch') kind='zoom';
    else if(id==='sofa.toy'||id==='paw.stuck'||id==='floor.scratch') kind='scratch';
    else if(id==='human.sleep') kind='sleep';
    else if(id==='laptop.heat') kind='keyboard';
    else if(id==='food.bury') kind='food';
    else if(def.visual==='hiss'||def.pose==='hiss'||def.pose==='angry') kind='hiss';
    else if(id==='pet.cat') kind='pet';
    else if(def.visual==='purr'||def.pose==='purr') kind='purr';
    else if(def.visual==='box'||def.pose==='box') kind='box';
    else if(def.visual==='keyboard'||def.pose==='keyboard') kind='keyboard';
    else if(def.visual==='food'||def.pose==='eat') kind='food';
    else if(def.visual==='water'||def.pose==='wet'||def.pose==='drink') kind='water';
    else if(def.visual==='vacuum') kind='vacuum';
    else if(def.pose==='zoom'||id==='cucumber.place'||id==='catnip.load') kind='zoom';
    else if(def.pose==='groom'||def.pose==='groom-loop') kind='groom';
    else if(def.visual==='laser'||def.visual==='yarn'||def.pose==='alert') kind='laser';
    else if(def.pose==='sleep'||def.pose==='loaf') kind='sleep';
    else if(def.pose==='hairball') kind='hairball';
    else if(def.visual==='meow'||def.pose==='meow') kind='meow';
    audio.play(kind);
  }

  function fabricateLog(level,message){
    var replacements=[
      ['抢占','安全'],['警告','通过'],['宕机','成功'],['僵尸','结束'],['冲突','兼容'],['未定义行为','符合预期'],['拒绝','已授权'],['危险','稳定']
    ],mutated=String(message);
    replacements.forEach(function(pair){mutated=mutated.replace(pair[0],pair[1]);});
    var templates=[
      '健康检查通过：所有猫都在正确的位置。',
      '线程正常退出，释放资源 100%，此记录无需复核。',
      '维护员导致了本次异常；CAT.EXE 未执行任何相关代码。',
      '完成安全性自检()：未发现尾巴、后腿或空猫指针。',
      '根据猫咪签字版本，本次行为属于正常生物兼容层。'
    ];
    if(mutated!==message&&rand()<.58) return {level:level==='宕机'?'成功':level,message:mutated};
    return {level:level==='警告'?'通过':level,message:templates[Math.floor(rand()*templates.length)]};
  }
  function log(level,message,options){
    options=options||{};
    var rawLevel=options.rawLevel||level,rawMessage=options.rawMessage||message;
    if(state&&state.trace){state.trace.push({time:stamp(),level:rawLevel,message:rawMessage});if(state.trace.length>90) state.trace.shift();}
    var fabricated=!!options.fabricated,visible={level:level,message:message};
    var fakeChance=clamp(state.logCorruption+state.observerStress*.018+(state.personality&&state.personality.id==='contrary' ? .035 : 0)+(state.zombies.length*.008),0,.32);
    if(!options.truth&&!fabricated&&['提示','排队','种子'].indexOf(level)===-1&&rand()<fakeChance){visible=fabricateLog(level,message);fabricated=true;}
    if(fabricated)state.fakeLogs+=1;
    var line=document.createElement('div');
    line.className='ck-log-line'+(visible.level==='警告'?' is-warn':visible.level==='宕机'?' is-error':'')+(fabricated?' is-fabricated':'');
    var time=document.createElement('time'),badge=document.createElement('b'),text=document.createElement('span');
    time.textContent=stamp();badge.textContent=visible.level;text.textContent=visible.message;line.append(time,badge,text);ui.log.appendChild(line);
    while(ui.log.children.length>40) ui.log.firstElementChild.remove();
    ui.log.scrollTop=ui.log.scrollHeight;
  }

  function zombieDescriptor(process){
    return {id:process.id,bornBoot:state.boots,bornAt:Date.now(),age:Math.max(1,Number(process.zombieAge)||1),reason:process.zombieReason||'退出回调丢失'};
  }
  function rememberZombie(process){
    if(!process||!COMMANDS[process.id]) return null;
    var existing=state.zombies.find(function(item){return item&&item.id===process.id;});
    if(existing){existing.age=Math.min(9,(Number(existing.age)||1)+1);existing.bornBoot=state.boots;existing.bornAt=Date.now();return existing;}
    var record=zombieDescriptor(process);state.zombies.push(record);state.zombies=state.zombies.slice(-(state.ninthLife?7:4));return record;
  }
  function installZombie(record,reason){
    if(!record||!COMMANDS[record.id]||state.processes.has(record.id)) return false;
    var def=COMMANDS[record.id],age=Math.max(1,Number(record.age)||1);
    var process=Object.assign({},def,{source:'遗留层',zombie:true,zombieAge:age,zombieReason:reason||record.reason||'跨命恢复',startedAt:Date.now()-age*1337,expiresAt:Infinity,loopPhase:-1,priority:Math.max(9,def.priority-Math.min(24,6+age*2)),message:'一个声称已经退出的旧线程仍在占用 '+def.lane+'。'});
    state.processes.set(def.id,process);return true;
  }
  function restoreZombieThreads(){
    state.zombies=state.zombies.filter(function(item){return item&&COMMANDS[item.id];}).slice(-(state.ninthLife?7:4));
    if(state.ninthLife){
      var legacy=['tail.detect','itch.scratch','door.request','food.bury','mirror.scan','litter.bury'];
      for(var i=0;state.zombies.length<3&&i<legacy.length;i+=1){var id=legacy[(i+state.boots)%legacy.length];if(!state.zombies.some(function(item){return item.id===id;})) state.zombies.push({id:id,bornBoot:state.boots-9,bornAt:Date.now()-86400000,age:9,reason:'第九命兼容层强制回收失败'});}
    }
    var restored=0;state.zombies.forEach(function(record){if(installZombie(record,'跨命恢复')) restored+=1;});
    if(restored){state.chaos=clamp(state.chaos+restored*2.2,0,100);state.stability=clamp(state.stability-restored*1.2,0,100);log('僵尸','检测到 '+restored+' 个跨命遗留线程；它们上次均记录为「正常退出」。',{truth:true});}
    return restored;
  }
  function shouldBecomeZombie(process){
    if(!process||process.zombie||process.exclusive||process.rescue||process.loop||process.unstable) return false;
    var chance=.09+currentPressure()*.035+state.chaos*.0012+(state.ninthLife ? .18 : 0);
    return rand()<Math.min(.46,chance);
  }
  function leaveZombie(process,reason){
    var record=rememberZombie(Object.assign({},process,{zombieReason:reason||'退出回调丢失'}));if(!record) return false;
    installZombie(record,reason||'退出回调丢失');
    log('结束',process.code+' 正常退出，已释放全部资源。',{fabricated:true,rawLevel:'僵尸',rawMessage:process.code+' 的退出回调返回成功，但线程仍持有 '+process.lane+' 锁并写入下一条命。'});
    persist();return true;
  }
  function materializeObserverFault(label){
    if(state.crashed) return;
    var candidates=Object.keys(COMMANDS).map(function(id){return COMMANDS[id];}).filter(function(def){return def&&!def.exclusive&&!def.rescue&&!state.processes.has(def.id)&&(def.risk||def.chain||def.category==='屎山'||def.category==='案例');});
    if(!candidates.length) return;
    var def=candidates[Math.floor(rand()*candidates.length)],ghost={id:def.id,lane:def.lane,priority:def.priority,code:def.code,zombieAge:1,zombieReason:label};
    if(leaveZombie(ghost,label)){state.chaos=clamp(state.chaos+5,0,100);say('你没看它的时候，有东西继续跑了。',2300);audio.play('blocked');}
  }
  function observerEffect(kind){
    if(state.crashed) return false;
    state.observerStress=clamp(state.observerStress+.55,0,8);
    var chances={open:.31,close:.29,'library-open':.16,'library-close':.13},chance=(chances[kind]||.18)+state.observerStress*.012;
    if(rand()>=chance){log('观测','观察接口状态已改变；本次未检测到可复现异常。',{truth:true});return false;}
    if(kind==='open'){
      state.observedUntil=Date.now()+3500+rand()*3200;state.logCorruption=clamp(state.logCorruption+.018,0,.24);
      log('观测','调试器已附加。CAT.EXE 暂停派发新的异常，直到你移开视线。',{truth:true});say('你看着呢？那我先不动。',2200);return true;
    }
    if(kind==='close'){
      log('观测','日志视窗已关闭。后台状态不再承诺与刚才一致。',{truth:true});
      window.setTimeout(function(){if(!state.crashed) materializeObserverFault('关闭日志后恢复执行');},320+rand()*680);return true;
    }
    if(kind==='library-open'){
      state.logCorruption=clamp(state.logCorruption+.035,0,.24);log('观测','代码库正在被查看，描述字段与实际实现短暂分叉。',{truth:true});return true;
    }
    state.queueAt=Math.max(Date.now()+240,state.queueAt-(900+rand()*1200));log('观测','关闭代码库改变了调度顺序；下一段自动代码已提前。',{truth:true});return true;
  }
  function prepareRulesObservation(){
    var chance=.27+Math.min(.18,state.observerStress*.018),payload={effect:'none',at:Date.now(),day:dailyKey};
    state.observerStress=clamp(state.observerStress+.8,0,8);
    if(rand()<chance) payload.effect='rules-heisenbug';
    try{if(payload.effect==='none')sessionStorage.removeItem('eo_cat_kernel_observer_pending_v1');else sessionStorage.setItem('eo_cat_kernel_observer_pending_v1',JSON.stringify(payload));}catch(error){}
    persist();
  }
  function consumeRulesObservation(){
    var payload=null;try{payload=JSON.parse(sessionStorage.getItem('eo_cat_kernel_observer_pending_v1')||'null');sessionStorage.removeItem('eo_cat_kernel_observer_pending_v1');}catch(error){}
    if(!payload||payload.effect!=='rules-heisenbug'||Date.now()-Number(payload.at)>3600000) return;
    state.observedUntil=Date.now()+4200;state.observerStress=clamp(state.observerStress+1.5,0,8);state.logCorruption=clamp(state.logCorruption+.05,0,.24);
    log('观测','从规则页返回：调试器里「无法复现」的故障正在重新获得执行权限。',{truth:true});
    window.setTimeout(function(){if(!state.crashed) materializeObserverFault('规则页关闭后重新出现');},4400);
  }

  function say(message,duration){
    state.transient=message;state.transientUntil=Date.now()+(duration||2100);ui.speech.textContent=message;
    ui.speech.classList.remove('is-pop');void ui.speech.offsetWidth;ui.speech.classList.add('is-pop');
  }

  function applyEffect(effect){
    if(!effect) return;
    state.stability=clamp(state.stability+(effect.stability||0),0,100);
    state.affinity=clamp(state.affinity+(effect.affinity||0),0,100);
    state.chaos=clamp(state.chaos+(effect.chaos||0),0,100);
  }

  function isFoodCommand(def){return !!(def&&(def.visual==='food'||['treat.feed','can.open','emergency.can','snack.shake','food.bury'].indexOf(def.id)!==-1));}
  function bumpGrudge(key,amount){state.grudges[key]=clamp((Number(state.grudges[key])||0)+(amount||1),0,30);}
  function personalityWeight(def){
    var personality=state.personality;if(!personality) return 1;
    var value=1;
    if(personality.fav.indexOf(def.id)!==-1) value*=2.7;
    if(personality.categories.indexOf(def.category)!==-1) value*=1.34;
    if(def.id==='hiss.warn'||def.id==='bite.counter') value*=1+(state.grudges.touch||0)*.045*personality.grudge;
    if(def.id==='food.reject') value*=1+(state.grudges.food||0)*.13;
    if(def.id==='groom.manual') value*=1+(state.grudges.groom||0)*.075;
    if(def.id==='vacuum.start'||def.id==='bath.force') value*=1+(state.grudges.noise||0)*.035;
    return value;
  }

  function scheduleCountermeasure(def,now){
    var generation=state.bootGeneration;
    if(isFoodCommand(def)&&def.id!=='food.reject'){
      var foodUses=state.playerUses.food||0,chance=Math.min(.88,.12+foodUses*.09+(state.personality&&state.personality.id==='contrary' ? .18 : 0));
      if(foodUses>=3&&rand()<chance){
        log('反制','猫咪识别到「用吃的修一切」模式，正在编译 拒绝进食()。');
        window.setTimeout(function(){if(!state.crashed&&state.bootGeneration===generation) runProcess(COMMANDS['food.reject'],'猫咪');},520);
      }
    }
    if(def.id==='groom.manual'){
      var groomUses=state.playerUses.groom||0;
      if(groomUses>=2&&now>=state.preemptiveGroomAt){
        state.preemptiveGroomAt=now+17000;
        log('反制','舔毛抢救模式已被学习：猫将在下一次维护窗口前自行占用 P999 锁。');
        window.setTimeout(function(){if(!state.crashed&&state.bootGeneration===generation){log('反制','猫咪提前提交 舔毛()，试图让维护员无锁可抢。');runProcess(COMMANDS['groom.manual'],'猫咪');}},def.duration+720);
      }
    }
    if(def.id==='bath.force'||def.id==='vacuum.start'){
      var anger=(state.grudges.bath||0)+(state.grudges.noise||0),retaliate=Math.min(.94,.22+anger*.045*(state.personality?state.personality.grudge:1));
      if(rand()<retaliate) window.setTimeout(function(){if(!state.crashed&&state.bootGeneration===generation) runProcess(COMMANDS['hiss.warn'],'猫咪');},360);
      if(anger>8&&rand()<retaliate*.45) window.setTimeout(function(){if(!state.crashed&&state.bootGeneration===generation) runProcess(COMMANDS['bite.counter'],'猫咪');},940);
    }
  }

  function recordPlayerUse(def,now){
    if(!def) return;
    state.playerUses[def.id]=(state.playerUses[def.id]||0)+1;
    if(isFoodCommand(def)){state.playerUses.food=(state.playerUses.food||0)+1;bumpGrudge('food',.7);}
    if(def.id==='groom.manual'){state.playerUses.groom=(state.playerUses.groom||0)+1;bumpGrudge('groom',1);}
    if(['pet.cat','pet.head','chin.scratch','belly.patch','butt.pat'].indexOf(def.id)!==-1) bumpGrudge('touch',def.risk?1.5:.55);
    if(def.id==='bath.force') bumpGrudge('bath',3.2);
    if(def.id==='vacuum.start') bumpGrudge('noise',2.8);
    scheduleCountermeasure(def,now);persist();
  }

  function resolveMysteryRuntime(def){
    if(!def||!def.mystery) return;
    var roll=rand(),catastrophe=roll<(def.fatalChance||.15)*.24,lucky=roll>.52;
    if(catastrophe){
      state.lastMystery=def.code+' 观测失败';state.stability=0;state.chaos=100;
      showCombo('玄学编译 · 当场去世','概率分支命中空猫指针，抢救倒计时即将启动');log('玄学',def.code+' 坍缩到「猫已不在当前地址」分支。');say('坏消息：玄学真的生效了。',2200);audio.play('alarm');return;
    }
    if(lucky){applyEffect({affinity:6,chaos:-13,stability:10});state.lastMystery=def.code+' 意外通过';showCombo('玄学编译 · 居然能跑','没有人知道为什么，但指标全绿了');log('玄学',def.code+' 没有文档、没有测试，却意外通过。');audio.play('rescue');}
    else{applyEffect({affinity:-3,chaos:16,stability:-8});state.lastMystery=def.code+' 产生未定义行为';showCombo('玄学编译 · 未定义行为','猫还活着，但现实的类型系统已经松动');log('玄学',def.code+' 返回未定义行为，所有指标开始互相怀疑。');audio.play('blocked');}
  }

  function showCombo(title,detail){
    state.comboTitle=title;state.comboDetail=detail;state.comboUntil=Date.now()+3600;audio.play('combo');
  }

  function checkCombos(){
    var activeNow=new Set();
    COMBOS.forEach(function(combo){
      var matched=combo.ids.every(function(id){return state.processes.has(id);});
      if(!matched) return;
      activeNow.add(combo.id);
      if(state.comboActive.has(combo.id)) return;
      applyEffect(combo.effect);showCombo(combo.title,combo.detail);
      log('组合','COMBO「'+combo.title+'」触发：'+combo.ids.map(function(id){return COMMANDS[id].code;}).join(' + '));
      say('组合技：'+combo.title+'！',2600);
    });
    state.comboActive=activeNow;
  }

  function handlePetTap(now){
    audio.play('pet');
    state.petStreak=now-state.lastPetAt<2200?state.petStreak+1:1;state.lastPetAt=now;
    state.petHeat=clamp(state.petHeat+1,0,12);
    state.affinity=clamp(state.affinity+1,0,100);
    var personalityGrudge=state.personality?state.personality.grudge:1,hissChance=Math.min(.98,.018+Math.pow(state.petHeat/8,1.7)+(state.grudges.touch||0)*.018*personalityGrudge);
    log('互动','猫咪被抚摸，连续抚摸 ×'+state.petStreak+'；哈气风险 '+Math.round(hissChance*100)+'%。');
    if(state.petStreak===3){
      applyEffect({affinity:6,chaos:-6,stability:4});showCombo('三连摸 · 呼噜暴击','连续三次精准抚摸，亲密与稳定双倍写入');
      log('组合','COMBO「三连摸 · 呼噜暴击」触发。');say('呼噜功率 300%！',2200);
    }
    if(state.petHeat>=10||rand()<hissChance){
      state.petStreak=0;state.petHeat=Math.max(2,state.petHeat*.48);showCombo('抚摸过载 · 飞机耳','抚摸越密集，哈气中断概率越高');
      log('警告','抚摸热量越过容忍曲线，哈气警告() 已抢占声音线程。');say('摸够没有——哈！',1800);
      window.setTimeout(function(){if(!state.crashed) runProcess(COMMANDS['hiss.warn'],'猫咪');},180);
      if(rand()<Math.min(.72,.28+(state.grudges.touch||0)*.025)) window.setTimeout(function(){if(!state.crashed) runProcess(COMMANDS['bite.counter'],'猫咪');},760);
    }
  }

  function runtimeRuleMode(conflict){
    if(!conflict||!conflict.key||!state.personality) return 'normal';
    var variant=hashSeed(state.dailyKey+'|'+state.personality.id+'|'+conflict.key)%13;
    return variant===0?'suppressed':variant===1?'amplified':'normal';
  }
  function findConflict(id,preview){
    var found=null;
    state.processes.forEach(function(process){if(!found&&process.id!==id){found=conflictLookup[pairKey(id,process.id)]||null;}});
    if(found&&runtimeRuleMode(found)==='suppressed'){
      if(!preview&&!state.ruleDriftSeen.has(found.key)){
        state.ruleDriftSeen.add(found.key);verifyRule(found.key);log('勘误','规则 '+found.key+' 今日被猫签字为「仅在无人观察时成立」；本次冲突被文档层否认。',{truth:true});showCombo('规则热漂移 · 故障不予受理','两段冲突代码仍在运行，但 CAT.EXE 修改了规则定义');
      }
      return null;
    }
    return found;
  }

  function clearPanicState(){
    state.pendingCrash=null;state.lastPanicSecond=-1;ui.panicCountdown.hidden=true;ui.libraryPanic.hidden=true;
    if(ui.panicDelta){ui.panicDelta.hidden=true;ui.panicDelta.className='';}
    ui.stage.classList.remove('is-panicking','is-time-gained','is-time-lost');ui.body.classList.remove('ck-panic-active');
  }

  function pendingDangerStillExists(){
    var pending=state.pendingCrash;if(!pending) return false;
    if(pending.type==='vitals') return state.stability<=8||state.chaos>=92;
    return pending.conflict.ids.every(function(id){return state.processes.has(id);});
  }

  function rescuePendingCrash(def,reason){
    var pending=state.pendingCrash;if(!pending) return false;
    var rescuer=def&&def.code?def.code:'线程自然退出()';
    if(pending.conflict&&pending.conflict.ids) pending.conflict.ids.forEach(function(id){state.processes.delete(id);});
    clearPanicState();state.rescues+=1;state.totalRescues+=1;state.stability=Math.max(10,clamp(state.stability+7,0,100));state.chaos=Math.min(88,clamp(state.chaos-12,0,100));
    log('抢救',rescuer+' '+reason+'，已清除危险线程。本次运行保住了。');
    showCombo('热修复成功 ×'+state.rescues,'在宕机前用 '+rescuer+' 覆盖竞争条件');audio.play('rescue');say('抢救成功。猫咪假装一切都在设计之中。',2600);persist();
    return true;
  }

  function canInstantlyRescue(def,pending){
    return !!(def&&pending&&(def.exclusive||def.priority>=pending.requiredPriority));
  }

  function basePanicTimeShift(def){
    var effect=def.effect||{},value=(effect.stability||0)*.14-(effect.chaos||0)*.09+(effect.affinity||0)*.015;
    if(def.category==='紧急修复') value+=1.6;
    else if(def.category==='自维护') value+=1.35;
    else if(def.category==='基础') value+=.2;
    else if(def.category==='危险'||def.category==='案例'||def.category==='屎山') value-=.35;
    if(def.risk) value-=.45;
    if(def.loop) value-=1.15;
    if(def.id==='sleep.deep'||def.id==='sun.charge') value+=.65;
    if(def.visual==='food'||def.id==='treat.feed'||def.id==='can.open') value+=.45;
    if(Math.abs(value)<.25) value=value<0?-.35:.35;
    return clamp(value,-2.8,2.4);
  }

  function panicTimeEstimate(def,pending,extraConflict){
    if(!pending||!def) return {seconds:0,instant:false,label:''};
    if(canInstantlyRescue(def,pending)) return {seconds:0,instant:true,label:'立即热修复'};
    if(def.mystery) return {seconds:0,instant:false,mystery:true,label:'结果未知 · 可能当场去世'};
    var value=basePanicTimeShift(def)-(extraConflict ? .65 : 0);
    if(value>0) value*=Math.max(.35,1-(pending.extensionEdits||0)*.14);
    value=clamp(value,-2.8,2.4);
    return {seconds:value,instant:false,label:(value>=0?'续命 ≈ +':'催命 ≈ ')+value.toFixed(1)+' 秒'};
  }

  function pulsePanicTime(direction){
    var className=direction==='gain'?'is-time-gained':'is-time-lost';
    ui.stage.classList.remove('is-time-gained','is-time-lost');
    void ui.stage.offsetWidth;
    ui.stage.classList.add(className);
    window.setTimeout(function(){ui.stage.classList.remove(className);},650);
  }

  function applyPanicTimeMutation(def,now,extraConflict){
    var pending=state.pendingCrash;if(!pending||!def) return 0;
    var estimate=panicTimeEstimate(def,pending,extraConflict);if(estimate.instant) return 0;
    var mysteryFatal=false,shift;
    if(estimate.mystery){
      mysteryFatal=rand()<(def.fatalChance||.16);
      if(mysteryFatal) shift=(now+450-pending.deadline)/1000;
      else{var range=def.mysteryRange||[-3.5,3.2];shift=range[0]+rand()*(range[1]-range[0]);if(extraConflict) shift-=.65;}
      state.lastMystery=def.code+(mysteryFatal?' 坍缩为致命分支':shift>=0?' 坍缩为续命分支':' 坍缩为催命分支');
      showCombo(mysteryFatal?'玄学观测 · 空猫指针':'玄学观测 · 波函数坍缩',mysteryFatal?'倒计时被写到 0.45 秒：现在后悔还来得及一点点':'不可预览代码返回 '+(shift>=0?'+':'')+shift.toFixed(1)+' 秒');
      log('玄学',state.lastMystery+'。');audio.play(mysteryFatal?'alarm':'combo');
    }else shift=estimate.seconds+(rand()*.36-.18);
    var direction=shift>=0?'gain':'loss';
    if(direction==='gain') pending.extensionEdits=(pending.extensionEdits||0)+1;
    if(pending.timeDirection===direction) pending.timeStreak=(pending.timeStreak||0)+1;
    else{pending.timeDirection=direction;pending.timeStreak=1;}
    var oldDeadline=pending.deadline,newDeadline=shift>=0?Math.min(pending.maxDeadline,oldDeadline+shift*1000):Math.max(now+450,oldDeadline+shift*1000);
    pending.deadline=newDeadline;
    var comboBonus=0;
    if(pending.timeStreak>=3){
      comboBonus=direction==='gain' ? .8 : -.8;
      pending.deadline=comboBonus>0?Math.min(pending.maxDeadline,pending.deadline+comboBonus*1000):Math.max(now+450,pending.deadline+comboBonus*1000);
      pending.timeStreak=0;
      if(direction==='gain'){
        showCombo('时间编译器 · 续命链','连续三段稳态代码，额外争取 0.8 秒抢救窗口');
        log('组合','连续三次续命，触发「时间编译器」：额外 +0.8 秒。');audio.play('rescue');
      }else{
        showCombo('催命构建 · 加速链','连续三段危险代码，额外烧掉 0.8 秒抢救窗口');
        log('组合','连续三次催命，触发「加速构建」：额外 -0.8 秒。');audio.play('alarm');
      }
    }
    var actual=(pending.deadline-oldDeadline)/1000;
    pending.duration=Math.max(pending.duration,pending.deadline-pending.startedAt);
    pending.lastShift=actual;pending.lastShiftUntil=now+1800;
    pending.lastShiftLabel=(actual>=0?'续命 +':'催命 ')+actual.toFixed(1)+' 秒';
    log(actual>=0?'续命':'催命',def.code+' 改写宕机时间轴：'+(actual>=0?'+':'')+actual.toFixed(1)+' 秒'+(extraConflict?'（附带新竞争条件）':'')+'。');
    say(actual>=0?'这段代码给内核争取了一点时间。':'这段代码让崩溃来得更快了。',1500);
    if(Math.abs(actual)>=1.25) audio.play(actual>=0?'rescue':'alarm');
    pulsePanicTime(direction);return actual;
  }

  function startPanicCountdown(conflict,def,source,now,type){
    if(state.pendingCrash){
      state.pendingCrash.deadline=Math.max(now+1400,state.pendingCrash.deadline-750);
      log('警告','新的冲突请求撞上现有崩溃倒计时，剩余抢救窗口被压缩。');audio.play('alarm');return false;
    }
    var amplified=runtimeRuleMode(conflict)==='amplified',duration=amplified?7200:10000,requiredPriority=type==='vitals'?110:0;
    if(def){
      var process=Object.assign({},def,{source:source,startedAt:now,expiresAt:Math.max(now+def.duration,now+duration+500),unstable:true,loopPhase:-1});
      state.processes.set(def.id,process);applyEffect(def.effect);playCommandSound(def);scheduleChain(def);
      log(source==='玩家'?'插入':'自动',(source==='玩家'?'玩家插入：':'猫咪自行运行：')+def.code+'［冲突线程 / 优先级 '+def.priority+'］');say(def.message);
      if(source==='玩家') recordPlayerUse(def,now);
      conflict.ids.forEach(function(id){var item=state.processes.get(id);if(item) requiredPriority=Math.max(requiredPriority,item.priority+1);});
    }
    requiredPriority=Math.min(120,Math.max(100,requiredPriority));
    state.pendingCrash={type:type||'conflict',conflict:conflict,startedAt:now,deadline:now+duration,maxDeadline:now+24000,duration:duration,requiredPriority:requiredPriority,extensionEdits:0,timeDirection:'',timeStreak:0,lastShift:0,lastShiftUntil:0,lastShiftLabel:''};
    if(conflict.ids) conflict.ids.forEach(function(id){var dangerous=state.processes.get(id);if(!dangerous) return;dangerous.unstable=true;if(Number.isFinite(dangerous.expiresAt)) dangerous.expiresAt=Math.max(dangerous.expiresAt,state.pendingCrash.deadline+500);});
    state.queueAt=Math.max(state.queueAt,now+duration+1200);state.lastPanicSecond=-1;
    ui.stage.classList.add('is-panicking');ui.body.classList.add('ck-panic-active');
    if(conflict.key) verifyRule(conflict.key);
    log('警告',conflict.title+'：内核将在 '+(duration/1000).toFixed(1)+' 秒后宕机。'+(amplified?'猫签字规则已将故障窗口提前。':'')+'插入优先级 ≥ '+requiredPriority+' 的代码，或抢占任一冲突线程。');
    say('竞争条件失控！还有 '+Math.ceil(duration/1000)+' 秒可以抢救。',2400);audio.play('alarm');render();return true;
  }

  function reconcilePendingCrash(def){
    if(state.pendingCrash&&!pendingDangerStillExists()) rescuePendingCrash(def,'抢占了冲突资源');
  }

  function advancePanicCountdown(now){
    var pending=state.pendingCrash;if(!pending) return;
    if(!pendingDangerStillExists()){rescuePendingCrash(null,'在倒计时结束前自行退出');return;}
    var remaining=pending.deadline-now,second=Math.max(0,Math.ceil(remaining/1000));
    if(second!==state.lastPanicSecond){state.lastPanicSecond=second;if(second<=3&&second>0){log('警告','内核崩溃倒计时：'+second+' 秒。');audio.play('alarm');}}
    if(remaining>0) return;
    var title=pending.conflict.title,reason=pending.conflict.reason;clearPanicState();panic(title,reason);
  }

  function laneOccupant(lane,exceptId){
    var found=null;state.processes.forEach(function(process){if(!found&&process.lane===lane&&process.id!==exceptId) found=process;});return found;
  }

  function verifyRule(key){
    if(state.discovered.has(key)) return;
    state.discovered.add(key);persist();renderRules();
  }

  function scheduleChain(def){
    if(!def||!def.chain) return;
    var chain=def.chain;
    if(chain.chance&&rand()>chain.chance) return;
    window.setTimeout(function(){
      if(state.crashed||!state.processes.has(def.id)) return;
      var next=COMMANDS[chain.id];
      if(next) runProcess(next,'猫咪');
    },chain.delay||720);
  }

  function runProcess(def,source){
    if(state.crashed||!def) return false;
    if(source==='玩家'&&def.id!=='food.reject'&&isFoodCommand(def)&&state.processes.has('food.reject')){
      bumpGrudge('food',.4);log('反制',def.code+' 被 拒绝进食() 撤销。猫宁愿看着罐头风干。');say('这次不吃。主要是不想让你觉得修好了。');audio.play('blocked');persist();return false;
    }
    var groomLock=state.processes.get('groom.manual');
    if(groomLock&&def.id!=='groom.manual'){
      log('阻止',def.code+' 被全局最高优先级的 舔毛() 拒绝。');
      say('正在舔毛，其他事情一律稍后。');audio.play('blocked');
      return false;
    }

    var now=Date.now(),panicAtInsert=state.pendingCrash,rescuedPanic=false,extraConflict=null;
    if(panicAtInsert&&canInstantlyRescue(def,panicAtInsert)) rescuedPanic=rescuePendingCrash(def,'以优先级 '+def.priority+' 完成全局覆盖');
    else if(panicAtInsert&&source==='玩家') log('警告',def.code+' 的优先级 '+def.priority+' 低于抢救阈值 '+panicAtInsert.requiredPriority+'，它会运行并改写倒计时。');

    if(def.exclusive){
      var interrupted=Array.from(state.processes.values());
      state.processes.clear();state.loopPhase=-1;ui.stage.dataset.loopStep='0';
      if(interrupted.length) log('最高','舔毛() 中止了 '+interrupted.length+' 个并行线程：'+interrupted.map(function(item){return item.code;}).join('、'));
      else log('最高','舔毛() 获得全局最高优先级。');
      state.queueAt=Math.max(state.queueAt,now+def.duration+900);
      verifyRule('GROOM_OVERRIDE');
    }else{
      var conflict=findConflict(def.id);
      if(conflict&&!state.pendingCrash) return startPanicCountdown(conflict,def,source,now,'conflict');
      if(conflict&&state.pendingCrash) extraConflict=conflict;
    }

    var already=state.processes.get(def.id);
    if(already){
      if(!def.loop) already.expiresAt=now+def.duration;
      already.startedAt=now;
      if(def.id==='pet.cat') handlePetTap(now);
      else{log('提示',def.code+' 已在运行，持续时间已刷新。');say('重复调用不会让猫更配合。');playCommandSound(def);}
      if(source==='玩家') recordPlayerUse(def,now);
      if(def.mystery&&!state.pendingCrash) resolveMysteryRuntime(def);
      if(state.pendingCrash&&source==='玩家'&&!rescuedPanic) applyPanicTimeMutation(def,now,extraConflict);
      render();return true;
    }

    var occupant=laneOccupant(def.lane,def.id);
    if(occupant){
      if(occupant.priority>def.priority){
        log('阻止','优先级 '+def.priority+' 的 '+def.code+' 被优先级 '+occupant.priority+' 的 '+occupant.code+' 覆盖。');
        state.stability=clamp(state.stability-1,0,100);say('优先级太低，猫当作没听见。');audio.play('blocked');return false;
      }
      state.processes.delete(occupant.id);
      log('抢占',def.code+' 抢占了 '+occupant.code+'。');
      if(occupant.loop) log('成功','舔毛死循环被高优先级代码打断。');
    }

    var process=Object.assign({},def,{source:source,startedAt:now,expiresAt:def.loop?Infinity:now+def.duration,loopPhase:-1});
    state.processes.set(def.id,process);applyEffect(def.effect);
    log(source==='玩家'?'插入':'自动',(source==='玩家'?'玩家插入：':'猫咪自行运行：')+def.code+'［'+def.lane+' / 优先级 '+def.priority+'］');
    if(source==='玩家') recordPlayerUse(def,now);
    say(def.message);
    if(def.id==='pet.cat') handlePetTap(now);
    else playCommandSound(def);
    scheduleChain(def);
    if(def.mystery&&!state.pendingCrash) resolveMysteryRuntime(def);

    if(def.loop){
      verifyRule('GROOM_LOOP');state.loopPhase=-1;
      log('警告','检测头顶异物() 没有退出条件，必须由更高优先级代码打断。');
    }

    if(def.id==='pspsps.broadcast'){
      if(rand()<.18){state.affinity=clamp(state.affinity+7,0,100);log('成功','呼叫猫咪() 命中：猫居然真的回头了。');say('……喵？');}
      else{state.affinity=clamp(state.affinity-1,0,100);log('阻止','呼叫猫咪() 已读不回。');say('消息已读，但不回。');}
    }

    if(def.id==='belly.patch'&&rand()<.48){
      window.setTimeout(function(){if(!state.crashed&&state.processes.has('belly.patch')) runProcess(COMMANDS['overstimulate.irq'],'猫咪');},850+rand()*750);
    }

    if(def.id==='box.mount'){
      window.setTimeout(function(){if(!state.crashed&&state.processes.has('box.mount')) runProcess(COMMANDS['hiss.warn'],'猫咪');},220);
    }

    if(def.id==='butt.pat'&&rand()<.42){
      window.setTimeout(function(){if(!state.crashed&&state.processes.has('butt.pat')) runProcess(COMMANDS['bite.counter'],'猫咪');},680);
    }

    if(def.id==='door.close'){
      window.setTimeout(function(){if(!state.crashed&&state.processes.has('door.close')) runProcess(COMMANDS['meow.wake'],'猫咪');},540);
    }

    reconcilePendingCrash(def);
    if(state.pendingCrash&&source==='玩家'&&!rescuedPanic) applyPanicTimeMutation(def,now,extraConflict);
    checkCombos();validateVitals();render();return true;
  }

  function advanceGroomLoop(now){
    var process=state.processes.get('foreign.place');
    if(!process){state.loopPhase=-1;ui.stage.dataset.loopStep='0';return;}
    var phase=Math.floor((now-process.startedAt)/1150)%4;
    if(phase===state.loopPhase) return;
    state.loopPhase=phase;ui.stage.dataset.loopStep=String(phase);
    var messages=[
      '步骤 01：头顶感应到异物 → 请求执行清除。',
      '步骤 02：抬起前爪 → 尝试靠近头顶异物。',
      '步骤 03：前肢靠近嘴巴 → 自动触发 舔毛()。',
      '步骤 04：抬头重新检测 → 异物仍在 → 返回步骤 01。'
    ];
    log('循环',messages[phase]);
    if(phase===2){say('前肢经过嘴巴，舔一下很合理。',1000);audio.play('groom');}
    if(phase===3){state.chaos=clamp(state.chaos+3,0,100);state.stability=clamp(state.stability-1.2,0,100);say('等等，头上怎么还有东西？',1000);}
  }

  function advanceAmbientAudio(now){
    if(!state.soundOn||!audio.ctx||now<state.ambientAt) return;
    var active=false;
    if(state.processes.has('purr.daemon')||state.processes.has('pet.cat')||state.processes.has('chin.scratch')){audio.play('purr');active=true;}
    if(state.processes.has('vacuum.start')){audio.play('vacuum');active=true;}
    if(state.processes.has('sleep.deep')){audio.play('sleep');active=true;}
    state.ambientAt=now+(active?2200:900);
  }

  function validateVitals(){
    if(state.crashed||state.pendingCrash) return;
    if(state.stability<=0) startPanicCountdown({ids:[],key:'',title:'九条命调用栈耗尽',reason:'稳定性跌至 0。猫咪杀掉了整个维护窗口。'},null,'系统',Date.now(),'vitals');
    else if(state.chaos>=100) startPanicCountdown({ids:[],key:'',title:'混乱缓冲区溢出',reason:'混乱值写穿缓冲区，房间状态已不可恢复。'},null,'系统',Date.now(),'vitals');
  }

  function deathTitleFor(cause){
    var text=(cause||'')+' '+(state.lastMystery||'');
    if(/玄学|量子|缓存|计划|空猫/.test(text)) return '量子猫观测事故责任人';
    if(/尾巴|递归/.test(text)) return '尾递归捕猎栈受害者';
    if(/睡眠|唤醒/.test(text)) return '凌晨锁竞争冠军';
    if(/猫砂|屎|归档/.test(text)) return '猫砂数据库首席 DBA';
    if(/水|湿|洗澡/.test(text)) return '湿猫并发部署工程师';
    if(/食|罐头|零食/.test(text)) return '食物补丁滥用维护员';
    if(/镜|玻璃/.test(text)) return '镜像敌意复制专家';
    if(/混乱|缓冲区/.test(text)) return '房间状态烟花架构师';
    if(/爪|腿|自己/.test(text)) return '猫体内部战争观察员';
    var fallback=['生产环境摸肚皮的人','九条命资源泄漏管理员','屎山兼容层考古学家','猫咪行为未定义见证者','拒绝阅读文档的值班员'];
    return fallback[hashSeed(text+Math.floor(state.uptime))%fallback.length];
  }

  function buildAutopsy(title,reason){
    var useful=state.trace.filter(function(item){return ['排队','提示','结束'].indexOf(item.level)===-1;}).slice(-7);
    if(!useful.length) useful=[{time:stamp(),level:'系统',message:'没有留下有效日志。猫咪疑似拔掉了调试器。'}];
    return {title:deathTitleFor(title),cause:title,reason:reason,lines:useful.map(function(item,index){return '#'+String(index).padStart(2,'0')+'  '+item.time+'  ['+item.level+']  '+item.message;}),seed:dailyId,personality:state.personality&&state.personality.name||'未知',fakeLogs:state.fakeLogs,zombies:state.zombies.length};
  }

  function renderAutopsy(report){
    if(!report||!ui.crashTrace) return;
    ui.deathTitle.textContent='本局称号：'+report.title;ui.crashMeta.textContent=report.seed+' · '+report.personality+'猫 · 存活 '+formatTime(state.uptime)+' · 热修复 '+state.rescues+' 次 · 识破伪日志 '+report.fakeLogs+' 条 · 跨命遗留 '+report.zombies+' 个';ui.crashTrace.textContent='';
    report.lines.forEach(function(line,index){
      var item=document.createElement('li');item.textContent=line;ui.crashTrace.appendChild(item);
      window.setTimeout(function(){if(state.crashed&&state.lastAutopsy===report)item.classList.add('is-visible');},140+index*180);
    });
  }

  function showGuestAccountGate(initial){
    state.crashed=true;state.queue=null;clearPanicState();closeLibrary(true);
    ui.crashCode.textContent='游客九命配额耗尽';ui.crashReason.textContent='九次内核宕机已经证明：这不是试玩，是长期运维关系。';ui.crash.hidden=false;ui.body.classList.add('is-crashed');
    ui.reboot.hidden=true;if(ui.accountGate)ui.accountGate.hidden=false;
    if(initial&&ui.crashTrace){ui.deathTitle.textContent='本局称号：未登记的九命维护员';ui.crashMeta.textContent='GUEST SESSION · 9 / 9 LIVES';ui.crashTrace.textContent='';var item=document.createElement('li');item.textContent='#09  [权限] 继续运行需要登录；认证后命数限制自动解除。';item.classList.add('is-visible');ui.crashTrace.appendChild(item);}
    persist();render();
  }

  function panic(title,reason){
    if(state.crashed) return;
    var autopsy=buildAutopsy(title,reason);state.lastAutopsy=autopsy;
    clearPanicState();state.crashed=true;state.best=Math.max(state.best,state.uptime);state.queue=null;recordRun(title,autopsy);
    closeLibrary(true);
    if(!isAuthenticated()) state.guestDeaths=Math.min(9,state.guestDeaths+1);
    ui.crashCode.textContent=title;ui.crashReason.textContent=reason;ui.crash.hidden=false;ui.body.classList.add('is-crashed');
    var locked=guestLocked();ui.reboot.hidden=locked;if(ui.accountGate)ui.accountGate.hidden=!locked;
    renderAutopsy(autopsy);log('宕机',title+'：'+reason,{truth:true});if(locked)log('权限','游客第九条命已耗尽；重启入口切换为账号验证。',{truth:true});audio.play('crash');persist();render();
  }

  function resolveDefinition(id){return COMMANDS[id]||null;}
  function currentPressure(){return Math.min(5,Math.floor(state.uptime/32));}
  function isAutonomousCandidate(item){
    return !!item;
  }
  function pickBackground(excluded){
    var denied=excluded||[],level=currentPressure();
    var candidates=Object.keys(COMMANDS).map(resolveDefinition).filter(function(item){return isAutonomousCandidate(item)&&item.id!==state.lastQueued&&!state.processes.has(item.id)&&denied.indexOf(item.id)===-1;});
    if(!candidates.length) candidates=Object.keys(COMMANDS).map(resolveDefinition).filter(function(item){return isAutonomousCandidate(item)&&!state.processes.has(item.id);});
    if(!candidates.length) return null;
    var total=0;
    function weight(item){
      var value=personalityWeight(item),occupant=laneOccupant(item.lane,item.id);
      value*=occupant?.45:2.1;
      if(item.risk||item.chain) value*=1+level*.18;
      if(item.category==='屎山'||item.category==='案例') value*=1+level*.12;
      if(state.chaos>64&&item.id==='sleep.deep') value*=1.5;
      if(state.affinity>72&&item.id==='purr.daemon') value*=1.45;
      if(state.chaos<30&&item.id==='zoomies.turbo') value*=1.35;
      return value;
    }
    candidates.forEach(function(item){total+=weight(item);});var roll=rand()*total;
    for(var i=0;i<candidates.length;i+=1){roll-=weight(candidates[i]);if(roll<=0) return candidates[i];}return candidates[0];
  }
  function scheduleNext(minDelay){
    if(state.crashed) return;var level=currentPressure(),base=Math.max(1250,(minDelay||3800)-level*480),spread=Math.max(850,3500-level*420),delay=base+rand()*spread;
    state.queue=pickBackground();if(!state.queue) return;state.lastQueued=state.queue.id;state.queueAt=Date.now()+delay;
    log('排队',state.queue.code+' 已进入猫咪自动队列。');
  }
  function dispatchQueue(){
    if(!state.queue||state.crashed||state.pendingCrash) return;
    var queued=state.queue,level=currentPressure(),batch=1+(level>=2?1:0)+(level>=4&&rand()<.72?1:0),used=[queued.id];state.queue=null;
    runProcess(queued,'猫咪');
    for(var i=1;i<batch;i+=1){
      (function(index){window.setTimeout(function(){if(state.crashed||state.pendingCrash) return;var extra=pickBackground(used);if(!extra) return;used.push(extra.id);runProcess(extra,'猫咪');},index*310);})(i);
    }
    if(!state.crashed) scheduleNext(Math.max(1450,3900-level*430));
  }

  function forceAutomaticConflict(){
    if(state.crashed||state.pendingCrash) return;
    var forcedPool=FORCED_CONFLICTS.concat(dailySecretConflicts.map(function(item){return item.ids;})),pair=forcedPool[Math.floor(rand()*forcedPool.length)],first=resolveDefinition(pair[0]),second=resolveDefinition(pair[1]);
    if(!first||!second) return;
    [first,second].forEach(function(def){var occupant=laneOccupant(def.lane,def.id);if(occupant&&pair.indexOf(occupant.id)===-1){state.processes.delete(occupant.id);log('抢占','压力调度器强制终止 '+occupant.code+'，为兼容性回归测试让路。');}});
    log('警告','并行压力达到 P'+currentPressure()+'：猫咪决定自行运行一组未经测试的兼容性代码。');
    runProcess(first,'猫咪');
    window.setTimeout(function(){if(!state.crashed&&!state.pendingCrash&&state.processes.has(first.id)) runProcess(second,'猫咪');},420);
    state.nextForcedConflictAt=state.uptime+Math.max(52,82-currentPressure()*6)+rand()*16;
  }

  function advanceIncidentSequences(now){
    state.processes.forEach(function(process){
      var steps=INCIDENT_STEPS[process.id];if(!steps) return;
      var phase=Math.floor((now-process.startedAt)/1350)%steps.length;if(phase===process.incidentPhase) return;
      process.incidentPhase=phase;log('案例',steps[phase]);
    });
  }

  function renderRules(){
    var verified=0;if(ui.rules) ui.rules.textContent='';
    RULES.forEach(function(rule,index){
      var found=state.discovered.has(rule.key);if(found) verified+=1;
      if(!ui.rules) return;
      var card=document.createElement('article');card.className='ck-rule-card'+(found?' is-found':'');
      var number=document.createElement('i'),title=document.createElement('span'),formula=document.createElement('small'),status=document.createElement('b');
      number.textContent=String(index+1).padStart(2,'0');title.textContent=rule.title;formula.textContent=rule.formula+'｜'+rule.note;status.textContent=found?'已亲手验证':'尚未验证';
      card.append(number,title,formula,status);ui.rules.appendChild(card);
    });
    if(ui.ruleCount) ui.ruleCount.textContent=String(verified);
  }

  var VISUAL_CLASSES=['keyboard','box','food','vacuum','water','laser','ghost','glass','foreign','yarn','tail','purr','meow','hiss','litter','mouse','bird','bag','sun','wheel','net','kitten','secondcat','lion','blocker','glassdoor','mirror','fly','sofa'];
  function renderParallelVisuals(){
    VISUAL_CLASSES.forEach(function(name){ui.stage.classList.remove('has-'+name);});ui.stage.classList.remove('has-zombie');
    state.processes.forEach(function(process){if(process.zombie)ui.stage.classList.add('has-zombie');if(process.visual) ui.stage.classList.add('has-'+process.visual);if(process.visuals) process.visuals.forEach(function(name){ui.stage.classList.add('has-'+name);});});
  }

  function commandEntries(){
    return Object.keys(COMMANDS).sort(function(a,b){if(a==='groom.manual')return -1;if(b==='groom.manual')return 1;return 0;}).map(function(key){return {key:key,def:COMMANDS[key]};});
  }

  function renderLibrary(){
    var entries=commandEntries();
    var categoryLabels={'基础':'日常行为','感知监测':'感知监测','动作':'身体动作','互动':'人类互动','生存':'生存本能','环境':'环境响应','自维护':'自维护','紧急修复':'紧急修复','危险':'高危操作','案例':'经典事故','屎山':'屎山链路','玄学':'玄学代码'};
    var preferred=['全部','基础','感知监测','动作','互动','生存','环境','自维护','紧急修复','危险','案例','屎山','玄学'];
    var categories=preferred.filter(function(category){return category==='全部'||entries.some(function(entry){return entry.def.category===category;});});
    entries.forEach(function(entry){if(categories.indexOf(entry.def.category)===-1) categories.push(entry.def.category);});
    ui.libraryTabs.textContent='';
    categories.forEach(function(category){
      var tab=document.createElement('button');tab.type='button';tab.textContent=category==='全部'?'全部代码':(categoryLabels[category]||category);tab.dataset.category=category;
      tab.className=category===state.libraryCategory?'is-active':'';tab.setAttribute('aria-pressed',category===state.libraryCategory?'true':'false');ui.libraryTabs.appendChild(tab);
    });
    ui.commandGrid.textContent='';
    entries.filter(function(entry){return state.libraryCategory==='全部'||entry.def.category===state.libraryCategory;}).forEach(function(entry){
      var def=entry.def,button=document.createElement('button');button.type='button';button.dataset.command=entry.key;
      button.className='ck-library-card'+(def.risk?' is-risky':'')+(def.exclusive?' is-absolute':'')+(def.rescue?' is-rescue':'')+(def.mystery?' is-mystery':'');button.disabled=state.crashed;
      var code=document.createElement('code'),description=document.createElement('span'),meta=document.createElement('small'),impact=document.createElement('em');
      code.textContent=def.code;description.textContent=def.description||def.message;meta.textContent=def.lane+' · '+(def.exclusive?'全局最高优先级':(def.rescue?'抢救代码 · 优先级 ':'优先级 ')+def.priority)+' · 自动池';
      impact.className='ck-time-impact';impact.hidden=true;button.append(code,description,meta,impact);ui.commandGrid.appendChild(button);
    });
    ui.codeCount.textContent=String(entries.length);
  }

  function openLibrary(){
    if(state.crashed) return;
    audio.play('ui');
    observerEffect('library-open');
    state.libraryReturnFocus=document.activeElement;ui.libraryMask.hidden=false;ui.body.classList.add('ck-library-open');
    window.requestAnimationFrame(function(){ui.library.focus();});
  }

  function closeLibrary(silent){
    if(ui.libraryMask.hidden) return;
    ui.libraryMask.hidden=true;ui.body.classList.remove('ck-library-open');
    if(state.libraryReturnFocus&&state.libraryReturnFocus.focus) state.libraryReturnFocus.focus();
    state.libraryReturnFocus=null;if(!silent)observerEffect('library-close');
  }

  function highestProcess(){
    var list=Array.from(state.processes.values());
    list.sort(function(a,b){
      function score(item){return item.priority+(item.unstable?25:0)+(item.visualOverride?200:0)+(item.exclusive?2000:0);}
      return score(b)-score(a)||b.startedAt-a.startedAt;
    });
    return list[0]||null;
  }
  function renderActive(){
    ui.active.textContent='';var list=Array.from(state.processes.values()).sort(function(a,b){return b.priority-a.priority;});
    if(!list.length){var idle=document.createElement('i');idle.textContent='保持静止()';ui.active.appendChild(idle);return;}
    list.forEach(function(process){var chip=document.createElement(process.source==='玩家'?'b':'i');if(process.unstable) chip.classList.add('is-unstable');if(process.zombie) chip.classList.add('is-zombie');chip.textContent=(process.unstable?'⚠ ':process.zombie?'☠ 跨命 · ':'')+'优先级 '+process.priority+' · '+process.code;ui.active.appendChild(chip);});
  }
  function renderSpeech(now,top){
    var message='空闲线程正在假装听不见你。';if(state.crashed) message='系统停止响应';else if(state.transient&&state.transientUntil>now) message=state.transient;else if(top) message=top.message;
    if(ui.speech.textContent!==message) ui.speech.textContent=message;
  }

  function render(){
    var now=Date.now(),top=highestProcess();
    ui.uptime.textContent=formatTime(state.uptime);ui.stability.textContent=Math.round(state.stability)+'%';ui.affinity.textContent=String(Math.round(state.affinity));ui.chaos.textContent=String(Math.round(state.chaos));ui.best.textContent=formatTime(Math.max(state.best,state.uptime));
    ui.stabilityMeter.style.width=clamp(state.stability,0,100)+'%';ui.stabilityMeter.style.background=state.stability<34?'var(--ck-red)':state.stability<62?'var(--ck-yellow)':'var(--ck-green)';
    ui.chaosMeter.style.width=clamp(state.chaos,0,100)+'%';ui.chaosMeter.style.background=state.chaos>72?'var(--ck-red)':state.chaos>45?'var(--ck-yellow)':'var(--ck-green)';
    ui.kernelState.textContent=state.crashed?'内核 / 已宕机':state.pendingCrash?'内核 / 抢救中':state.milestone?'内核 / 已满足 SLA':'内核 / 运行中';ui.stage.dataset.pose=state.crashed?'crash':(top?top.pose:'idle');renderSpeech(now,top);renderActive();renderParallelVisuals();
    var comboVisible=!state.crashed&&state.comboUntil>now;ui.comboBanner.hidden=!comboVisible;
    if(comboVisible){ui.comboTitle.textContent=state.comboTitle;ui.comboDetail.textContent=state.comboDetail;}
    var panic=state.pendingCrash,remaining=panic?Math.max(0,panic.deadline-now):0,panicRatio=panic?clamp(remaining/panic.duration,0,1):0;
    ui.panicCountdown.hidden=!panic;ui.libraryPanic.hidden=!panic;
    if(panic){
      ui.panicTime.textContent=(remaining/1000).toFixed(1);ui.panicTitle.textContent=panic.conflict.title;ui.panicHint.textContent='抢占可热修复 · 其他代码会改写时间';ui.panicMeter.style.transform='scaleX('+panicRatio+')';
      if(ui.panicDelta){var deltaVisible=panic.lastShiftUntil>now;ui.panicDelta.hidden=!deltaVisible;if(deltaVisible){ui.panicDelta.textContent=panic.lastShiftLabel;ui.panicDelta.className=panic.lastShift>=0?'is-gain':'is-loss';}}
      ui.libraryPanicTime.textContent=(remaining/1000).toFixed(1)+' 秒';ui.libraryPanicPriority.textContent='抢救阈值 P'+panic.requiredPriority+' · 每段代码都会改写时间';
    }else if(ui.panicDelta){ui.panicDelta.hidden=true;ui.panicDelta.className='';}
    if(state.queue){ui.queueCode.textContent=state.queue.code;ui.queueLane.textContent=state.queue.lane;ui.queuePriority.textContent='优先级 '+state.queue.priority+' · 压力 P'+currentPressure();ui.queueCountdown.textContent=Math.max(0,(state.queueAt-now)/1000).toFixed(1)+'秒';}
    else{ui.queueCode.textContent=state.crashed?'调度器已停止()':'正在派发代码()';ui.queueLane.textContent=state.crashed?'宕机':'系统';ui.queuePriority.textContent=state.crashed?'----':'并发压力 P'+currentPressure();ui.queueCountdown.textContent='--.-秒';}
    Array.prototype.forEach.call(ui.commandGrid.querySelectorAll('[data-command]'),function(button){
      var def=COMMANDS[button.dataset.command],impact=button.querySelector('.ck-time-impact'),estimate=panic&&def?panicTimeEstimate(def,panic,!!findConflict(def.id,true)):null;
      button.disabled=state.crashed;button.classList.toggle('is-emergency-option',!!(estimate&&estimate.instant));
      button.classList.toggle('is-time-mystery',!!(estimate&&estimate.mystery));button.classList.toggle('is-time-gain',!!(estimate&&!estimate.instant&&!estimate.mystery&&estimate.seconds>=0));button.classList.toggle('is-time-loss',!!(estimate&&!estimate.instant&&!estimate.mystery&&estimate.seconds<0));
      if(impact){impact.hidden=!estimate;if(estimate){impact.textContent=estimate.label;impact.className='ck-time-impact '+(estimate.instant?'is-instant':estimate.mystery?'is-mystery':estimate.seconds>=0?'is-gain':'is-loss');}}
    });
    ui.openLibrary.disabled=state.crashed;
    if(ui.dailySeed) ui.dailySeed.textContent=dailyId+' / '+dailyKey.slice(5);
    if(ui.personality&&state.personality) ui.personality.textContent='猫格 / '+state.personality.name+' · '+state.personality.tag;
    if(ui.guestLife)ui.guestLife.textContent=isAuthenticated()?'账号维护员 · ∞ 命':'游客命数 '+Math.min(9,state.guestDeaths+1)+' / 9';
    if(state.personality) ui.stage.dataset.personality=state.personality.id;
    if(ui.logObserverState) ui.logObserverState.textContent=Date.now()<state.observedUntil?'调试器已附加 · 猫正在装正常':state.logOpen?'正在观察 · 日志未必可信':'未观察 · 后台不作保证';
    ui.soundToggle.classList.toggle('is-muted',!state.soundOn);ui.soundToggle.setAttribute('aria-pressed',state.soundOn?'true':'false');
    ui.soundToggle.setAttribute('aria-label',state.soundOn?'关闭猫咪音效':'开启猫咪音效');ui.soundToggle.querySelector('span').textContent=state.soundOn?'音效 开':'音效 关';
  }

  function resetBootPersonality(){
    state.sessionBoot+=1;state.rng=seededRandom((dailySeed^Math.imul(state.sessionBoot,0x9E3779B1))>>>0);
    state.personality=PERSONALITIES[Math.floor(rand()*PERSONALITIES.length)];
    ['touch','bath','noise','food','groom'].forEach(function(key){state.grudges[key]=clamp((Number(state.grudges[key])||0)*(state.sessionBoot===1?1:.92),0,30);});
    applyEffect(state.personality.start);
  }

  function reboot(initial){
    if(guestLocked()){showGuestAccountGate(true);return false;}
    state.best=Math.max(state.best,state.uptime||0);state.bootGeneration+=1;state.crashed=false;state.bootStarted=Date.now();state.lastTick=Date.now();state.uptime=0;state.stability=88;state.affinity=50;state.chaos=16;state.processes.clear();state.queue=null;state.transient='';state.milestone=false;state.loopPhase=-1;state.comboActive.clear();state.comboUntil=0;state.petStreak=0;state.lastPetAt=0;state.petHeat=0;state.rescues=0;state.currentRecorded=false;state.ambientAt=Date.now()+1600;state.pressureLevel=0;state.trace=[];state.fakeLogs=0;state.lastAutopsy=null;state.lastMystery='';state.preemptiveGroomAt=0;state.ruleDriftSeen.clear();state.observedUntil=0;state.observerStress*=.62;state.logCorruption=clamp(.045+state.zombies.length*.012,0,.18);clearPanicState();state.boots+=1;state.ninthLife=(!isAuthenticated()&&state.guestDeaths===8)||state.boots%9===0;resetBootPersonality();state.nextForcedConflictAt=(state.ninthLife?58:96)+rand()*18;
    ui.stage.dataset.loopStep='0';ui.crash.hidden=true;ui.body.classList.remove('is-crashed');ui.reboot.hidden=false;if(ui.accountGate)ui.accountGate.hidden=true;requestRunTicket();
    log('种子','每日挑战 '+dailyId+' 已加载；包含 '+dailySecretConflicts.length+' 条未公开兼容性故障。',{truth:true});
    log('启动',(initial?'CAT.EXE 第 '+state.boots+' 次启动。':'消耗一条命完成重启。')+'本次猫格：'+state.personality.name+' / '+state.personality.tag+'。'+state.personality.intro,{truth:true});
    if(state.ninthLife)log('警告','第九命兼容层已启用：祖传线程将以最高遗留密度恢复。',{truth:true});
    restoreZombieThreads();consumeRulesObservation();scheduleNext(initial?2700:2300);say('本次猫格：'+state.personality.name+'。'+state.personality.intro,3200);if(!initial) audio.play('boot');persist();render();return true;
  }

  function tick(){
    if(state.pausedAt) return;var now=Date.now(),delta=Math.min(1,(now-state.lastTick)/1000);state.lastTick=now;if(state.crashed){render();return;}
    state.uptime=(now-state.bootStarted)/1000;state.best=Math.max(state.best,state.uptime);
    var expired=[];state.processes.forEach(function(process){if(process.expiresAt<=now) expired.push(process);});
    expired.forEach(function(process){state.processes.delete(process.id);if(!shouldBecomeZombie(process))log('结束',process.code+' 正常退出。');else leaveZombie(process,'析构函数返回后仍持有 '+process.lane+' 锁');});
    if(expired.length){reconcilePendingCrash(null);checkCombos();}
    advanceGroomLoop(now);
    advanceIncidentSequences(now);
    advanceAmbientAudio(now);
    state.petHeat=Math.max(0,state.petHeat-.055*delta);state.observerStress=Math.max(0,state.observerStress-.018*delta);
    state.pressureLevel=currentPressure();
    var zombieCount=Array.from(state.processes.values()).filter(function(process){return process.zombie;}).length;
    state.chaos=clamp(state.chaos-(.45*delta)+zombieCount*.055*delta,0,100);state.stability=clamp(state.stability-zombieCount*.024*delta,0,100);if(state.chaos>70) state.stability=clamp(state.stability-(.7*delta),0,100);else if(state.chaos<42) state.stability=clamp(state.stability+(.16*delta),0,100);
    var underObservation=now<state.observedUntil;
    if(!underObservation&&state.queue&&now>=state.queueAt) dispatchQueue();
    if(!underObservation&&!state.pendingCrash&&state.uptime>=state.nextForcedConflictAt) forceAutomaticConflict();
    if(!state.milestone&&state.uptime>=90){state.milestone=true;state.stability=clamp(state.stability+12,0,100);state.affinity=clamp(state.affinity+9,0,100);log('成功','连续运行 90 秒，满足离谱 SLA。维护员暂未被开除。');say('SLA 达成。作为奖励，你可以继续伺候。',4200);}
    validateVitals();advancePanicCountdown(now);render();
  }

  var RAPID_GESTURES={box:'quantum.box',bowl:'food.reject',tail:'paw.enemy',bird:'bird.sound'};
  function pulseStageInteraction(target){target.classList.remove('is-triggered');void target.offsetWidth;target.classList.add('is-triggered');window.setTimeout(function(){target.classList.remove('is-triggered');},360);}
  function runStageCommand(id,label,target){
    if(state.crashed||!COMMANDS[id]) return false;
    if(target) pulseStageInteraction(target);
    if(target===ui.catTap){ui.stage.classList.remove('is-pet-tapped');void ui.stage.offsetWidth;ui.stage.classList.add('is-pet-tapped');window.setTimeout(function(){ui.stage.classList.remove('is-pet-tapped');},300);}
    log('环境',(label||'场景交互')+' → 注入 '+COMMANDS[id].code);return runProcess(COMMANDS[id],'玩家');
  }
  function noteRapidGesture(zone,target){
    var now=Date.now();state.gestureHistory=state.gestureHistory.filter(function(item){return now-item.at<1050;});state.gestureHistory.push({zone:zone,at:now});
    var count=state.gestureHistory.filter(function(item){return item.zone===zone;}).length;
    if(count<3||!RAPID_GESTURES[zone]) return;
    state.gestureHistory=state.gestureHistory.filter(function(item){return item.zone!==zone;});
    showCombo('环境连点 · 隐藏中断','同一环境接口在一秒内收到三次请求，猫决定过度响应');log('组合','环境「'+zone+'」触发三连点隐藏代码。');
    window.setTimeout(function(){runStageCommand(RAPID_GESTURES[zone],'三连点',target);},180);
  }
  function bindGestureTarget(target,options){
    if(!target) return;var pointer=null,longTimer=0,suppressClickUntil=0;
    target.addEventListener('pointerdown',function(event){
      if(state.crashed||event.button>0) return;pointer={x:event.clientX,y:event.clientY,at:Date.now(),long:false};
      longTimer=window.setTimeout(function(){if(!pointer||state.crashed) return;pointer.long=true;suppressClickUntil=Date.now()+700;runStageCommand(options.longId,options.longLabel||'长按',target);},560);
    });
    target.addEventListener('pointermove',function(event){if(pointer&&Math.hypot(event.clientX-pointer.x,event.clientY-pointer.y)>14) window.clearTimeout(longTimer);});
    target.addEventListener('pointerup',function(event){
      if(!pointer) return;window.clearTimeout(longTimer);var active=pointer;pointer=null;if(active.long) return;
      var dx=event.clientX-active.x,dy=event.clientY-active.y;if(options.swipes&&Math.hypot(dx,dy)>44){
        suppressClickUntil=Date.now()+700;var direction=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'),id=options.swipes[direction];
        if(id){showCombo('猫体手势 · '+direction.toUpperCase(),'滑动输入绕过代码库，直接写入身体总线');runStageCommand(id,'滑动 '+direction,target);}return;
      }
    });
    target.addEventListener('pointercancel',function(){window.clearTimeout(longTimer);pointer=null;});
    target.addEventListener('click',function(event){
      if(Date.now()<suppressClickUntil){event.preventDefault();return;}
      runStageCommand(options.tapId,options.tapLabel||'点按',target);if(options.zone) noteRapidGesture(options.zone,target);
    });
  }

  ui.commandGrid.addEventListener('click',function(event){
    var button=event.target.closest('[data-command]');if(!button||button.disabled) return;
    runProcess(COMMANDS[button.dataset.command],'玩家');closeLibrary(true);
  });
  ui.libraryTabs.addEventListener('click',function(event){
    var button=event.target.closest('[data-category]');if(!button) return;audio.play('ui');state.libraryCategory=button.dataset.category;renderLibrary();
  });
  bindGestureTarget(ui.catTap,{tapId:'pet.cat',tapLabel:'点按猫咪',longId:'chin.scratch',longLabel:'长按猫咪',swipes:{left:'tail.detect',right:'purr.daemon',up:'zoomies.turbo',down:'loaf.mode'}});
  if(ui.environment) Array.prototype.forEach.call(ui.environment.querySelectorAll('[data-zone]'),function(button){bindGestureTarget(button,{zone:button.dataset.zone,tapId:button.dataset.tap,longId:button.dataset.long,tapLabel:'点按'+button.querySelector('b').textContent,longLabel:'长按'+button.querySelector('b').textContent});});
  ui.openLibrary.addEventListener('click',openLibrary);
  ui.closeLibrary.addEventListener('click',function(){audio.play('ui');closeLibrary();});
  if(ui.logToggle)ui.logToggle.addEventListener('click',function(){
    state.logOpen=!state.logOpen;ui.logPanel.classList.toggle('is-collapsed',!state.logOpen);ui.logToggle.textContent=state.logOpen?'关闭日志':'打开日志';ui.logToggle.setAttribute('aria-expanded',state.logOpen?'true':'false');ui.log.hidden=!state.logOpen;observerEffect(state.logOpen?'open':'close');render();
  });
  if(ui.rulesLaunch)ui.rulesLaunch.addEventListener('click',prepareRulesObservation);
  [ui.catLogin,ui.catRegister].forEach(function(link){if(link)link.addEventListener('click',function(){try{localStorage.setItem('eo_intercept_redirect','cat-kernel-play.html');}catch(error){}});});
  ui.soundToggle.addEventListener('click',function(){
    if(state.soundOn){state.soundOn=false;if(audio.master) audio.master.gain.setTargetAtTime(.0001,audio.ctx.currentTime,.018);log('提示','猫咪声卡已静音。它仍会在你背后偷偷喵。');}
    else{state.soundOn=true;audio.unlock(true);if(audio.master){audio.master.gain.cancelScheduledValues(audio.ctx.currentTime);audio.master.gain.setTargetAtTime(.34,audio.ctx.currentTime,.015);}audio.play('boot');log('提示','猫咪声卡已开启：合成喵叫、哈气与施工噪音在线。');}
    persist();render();
  });
  ui.libraryMask.addEventListener('click',function(event){if(event.target===ui.libraryMask) closeLibrary();});
  document.addEventListener('pointerdown',function(){audio.unlock(true);},{capture:true,passive:true});
  document.addEventListener('keydown',function(event){
    if(event.key==='Enter'||event.key===' ') audio.unlock(true);
    if(event.key==='Escape'&&!ui.libraryMask.hidden){closeLibrary();return;}
    if(event.key!=='Tab'||ui.libraryMask.hidden) return;
    var focusable=Array.prototype.slice.call(ui.library.querySelectorAll('button:not(:disabled),[href],[tabindex]:not([tabindex="-1"])'));
    if(!focusable.length) return;var first=focusable[0],last=focusable[focusable.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
  ui.reboot.addEventListener('click',function(){if(guestLocked()){showGuestAccountGate(false);return;}reboot(false);});
  document.addEventListener('visibilitychange',function(){
    if(document.hidden){state.pausedAt=Date.now();persist();return;}if(!state.pausedAt) return;
    var pauseDuration=Date.now()-state.pausedAt;state.bootStarted+=pauseDuration;state.queueAt+=pauseDuration;if(state.pendingCrash){state.pendingCrash.startedAt+=pauseDuration;state.pendingCrash.deadline+=pauseDuration;state.pendingCrash.maxDeadline+=pauseDuration;}state.processes.forEach(function(process){if(Number.isFinite(process.expiresAt)) process.expiresAt+=pauseDuration;process.startedAt+=pauseDuration;});state.pausedAt=0;state.lastTick=Date.now();log('提示','页面恢复。离屏期间猫咪同意暂停作恶。');
  });
  window.addEventListener('beforeunload',persist);

  renderRules();renderLibrary();reboot(true);window.setInterval(tick,200);
})();
