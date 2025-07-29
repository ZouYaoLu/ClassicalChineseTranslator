#!/bin/bash

# 智能文言文翻译器 - 自动安装脚本
# 适用于 Ubuntu/Debian/CentOS 系统

echo "🚀 开始安装智能文言文翻译器..."

# 检测操作系统
if [ -f /etc/redhat-release ]; then
    OS="centos"
    echo "检测到 CentOS/RHEL 系统"
elif [ -f /etc/debian_version ]; then
    OS="debian"
    echo "检测到 Debian/Ubuntu 系统"
else
    echo "❌ 不支持的操作系统"
    exit 1
fi

# 更新系统包
echo "📦 更新系统包..."
if [ "$OS" = "debian" ]; then
    sudo apt update
    sudo apt install -y python3 python3-pip python3-venv git curl
elif [ "$OS" = "centos" ]; then
    sudo yum update -y
    sudo yum install -y python3 python3-pip git curl
    sudo yum groupinstall -y "Development Tools"
fi

# 检查Python版本
python_version=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo "Python版本: $python_version"

if ! python3 -c 'import sys; exit(0 if sys.version_info >= (3, 8) else 1)'; then
    echo "❌ 需要Python 3.8或更高版本"
    exit 1
fi

# 创建虚拟环境
echo "🔧 创建Python虚拟环境..."
python3 -m venv venv
source venv/bin/activate

# 升级pip
pip install --upgrade pip

# 安装依赖
echo "📥 安装Python依赖包..."
pip install -r requirements.txt

# 复制环境配置文件
if [ ! -f .env ]; then
    echo "⚙️ 创建环境配置文件..."
    cp .env.example .env
    echo "✅ 请编辑 .env 文件，配置您的API密钥"
fi

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p static/audio
mkdir -p database
mkdir -p logs

# 设置权限
chmod +x run.py
chmod +x wsgi.py

# 初始化数据库
echo "🗄️ 初始化数据库..."
python -c "from app import create_app; app = create_app(); app.app_context().push(); from app.models import db; db.create_all()"

echo ""
echo "🎉 安装完成！"
echo ""
echo "📝 下一步操作："
echo "1. 编辑 .env 文件，配置您的API密钥"
echo "2. 运行开发服务器: python run.py"
echo "3. 或使用宝塔面板部署到生产环境"
echo ""
echo "🔗 访问地址: http://localhost:5000"
echo ""
echo "📚 API密钥获取："
echo "   阿里千问: https://dashscope.aliyun.com/"
echo "   OpenAI: https://platform.openai.com/api-keys"
echo "   Claude: https://console.anthropic.com/"
echo ""