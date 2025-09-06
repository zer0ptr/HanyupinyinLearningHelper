// 语音合成功能
class SpeechManager {
  constructor() {
    this.synth = window.speechSynthesis;
    this.voices = [];
    this.isVoicesLoaded = false;
    this.loadVoices();
  }
  
  loadVoices() {
    console.log('开始加载语音列表...');
    this.voices = this.synth.getVoices();
    
    if (this.voices.length > 0) {
      this.isVoicesLoaded = true;
      this.logAvailableVoices();
    } else {
      console.log('语音列表为空，等待voiceschanged事件...');
      this.synth.addEventListener('voiceschanged', () => {
        this.voices = this.synth.getVoices();
        this.isVoicesLoaded = true;
        console.log('语音列表已更新');
        this.logAvailableVoices();
      });
    }
  }
  
  // 输出可用语音列表到控制台
  logAvailableVoices() {
    console.log('=== 可用语音列表 ===');
    console.log(`总共找到 ${this.voices.length} 个语音`);
    
    this.voices.forEach((voice, index) => {
      console.log(`${index + 1}. ${voice.name} (${voice.lang}) - ${voice.localService ? '本地' : '在线'}`);
    });
    
    // 专门显示中文语音
    const chineseVoices = this.voices.filter(voice => 
      voice.lang.includes('zh') || 
      voice.name.includes('Chinese') ||
      voice.name.includes('中文')
    );
    
    console.log('=== 中文语音列表 ===');
    if (chineseVoices.length > 0) {
      chineseVoices.forEach((voice, index) => {
        console.log(`${index + 1}. ${voice.name} (${voice.lang}) - ${voice.localService ? '本地' : '在线'}`);
      });
    } else {
      console.warn('未找到中文语音！');
    }
  }
  
  // 获取中文语音
  getChineseVoice() {
    console.log('正在选择中文语音...');
    
    // 更严格的中文语音筛选
    const chineseVoices = this.voices.filter(voice => {
      const isChineseLang = voice.lang && (
        voice.lang.toLowerCase().includes('zh-cn') ||
        voice.lang.toLowerCase().includes('zh-tw') ||
        voice.lang.toLowerCase().includes('zh')
      );
      
      const isChineseName = voice.name && (
        voice.name.toLowerCase().includes('chinese') ||
        voice.name.includes('中文') ||
        voice.name.toLowerCase().includes('huihui') ||
        voice.name.toLowerCase().includes('yaoyao') ||
        voice.name.toLowerCase().includes('kangkang') ||
        voice.name.toLowerCase().includes('xiaoxiao') ||
        voice.name.toLowerCase().includes('yunyang')
      );
      
      return isChineseLang || isChineseName;
    });
    
    console.log(`找到 ${chineseVoices.length} 个中文语音:`);
    chineseVoices.forEach(voice => {
      console.log(`- ${voice.name} (${voice.lang}) - ${voice.localService ? '本地' : '在线'}`);
    });
    
    // 按优先级选择最佳中文语音
    let selectedVoice = null;
    
    // 1. 优先选择Microsoft Huihui（标准普通话女声）
    selectedVoice = chineseVoices.find(voice => 
      voice.name.toLowerCase().includes('huihui') && 
      voice.lang && voice.lang.toLowerCase().includes('zh-cn')
    );
    
    // 2. 选择Microsoft Yaoyao（标准普通话女声）
    if (!selectedVoice) {
      selectedVoice = chineseVoices.find(voice => 
        voice.name.toLowerCase().includes('yaoyao') && 
        voice.lang && voice.lang.toLowerCase().includes('zh-cn')
      );
    }
    
    // 3. 选择Microsoft Kangkang（标准普通话男声）
    if (!selectedVoice) {
      selectedVoice = chineseVoices.find(voice => 
        voice.name.toLowerCase().includes('kangkang') && 
        voice.lang && voice.lang.toLowerCase().includes('zh-cn')
      );
    }
    
    // 4. 选择任何本地简体中文语音
    if (!selectedVoice) {
      selectedVoice = chineseVoices.find(voice => 
        voice.localService && 
        voice.lang && voice.lang.toLowerCase().includes('zh-cn')
      );
    }
    
    // 5. 选择任何简体中文语音
    if (!selectedVoice) {
      selectedVoice = chineseVoices.find(voice => 
        voice.lang && voice.lang.toLowerCase().includes('zh-cn')
      );
    }
    
    // 6. 选择任何本地中文语音
    if (!selectedVoice) {
      selectedVoice = chineseVoices.find(voice => voice.localService);
    }
    
    // 7. 选择任何中文语音
    if (!selectedVoice) {
      selectedVoice = chineseVoices[0];
    }
    
    if (selectedVoice) {
      console.log(`✓ 选择语音: ${selectedVoice.name} (${selectedVoice.lang}) - ${selectedVoice.localService ? '本地' : '在线'}`);
      return selectedVoice;
    }
    
    console.error('❌ 未找到任何中文语音！');
    return null;
  }
  
