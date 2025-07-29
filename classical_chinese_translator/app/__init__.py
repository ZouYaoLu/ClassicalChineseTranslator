from flask import Flask
from flask_cors import CORS
from .models import db
from .config import Config

def create_app():
    """创建Flask应用"""
    app = Flask(__name__)
    
    # 加载配置
    app.config.from_object(Config)
    
    # 启用CORS
    CORS(app)
    
    # 初始化数据库
    db.init_app(app)
    
    # 注册蓝图
    from .routes import main
    app.register_blueprint(main)
    
    # 创建数据库表
    with app.app_context():
        db.create_all()
    
    return app