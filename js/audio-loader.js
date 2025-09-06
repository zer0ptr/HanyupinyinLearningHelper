// 音频文件加载器模块
class AudioLoader {
  constructor() {
    this.loadedAudios = new Map(); // 存储加载的音频文件
    this.supportedFormats = ['mp3', 'wav', 'ogg', 'm4a']; // 支持的音频格式
    this.pinyinLetters = [
      // 声母
      'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 
      'j', 'q', 'x', 'zh', 'ch', 'sh', 'r', 'z', 'c', 's', 'y', 'w',
      // 韵母
      'a', 'o', 'e', 'i', 'u', 'v', 'ai', 'ei', 'ui', 'ao', 'ou', 'iu',
      'ie', 've', 'an', 'en', 'in', 'un', 'vn', 'ang', 'eng', 'ing', 'ong'
    ];
  }

  // 检查浏览器是否支持文件API
  isFileAPISupported() {
    return window.File && window.FileReader && window.FileList && window.Blob;
  }

  // 选择音频文件目录
  async selectAudioDirectory() {
    if (!this.isFileAPISupported()) {
      this.showMessage('您的浏览器不支持文件选择功能', 'error');
      return false;
    }

    try {
      // 创建文件选择器
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = this.supportedFormats.map(format => `.${format}`).join(',');
      input.webkitdirectory = true; // 允许选择目录

      return new Promise((resolve) => {
        input.onchange = async (event) => {
          const files = Array.from(event.target.files);
          console.log(`选择了 ${files.length} 个文件`);
          
          const result = await this.loadAudioFiles(files);
          resolve(result);
        };

        input.oncancel = () => {
          console.log('用户取消了文件选择');
          resolve(false);
        };

        // 触发文件选择对话框
        input.click();
      });
    } catch (error) {
      console.error('选择目录失败:', error);
      this.showMessage('选择目录失败，请重试', 'error');
      return false;
    }
  }

  // 加载音频文件
  async loadAudioFiles(files) {
    if (!files || files.length === 0) {
      this.showMessage('没有选择任何文件', 'warning');
      return false;
    }

    let loadedCount = 0;
    let skippedCount = 0;
    const loadedLetters = [];

    console.log('开始加载音频文件...');
    this.showMessage('正在加载音频文件...', 'info');

    for (const file of files) {
      try {
        const result = await this.processAudioFile(file);
        if (result) {
          loadedCount++;
          loadedLetters.push(result.letter);
        } else {
          skippedCount++;
        }
      } catch (error) {
        console.error(`处理文件 ${file.name} 失败:`, error);
        skippedCount++;
      }
    }

    // 显示加载结果
    const message = `加载完成！成功: ${loadedCount} 个，跳过: ${skippedCount} 个`;
    console.log(message);
    console.log('已加载的拼音:', loadedLetters);
    
    this.showMessage(message, loadedCount > 0 ? 'success' : 'warning');
    
    // 触发加载完成事件
    this.dispatchLoadCompleteEvent({
      loadedCount,
      skippedCount,
      loadedLetters,
      totalAudios: this.loadedAudios.size
    });

    return loadedCount > 0;
  }

  // 处理单个音频文件
  async processAudioFile(file) {
    // 检查文件格式
    const fileExtension = this.getFileExtension(file.name);
    if (!this.supportedFormats.includes(fileExtension)) {
      console.log(`跳过不支持的文件格式: ${file.name}`);
      return null;
    }

    // 从文件名提取拼音字母
    const letter = this.extractPinyinFromFilename(file.name);
    if (!letter) {
      console.log(`无法识别拼音字母: ${file.name}`);
      return null;
    }

    // 检查文件大小
    if (file.size > 10 * 1024 * 1024) { // 10MB限制
      console.log(`文件过大，跳过: ${file.name}`);
      return null;
    }

    try {
      // 创建音频URL
      const audioUrl = URL.createObjectURL(file);
      
      // 验证音频文件是否可播放
      const isValid = await this.validateAudioFile(audioUrl);
      if (!isValid) {
        URL.revokeObjectURL(audioUrl);
        console.log(`音频文件无效: ${file.name}`);
        return null;
      }

      // 存储音频信息
      const audioInfo = {
        letter: letter,
        url: audioUrl,
        file: file,
        filename: file.name,
        size: file.size,
        type: file.type,
        timestamp: Date.now()
      };

      // 如果已存在该字母的音频，先清理旧的
      if (this.loadedAudios.has(letter)) {
        const oldAudio = this.loadedAudios.get(letter);
        URL.revokeObjectURL(oldAudio.url);
      }

      this.loadedAudios.set(letter, audioInfo);
      console.log(`成功加载音频: ${letter} <- ${file.name}`);
      
      return audioInfo;
    } catch (error) {
      console.error(`处理音频文件失败: ${file.name}`, error);
      return null;
    }
  }

  // 从文件名提取拼音字母
  extractPinyinFromFilename(filename) {
    // 移除文件扩展名
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '').toLowerCase();
    
