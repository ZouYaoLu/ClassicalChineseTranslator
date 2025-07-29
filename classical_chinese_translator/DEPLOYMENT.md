# 智能文言文翻译器 - 宝塔面板部署指南

## 📋 系统要求

- **操作系统**: Ubuntu 18.04+ / CentOS 7+ / Debian 9+
- **Python版本**: Python 3.8+
- **内存**: 最低 1GB RAM，推荐 2GB+
- **存储**: 最低 2GB 可用空间
- **宝塔面板**: 7.7.0+

## 🚀 快速部署 (推荐)

### 方法一：自动安装脚本

1. **登录服务器**
   ```bash
   ssh root@your-server-ip
   ```

2. **下载并运行安装脚本**
   ```bash
   cd /www/wwwroot
   git clone https://github.com/your-username/classical_chinese_translator.git
   cd classical_chinese_translator
   chmod +x install.sh
   ./install.sh
   ```

3. **配置API密钥**
   ```bash
   nano .env
   ```
   
   编辑以下配置项：
   ```env
   # 必填: 阿里千问API密钥
   QWEN_API_KEY=sk-your-qwen-api-key
   
   # 可选: OpenAI API密钥
   OPENAI_API_KEY=sk-your-openai-api-key
   
   # 可选: Claude API密钥
   CLAUDE_API_KEY=your-claude-api-key
   
   # 生产环境密钥 (必须修改)
   SECRET_KEY=your-super-secret-key-change-this
   ```

### 方法二：宝塔面板部署

## 📊 宝塔面板详细部署步骤

### 1. 环境准备

1. **安装宝塔面板**
   ```bash
   # Ubuntu/Debian
   wget -O install.sh http://download.bt.cn/install/install-ubuntu_6.0.sh && sudo bash install.sh
   
   # CentOS
   yum install -y wget && wget -O install.sh http://download.bt.cn/install/install_6.0.sh && sh install.sh
   ```

2. **安装必要软件**
   - 在宝塔面板中安装：
     - **Nginx** (1.20+)
     - **Python项目管理器** (最新版)
     - **PM2管理器** (可选，用于进程管理)

### 2. 项目部署

1. **上传项目文件**
   - 方式1: 通过宝塔文件管理器上传
   - 方式2: 使用Git克隆
     ```bash
     cd /www/wwwroot
     git clone https://github.com/your-username/classical_chinese_translator.git
     ```

2. **设置项目目录权限**
   ```bash
   cd /www/wwwroot/classical_chinese_translator
   chmod -R 755 .
   chown -R www:www .
   ```

3. **创建Python虚拟环境**
   
   在宝塔面板 → Python项目管理器 → 添加项目：
   - **项目名称**: classical_chinese_translator
   - **项目路径**: /www/wwwroot/classical_chinese_translator
   - **Python版本**: 3.8+
   - **框架**: Flask
   - **启动文件**: wsgi.py
   - **端口**: 5000

4. **安装Python依赖**
   
   在项目管理界面点击"模块"，然后点击"一键安装"：
   ```
   Flask==2.3.3
   Flask-SQLAlchemy==3.0.5
   Flask-CORS==4.0.0
   requests==2.31.0
   python-dotenv==1.0.0
   dashscope==1.17.0
   openai==1.3.8
   gtts==2.4.0
   ```

### 3. 配置环境变量

1. **复制环境配置文件**
   ```bash
   cp .env.example .env
   ```

2. **编辑配置文件**
   ```bash
   nano .env
   ```
   
   重要配置项说明：
   ```env
   # Flask配置
   SECRET_KEY=your-production-secret-key-very-long-and-random
   FLASK_ENV=production
   PORT=5000
   
   # 数据库配置
   DATABASE_URL=sqlite:///classical_chinese.db
   
   # 默认翻译模型
   DEFAULT_MODEL=qwen
   
   # 阿里千问配置 (必填)
   QWEN_API_KEY=sk-your-qwen-api-key-here
   
   # OpenAI配置 (可选)
   OPENAI_API_KEY=sk-your-openai-api-key-here
   
   # Claude配置 (可选)
   CLAUDE_API_KEY=your-claude-api-key-here
   ```

### 4. 配置Nginx反向代理

1. **添加站点**
   - 在宝塔面板 → 网站 → 添加站点
   - 域名: your-domain.com
   - 目录: /www/wwwroot/classical_chinese_translator

2. **配置反向代理**
   
   在站点设置 → 反向代理 → 添加反向代理：
   ```nginx
   location / {
       proxy_pass http://127.0.0.1:5000;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }
   
   location /static {
       alias /www/wwwroot/classical_chinese_translator/static;
       expires 1d;
   }
   ```

