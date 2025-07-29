import os
import json
import hashlib
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from app.translator import TranslatorService
from app.config_manager import ConfigManager

app = Flask(__name__)
CORS(app)

# 初始化配置管理器和翻译服务
config_manager = ConfigManager()
translator_service = TranslatorService(config_manager)

@app.route('/')
def index():
    """主页"""
    return render_template('index.html')

@app.route('/api/translate', methods=['POST'])
def translate():
    """翻译接口"""
    data = request.get_json()
    text = data.get('text', '').strip()
    
    if not text:
        return jsonify({'error': '请输入要翻译的文言文'}), 400
    
    try:
        result = translator_service.translate(text)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/history', methods=['GET'])
def get_history():
    """获取翻译历史"""
    try:
        history = translator_service.get_history()
        return jsonify({'history': history})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/config')
def config_page():
    """配置页面"""
    return render_template('config.html')

@app.route('/api/config', methods=['GET'])
def get_config():
    """获取配置"""
    try:
        config = config_manager.get_config()
        # 隐藏API密钥
        for model_key in config.get('models', {}):
            if 'api_key' in config['models'][model_key]:
                if config['models'][model_key]['api_key']:
                    config['models'][model_key]['api_key'] = '******'
        return jsonify(config)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/config', methods=['POST'])
def update_config():
    """更新配置"""
    try:
        new_config = request.get_json()
        config_manager.update_config(new_config)
        # 重新初始化翻译服务
        translator_service.__init__(config_manager)
        return jsonify({'message': '配置更新成功'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(
        host=config_manager.get_config()['server']['host'],
        port=config_manager.get_config()['server']['port'],
        debug=True
    )