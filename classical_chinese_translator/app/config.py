import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """应用配置类"""
    
    # Flask配置
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key-here'
    
    # 数据库配置
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///classical_chinese.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # 大模型配置
    MODELS_CONFIG = {
        'qwen': {
            'name': '阿里千问',
            'api_key': os.environ.get('QWEN_API_KEY'),
            'endpoint': 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
            'model': 'qwen-turbo',
            'enabled': bool(os.environ.get('QWEN_API_KEY'))
        },
        'openai': {
            'name': 'OpenAI GPT',
            'api_key': os.environ.get('OPENAI_API_KEY'),
            'model': 'gpt-3.5-turbo',
            'enabled': bool(os.environ.get('OPENAI_API_KEY'))
        },
        'claude': {
            'name': 'Claude',
            'api_key': os.environ.get('CLAUDE_API_KEY'),
            'model': 'claude-3-haiku-20240307',
            'enabled': bool(os.environ.get('CLAUDE_API_KEY'))
        }
    }
    
    # 默认翻译模型
    DEFAULT_MODEL = os.environ.get('DEFAULT_MODEL') or 'qwen'
    
    # 翻译提示词配置
    TRANSLATION_PROMPTS = {
        'default': '''你是一个专业的文言文翻译专家。请将下面的文言文翻译成现代汉语。要求：
1. 翻译要准确、流畅，符合现代汉语表达习惯
2. 保持原文的意境和文学色彩
3. 对于专有名词（人名、地名等）要准确翻译
4. 只返回翻译结果，不要添加其他解释

原文：{text}
翻译：''',
        
        'detailed': '''你是一个专业的文言文翻译专家。请将下面的文言文翻译成现代汉语，并提供详细解释。要求：
1. 翻译要准确、流畅，符合现代汉语表达习惯
2. 保持原文的意境和文学色彩
3. 对关键词汇进行注释说明
4. 解释文言文语法结构

原文：{text}
翻译：'''
    }
    
    # 音频配置
    AUDIO_DIR = 'static/audio'
    TTS_LANGUAGE = 'zh'
    
    # 缓存配置
    CACHE_ENABLED = True
    CACHE_EXPIRE_DAYS = 30