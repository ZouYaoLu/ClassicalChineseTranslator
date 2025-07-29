#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WSGI配置文件
用于生产环境部署(如宝塔面板、Apache、Nginx等)
"""

import os
import sys

# 添加项目路径到Python路径
project_path = os.path.dirname(os.path.abspath(__file__))
if project_path not in sys.path:
    sys.path.insert(0, project_path)

# 导入Flask应用
from app import create_app

# 创建应用实例
application = create_app()

if __name__ == "__main__":
    application.run()