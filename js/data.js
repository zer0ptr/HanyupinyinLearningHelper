// 拼音数据
const pinyinData = {
  // 声母 23个
  initials: [
    'b', 'p', 'm', 'f', 'd', 't', 'n', 'l',
    'g', 'k', 'h', 'j', 'q', 'x', 'zh', 'ch',
    'sh', 'r', 'z', 'c', 's', 'y', 'w'
  ],
  
  // 韵母 24个
  finals: [
    'a', 'o', 'e', 'i', 'u', 'ü',
    'ai', 'ei', 'ui', 'ao', 'ou', 'iu',
    'ie', 'üe', 'er', 'an', 'en', 'in',
    'un', 'ün', 'ang', 'eng', 'ing', 'ong'
  ],
  
  // 整体认读音节 16个
  wholeReading: [
    'zhi', 'chi', 'shi', 'ri', 'zi', 'ci', 'si',
    'yi', 'wu', 'yu', 'ye', 'yue', 'yuan',
    'yin', 'yun', 'ying'
  ],
  
  // 声调符号
  tones: {
    1: { name: '一声', symbol: 'ˉ' },
    2: { name: '二声', symbol: 'ˊ' },
    3: { name: '三声', symbol: 'ˇ' },
    4: { name: '四声', symbol: 'ˋ' }
  },
  
  // 汉字示例
  examples: {
    'ba': { 1: '八', 2: '拔', 3: '把', 4: '爸' },
    'ma': { 1: '妈', 2: '麻', 3: '马', 4: '骂' },
    'da': { 1: '搭', 2: '达', 3: '打', 4: '大' },
    'la': { 1: '拉', 2: '来', 3: '老', 4: '辣' },
    'pa': { 1: '趴', 2: '爬', 3: '怕', 4: '帕' },
    'fa': { 1: '发', 2: '罚', 3: '法', 4: '乏' },
    'ta': { 1: '他', 2: '踏', 3: '塔', 4: '她' },
    'na': { 1: '拿', 2: '那', 3: '哪', 4: '纳' },
    'ga': { 1: '嘎', 2: '咖', 3: '卡', 4: '尬' },
    'ka': { 1: '咖', 2: '卡', 3: '咔', 4: '喀' },
    'ha': { 1: '哈', 2: '蛤', 3: '哈', 4: '哈' },
    'za': { 1: '扎', 2: '杂', 3: '咋', 4: '砸' },
    'ca': { 1: '擦', 2: '嚓', 3: '咔', 4: '擦' },
    'sa': { 1: '撒', 2: '洒', 3: '萨', 4: '飒' }
  }
};

// 获取声调音节
function getTonedSyllable(syllable, tone) {
  const toneMarks = {
    'a': ['a', 'á', 'ǎ', 'à'],
    'o': ['o', 'ó', 'ǒ', 'ò'],
    'e': ['e', 'é', 'ě', 'è'],
    'i': ['i', 'í', 'ǐ', 'ì'],
    'u': ['u', 'ú', 'ǔ', 'ù'],
    'ü': ['ü', 'ǘ', 'ǔ', 'ǜ']
  };
  
  // 找到主要元音并添加声调
  for (let vowel in toneMarks) {
    if (syllable.includes(vowel)) {
      return syllable.replace(vowel, toneMarks[vowel][tone - 1]);
    }
  }
  
  return syllable;
}