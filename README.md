# 🎯 汉语拼音学习助手

一个现代化的汉语拼音学习工具，帮助用户掌握标准普通话发音。支持声母、韵母学习，提供语音合成和自定义音频功能。

## ✨ 功能特性

### 📚 拼音学习功能
- **声母学习**：23个声母的标准发音练习
- **韵母学习**：24个韵母的发音训练
- **音节组合**：声母韵母组合练习
- **交互式界面**：点击即可听到标准发音

### 🔊 语音功能
- **智能语音合成**：基于Web Speech API的TTS功能
- **自定义音频**：支持加载个人录制的音频文件
- **多格式支持**：支持MP3、WAV、OGG等音频格式
- **优先级播放**：优先使用自定义音频，无文件时自动回退到TTS

### 🎨 现代化设计
- **响应式布局**：完美适配桌面端和移动端
- **现代化UI**：白色卡片容器，浅灰色背景，蓝色主题
- **流畅交互**：按钮点击反馈，触摸优化
- **清晰字体**：Microsoft YaHei字体，提升阅读体验

### 📱 移动端优化
- **触摸友好**：优化移动端触摸交互
- **自适应布局**：根据屏幕尺寸自动调整
- **快速响应**：流畅的移动端体验

## 🛠️ 技术栈

### 前端技术
- **HTML5**：语义化标签，现代化结构
- **CSS3**：Grid布局，Flexbox，响应式设计
- **JavaScript ES6+**：模块化开发，现代语法



## 🚀 安装和使用

### 环境要求
- 现代浏览器 (Chrome 60+, Firefox 55+, Safari 11+)
- 支持Web Speech API的浏览器
- HTTP服务器（用于本地开发）

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/zer0ptr/HanyupinyinLearningHelper.git
cd HanyupinyinLearningHelper
```

2. **启动HTTP服务器**
```bash
# 使用Python（如果已安装）
python -m http.server 3000

# 或使用Node.js http-server（如果已安装）
npx http-server . -p 3000

# 或使用任何其他HTTP服务器
```

3. **访问应用**
打开浏览器访问：`http://localhost:3000`

### 直接使用
本项目是纯静态Web应用，也可以直接：
- 双击 `index.html` 文件在浏览器中打开
- 部署到任何静态网站托管服务（如GitHub Pages、Vercel等）

### 快速开始

1. **基础学习**：点击主页面的声母或韵母按钮听取发音
2. **音频管理**：访问 `/audio-manager.html` 管理自定义音频文件

## 🎵 自定义音频使用指南

### 文件命名规则

音频文件需要按照拼音名称命名：

**声母文件命名**：
- `b.mp3`, `p.mp3`, `m.mp3`, `f.mp3`
- `d.mp3`, `t.mp3`, `n.mp3`, `l.mp3`
- `g.mp3`, `k.mp3`, `h.mp3`
- `j.mp3`, `q.mp3`, `x.mp3`
- `zh.mp3`, `ch.mp3`, `sh.mp3`, `r.mp3`
- `z.mp3`, `c.mp3`, `s.mp3`
- `y.mp3`, `w.mp3`

**韵母文件命名**：
- 单韵母：`a.mp3`, `o.mp3`, `e.mp3`, `i.mp3`, `u.mp3`, `v.mp3`
- 复韵母：`ai.mp3`, `ei.mp3`, `ui.mp3`, `ao.mp3`, `ou.mp3`, `iu.mp3`, `ie.mp3`, `ve.mp3`, `er.mp3`
- 鼻韵母：`an.mp3`, `en.mp3`, `in.mp3`, `un.mp3`, `vn.mp3`, `ang.mp3`, `eng.mp3`, `ing.mp3`, `ong.mp3`

### 支持的音频格式
- **MP3**：推荐格式，兼容性最好
- **WAV**：无损格式，文件较大
- **OGG**：开源格式，压缩率高
- **M4A**：Apple格式，质量较好

### 加载方法

1. **准备音频文件**：按照命名规则准备音频文件
2. **访问音频管理页面**：打开 `http://localhost:3000/audio-manager.html`
3. **选择音频目录**：点击"选择音频文件夹"按钮
4. **批量加载**：系统自动识别并加载匹配的音频文件
5. **查看状态**：在文件列表中查看加载状态

### 使用示例

```
音频文件夹结构：
/my-pinyin-audio/
  ├── b.mp3      # 声母 b
  ├── p.mp3      # 声母 p
  ├── a.mp3      # 韵母 a
  ├── ai.mp3     # 韵母 ai
  ├── ch.mp3     # 声母 ch
  └── ...
```

## 📁 项目结构

```
HanyupinyinLearningHelper/
├── index.html              # 主页面
├── audio-manager.html      # 音频管理页面
├── css/
│   ├── style.css          # 主样式文件
│   └── components.css     # 组件样式
├── js/
│   ├── app.js            # 主应用逻辑
│   ├── speech.js         # 语音功能模块
│   ├── audio-loader.js   # 音频加载模块
│   ├── audio-recorder.js # 音频录制模块
│   ├── data.js           # 拼音数据
│   └── utils.js          # 工具函数
├── assets/               # 静态资源目录
├── .trae/                # 项目文档目录
├── .vercel/              # Vercel部署配置
├── LICENSE               # 许可证文件
└── README.md            # 项目说明
```

## 🌟 核心功能说明

### 语音合成优化
- 智能选择最佳中文语音引擎
- 优化语速和音调参数
- 支持标准普通话发音
- 自动处理特殊拼音读音

### 自定义音频系统
- 批量音频文件加载
- 智能文件名匹配
- 音频状态实时显示
- 一键清除功能

### 响应式设计
- CSS Grid和Flexbox布局
- 移动端触摸优化
- 自适应字体大小
- 流畅的动画效果

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

### 开发规范
- 使用ES6+语法
- 遵循语义化命名
- 添加适当的注释
- 确保移动端兼容性

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。


## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 Issue：[GitHub Issues](https://github.com/zer0ptr/HanyupinyinLearningHelper/issues)
- 邮箱：iszhenghailin@gmail.com

---
