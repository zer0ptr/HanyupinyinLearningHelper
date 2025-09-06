// 音频录制和管理模块
class AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.stream = null;
    this.customAudios = new Map(); // 存储自定义音频文件
    this.useCustomAudio = true; // 是否优先使用自定义音频
    
    // 初始化IndexedDB
    this.initDatabase();
    
    // 加载已保存的音频文件
    this.loadCustomAudios();
  }
  
  // 初始化IndexedDB数据库
  async initDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('PinyinAudioDB', 1);
      
      request.onerror = () => {
        console.error('数据库打开失败:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('音频数据库初始化成功');
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // 创建音频存储对象仓库
        if (!db.objectStoreNames.contains('audios')) {
          const audioStore = db.createObjectStore('audios', { keyPath: 'letter' });
          audioStore.createIndex('letter', 'letter', { unique: true });
          console.log('创建音频存储仓库');
        }
      };
    });
  }
  
  // 检查浏览器是否支持录音
  isRecordingSupported() {
    return navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
  }
  
  // 开始录音
  async startRecording(letter) {
    if (this.isRecording) {
      this.showUserMessage('已经在录音中，请先停止当前录音', 'warning');
      return false;
    }
    
    if (!this.isRecordingSupported()) {
      this.showUserMessage('您的浏览器不支持录音功能，请使用Chrome、Firefox或Safari浏览器', 'error');
      return false;
    }
    
    try {
      console.log(`开始录制字母: ${letter}`);
      
      // 获取麦克风权限
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });
      
      // 创建MediaRecorder实例
      const options = {
        mimeType: 'audio/webm;codecs=opus'
      };
      
      // 检查支持的MIME类型
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            delete options.mimeType;
          }
        }
      }
      
      this.mediaRecorder = new MediaRecorder(this.stream, options);
      this.audioChunks = [];
      this.currentLetter = letter;
      
      // 设置录音事件监听
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.onstop = async () => {
        console.log('录音结束，开始处理音频数据');
        await this.processRecordedAudio();
      };
      
      this.mediaRecorder.onerror = (event) => {
        console.error('录音过程中发生错误:', event.error);
        this.showUserMessage('录音过程中发生错误，请重试', 'error');
        this.cleanup();
      };
      
      // 开始录音
      this.mediaRecorder.start(100); // 每100ms收集一次数据
      this.isRecording = true;
      
      console.log('录音已开始');
      this.showUserMessage(`开始录制字母 "${letter}"`, 'success');
      return true;
      
    } catch (error) {
      console.error('开始录音失败:', error);
      this.handleRecordingError(error);
      this.cleanup();
      return false;
    }
  }
  
  // 停止录音
  stopRecording() {
    if (!this.isRecording || !this.mediaRecorder) {
      console.warn('当前没有进行录音');
      return false;
    }
    
    console.log('停止录音');
    this.mediaRecorder.stop();
    this.isRecording = false;
    
    return true;
  }
  
  // 处理录制的音频数据
  async processRecordedAudio() {
    if (this.audioChunks.length === 0) {
      console.warn('没有录制到音频数据');
      this.showUserMessage('录音失败：没有检测到音频数据，请检查麦克风权限', 'error');
      return;
    }
    
    try {
      // 创建音频Blob
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      
      // 检查音频文件大小
      if (audioBlob.size < 1000) { // 小于1KB可能是无效录音
        this.showUserMessage('录音时间太短，请重新录制', 'warning');
        return;
      }
      
      if (audioBlob.size > 5 * 1024 * 1024) { // 大于5MB
        this.showUserMessage('录音文件过大，请录制较短的音频', 'warning');
        return;
      }
      
      console.log(`录音完成，大小: ${(audioBlob.size / 1024).toFixed(2)} KB`);
      
      // 检查存储空间
      if (await this.checkStorageQuota(audioBlob.size)) {
        // 转换为ArrayBuffer以便存储
        const arrayBuffer = await audioBlob.arrayBuffer();
        
        // 保存到IndexedDB
        await this.saveAudioToDatabase(this.currentLetter, arrayBuffer);
        
        // 更新内存中的音频映射
        const audioUrl = URL.createObjectURL(audioBlob);
        this.customAudios.set(this.currentLetter, {
          url: audioUrl,
          blob: audioBlob,
          timestamp: Date.now()
        });
        
        console.log(`字母 "${this.currentLetter}" 的录音已保存`);
        this.showUserMessage(`字母 "${this.currentLetter}" 录音保存成功`, 'success');
        
        // 触发录音完成事件
        this.dispatchRecordingCompleteEvent(this.currentLetter, audioUrl);
      }
      
    } catch (error) {
      console.error('处理录音数据失败:', error);
      this.showUserMessage('保存录音失败，请重试', 'error');
    } finally {
      this.cleanup();
    }
  }
  
  // 保存音频到IndexedDB
  async saveAudioToDatabase(letter, arrayBuffer) {
    if (!this.db) {
      throw new Error('数据库未初始化');
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['audios'], 'readwrite');
      const store = transaction.objectStore('audios');
      
      const audioData = {
        letter: letter,
        data: arrayBuffer,
        timestamp: Date.now(),
        mimeType: 'audio/webm'
      };
      
      const request = store.put(audioData);
      
      request.onsuccess = () => {
        console.log(`音频数据已保存到数据库: ${letter}`);
        resolve();
      };
      
      request.onerror = () => {
        console.error('保存音频数据失败:', request.error);
        if (request.error.name === 'QuotaExceededError') {
          this.showUserMessage('存储空间不足，请删除一些旧录音', 'error');
        } else {
          this.showUserMessage('保存录音失败，请重试', 'error');
        }
        reject(request.error);
      };
      
      transaction.onerror = () => {
        console.error('数据库事务失败:', transaction.error);
        this.showUserMessage('数据库操作失败，请刷新页面重试', 'error');
        reject(transaction.error);
      };
    });
  }
  
  // 从IndexedDB加载自定义音频
  async loadCustomAudios() {
    if (!this.db) {
      await this.initDatabase();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['audios'], 'readonly');
      const store = transaction.objectStore('audios');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const audios = request.result;
        console.log(`从数据库加载了 ${audios.length} 个自定义音频`);
        
        audios.forEach(audio => {
          const blob = new Blob([audio.data], { type: audio.mimeType });
          const url = URL.createObjectURL(blob);
          
          this.customAudios.set(audio.letter, {
            url: url,
            blob: blob,
            timestamp: audio.timestamp
          });
        });
        
        resolve(audios);
      };
      
      request.onerror = () => {
        console.error('加载自定义音频失败:', request.error);
        reject(request.error);
      };
    });
  }
  
  // 播放音频（优先级：加载的文件 > 自定义录音 > TTS）
  async playAudio(letter) {
    console.log(`播放音频: ${letter}`);
    
    // 1. 优先使用从文件加载的音频
    if (window.audioLoader && window.audioLoader.hasAudio(letter)) {
      try {
        console.log(`使用加载的音频文件: ${letter}`);
        return await window.audioLoader.playLoadedAudio(letter);
      } catch (error) {
        console.error(`播放加载的音频失败: ${letter}`, error);
        // 继续尝试其他方式
      }
    }
    
    // 2. 使用自定义录音
    if (this.useCustomAudio && this.customAudios.has(letter)) {
      try {
        return await this.playCustomAudio(letter);
      } catch (error) {
        console.error(`播放自定义录音失败: ${letter}`, error);
        // 继续尝试TTS
      }
    }
    
    // 3. 回退到TTS语音合成
    return this.playTTSAudio(letter);
  }
  
  // 播放自定义录音
  playCustomAudio(letter) {
    return new Promise((resolve, reject) => {
      const audioData = this.customAudios.get(letter);
      if (!audioData) {
        reject(new Error(`没有找到字母 "${letter}" 的自定义录音`));
        return;
      }
      
      console.log(`播放自定义录音: ${letter}`);
      
      const audio = new Audio(audioData.url);
      
      audio.onended = () => {
        console.log(`自定义录音播放完成: ${letter}`);
        resolve();
      };
      
      audio.onerror = (error) => {
        console.error(`播放自定义录音失败: ${letter}`, error);
        // 回退到TTS
        this.playTTSAudio(letter).then(resolve).catch(reject);
      };
      
      audio.play().catch(error => {
        console.error(`播放自定义录音失败: ${letter}`, error);
        // 回退到TTS
        this.playTTSAudio(letter).then(resolve).catch(reject);
      });
    });
  }
  
  // 播放TTS音频
  playTTSAudio(letter) {
    return new Promise((resolve) => {
      console.log(`使用TTS播放: ${letter}`);
      
      if (window.speechManager) {
        // 使用现有的语音管理器，但不播放额外的提示音
        speechManager.speakPinyin(letter);
        // TTS没有直接的完成回调，使用定时器估算
        setTimeout(resolve, 1500);
      } else {
        console.warn('语音管理器不可用');
        resolve();
      }
    });
  }
  
  // 删除自定义录音
  async deleteCustomAudio(letter) {
    try {
      // 从内存中删除
      if (this.customAudios.has(letter)) {
        const audioData = this.customAudios.get(letter);
        URL.revokeObjectURL(audioData.url);
        this.customAudios.delete(letter);
      }
      
      // 从数据库中删除
      await this.deleteAudioFromDatabase(letter);
      
      console.log(`已删除字母 "${letter}" 的自定义录音`);
      
      // 触发删除事件
      this.dispatchAudioDeletedEvent(letter);
      
      return true;
    } catch (error) {
      console.error(`删除录音失败: ${letter}`, error);
      return false;
    }
  }
  
  // 从数据库删除音频
  async deleteAudioFromDatabase(letter) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['audios'], 'readwrite');
      const store = transaction.objectStore('audios');
      const request = store.delete(letter);
      
      request.onsuccess = () => {
        console.log(`从数据库删除音频: ${letter}`);
        resolve();
      };
      
      request.onerror = () => {
        console.error('从数据库删除音频失败:', request.error);
        reject(request.error);
      };
    });
  }
  
  // 获取所有自定义录音的状态（保持向后兼容）
  getRecordingStatus() {
    return this.getAudioStatus().map(status => ({
      letter: status.letter,
      hasCustomAudio: status.hasCustomAudio,
      timestamp: status.timestamp
    }));
  }
  
  // 获取所有音频的状态（包括加载的文件和自定义录音）
  getAudioStatus() {
    const allLetters = [
      // 声母
      'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 
      'j', 'q', 'x', 'zh', 'ch', 'sh', 'r', 'z', 'c', 's', 'y', 'w',
      // 韵母
      'a', 'o', 'e', 'i', 'u', 'v', 'ai', 'ei', 'ui', 'ao', 'ou', 'iu',
      'ie', 've', 'an', 'en', 'in', 'un', 'vn', 'ang', 'eng', 'ing', 'ong'
    ];
    
    return allLetters.map(letter => {
      const hasLoadedAudio = window.audioLoader ? window.audioLoader.hasAudio(letter) : false;
      const hasCustomAudio = this.customAudios.has(letter);
      
      return {
        letter: letter,
        hasLoadedAudio: hasLoadedAudio,
        hasCustomAudio: hasCustomAudio,
        hasAnyAudio: hasLoadedAudio || hasCustomAudio,
        audioSource: hasLoadedAudio ? 'loaded' : (hasCustomAudio ? 'recorded' : 'tts'),
        timestamp: hasCustomAudio ? this.customAudios.get(letter).timestamp : null
      };
    });
  }
  
  // 切换音频模式（自定义音频 vs TTS）
  toggleAudioMode() {
    this.useCustomAudio = !this.useCustomAudio;
    console.log(`音频模式切换为: ${this.useCustomAudio ? '自定义录音' : 'TTS语音合成'}`);
    
    // 触发模式切换事件
    this.dispatchModeChangeEvent(this.useCustomAudio);
    
    return this.useCustomAudio;
  }
  
  // 批量导出录音
  async exportRecordings() {
    const recordings = [];
    
    for (const [letter, audioData] of this.customAudios) {
      recordings.push({
        letter: letter,
        blob: audioData.blob,
        timestamp: audioData.timestamp
      });
    }
    
    return recordings;
  }
  
  // 批量导入录音
  async importRecordings(files) {
    const results = [];
    
    for (const file of files) {
      try {
        const letter = this.extractLetterFromFilename(file.name);
        if (letter) {
          const arrayBuffer = await file.arrayBuffer();
          await this.saveAudioToDatabase(letter, arrayBuffer);
          
          const url = URL.createObjectURL(file);
          this.customAudios.set(letter, {
            url: url,
            blob: file,
            timestamp: Date.now()
          });
          
          results.push({ letter, success: true });
          console.log(`导入录音成功: ${letter}`);
        } else {
          results.push({ filename: file.name, success: false, error: '无法识别字母' });
        }
      } catch (error) {
        results.push({ filename: file.name, success: false, error: error.message });
        console.error(`导入录音失败: ${file.name}`, error);
      }
    }
    
    return results;
  }
  
  // 从文件名提取字母
  extractLetterFromFilename(filename) {
    const match = filename.match(/([a-z])\.(mp3|wav|webm|m4a)$/i);
    return match ? match[1].toLowerCase() : null;
  }
  
  // 清理资源
  cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
  }
  
  // 触发录音完成事件
  dispatchRecordingCompleteEvent(letter, audioUrl) {
    const event = new CustomEvent('recordingComplete', {
      detail: { letter, audioUrl }
    });
    document.dispatchEvent(event);
  }
  
  // 触发录音删除事件
  dispatchAudioDeletedEvent(letter) {
    const event = new CustomEvent('audioDeleted', {
      detail: { letter }
    });
    document.dispatchEvent(event);
  }
  
  // 触发模式切换事件
  dispatchModeChangeEvent(useCustomAudio) {
    const event = new CustomEvent('audioModeChanged', {
      detail: { useCustomAudio }
    });
    document.dispatchEvent(event);
  }
  
  // 处理录音错误
  handleRecordingError(error) {
    console.error('录音错误:', error);
    
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      this.showUserMessage('麦克风权限被拒绝，请在浏览器设置中允许麦克风访问', 'error');
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      this.showUserMessage('未找到麦克风设备，请检查设备连接', 'error');
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      this.showUserMessage('麦克风被其他应用占用，请关闭其他录音应用', 'error');
    } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
      this.showUserMessage('麦克风不支持所需的音频格式', 'error');
    } else {
      this.showUserMessage('录音失败，请检查设备和权限设置', 'error');
    }
  }
  
  // 检查存储配额
  async checkStorageQuota(requiredSize) {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const available = estimate.quota - estimate.usage;
        
        if (available < requiredSize * 2) { // 保留一些缓冲空间
          this.showUserMessage('存储空间不足，请删除一些旧录音或清理浏览器缓存', 'error');
          return false;
        }
      }
      return true;
    } catch (error) {
      console.warn('无法检查存储配额:', error);
      return true; // 如果无法检查，继续尝试保存
    }
  }
  
  // 显示用户消息
  showUserMessage(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // 如果存在全局的showToast函数，使用它
    if (typeof window.showToast === 'function') {
      window.showToast(message, type);
    } else if (typeof window.app?.showToast === 'function') {
      window.app.showToast(message, type);
    } else {
      // 回退到alert（仅用于错误消息）
      if (type === 'error') {
        alert(message);
      }
    }
  }
}

// 创建全局音频录制管理器实例
const audioRecorder = new AudioRecorder();

// 检查录音支持
if (!audioRecorder.isRecordingSupported()) {
  console.warn('当前浏览器不支持录音功能');
  if (typeof window.showToast === 'function') {
    window.showToast('当前浏览器不支持录音功能，请使用Chrome、Firefox或Safari浏览器', 'warning');
  }
} else {
  console.log('音频录制功能已初始化');
}

// 导出到全局作用域
window.audioRecorder = audioRecorder;