3. **配置SSL证书** (推荐)
   - 在站点设置 → SSL → Let's Encrypt → 申请免费证书

### 5. 启动应用

1. **初始化数据库**
   ```bash
   cd /www/wwwroot/classical_chinese_translator
   source venv/bin/activate
   python -c "from app import create_app; app = create_app(); app.app_context().push(); from app.models import db; db.create_all()"
   ```

2. **启动Python项目**
   - 在宝塔面板 → Python项目管理器 → 找到项目 → 点击"启动"

3. **设置开机自启**
   - 在项目管理界面启用"开机自启动"

### 6. 验证部署

1. **检查服务状态**
   ```bash
   ps aux | grep python
   netstat -tlnp | grep 5000
   ```

2. **访问网站**
   - 打开浏览器访问: `http://your-domain.com`
   - 测试翻译功能

## 🔧 进阶配置

### 性能优化

1. **配置Gunicorn** (推荐生产环境)
   
   安装Gunicorn：
   ```bash
   pip install gunicorn
   ```
   
   创建Gunicorn配置文件 `gunicorn.conf.py`：
   ```python
   bind = "127.0.0.1:5000"
   workers = 4
   worker_class = "sync"
   worker_connections = 1000
   max_requests = 1000
   max_requests_jitter = 100
   timeout = 30
   keepalive = 60
   preload_app = True
   ```
   
   启动命令修改为：
   ```bash
   gunicorn -c gunicorn.conf.py wsgi:application
   ```

2. **配置Redis缓存** (可选)
   
   安装Redis：
   ```bash
   # 在宝塔面板安装Redis
   ```
   
   修改配置文件支持Redis缓存。

### 安全配置

1. **防火墙设置**
   ```bash
   # 只开放必要端口
   ufw allow 22    # SSH
   ufw allow 80    # HTTP
   ufw allow 443   # HTTPS
   ufw enable
   ```

2. **限制访问频率**
   
   在Nginx配置中添加：
   ```nginx
   limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
   
   location /api/ {
       limit_req zone=api burst=20 nodelay;
       # ... 其他配置
   }
   ```

## 🔍 监控和维护

### 日志配置

1. **查看应用日志**
   ```bash
   tail -f /www/wwwroot/classical_chinese_translator/logs/app.log
   ```

2. **查看Nginx访问日志**
   ```bash
   tail -f /www/server/nginx/logs/access.log
   ```

### 备份策略

1. **数据库备份**
   ```bash
   # 自动备份脚本
   #!/bin/bash
   DATE=$(date +%Y%m%d_%H%M%S)
   cp /www/wwwroot/classical_chinese_translator/classical_chinese.db \
      /www/backup/classical_chinese_$DATE.db
   ```

2. **定期清理**
   ```bash
   # 添加到crontab
   0 2 * * * /www/wwwroot/classical_chinese_translator/cleanup.sh
   ```

## ❗ 常见问题解决

### 1. 端口被占用
```bash
# 查找占用端口的进程
lsof -i :5000
# 结束进程
kill -9 <PID>
```

### 2. 权限问题
```bash
# 设置正确的权限
chown -R www:www /www/wwwroot/classical_chinese_translator
chmod -R 755 /www/wwwroot/classical_chinese_translator
```

### 3. Python依赖安装失败
```bash
# 更新pip
pip install --upgrade pip
# 使用国内镜像源
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple/
```

### 4. API调用失败
- 检查API密钥是否正确配置
- 确认网络连接正常
- 查看API配额是否用完

### 5. 音频功能异常
```bash
# 安装音频处理依赖
sudo apt-get install espeak espeak-data libespeak1 libespeak-dev
sudo apt-get install ffmpeg
```

### 6. 数据库锁定
```bash
# 重启应用
systemctl restart your-app-service
# 或在宝塔面板重启Python项目
```

## 📞 技术支持

如果在部署过程中遇到问题，可以：

1. 查看项目GitHub Issues
2. 检查系统日志：`journalctl -f`
3. 查看宝塔面板错误日志
4. 确认所有依赖都已正确安装

## 🎯 API密钥获取链接

- **阿里千问**: https://dashscope.aliyun.com/
- **OpenAI**: https://platform.openai.com/api-keys
- **Claude**: https://console.anthropic.com/

---

## 📝 更新日志

- **v1.0.0**: 初始版本发布
- 支持阿里千问、OpenAI、Claude多种大模型
- 智能缓存系统
- 音频朗读功能
- 翻译历史记录
- 现代化响应式界面