    // 直接匹配拼音字母
    if (this.pinyinLetters.includes(nameWithoutExt)) {
      return nameWithoutExt;
    }

    // 尝试匹配包含拼音的文件名（如：ch_sound.mp3 -> ch）
    for (const letter of this.pinyinLetters) {
      if (nameWithoutExt.includes(letter)) {
        // 优先匹配较长的拼音（如zh, ch, sh）
        if (letter.length > 1 && nameWithoutExt.startsWith(letter)) {
          return letter;
        } else if (letter.length === 1 && nameWithoutExt === letter) {
          return letter;
        }
      }
    }

    return null;
  }

  // 获取文件扩展名
  getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
  }

  // 验证音频文件是否可播放
  validateAudioFile(audioUrl) {
    return new Promise((resolve) => {
      const audio = new Audio();
      
      const cleanup = () => {
        audio.removeEventListener('canplaythrough', onCanPlay);
        audio.removeEventListener('error', onError);
        audio.src = '';
      };

      const onCanPlay = () => {
        cleanup();
        resolve(true);
      };

      const onError = () => {
        cleanup();
        resolve(false);
      };

      audio.addEventListener('canplaythrough', onCanPlay);
      audio.addEventListener('error', onError);
      
      // 设置超时
      setTimeout(() => {
        cleanup();
        resolve(false);
      }, 3000);

      audio.src = audioUrl;
    });
  }

  // 播放加载的音频
  async playLoadedAudio(letter) {
    const audioInfo = this.loadedAudios.get(letter);
    if (!audioInfo) {
      throw new Error(`没有找到字母 "${letter}" 的音频文件`);
    }

    return new Promise((resolve, reject) => {
      const audio = new Audio(audioInfo.url);
      
      audio.onended = () => {
        console.log(`播放完成: ${letter}`);
        resolve();
      };

      audio.onerror = (error) => {
        console.error(`播放失败: ${letter}`, error);
        reject(new Error(`播放音频失败: ${letter}`));
      };

      audio.play().catch(reject);
    });
  }

  // 检查是否有指定字母的音频
  hasAudio(letter) {
    return this.loadedAudios.has(letter);
  }

  // 获取所有已加载的音频信息
  getAllLoadedAudios() {
    const result = [];
    for (const [letter, audioInfo] of this.loadedAudios) {
      result.push({
        letter: letter,
        filename: audioInfo.filename,
        size: audioInfo.size,
        type: audioInfo.type,
        timestamp: audioInfo.timestamp
      });
    }
    return result.sort((a, b) => a.letter.localeCompare(b.letter));
  }

  // 获取加载状态统计
  getLoadingStats() {
    const totalLetters = this.pinyinLetters.length;
    const loadedLetters = this.loadedAudios.size;
    const missingLetters = this.pinyinLetters.filter(letter => !this.loadedAudios.has(letter));
    
    return {
      total: totalLetters,
      loaded: loadedLetters,
      missing: missingLetters.length,
      missingLetters: missingLetters,
      percentage: Math.round((loadedLetters / totalLetters) * 100)
    };
  }

  // 清除所有已加载的音频
  clearAllAudios() {
    console.log('清除所有已加载的音频');
    
    // 释放所有URL对象
    for (const [letter, audioInfo] of this.loadedAudios) {
      URL.revokeObjectURL(audioInfo.url);
    }
    
    this.loadedAudios.clear();
    
    // 触发清除事件
    this.dispatchClearEvent();
    
    this.showMessage('已清除所有音频文件', 'info');
  }

  // 删除指定字母的音频
  removeAudio(letter) {
    if (this.loadedAudios.has(letter)) {
      const audioInfo = this.loadedAudios.get(letter);
      URL.revokeObjectURL(audioInfo.url);
      this.loadedAudios.delete(letter);
      
      console.log(`删除音频: ${letter}`);
      this.dispatchRemoveEvent(letter);
      
      return true;
    }
    return false;
  }

  // 显示消息
  showMessage(message, type = 'info') {
    console.log(`[AudioLoader] ${message}`);
    
    // 如果页面有消息显示组件，使用它
    if (window.showUserMessage) {
      window.showUserMessage(message, type);
    } else if (window.toast) {
      window.toast(message);
    } else {
      // 简单的alert作为后备
      if (type === 'error') {
        alert(`错误: ${message}`);
      }
    }
  }

  // 触发加载完成事件
  dispatchLoadCompleteEvent(data) {
    const event = new CustomEvent('audioLoadComplete', {
      detail: data
    });
    document.dispatchEvent(event);
  }

  // 触发清除事件
  dispatchClearEvent() {
    const event = new CustomEvent('audioLoadClear');
    document.dispatchEvent(event);
  }

  // 触发删除事件
  dispatchRemoveEvent(letter) {
    const event = new CustomEvent('audioLoadRemove', {
      detail: { letter }
    });
    document.dispatchEvent(event);
  }
}

// 创建全局实例
const audioLoader = new AudioLoader();

// 导出到全局作用域
if (typeof window !== 'undefined') {
  window.audioLoader = audioLoader;
}