  // 朗读文本（支持自定义录音优先）
  async speak(text, options = {}) {
    console.log(`🎯 请求播放: "${text}"`);
    
    // 检查是否有自定义录音可用
    if (window.audioRecorder && this.shouldUseCustomAudio(text)) {
      try {
        console.log('🎙️ 尝试使用自定义录音');
        await window.audioRecorder.playAudio(text.toLowerCase());
        return;
      } catch (error) {
        console.log('⚠️ 自定义录音播放失败，回退到TTS:', error.message);
        // 继续执行TTS逻辑
      }
    }
    
    // 使用TTS语音合成
    this.speakWithTTS(text, options);
  }
  
  // 专门用于播放拼音字母的方法（不播放额外提示音）
  speakPinyin(letter) {
    console.log(`🎯 播放拼音字母: "${letter}"`);
    
    if (!this.isSupported()) {
      console.warn('语音合成不支持');
      return;
    }

    // 停止当前朗读
    this.stop();

    // 获取中文读音
    const chineseReading = this.getChineseLetterReading(letter.toLowerCase());
    console.log(`📝 拼音字母转换: ${letter} -> ${chineseReading}`);

    const utterance = new SpeechSynthesisUtterance(chineseReading);
    
    // 强制设置中文语音和参数
    const chineseVoice = this.getChineseVoice();
    if (chineseVoice) {
      utterance.voice = chineseVoice;
      console.log(`🔊 选择语音: ${chineseVoice.name} (${chineseVoice.lang})`);
      
      // 根据不同的语音引擎优化参数
      this.optimizeVoiceParameters(utterance, chineseVoice);
    } else {
      console.warn('⚠️ 未找到中文语音，使用默认语音');
      // 即使没有中文语音，也要设置中文参数
      utterance.lang = 'zh-CN';
      utterance.rate = 0.7;
      utterance.pitch = 1.1;
      utterance.volume = 1.0;
    }
    
    console.log(`⚙️ 语音参数: lang=${utterance.lang}, rate=${utterance.rate}, pitch=${utterance.pitch}`);

    // 事件监听
    utterance.onstart = () => {
      console.log('▶️ 开始播放拼音');
    };

    utterance.onend = () => {
      console.log('✅ 拼音播放完成');
    };

    utterance.onerror = (event) => {
      if (event.error === 'interrupted') {
        console.log('🔄 拼音播放被中断（正常现象）');
      } else {
        console.error('❌ 拼音语音合成错误:', event.error);
      }
    };

    // 开始朗读
    if (this.synth) {
      this.synth.speak(utterance);
    } else {
      window.speechSynthesis.speak(utterance);
    }
  }
  
  // 检查是否应该使用自定义录音
  shouldUseCustomAudio(text) {
    // 只对单个拼音字母使用自定义录音
    if (text.length === 1 && /[a-zA-Z]/.test(text)) {
      return window.audioRecorder && 
             window.audioRecorder.useCustomAudio && 
             window.audioRecorder.customAudios.has(text.toLowerCase());
    }
    return false;
  }
  
