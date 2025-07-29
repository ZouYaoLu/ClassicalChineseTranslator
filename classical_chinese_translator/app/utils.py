import requests
import json
import os
from gtts import gTTS
import hashlib
from flask import current_app
from .models import Translation, db
from .config import Config
import dashscope
import openai
from datetime import datetime

class TranslationService:
    """翻译服务类"""
    
    def __init__(self):
        self.config = Config()
    
    def translate(self, text, model_name=None, prompt_type='default', force_new=False):
        """
        翻译文言文
        
        Args:
            text: 要翻译的文言文
            model_name: 使用的模型名称
            prompt_type: 提示词类型
            force_new: 是否强制重新翻译
        
        Returns:
            dict: 翻译结果
        """
        # 清理输入文本
        text = text.strip()
        if not text:
            return {'error': '请输入要翻译的文言文'}
        
        # 检查缓存
        if not force_new and self.config.CACHE_ENABLED:
            cached = Translation.find_cached_translation(text, prompt_type)
            if cached:
                return {
                    'translation': cached.translated_text,
                    'model_used': cached.model_used,
                    'from_cache': True,
                    'created_at': cached.created_at.isoformat(),
                    'access_count': cached.access_count
                }
        
        # 选择模型
        if not model_name:
            model_name = self.config.DEFAULT_MODEL
        
        model_config = self.config.MODELS_CONFIG.get(model_name)
        if not model_config or not model_config['enabled']:
            return {'error': f'模型 {model_name} 未配置或未启用'}
        
        # 调用模型进行翻译
        try:
            translation_result = self._call_model(text, model_name, prompt_type)
            
            if 'error' in translation_result:
                return translation_result
            
            translated_text = translation_result['translation']
            
            # 保存到数据库
            if self.config.CACHE_ENABLED:
                translation_record = Translation(
                    original_text=text,
                    translated_text=translated_text,
                    model_used=model_name,
                    prompt_type=prompt_type
                )
                db.session.add(translation_record)
                db.session.commit()
            
            return {
                'translation': translated_text,
                'model_used': model_name,
                'from_cache': False,
                'created_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            return {'error': f'翻译失败: {str(e)}'}
    
    def _call_model(self, text, model_name, prompt_type):
        """调用具体的模型进行翻译"""
        
        model_config = self.config.MODELS_CONFIG[model_name]
        prompt = self.config.TRANSLATION_PROMPTS[prompt_type].format(text=text)
        
        try:
            if model_name == 'qwen':
                return self._call_qwen(prompt, model_config)
            elif model_name == 'openai':
                return self._call_openai(prompt, model_config)
            elif model_name == 'claude':
                return self._call_claude(prompt, model_config)
            else:
                return {'error': f'不支持的模型: {model_name}'}
        
        except Exception as e:
            return {'error': f'调用模型失败: {str(e)}'}
    
    def _call_qwen(self, prompt, config):
        """调用阿里千问模型"""
        try:
            dashscope.api_key = config['api_key']
            
            response = dashscope.Generation.call(
                model=config['model'],
                prompt=prompt,
                max_tokens=1000,
                temperature=0.1
            )
            
            if response.status_code == 200:
                return {'translation': response.output['text'].strip()}
            else:
                return {'error': f'千问API调用失败: {response.message}'}
                
        except Exception as e:
            return {'error': f'千问模型调用异常: {str(e)}'}
    
    def _call_openai(self, prompt, config):
        """调用OpenAI模型"""
        try:
            openai.api_key = config['api_key']
            
            response = openai.ChatCompletion.create(
                model=config['model'],
                messages=[
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.1
            )
            
            return {'translation': response.choices[0].message.content.strip()}
            
        except Exception as e:
            return {'error': f'OpenAI模型调用异常: {str(e)}'}
    
    def _call_claude(self, prompt, config):
        """调用Claude模型"""
        try:
            headers = {
                'Content-Type': 'application/json',
                'x-api-key': config['api_key'],
                'anthropic-version': '2023-06-01'
            }
            
            data = {
                'model': config['model'],
                'max_tokens': 1000,
                'messages': [
                    {"role": "user", "content": prompt}
                ]
            }
            
            response = requests.post(
                'https://api.anthropic.com/v1/messages',
                headers=headers,
                json=data,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                return {'translation': result['content'][0]['text'].strip()}
            else:
                return {'error': f'Claude API调用失败: {response.text}'}
                
        except Exception as e:
            return {'error': f'Claude模型调用异常: {str(e)}'}


class AudioService:
    """音频服务类"""
    
    def __init__(self):
        self.audio_dir = Config.AUDIO_DIR
        os.makedirs(self.audio_dir, exist_ok=True)
    
    def generate_audio(self, text, language='zh'):
        """
        生成文本的音频文件
        
        Args:
            text: 要生成音频的文本
            language: 语言代码
        
        Returns:
            dict: 音频文件信息
        """
        try:
            # 生成文件名
            text_hash = hashlib.md5(text.encode('utf-8')).hexdigest()
            filename = f"{text_hash}.mp3"
            filepath = os.path.join(self.audio_dir, filename)
            
            # 检查文件是否已存在
            if os.path.exists(filepath):
                return {
                    'success': True,
                    'filename': filename,
                    'filepath': filepath,
                    'url': f'/static/audio/{filename}'
                }
            
            # 生成音频
            tts = gTTS(text=text, lang=language, slow=False)
            tts.save(filepath)
            
            return {
                'success': True,
                'filename': filename,
                'filepath': filepath,
                'url': f'/static/audio/{filename}'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'音频生成失败: {str(e)}'
            }
    
    def cleanup_old_audio(self, days=7):
        """清理旧的音频文件"""
        try:
            import time
            current_time = time.time()
            cleanup_count = 0
            
            for filename in os.listdir(self.audio_dir):
                if filename.endswith('.mp3'):
                    filepath = os.path.join(self.audio_dir, filename)
                    file_age = current_time - os.path.getctime(filepath)
                    
                    if file_age > (days * 24 * 3600):  # 转换为秒
                        os.remove(filepath)
                        cleanup_count += 1
            
            return cleanup_count
            
        except Exception as e:
            return 0


class HistoryService:
    """历史记录服务类"""
    
    @staticmethod
    def get_recent_translations(limit=10, page=1):
        """获取最近的翻译记录"""
        try:
            offset = (page - 1) * limit
            translations = Translation.query.order_by(
                Translation.last_accessed.desc()
            ).offset(offset).limit(limit).all()
            
            total = Translation.query.count()
            
            return {
                'translations': [t.to_dict() for t in translations],
                'total': total,
                'page': page,
                'limit': limit,
                'has_more': total > (page * limit)
            }
            
        except Exception as e:
            return {'error': f'获取历史记录失败: {str(e)}'}
    
    @staticmethod
    def search_translations(keyword, limit=10):
        """搜索翻译记录"""
        try:
            translations = Translation.query.filter(
                Translation.original_text.contains(keyword) |
                Translation.translated_text.contains(keyword)
            ).order_by(Translation.last_accessed.desc()).limit(limit).all()
            
            return {
                'translations': [t.to_dict() for t in translations],
                'total': len(translations),
                'keyword': keyword
            }
            
        except Exception as e:
            return {'error': f'搜索失败: {str(e)}'}
    
    @staticmethod
    def delete_translation(translation_id):
        """删除翻译记录"""
        try:
            translation = Translation.query.get(translation_id)
            if translation:
                db.session.delete(translation)
                db.session.commit()
                return {'success': True}
            else:
                return {'error': '记录不存在'}
                
        except Exception as e:
            return {'error': f'删除失败: {str(e)}'}


def get_available_models():
    """获取可用的模型列表"""
    models = []
    for key, config in Config.MODELS_CONFIG.items():
        if config['enabled']:
            models.append({
                'key': key,
                'name': config['name'],
                'model': config.get('model', ''),
                'is_default': key == Config.DEFAULT_MODEL
            })
    return models