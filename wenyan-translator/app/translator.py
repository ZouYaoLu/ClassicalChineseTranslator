import os
import json
import hashlib
import time
from typing import Dict, Any, List
from datetime import datetime
import dashscope
import openai

class TranslatorService:
    def __init__(self, config_manager):
        self.config_manager = config_manager
        self.cache_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'cache')
        self.cache_file = os.path.join(self.cache_dir, 'translations.json')
        self._load_cache()
    
    def _load_cache(self):
        """加载缓存"""
        if not os.path.exists(self.cache_file):
            self.cache = {}
            os.makedirs(self.cache_dir, exist_ok=True)
            self._save_cache()
        else:
            with open(self.cache_file, 'r', encoding='utf-8') as f:
                self.cache = json.load(f)
    
    def _save_cache(self):
        """保存缓存"""
        with open(self.cache_file, 'w', encoding='utf-8') as f:
            json.dump(self.cache, f, ensure_ascii=False, indent=2)
    
    def _get_text_hash(self, text: str) -> str:
        """获取文本的哈希值"""
        return hashlib.md5(text.encode('utf-8')).hexdigest()
    
    def translate(self, text: str) -> Dict[str, Any]:
        """翻译文言文"""
        # 检查缓存
        text_hash = self._get_text_hash(text)
        
        if self.config_manager.get_config()['cache']['enabled'] and text_hash in self.cache:
            return {
                'original': text,
                'translation': self.cache[text_hash]['translation'],
                'from_cache': True,
                'timestamp': self.cache[text_hash]['timestamp']
            }
        
        # 调用AI模型进行翻译
        try:
            model_info = self.config_manager.get_enabled_model()
            model_key = model_info['key']
            model_config = model_info['config']
            
            if not model_config.get('api_key'):
                raise ValueError(f"请先配置{model_config['name']}的API密钥")
            
            if model_key == 'qwen':
                translation = self._translate_with_qwen(text, model_config)
            elif model_key == 'openai':
                translation = self._translate_with_openai(text, model_config)
            else:
                raise ValueError(f"不支持的模型: {model_key}")
            
            # 保存到缓存
            timestamp = datetime.now().isoformat()
            self.cache[text_hash] = {
                'original': text,
                'translation': translation,
                'timestamp': timestamp,
                'model': model_config['name']
            }
            
            # 限制缓存大小
            if len(self.cache) > self.config_manager.get_config()['cache']['max_size']:
                # 删除最旧的条目
                oldest_key = min(self.cache.keys(), 
                               key=lambda k: self.cache[k]['timestamp'])
                del self.cache[oldest_key]
            
            self._save_cache()
            
            return {
                'original': text,
                'translation': translation,
                'from_cache': False,
                'timestamp': timestamp
            }
            
        except Exception as e:
            raise Exception(f"翻译失败: {str(e)}")
    
    def _translate_with_qwen(self, text: str, config: Dict[str, Any]) -> str:
        """使用通义千问翻译"""
        dashscope.api_key = config['api_key']
        
        response = dashscope.Generation.call(
            model=config['model'],
            prompt=config['prompt'].format(text=text),
            result_format='message'
        )
        
        if response.status_code == 200:
            return response.output.choices[0].message.content.strip()
        else:
            raise Exception(f"通义千问API错误: {response.message}")
    
    def _translate_with_openai(self, text: str, config: Dict[str, Any]) -> str:
        """使用OpenAI翻译"""
        client = openai.OpenAI(
            api_key=config['api_key'],
            base_url=config.get('base_url', 'https://api.openai.com/v1')
        )
        
        response = client.chat.completions.create(
            model=config['model'],
            messages=[
                {"role": "system", "content": "你是一个专业的文言文翻译专家。"},
                {"role": "user", "content": config['prompt'].format(text=text)}
            ],
            temperature=0.3
        )
        
        return response.choices[0].message.content.strip()
    
    def get_history(self, limit: int = 20) -> List[Dict[str, Any]]:
        """获取翻译历史"""
        # 按时间戳排序
        sorted_items = sorted(
            self.cache.items(),
            key=lambda x: x[1]['timestamp'],
            reverse=True
        )
        
        history = []
        for _, item in sorted_items[:limit]:
            history.append({
                'original': item['original'],
                'translation': item['translation'],
                'timestamp': item['timestamp'],
                'model': item.get('model', '未知')
            })
        
        return history