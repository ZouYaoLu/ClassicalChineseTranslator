# 智能文言文翻译器部署说明

以下教程以 **宝塔 Linux 面板** 为例，指导你在服务器上快速部署本项目。

---
## 1. 环境准备
1. 登录宝塔面板，确保已安装 **Python 项目管理器**（或直接安装 Python3 & pip）。
2. 确保服务器可以访问外网（用于调用千问/其它大模型接口）。
3. 申请并保存好对应大模型的 `API Key`。

---
## 2. 上传代码
1. 通过 SSH 或宝塔文件管理器，将本项目代码上传到例如 `/www/wwwroot/wyw-translator`。
2. 项目结构示例：
   ```
   /www/wwwroot/wyw-translator
   ├── app.py
   ├── db.py
   ├── models.py
   ├── config.yaml  # 模型与密钥配置
   ├── requirements.txt
   └── static/
   ```

---
## 3. 安装依赖
在宝塔终端或 SSH 中执行：
```bash
cd /www/wwwroot/wyw-translator
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---
## 4. 配置模型密钥
编辑 `config.yaml`，将 `YOUR_ALIBABA_API_KEY` / `YOUR_OPENAI_API_KEY` 替换为你自己的 key，同时可根据需要增删模型或修改提示词。

---
## 5. 启动测试
```bash
source venv/bin/activate
uvicorn app:app --host 0.0.0.0 --port 8000 --workers 2
```
浏览器访问 `http://服务器IP:8000`，检查是否能正常翻译。

---
## 6. 配置宝塔守护进程 (可选)
1. 宝塔面板 → **计划任务** → **Shell脚本**，添加以下启动脚本并设置开机自启：
   ```bash
   cd /www/wwwroot/wyw-translator && source venv/bin/activate && nohup uvicorn app:app --host 0.0.0.0 --port 8000 --workers 2 > log.txt 2>&1 &
   ```
2. 亦可使用 **Supervisor 管理器** 插件，将 `uvicorn` 作为守护进程运行。

---
## 7. Nginx 反向代理 (推荐)
在宝塔 **网站** 栏中新建或修改站点，域名指向服务器IP，勾选 **反向代理**：
- 目标 URL：`http://127.0.0.1:8000`
- 其他保持默认。

这样即可通过域名/80 端口访问。

---
## 8. 常见问题
- **报错 401/403**：请检查大模型 API Key 是否正确，或 IP 是否在白名单内。
- **翻译速度慢**：与模型接口网络延迟或并发限制有关，可考虑升级套餐或自行缓存更多结果。
- **无法朗读**：朗读功能基于浏览器的 `SpeechSynthesis`，部分浏览器/系统可能不支持，请更换 Chrome、Edge 等现代浏览器。

---
## 9. 二次开发
- 前端代码位于 `static/` 目录，可自由更换 UI 框架。
- 后端采用 FastAPI，可使用 `python main.py` 热重载开发，或引入 Celery 等实现队列加速。

---
祝你部署顺利！
