from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import hashlib

db = SQLAlchemy()

class Translation(db.Model):
    """翻译记录模型"""
    __tablename__ = 'translations'
    
    id = db.Column(db.Integer, primary_key=True)
    original_text = db.Column(db.Text, nullable=False, index=True)
    translated_text = db.Column(db.Text, nullable=False)
    text_hash = db.Column(db.String(64), nullable=False, unique=True, index=True)
    model_used = db.Column(db.String(50), nullable=False)
    prompt_type = db.Column(db.String(20), default='default')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    access_count = db.Column(db.Integer, default=1)
    last_accessed = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __init__(self, original_text, translated_text, model_used, prompt_type='default'):
        self.original_text = original_text
        self.translated_text = translated_text
        self.model_used = model_used
        self.prompt_type = prompt_type
        self.text_hash = self.generate_hash(original_text)
        
    @staticmethod
    def generate_hash(text):
        """生成文本的MD5哈希值"""
        return hashlib.md5(text.encode('utf-8')).hexdigest()
    
    @classmethod
    def find_cached_translation(cls, text, prompt_type='default'):
        """查找缓存的翻译"""
        text_hash = cls.generate_hash(text)
        translation = cls.query.filter_by(
            text_hash=text_hash, 
            prompt_type=prompt_type
        ).first()
        
        if translation:
            # 更新访问记录
            translation.access_count += 1
            translation.last_accessed = datetime.utcnow()
            db.session.commit()
            
        return translation
    
    @classmethod
    def cleanup_old_records(cls, days=30):
        """清理过期的记录"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        old_records = cls.query.filter(cls.last_accessed < cutoff_date).all()
        
        for record in old_records:
            db.session.delete(record)
        
        db.session.commit()
        return len(old_records)
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'original_text': self.original_text,
            'translated_text': self.translated_text,
            'model_used': self.model_used,
            'prompt_type': self.prompt_type,
            'created_at': self.created_at.isoformat(),
            'access_count': self.access_count,
            'last_accessed': self.last_accessed.isoformat()
        }

class ModelConfig(db.Model):
    """模型配置模型"""
    __tablename__ = 'model_configs'
    
    id = db.Column(db.Integer, primary_key=True)
    model_name = db.Column(db.String(50), nullable=False, unique=True)
    display_name = db.Column(db.String(100), nullable=False)
    api_key = db.Column(db.String(200))
    endpoint = db.Column(db.String(200))
    model_version = db.Column(db.String(50))
    is_enabled = db.Column(db.Boolean, default=True)
    is_default = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'model_name': self.model_name,
            'display_name': self.display_name,
            'is_enabled': self.is_enabled,
            'is_default': self.is_default,
            'created_at': self.created_at.isoformat()
        }