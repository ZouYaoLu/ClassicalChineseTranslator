# 🎯 智能文言文翻译器

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.8+-green.svg)
![Flask](https://img.shields.io/badge/flask-2.3+-orange.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

**专业、高效、准确的文言文翻译工具**

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [部署指南](#-部署指南) • [API文档](#-api接口) • [贡献指南](#-贡献指南)

</div>

---

## 📖 项目介绍

智能文言文翻译器是一个基于现代AI大模型的Web应用，专门用于将文言文翻译成现代汉语。该项目支持多种主流AI模型，具备智能缓存、音频朗读、历史记录等丰富功能，为用户提供便捷、准确的文言文翻译服务。

### ✨ 主要特色

- 🤖 **多模型支持**: 集成阿里千问、OpenAI GPT、Claude等主流AI模型
- 💾 **智能缓存**: 本地缓存翻译结果，避免重复调用API
- 🔊 **语音朗读**: 支持翻译结果的语音播放功能
- 📚 **历史记录**: 完整的翻译历史管理和搜索功能
- 🎨 **现代界面**: 响应式设计，支持多种设备访问
- ⚡ **高性能**: 优化的缓存策略和并发处理
- 🔒 **安全可靠**: 完善的错误处理和安全配置

## 🚀 功能特性

### 核心功能
- ✅ **文言文翻译**: 准确翻译各类文言文内容
- ✅ **多模型切换**: 支持在不同AI模型间灵活切换
- ✅ **翻译模式**: 标准翻译和详细解释两种模式
- ✅ **实时翻译**: 快速响应，即时获得翻译结果
- ✅ **批量处理**: 支持长文本的分段翻译

### 辅助功能
- 📱 **响应式设计**: 完美适配桌面、平板、手机
- 🔍 **历史搜索**: 快速查找历史翻译记录
- 📊 **使用统计**: 详细的翻译统计和分析
- 🎵 **音频播放**: 高质量的中文语音合成
- 📤 **结果导出**: 支持复制和分享翻译结果

### 管理功能
- ⚙️ **配置管理**: 灵活的模型和提示词配置
- 🗄️ **数据管理**: 自动清理过期数据
- 📈 **性能监控**: 实时监控系统运行状态
- 🔐 **安全防护**: API限流和错误处理

## 🛠 技术栈

### 后端技术
- **框架**: Flask 2.3+
- **数据库**: SQLite / PostgreSQL / MySQL
- **AI集成**: 阿里云DashScope、OpenAI API、Claude API
- **音频处理**: Google TTS (gTTS)

### 前端技术
- **UI框架**: Bootstrap 5
- **图标**: Font Awesome 6
- **JavaScript**: 原生ES6+
- **样式**: CSS3 + 渐变动画

### 部署技术
- **Web服务器**: Nginx
- **应用服务器**: Gunicorn / uWSGI
- **进程管理**: PM2 / Supervisor
- **容器化**: Docker (可选)

## 🚀 快速开始

### 环境要求

- Python 3.8+
- 1GB+ RAM
- 2GB+ 存储空间

### 一键安装

```bash
# 1. 克隆项目
git clone https://github.com/your-username/classical_chinese_translator.git
cd classical_chinese_translator

# 2. 运行安装脚本
chmod +x install.sh
./install.sh

# 3. 配置API密钥
cp .env.example .env
nano .env  # 编辑配置文件

# 4. 启动应用
python run.py
```

### 手动安装

```bash
# 1. 创建虚拟环境
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# 2. 安装依赖
pip install -r requirements.txt

# 3. 初始化数据库
python -c "from app import create_app; app = create_app(); app.app_context().push(); from app.models import db; db.create_all()"

# 4. 启动开发服务器
python run.py
```

### 配置API密钥

编辑 `.env` 文件，配置至少一个AI模型的API密钥：

```env
# 阿里千问 (推荐)
QWEN_API_KEY=sk-your-qwen-api-key

# OpenAI (可选)
OPENAI_API_KEY=sk-your-openai-api-key

# Claude (可选)
CLAUDE_API_KEY=your-claude-api-key
```

### API密钥获取

| 平台 | 获取地址 | 特点 |
|------|----------|------|
| 阿里千问 | [DashScope](https://dashscope.aliyun.com/) | 🇨🇳 国内访问快，价格优惠 |
| OpenAI | [OpenAI Platform](https://platform.openai.com/api-keys) | 🌍 功能强大，稳定可靠 |
| Claude | [Anthropic Console](https://console.anthropic.com/) | 🧠 理解能力强，安全性高 |

## 📦 部署指南

### 宝塔面板部署

详细的宝塔面板部署指南请参考：[DEPLOYMENT.md](DEPLOYMENT.md)

### Docker部署

```bash
# 1. 构建镜像
docker build -t classical-chinese-translator .

# 2. 运行容器
docker run -d \
  --name classical-chinese \
  -p 5000:5000 \
  -v $(pwd)/.env:/app/.env \
  classical-chinese-translator
```

### 传统VPS部署

```bash
# 1. 安装Nginx
sudo apt install nginx

# 2. 配置反向代理
sudo nano /etc/nginx/sites-available/classical-chinese

# 3. 启动服务
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 🔌 API接口

### 翻译接口

```http
POST /api/translate
Content-Type: application/json

{
  "text": "学而时习之，不亦说乎",
  "model": "qwen",
  "prompt_type": "default"
}
```

响应：
```json
{
  "translation": "学了知识并时常温习，不是很快乐的事情吗？",
  "model_used": "qwen",
  "from_cache": false,
  "created_at": "2024-01-01T12:00:00"
}
```

### 音频生成

```http
POST /api/audio/generate
Content-Type: application/json

{
  "text": "学了知识并时常温习，不是很快乐的事情吗？",
  "language": "zh"
}
```

### 历史记录

```http
GET /api/history?page=1&limit=10
```

### 统计信息

```http
GET /api/stats
```

## 📸 界面预览

### 主界面
- 🎨 现代化的渐变背景
- 📱 响应式布局设计
- ⚡ 流畅的动画效果

### 翻译功能
- 🔄 实时模型切换
- 📝 智能文本计数
- ⏱️ 翻译状态提示

### 历史记录
- 🔍 快速搜索功能
- 📊 详细使用统计
- 🗑️ 一键清理数据

## 🤝 贡献指南

我们欢迎各种形式的贡献！

### 如何贡献

1. **Fork** 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 **Pull Request**

### 开发指南

```bash
# 1. 安装开发依赖
pip install -r requirements-dev.txt

# 2. 运行测试
python -m pytest

# 3. 代码格式化
black app/
flake8 app/

# 4. 提交前检查
pre-commit run --all-files
```

### 问题反馈

如果您发现了 bug 或有功能建议，请：

1. 查看 [Issues](https://github.com/your-username/classical_chinese_translator/issues) 是否已有相关问题
2. 如果没有，请创建新的 Issue
3. 详细描述问题或建议
4. 提供复现步骤（如果是 bug）

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- 感谢 [阿里云DashScope](https://dashscope.aliyun.com/) 提供优秀的AI服务
- 感谢 [OpenAI](https://openai.com/) 的GPT系列模型
- 感谢 [Anthropic](https://www.anthropic.com/) 的Claude模型
- 感谢所有开源社区的贡献者

## 📞 联系我们

- 📧 Email: your-email@example.com
- 🐙 GitHub: [@your-username](https://github.com/your-username)
- 💬 讨论区: [GitHub Discussions](https://github.com/your-username/classical_chinese_translator/discussions)

---

<div align="center">

**如果这个项目对您有帮助，请给它一个⭐️！**

Made with ❤️ by [Your Name](https://github.com/your-username)

</div>
