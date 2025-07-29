from flask import Blueprint, render_template, request, jsonify, send_file
from .utils import TranslationService, AudioService, HistoryService, get_available_models
from .models import Translation
import os

main = Blueprint('main', __name__)

# 初始化服务
translation_service = TranslationService()
audio_service = AudioService()

@main.route('/')
def index():
    """主页"""
    models = get_available_models()
    return render_template('index.html', models=models)

@main.route('/api/translate', methods=['POST'])
def translate():
    """翻译API"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': '请提供要翻译的文本'}), 400
        
        text = data['text'].strip()
        model_name = data.get('model', None)
        prompt_type = data.get('prompt_type', 'default')
        force_new = data.get('force_new', False)
        
        if not text:
            return jsonify({'error': '请输入要翻译的文言文'}), 400
        
        if len(text) > 2000:
            return jsonify({'error': '文本长度不能超过2000字符'}), 400
        
        # 调用翻译服务
        result = translation_service.translate(
            text=text,
            model_name=model_name,
            prompt_type=prompt_type,
            force_new=force_new
        )
        
        if 'error' in result:
            return jsonify(result), 500
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': f'服务器错误: {str(e)}'}), 500

@main.route('/api/audio/generate', methods=['POST'])
def generate_audio():
    """生成音频API"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': '请提供要生成音频的文本'}), 400
        
        text = data['text'].strip()
        language = data.get('language', 'zh')
        
        if not text:
            return jsonify({'error': '请输入文本'}), 400
        
        if len(text) > 500:
            return jsonify({'error': '文本长度不能超过500字符'}), 400
        
        # 生成音频
        result = audio_service.generate_audio(text, language)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': f'音频生成失败: {str(e)}'}), 500

@main.route('/api/history')
def get_history():
    """获取翻译历史"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        keyword = request.args.get('keyword', '')
        
        if keyword:
            result = HistoryService.search_translations(keyword, limit)
        else:
            result = HistoryService.get_recent_translations(limit, page)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': f'获取历史记录失败: {str(e)}'}), 500

@main.route('/api/history/<int:translation_id>', methods=['DELETE'])
def delete_history(translation_id):
    """删除翻译记录"""
    try:
        result = HistoryService.delete_translation(translation_id)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': f'删除失败: {str(e)}'}), 500

@main.route('/api/models')
def get_models():
    """获取可用模型列表"""
    try:
        models = get_available_models()
        return jsonify({'models': models})
        
    except Exception as e:
        return jsonify({'error': f'获取模型列表失败: {str(e)}'}), 500

@main.route('/api/stats')
def get_stats():
    """获取统计信息"""
    try:
        total_translations = Translation.query.count()
        models = get_available_models()
        
        # 统计各模型使用次数
        model_stats = {}
        for model in models:
            count = Translation.query.filter_by(model_used=model['key']).count()
            model_stats[model['key']] = {
                'name': model['name'],
                'count': count
            }
        
        return jsonify({
            'total_translations': total_translations,
            'available_models': len(models),
            'model_stats': model_stats
        })
        
    except Exception as e:
        return jsonify({'error': f'获取统计信息失败: {str(e)}'}), 500

@main.route('/api/cleanup', methods=['POST'])
def cleanup():
    """清理过期数据"""
    try:
        data = request.get_json() or {}
        days = data.get('days', 30)
        
        # 清理过期翻译记录
        deleted_translations = Translation.cleanup_old_records(days)
        
        # 清理过期音频文件
        deleted_audio = audio_service.cleanup_old_audio(7)
        
        return jsonify({
            'success': True,
            'deleted_translations': deleted_translations,
            'deleted_audio_files': deleted_audio
        })
        
    except Exception as e:
        return jsonify({'error': f'清理失败: {str(e)}'}), 500

@main.errorhandler(404)
def not_found(error):
    """404错误处理"""
    if request.path.startswith('/api/'):
        return jsonify({'error': 'API接口不存在'}), 404
    return render_template('404.html'), 404

@main.errorhandler(500)
def internal_error(error):
    """500错误处理"""
    if request.path.startswith('/api/'):
        return jsonify({'error': '服务器内部错误'}), 500
    return render_template('500.html'), 500