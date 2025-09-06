// 应用主逻辑
class PinyinApp {
  constructor() {
    this.currentTab = 'learn-tab';
    this.currentCategory = 'initials';
    this.selectedInitial = 'b';
    this.selectedFinal = 'a';
    this.init();
  }
  
  init() {
    this.setupNavigation();
    this.setupAudioControls();
    this.initializeAudioLoader();
    this.renderLearnTab();
    this.renderPracticeTab();
    
    // 加载用户偏好设置
    this.loadUserPreferences();
  }
  
  // 初始化音频加载器
  initializeAudioLoader() {
    if (typeof AudioLoader !== 'undefined') {
      window.audioLoader = new AudioLoader();
      console.log('音频加载器已初始化');
    } else {
      console.warn('AudioLoader 类未找到');
    }
  }
  
  // 设置导航
  setupNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn[data-tab]');
    navBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetTab = e.currentTarget.dataset.tab;
        this.switchTab(targetTab);
      });
    });
    
    // 录音导航按钮
    const recordNavBtn = document.getElementById('record-nav-btn');
    if (recordNavBtn) {
      recordNavBtn.addEventListener('click', () => {
        this.openRecordManager();
      });
    }
    
    // 音频管理导航按钮
    const audioNavBtn = document.getElementById('audio-nav-btn');
    if (audioNavBtn) {
      audioNavBtn.addEventListener('click', () => {
        this.openAudioManager();
      });
    }
  }
  
  // 设置音频控制
  setupAudioControls() {
    // 音频模式切换按钮
    const modeToggleBtn = document.getElementById('audio-mode-toggle');
    if (modeToggleBtn) {
      modeToggleBtn.addEventListener('click', () => {
        this.toggleAudioMode();
      });
    }
    
    // 录音管理按钮
    const recordManagerBtn = document.getElementById('record-manager-btn');
    if (recordManagerBtn) {
      recordManagerBtn.addEventListener('click', () => {
        this.openRecordManager();
      });
    }
    
    // 音频管理按钮
    const audioManagerBtn = document.getElementById('audio-manager-btn');
    if (audioManagerBtn) {
      audioManagerBtn.addEventListener('click', () => {
        this.openAudioManager();
      });
    }
    
    // 初始化音频模式状态
    this.updateAudioModeDisplay();
  }
  
  // 切换音频模式
  toggleAudioMode() {
    if (window.audioRecorder) {
      window.audioRecorder.toggleMode();
      this.updateAudioModeDisplay();
      
      // 显示切换提示
      const mode = window.audioRecorder.useCustomAudio ? '自定义录音' : 'TTS语音';
      this.showToast(`已切换到${mode}模式`);
    } else {
      this.showToast('音频录制功能不可用', 'error');
    }
  }
  
  // 更新音频模式显示
  updateAudioModeDisplay() {
    const modeToggleBtn = document.getElementById('audio-mode-toggle');
    const modeIcon = modeToggleBtn?.querySelector('.mode-icon');
    const modeText = modeToggleBtn?.querySelector('.mode-text');
    
    if (window.audioRecorder && window.audioRecorder.useCustomAudio) {
      modeToggleBtn?.classList.add('custom-mode');
      if (modeIcon) modeIcon.textContent = '🎙️';
      if (modeText) modeText.textContent = '录音';
    } else {
      modeToggleBtn?.classList.remove('custom-mode');
      if (modeIcon) modeIcon.textContent = '🔊';
      if (modeText) modeText.textContent = 'TTS';
    }
  }
  
  // 打开录音管理器
  openRecordManager() {
    window.open('record-manager.html', '_blank', 'width=800,height=600');
  }
  
  // 打开音频管理器
  openAudioManager() {
    window.open('audio-manager.html', '_blank', 'width=1000,height=700');
  }
  
  // 显示提示消息
  showToast(message, type = 'info') {
    // 创建提示元素
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // 添加样式
    Object.assign(toast.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 20px',
      borderRadius: '6px',
      color: 'white',
      fontSize: '14px',
      zIndex: '10000',
      opacity: '0',
      transform: 'translateY(-20px)',
      transition: 'all 0.3s ease',
      backgroundColor: type === 'error' ? '#dc3545' : '#28a745'
    });
    
    document.body.appendChild(toast);
    
    // 显示动画
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    }, 10);
    
    // 自动隐藏
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-20px)';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }
  
  // 切换标签页
  switchTab(tabId) {
    // 隐藏所有标签页
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.remove('active');
    });
    
    // 显示目标标签页
    document.getElementById(tabId).classList.add('active');
    
    // 更新导航按钮状态
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    
    this.currentTab = tabId;
    
    // 保存当前标签页
    storage.set('currentTab', tabId);
  }
  
  // 渲染学习页面
  renderLearnTab() {
    const learnTab = document.getElementById('learn-tab');
    learnTab.innerHTML = `
      <div class="learn-container">
        <div class="category-selector">
          <button class="category-btn ${this.currentCategory === 'initials' ? 'active' : ''}" data-category="initials">声母</button>
          <button class="category-btn ${this.currentCategory === 'finals' ? 'active' : ''}" data-category="finals">韵母</button>
          <button class="category-btn ${this.currentCategory === 'wholeReading' ? 'active' : ''}" data-category="wholeReading">整体认读</button>
        </div>
        <div class="pinyin-grid" id="pinyin-grid">
          <!-- 拼音卡片将在这里动态生成 -->
        </div>
      </div>
    `;
    
    this.setupCategorySelector();
    this.renderPinyinGrid();
  }
  
  // 设置分类选择器
  setupCategorySelector() {
    const categoryBtns = document.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        categoryBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.currentCategory = e.target.dataset.category;
        this.renderPinyinGrid();
        
        // 保存当前分类
        storage.set('currentCategory', this.currentCategory);
      });
    });
  }
  
  // 渲染拼音网格
  renderPinyinGrid() {
    const grid = document.getElementById('pinyin-grid');
    const data = pinyinData[this.currentCategory];
    
    grid.innerHTML = data.map(pinyin => `
      <button class="pinyin-card" onclick="app.speakPinyin('${pinyin}')">
        ${pinyin}
      </button>
    `).join('');
  }
  
  // 朗读拼音（带防抖）
  speakPinyin = debounce((text) => {
    // 优先使用音频加载器播放
    if (window.audioLoader && window.audioLoader.hasAudio(text)) {
      window.audioLoader.playAudio(text);
    } else if (window.audioRecorder) {
      // 使用音频录制器播放（包含自定义录音和TTS）
      window.audioRecorder.playAudio(text);
    } else {
      // 回退到语音管理器的speakPinyin方法（避免额外提示音）
      speechManager.speakPinyin(text);
    }
  }, 300);
  
  // 渲染拼读页面
  renderPracticeTab() {
    const practiceTab = document.getElementById('practice-tab');
    practiceTab.innerHTML = `
      <div class="practice-container">
        <div class="selection-area">
          <div class="selector">
            <label>声母</label>
            <div class="current-selection">${this.selectedInitial}</div>
            <button class="select-btn" onclick="app.showSelector('initial')">选择</button>
          </div>
          <div class="selector">
            <label>韵母</label>
            <div class="current-selection">${this.selectedFinal}</div>
            <button class="select-btn" onclick="app.showSelector('final')">选择</button>
          </div>
        </div>
        
        <div class="syllable-display">
          <div class="syllable">${this.selectedInitial + this.selectedFinal}</div>
          <button class="speak-btn" onclick="app.speakPinyin('${this.selectedInitial + this.selectedFinal}')">
            🔊
          </button>
        </div>
        
        <div class="tone-practice">
          <h3>四声调练习</h3>
          <div class="tone-buttons">
            ${[1,2,3,4].map(tone => `
              <div class="tone-item">
                <button class="tone-btn" onclick="app.practiceTone(${tone})">
                  ${pinyinData.tones[tone].name}
                </button>
                <div class="example-char">
                  ${this.getExampleChar(this.selectedInitial + this.selectedFinal, tone)}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      
      <!-- 选择器模态框 -->
      <div id="selector-modal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="modal-title">选择声母</h3>
            <button class="close-btn" onclick="app.hideSelector()">&times;</button>
          </div>
          <div class="modal-body" id="selector-list">
            <!-- 选项列表 -->
          </div>
        </div>
      </div>
    `;
    
    // 设置模态框点击外部关闭
    this.setupModalEvents();
  }
  
  // 设置模态框事件
  setupModalEvents() {
    const modal = document.getElementById('selector-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hideSelector();
        }
      });
    }
  }
  
  // 获取示例汉字
  getExampleChar(syllable, tone) {
    return pinyinData.examples[syllable]?.[tone] || '字';
  }
  
  // 显示选择器
  showSelector(type) {
    const modal = document.getElementById('selector-modal');
    const title = document.getElementById('modal-title');
    const list = document.getElementById('selector-list');
    
    title.textContent = type === 'initial' ? '选择声母' : '选择韵母';
    const data = type === 'initial' ? pinyinData.initials : pinyinData.finals;
    
    list.innerHTML = data.map(item => `
      <button class="selector-item" onclick="app.selectItem('${type}', '${item}')">
        ${item}
      </button>
    `).join('');
    
    modal.style.display = 'block';
    
    // 添加动画效果
    setTimeout(() => {
      modal.style.opacity = '1';
    }, 10);
  }
  
  // 隐藏选择器
  hideSelector() {
    const modal = document.getElementById('selector-modal');
    modal.style.opacity = '0';
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300);
  }
  
  // 选择项目
  selectItem(type, item) {
    if (type === 'initial') {
      this.selectedInitial = item;
      storage.set('selectedInitial', item);
    } else {
      this.selectedFinal = item;
      storage.set('selectedFinal', item);
    }
    
    this.hideSelector();
    this.renderPracticeTab();
  }
  
  // 练习声调
  practiceTone(tone) {
    const syllable = this.selectedInitial + this.selectedFinal;
    const tonedSyllable = getTonedSyllable(syllable, tone);
    this.speakPinyin(tonedSyllable);
  }
  
  // 加载用户偏好设置
  loadUserPreferences() {
    const savedTab = storage.get('currentTab');
    const savedCategory = storage.get('currentCategory');
    const savedInitial = storage.get('selectedInitial');
    const savedFinal = storage.get('selectedFinal');
    
    if (savedTab && savedTab !== this.currentTab) {
      this.switchTab(savedTab);
    }
    
    if (savedCategory) {
      this.currentCategory = savedCategory;
    }
    
    if (savedInitial) {
      this.selectedInitial = savedInitial;
    }
    
    if (savedFinal) {
      this.selectedFinal = savedFinal;
    }
    
    // 重新渲染页面以应用设置
    this.renderLearnTab();
    this.renderPracticeTab();
  }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
  window.app = new PinyinApp();
});

// 处理页面可见性变化
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // 页面隐藏时停止语音
    speechManager.stop();
  }
});