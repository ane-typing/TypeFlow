/* ============================================================
   五笔 86 编码字典
   覆盖 frontend/zh/articles.js 中所有汉字 + 常用字
   ============================================================ */

var WUBI_DICT = {
  // 一级简码
  '一': 'ggll', '地': 'fbn', '在': 'dhfd', '要': 'svf', '工': 'aaaa',
  '上': 'hhgg', '是': 'jghu', '中': 'khk', '国': 'lgyi', '同': 'mgkd',
  '和': 'tkg', '的': 'rqyy', '有': 'def', '人': 'wwww', '我': 'trnt',
  '主': 'ygd', '产': 'ute', '不': 'gii', '为': 'oyly', '这': 'ypi',
  '民': 'nav', '了': 'bnh', '发': 'ntcy', '以': 'nywy', '经': 'xcag',
  '五': 'gghg', '们': 'wun',
  '王': 'gggg', '田': 'llll', '山': 'mmmm',
  '火': 'oooo', '女': 'vvvv', '白': 'rrrr', '言': 'yyyy',
  '耳': 'bghg', '刀': 'vnt', '弓': 'xngn', '禾': 'tttt', '竹': 'ttgh',

  // 二级简码 + 常用字
  '春': 'dwjf', '天': 'gdi', '早': 'jhnh', '晨': 'jdfe', '真': 'fhwu',
  '美': 'ugdu', '阳': 'bjg', '光': 'iqb', '照': 'jvko', '树': 'scfy',
  '叶': 'kfh', '小': 'ihty', '鸟': 'qyng', '枝': 'sfcy',
  '头': 'udi', '唱': 'kjjg', '歌': 'sksw', '走': 'fhu', '公': 'wcu',
  '园': 'lfqv', '路': 'khtk', '花': 'awxb', '香': 'tjf', '扑': 'rhy',
  '鼻': 'thlj', '而': 'dmjj', '来': 'goi', '样': 'sudh',
  '日': 'jjjj', '子': 'bbbb', '让': 'yhg', '心': 'nyny', '情': 'ngeg',
  '愉': 'nwgj', '快': 'nnwy', '喜': 'fkuk', '欢': 'cqwy',

  '家': 'peu', '四': 'lhng', '口': 'kkkk', '爸': 'wqcb', '妈': 'vcg',
  '妹': 'vfly', '弟': 'uxht', '医': 'atdi', '生': 'tgd', '老': 'ftxb',
  '师': 'jgmb', '学': 'ipbf', '幼': 'xln', '儿': 'qtn', '周': 'mfkd',
  '末': 'gsi', '常': 'ipkh', '起': 'fhnv', '去': 'fcu', '玩': 'gfqn',
  '开': 'gak', '现': 'gmqn', '很': 'tvey', '多': 'qqu', '都': 'ftjb',
  '用': 'etnh', '电': 'jnv', '脑': 'eybh', '作': 'wthf', '习': 'nud',
  '可': 'skd', '帮': 'dtbh', '助': 'egln', '查': 'sjgf', '资': 'uqwm',
  '料': 'oufh', '写': 'pgng', '文': 'yygy', '章': 'ujj', '画': 'glbj',
  '但': 'wjgg', '也': 'bnhn', '注': 'iygg', '意': 'ujnu',
  '保': 'wksy', '护': 'rynt', '眼': 'hvey', '睛': 'hgeg',
  '长': 'tayi', '时': 'jfy', '间': 'ujd', '看': 'rhf', '屏': 'nuak',
  '幕': 'ajdh',

  '今': 'wynb', '下': 'ghi', '午': 'tfj', '场': 'fnrt', '大': 'dddd',
  '雨': 'fghy', '点': 'hkou', '打': 'rsh', '窗': 'pwtq', '户': 'yne',
  '出': 'bmk', '滴': 'iumd', '答': 'twgk', '声': 'fnr',
  '音': 'ujf', '停': 'wyps', '后': 'rgkd', '空': 'pwaf', '气': 'rnb',
  '丽': 'gmyh', '彩': 'eset', '虹': 'jag', '高': 'ymkf',
  '兴': 'iwu', '跑': 'khqn',

  '智': 'tdkj', '能': 'cexx', '手': 'rtgh', '机': 'smn', '已': 'nnnn',
  '成': 'dnnt', '活': 'itdg', '部': 'ukbh', '分': 'wvb', '缺': 'rmnw',
  '或': 'akgd', '它': 'pxb', '随': 'bdep', '联': 'budy', '系': 'txiu',
  '取': 'bcy', '最': 'jbcu', '新': 'usr', '信': 'wyg', '息': 'thnu',
  '进': 'fjpk', '行': 'tfhh', '线': 'xgt', '然': 'qdou', '过': 'fpi',
  '度': 'yaci', '带': 'gkph', '问': 'ukd', '题': 'jghm', '比': 'xxn',
  '如': 'vkg', '影': 'jyie', '响': 'ktmk', '力': 'ltn', '减': 'udgt',
  '少': 'itr', '面': 'dmjd', '对': 'cfy', '流': 'iycq', '等': 'tffu',
  '何': 'wskg', '认': 'ywy', '思': 'lnu', '考': 'ftgn',

  '传': 'wfny', '统': 'xycq', '节': 'abj', '其': 'adwu',
  '重': 'tgjf', '农': 'pei', '历': 'dlv', '始': 'vckg',
  '贴': 'mhkg', '放': 'yty', '鞭': 'afwq', '炮': 'oqnn', '吃': 'ktnn',
  '年': 'rhfk', '夜': 'ywty', '饭': 'qnrc', '秋': 'toy', '月': 'eeee',
  '赏': 'ipkm', '饼': 'qnua', '象': 'qjeu', '征': 'tghg', '团': 'lfte',
  '圆': 'lkmi', '端': 'umdj', '赛': 'pfjm', '龙': 'dxv', '舟': 'tei',
  '粽': 'spfi', '俗': 'wwvk', '承': 'bdii', '载': 'falk', '富': 'pgkl',
  '内': 'mwi', '涵': 'ibib',

  '读': 'yfnd', '书': 'nnh', '好': 'vb', '种': 'tkhh',
  '惯': 'nxfm', '通': 'cepk', '阅': 'uukq', '解': 'qevh',
  '同': 'mgkd', '想': 'shnu', '阔': 'uitd', '自': 'thd', '己': 'nngn',
  '视': 'pymq', '野': 'jfcb', '每': 'txgu', '当': 'ivf', '拿': 'wgkr',
  '本': 'sgd', '仿': 'wyn', '佛': 'wxjh', '全': 'wgf', '世': 'anv',
  '界': 'lwjj', '无': 'fqv', '论': 'ywxn', '说': 'yukq', '还': 'gipi',
  '科': 'tufh', '物': 'trqr', '获': 'aqtd', '知': 'tdkg', '识': 'ykwy',
  '乐': 'qii', '建': 'vfhp', '议': 'yyqy', '培': 'fukg', '养': 'udyj',
  '个': 'whj',

  '技': 'rfcy', '术': 'syi', '近': 'fpk', '展': 'naei',
  '迅': 'nfpk', '速': 'gkip', '渗': 'icde', '透': 'tepv', '社': 'pyfg',
  '会': 'wfcu', '各': 'tkf', '领': 'wycm', '域': 'fakg', '从': 'wwy',
  '语': 'ygkg', '动': 'fcln', '驾': 'lkcf', '驶': 'ckqy', '汽': 'irnn',
  '车': 'lgnh', '诊': 'ywet', '断': 'onrh', '金': 'qqqq', '融': 'gkmj',
  '风': 'mqi', '控': 'rpwa', '正': 'ghd', '改': 'nty', '变': 'yocu',
  '方': 'yygn', '式': 'aad', '隐': 'bqvn', '私': 'tcy',
  '挑': 'riqn', '战': 'hkat', '推': 'rwyg', '创': 'wbjh',
  '确': 'dqeh', '健': 'wvfp', '康': 'yvii', '需': 'fdmj',
  '共': 'awu', '课': 'yjsy',

  '古': 'dghg', '云': 'fcu', '合': 'wgkf', '抱': 'rqnn', '之': 'pppp',
  '木': 'ssss', '于': 'gfk', '毫': 'yptn', '末': 'gsi', '九': 'vtn',
  '层': 'nfci', '台': 'ckf', '累': 'lxiu', '土': 'ffff',
  '千': 'tfk', '里': 'jfd', '足': 'khu', '话': 'ytdg',
  '告': 'tfkf', '诉': 'yryy', '远': 'fqpv', '目': 'hhhh',
  '标': 'sfiy', '追': 'wnnp', '梦': 'ssqu', '道': 'uthp', '遇': 'jmhp',
  '困': 'lsi', '难': 'cwyg', '挫': 'rwwf', '折': 'rrh',
  '只': 'kwu', '坚': 'jcff', '持': 'rffy', '懈': 'nqeh', '努': 'vclb',
  '向': 'tmkd', '步': 'hir', '终': 'xtuy', '够': 'qkqq',
  '到': 'gcfj', '达': 'dpi', '彼': 'thcy', '岸': 'mdfj',

  '着': 'udhf', '业': 'ogd', '化': 'wxn', '程': 'tkgg', '加': 'lkg',
  '环': 'ggiy', '境': 'fujq', '益': 'uwlf', '突': 'pwdu',
  '候': 'whnd', '样': 'sudh', '性': 'ntgg', '水': 'iiii',
  '源': 'idri', '短': 'tdgu', '严': 'godr', '威': 'dgvt',
  '胁': 'elwy', '存': 'dhbd', '续': 'xfnd', '际': 'bfiy',
  '身': 'tmd', '做': 'wdty', '浪': 'iyve', '费': 'xjmj', '约': 'xqyy',
  '与': 'gngd', '谐': 'yxxr', '处': 'thi', '才': 'fte', '拥': 'reh',
  '未': 'fii',

  // 补充常用字
  '什': 'wfh', '么': 'tcu', '他': 'wbn', '她': 'vbn', '你': 'wqiy',
  '两': 'gmww', '吧': 'kcn', '啊': 'kbsk', '吗': 'kcg', '呢': 'knxq',
  '哦': 'ktrt', '哈': 'kwgk', '再': 'gmfd', '又': 'cccc', '就': 'yidn',
  '且': 'egd', '并': 'uaj', '更': 'gjqi', '越': 'fhat', '极': 'seyy',
  '被': 'puhc', '把': 'rcn', '将': 'uqfy', '使': 'wgkq', '因': 'ldi',
  '所': 'rnrh', '者': 'ftjf', '外': 'qhy', '前': 'uejj',
  '左': 'daf', '右': 'dkf', '东': 'aii', '西': 'sghg', '南': 'fmuf',
  '北': 'uxn', '昨': 'jthf', '晚': 'jqkq',
  '星': 'jtgf', '期': 'adwe', '钟': 'qkhh', '秒': 'titt', '数': 'ovty',
  '量': 'jgjf', '低': 'wqay', '深': 'ipws', '浅': 'igt',
  '慢': 'njlc', '热': 'rvyo', '冷': 'uwyc', '温': 'ijlg',
  '几': 'mtn', '先': 'tfqb', '次': 'uqwy', '些': 'hxff', '类': 'odu',
  '往': 'tygg', '得': 'tjgf', '应': 'yid', '该': 'yynw',
  '觉': 'ipmq', '见': 'mqb', '听': 'krh', '回': 'lkd',
  '叫': 'knhh', '给': 'xwgk', '喝': 'kjqn', '跳': 'khiq',
  '站': 'uhkg', '坐': 'wwff', '关': 'udu', '门': 'uyhn',
  '住': 'wygg', '收': 'nhty', '立': 'uuuu', '请': 'ygeg',
  '谢': 'ytmf', '教': 'ftbt', '练': 'xanw', '像': 'wqje',
  '爱': 'epdc', '恨': 'nvey', '怕': 'nrg', '敢': 'nbt',
  '愿': 'drin', '必': 'nte', '须': 'edmy', '总': 'uknu', '没': 'imcy',
  '非': 'djdd', '否': 'gikf', '假': 'wnhc', '坏': 'fgiy',
  '错': 'qajg', '丑': 'nfd', '旧': 'hjg', '青': 'gef',
  '黑': 'lfou', '红': 'xag', '黄': 'amwu', '蓝': 'ajtl', '绿': 'xviy',
  '紫': 'hxxi', '灰': 'dou', '色': 'qcb', '百': 'djf', '万': 'dnv',
  '亿': 'wnn', '二': 'fgg', '三': 'dggg', '六': 'uygy', '七': 'agn',
  '八': 'wty', '十': 'fgh',

  // 文章中缺失的编码
  '丰': 'dhk', '事': 'gkvh', '交': 'uqu', '入': 'tyi', '则': 'mjh',
  '初': 'puvn', '利': 'tjh', '友': 'dcu', '句': 'qkd', '史': 'kqi',
  '块': 'fnwy', '字': 'pbf', '实': 'pudu', '库': 'ylk', '弊': 'umia',
  '拼': 'rua', '朋': 'eeg', '板': 'src', '构': 'sqcy', '此': 'hxn',
  '求': 'fiyi', '理': 'gjfg', '疗': 'ubk', '笔': 'ttn', '级': 'xeyy',
  '结': 'xfkg', '趣': 'fhbc',
  '价': 'wwjh', '值': 'wfhg',
  '那': 'vfb', '校': 'suqy', '幸': 'fufj', '福': 'pygl',
  '果': 'jsi', '虽': 'kju',
  '代': 'way', '计': 'yfh', '算': 'thaj', '互': 'gxgd',
  '网': 'mqqi', '观': 'cmqn', '革': 'afj', '命': 'wgkb',
  '驱': 'cagq', '践': 'khgt', '寸': 'fghy', '阴': 'beng',
  '壮': 'ufg', '徒': 'tfhy', '伤': 'wtln', '悲': 'djdn',
};

// 辅助函数：获取字符的五笔编码
function getWubi(ch) {
  // 通过 window.WUBI_DICT 查找（var 声明的变量会挂到 window 上）
  return (window.WUBI_DICT || {})[ch] || null;
}

// 暴露到 window，确保其他模块能通过 window.getWubi 访问
window.getWubi = getWubi;

// 辅助函数：获取文本中每个字的五笔编码数组
function getWubiSequence(text) {
  return [...text].map(ch => getWubi(ch));
}