  // TTS语音合成（原来的speak方法逻辑）
  speakWithTTS(text, options = {}) {
    if (!this.isSupported()) {
      console.warn('语音合成不支持');
      return;
    }

    // 停止当前朗读
    this.stop();

    console.log(`🔊 使用TTS播放: "${text}"`);
    
    // 对于单个字母，直接使用中文读音
    let processedText = text;
    if (text.length === 1 && /[a-zA-Z]/.test(text)) {
      const chineseReading = this.getChineseLetterReading(text.toLowerCase());
      processedText = chineseReading;
      console.log(`📝 字母转换: ${text} -> ${processedText}`);
    }

    const utterance = new SpeechSynthesisUtterance(processedText);
    
    // 强制设置中文语音和参数
    const chineseVoice = this.getChineseVoice();
    if (chineseVoice) {
      utterance.voice = chineseVoice;
      console.log(`🔊 选择语音: ${chineseVoice.name} (${chineseVoice.lang})`);
      
      // 根据不同的语音引擎优化参数
      this.optimizeVoiceParameters(utterance, chineseVoice);
    } else {
      console.warn('⚠️ 未找到中文语音，使用默认语音');
      // 即使没有中文语音，也要设置中文参数
      utterance.lang = 'zh-CN';
      utterance.rate = 0.7;
      utterance.pitch = 1.1;
      utterance.volume = 1.0;
    }
    
    console.log(`⚙️ 语音参数: lang=${utterance.lang}, rate=${utterance.rate}, pitch=${utterance.pitch}`);

    // 事件监听
    utterance.onstart = () => {
      console.log('▶️ 开始TTS朗读');
    };

    utterance.onend = () => {
      console.log('✅ TTS朗读完成');
    };

    utterance.onerror = (event) => {
      if (event.error === 'interrupted') {
        console.log('🔄 TTS朗读被中断（正常现象）');
      } else {
        console.error('❌ TTS语音合成错误:', event.error);
        // 尝试使用备用方案
        this.handleSpeechError(event.error, text, options);
      }
    };

    // 开始朗读
    if (this.synth) {
      this.synth.speak(utterance);
    } else {
      window.speechSynthesis.speak(utterance);
    }
  }
  
  getChineseLetterReading(letter) {
    // 拼音字母的标准普通话读音（按照汉语拼音方案）
    const letterMap = {
      'a': '啊',      // 第一声
      'b': '玻',      // 标准声母读音
      'c': '雌',      // 标准声母读音
      'd': '得',      // 标准声母读音
      'e': '鹅',      // 第二声
      'f': '佛',      // 标准声母读音
      'g': '哥',      // 标准声母读音
      'h': '喝',      // 标准声母读音
      'i': '衣',      // 第一声
      'j': '鸡',      // 标准声母读音
      'k': '科',      // 标准声母读音
      'l': '勒',      // 标准声母读音
      'm': '摸',      // 标准声母读音
      'n': '讷',      // 标准声母读音
      'o': '哦',      // 第一声
      'p': '泼',      // 标准声母读音
      'q': '欺',      // 标准声母读音
      'r': '日',      // 标准声母读音
      's': '思',      // 标准声母读音
      't': '特',      // 标准声母读音
      'u': '乌',      // 第一声
      'v': '迂',      // 韵母ü的读音
      'w': '乌',      // 声母w的读音
      'x': '西',      // 标准声母读音
      'y': '衣',      // 声母y的读音
      'z': '资'       // 标准声母读音
    };
    return letterMap[letter] || letter;
  }
  
  // 预处理文本以获得更好的中文发音
  preprocessTextForChinese(text) {
    // 如果是单个拼音字母，添加中文语境
    if (text.length === 1 && /[a-z]/i.test(text)) {
      // 为单个字母添加中文语境，帮助语音引擎使用中文发音
      const letterMap = {
        'a': '啊',      // 第一声
        'b': '玻',      // 标准声母读音
        'c': '雌',      // 标准声母读音
        'd': '得',      // 标准声母读音
        'e': '鹅',      // 第二声
        'f': '佛',      // 标准声母读音
        'g': '哥',      // 标准声母读音
        'h': '喝',      // 标准声母读音
        'i': '衣',      // 第一声
        'j': '鸡',      // 标准声母读音
        'k': '科',      // 标准声母读音
        'l': '勒',      // 标准声母读音
        'm': '摸',      // 标准声母读音
        'n': '讷',      // 标准声母读音
        'o': '哦',      // 第一声
        'p': '泼',      // 标准声母读音
        'q': '欺',      // 标准声母读音
        'r': '日',      // 标准声母读音
        's': '思',      // 标准声母读音
        't': '特',      // 标准声母读音
        'u': '乌',      // 第一声
        'v': '迂',      // 韵母ü的读音
        'w': '乌',      // 声母w的读音
        'x': '西',      // 标准声母读音
        'y': '衣',      // 声母y的读音
        'z': '资'       // 标准声母读音
      };
      
      const chineseLetter = letterMap[text.toLowerCase()];
      if (chineseLetter) {
        console.log(`字母 ${text} 转换为中文发音: ${chineseLetter}`);
        return chineseLetter;
      }
    }
    
    // 如果是拼音组合，保持原样但确保使用中文语境
    if (/^[a-z]+$/i.test(text) && text.length > 1) {
      // 对于拼音组合，我们保持原样，但可以在前面添加一个很短的中文语境
      return text;
    }
    
    // 其他情况保持原样
    return text;
  }
  
