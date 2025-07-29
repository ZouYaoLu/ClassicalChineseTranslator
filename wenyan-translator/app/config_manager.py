import os
import json
from typing import Dict, Any

class ConfigManager:
    def __init__(self):
        self.config_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'config')
        self.config_file = os.path.join(self.config_dir, 'config.json')
        self.default_config_file = os.path.join(self.config_dir, 'default_config.json')
        self._load_config()
    
    def _load_config(self):
        """加载配置文件"""
        # 如果配置文件不存在，从默认配置复制
        if not os.path.exists(self.config_file):
            with open(self.default_config_file, 'r', encoding='utf-8') as f:
                default_config = json.load(f)
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(default_config, f, ensure_ascii=False, indent=2)
        
        # 加载配置
        with open(self.config_file, 'r', encoding='utf-8') as f:
            self.config = json.load(f)
    
    def get_config(self) -> Dict[str, Any]:
        """获取配置"""
        return self.config
    
    def update_config(self, new_config: Dict[str, Any]):
        """更新配置"""
        # 保留原有的API密钥（如果新配置中是******）
        for model_key in new_config.get('models', {}):
            if 'api_key' in new_config['models'][model_key]:
                if new_config['models'][model_key]['api_key'] == '******':
                    new_config['models'][model_key]['api_key'] = self.config['models'][model_key]['api_key']
        
        self.config = new_config
        with open(self.config_file, 'w', encoding='utf-8') as f:
            json.dump(self.config, f, ensure_ascii=False, indent=2)
    
    def get_enabled_model(self) -> Dict[str, Any]:
        """获取当前启用的模型配置"""
        for model_key, model_config in self.config['models'].items():
            if model_config.get('enabled', False):
                return {
                    'key': model_key,
                    'config': model_config
                }
        raise ValueError("没有启用的模型")