  // 显示无语音警告
  showNoVoiceWarning() {
    const message = '❌ 抱歉，您的浏览器没有可用的中文语音。\n\n解决方案：\n1. 确保系统已安装中文语音包\n2. 在Windows设置中添加中文语音\n3. 使用Chrome或Edge浏览器\n4. 重启浏览器后再试';
    console.error(message);
    
    // 显示更详细的调试信息
    console.log('=== 调试信息 ===');
    console.log('可用语音总数:', this.voices.length);
    console.log('语音列表:', this.voices.map(v => `${v.name} (${v.lang})`));
    
    alert(message);
  }
  
  // 根据语音引擎优化参数
  optimizeVoiceParameters(utterance, voice) {
    // 强制设置中文语言
    utterance.lang = 'zh-CN';
    
    // 根据不同的语音引擎设置最佳参数
    const voiceName = voice.name.toLowerCase();
    
    if (voiceName.includes('huihui')) {
      // Microsoft Huihui - 标准普通话女声
      utterance.rate = 0.75;   // 适中语速
      utterance.pitch = 1.0;   // 标准音调
      utterance.volume = 1.0;
      console.log('🎯 使用Huihui优化参数');
    } else if (voiceName.includes('yaoyao')) {
      // Microsoft Yaoyao - 标准普通话女声
      utterance.rate = 0.7;
      utterance.pitch = 1.05;
      utterance.volume = 1.0;
      console.log('🎯 使用Yaoyao优化参数');
    } else if (voiceName.includes('kangkang')) {
      // Microsoft Kangkang - 标准普通话男声
      utterance.rate = 0.8;
      utterance.pitch = 0.95;
      utterance.volume = 1.0;
      console.log('🎯 使用Kangkang优化参数');
    } else {
      // 其他中文语音的通用优化参数
      utterance.rate = 0.7;    // 稍慢语速确保清晰度
      utterance.pitch = 1.1;   // 稍高音调更接近标准普通话
      utterance.volume = 1.0;
      console.log('🎯 使用通用中文语音优化参数');
    }
  }
  
  // 处理语音错误
  handleSpeechError(error, text, options) {
    console.error(`语音合成失败: ${error}`);
    
    // 尝试重新加载语音列表
    if (error === 'voice-unavailable') {
      console.log('尝试重新加载语音列表...');
      this.loadVoices();
      setTimeout(() => this.speak(text, options), 500);
    } else if (error === 'network') {
      console.log('网络错误，尝试使用本地语音...');
      // 强制使用本地语音重试
      setTimeout(() => {
        const localVoice = this.voices.find(v => v.localService && v.lang && v.lang.includes('zh'));
        if (localVoice) {
          this.speak(text, { ...options, forceVoice: localVoice });
        }
      }, 1000);
    }
  }
  
  // 测试语音功能
  testVoice() {
    console.log('=== 开始语音测试 ===');
    console.log('测试1: 中文问候');
    this.speak('你好，这是语音测试。');
    
    setTimeout(() => {
      console.log('测试2: 拼音字母');
      this.speak('a');
    }, 2000);
    
    setTimeout(() => {
      console.log('测试3: 拼音组合');
      this.speak('ma');
    }, 4000);
  }
  
  // 停止朗读
  stop() {
    if (this.synth) {
      this.synth.cancel();
    } else {
      window.speechSynthesis.cancel();
    }
  }
  
  // 检查是否支持语音合成
  isSupported() {
    return 'speechSynthesis' in window;
  }
}

// 创建全局语音管理器实例
const speechManager = new SpeechManager();

// 检查语音合成支持
if (!speechManager.isSupported()) {
  console.warn('当前浏览器不支持语音合成功能');
} else {
  console.log('语音合成功能已初始化');
  
  // 添加测试按钮（开发调试用）
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    setTimeout(() => {
      console.log('开发模式：可以在控制台输入 speechManager.testVoice() 来测试语音功能');
      console.log('开发模式：可以在控制台输入 speechManager.logAvailableVoices() 来查看语音列表');
      
      // 自动进行语音测试（需要用户交互后才能工作）
      console.log('=== 自动语音测试准备就绪 ===');
      console.log('点击任意拼音字母即可测试中文语音功能');
      
      // 添加页面点击事件来触发首次语音测试
      let firstClick = true;
      document.addEventListener('click', () => {
        if (firstClick) {
          firstClick = false;
          console.log('🎯 首次点击检测到，开始语音测试...');
          setTimeout(() => {
            speechManager.testVoice();
          }, 500);
        }
      }, { once: true });
    }, 1000);
  }
}