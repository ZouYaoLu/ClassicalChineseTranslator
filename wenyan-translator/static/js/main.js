// 工具函数
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function formatDateTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 主要功能
class WenyanTranslator {
    constructor() {
        this.inputText = document.getElementById('input-text');
        this.outputArea = document.getElementById('output-text');
        this.translateBtn = document.getElementById('translate-btn');
        this.copyBtn = document.getElementById('copy-btn');
        this.speakBtn = document.getElementById('speak-btn');
        this.pasteBtn = document.getElementById('paste-btn');
        this.historyList = document.getElementById('history-list');
        this.refreshHistoryBtn = document.getElementById('refresh-history');
        
        this.currentTranslation = null;
        this.speechSynthesis = window.speechSynthesis;
        
        this.initEventListeners();
        this.loadHistory();
    }
    
    initEventListeners() {
        // 翻译按钮
        this.translateBtn.addEventListener('click', () => this.translate());
        
        // 粘贴按钮
        this.pasteBtn.addEventListener('click', async () => {
            try {
                const text = await navigator.clipboard.readText();
                this.inputText.value = text;
                showToast('已粘贴文本', 'success');
            } catch (err) {
                showToast('粘贴失败，请手动粘贴', 'error');
            }
        });
        
        // 复制按钮
        this.copyBtn.addEventListener('click', () => {
            if (this.currentTranslation) {
                navigator.clipboard.writeText(this.currentTranslation)
                    .then(() => showToast('已复制到剪贴板', 'success'))
                    .catch(() => showToast('复制失败', 'error'));
            }
        });
        
        // 朗读按钮
        this.speakBtn.addEventListener('click', () => this.speak());
        
        // 刷新历史
        this.refreshHistoryBtn.addEventListener('click', () => this.loadHistory());
        
        // 回车键翻译
        this.inputText.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.translate();
            }
        });
    }
    
    async translate() {
        const text = this.inputText.value.trim();
        if (!text) {
            showToast('请输入要翻译的文言文', 'error');
            return;
        }
        
        // 显示加载状态
        this.translateBtn.disabled = true;
        this.translateBtn.innerHTML = '<span class="spinner"></span> 翻译中...';
        this.outputArea.innerHTML = '<p class="loading">正在翻译，请稍候...</p>';
        
        try {
            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.displayTranslation(data);
                if (data.from_cache) {
                    showToast('从缓存获取翻译结果', 'success');
                } else {
                    showToast('翻译成功', 'success');
                }
                // 刷新历史记录
                this.loadHistory();
            } else {
                throw new Error(data.error || '翻译失败');
            }
        } catch (error) {
            showToast(error.message, 'error');
            this.outputArea.innerHTML = '<p class="placeholder">翻译失败，请重试</p>';
        } finally {
            this.translateBtn.disabled = false;
            this.translateBtn.innerHTML = '<span class="icon">🎯</span> AI模型翻译';
        }
    }
    
    displayTranslation(data) {
        this.currentTranslation = data.translation;
        this.outputArea.innerHTML = `<div class="translation-text">${data.translation}</div>`;
        
        // 启用复制和朗读按钮
        this.copyBtn.disabled = false;
        this.speakBtn.disabled = false;
    }
    
    speak() {
        if (!this.currentTranslation) return;
        
        // 停止当前朗读
        this.speechSynthesis.cancel();
        
        // 创建朗读实例
        const utterance = new SpeechSynthesisUtterance(this.currentTranslation);
        utterance.lang = 'zh-CN';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        
        // 更新按钮状态
        this.speakBtn.innerHTML = '<span class="icon">⏸️</span> 停止';
        
        utterance.onend = () => {
            this.speakBtn.innerHTML = '<span class="icon">🔊</span> 朗读';
        };
        
        utterance.onerror = () => {
            showToast('朗读失败', 'error');
            this.speakBtn.innerHTML = '<span class="icon">🔊</span> 朗读';
        };
        
        // 开始朗读
        this.speechSynthesis.speak(utterance);
        
        // 点击停止
        this.speakBtn.onclick = () => {
            this.speechSynthesis.cancel();
            this.speakBtn.innerHTML = '<span class="icon">🔊</span> 朗读';
            this.speakBtn.onclick = () => this.speak();
        };
    }
    
    async loadHistory() {
        try {
            const response = await fetch('/api/history');
            const data = await response.json();
            
            if (response.ok) {
                this.displayHistory(data.history);
            } else {
                throw new Error(data.error || '加载历史失败');
            }
        } catch (error) {
            this.historyList.innerHTML = '<p class="loading">加载失败</p>';
        }
    }
    
    displayHistory(history) {
        if (history.length === 0) {
            this.historyList.innerHTML = '<p class="loading">暂无翻译历史</p>';
            return;
        }
        
        this.historyList.innerHTML = history.map(item => `
            <div class="history-item" data-original="${encodeURIComponent(item.original)}" data-translation="${encodeURIComponent(item.translation)}">
                <div class="history-original">${item.original}</div>
                <div class="history-translation">${item.translation}</div>
                <div class="history-meta">
                    <span>${formatDateTime(item.timestamp)}</span>
                    <span>${item.model}</span>
                </div>
            </div>
        `).join('');
        
        // 点击历史项目
        this.historyList.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                const original = decodeURIComponent(item.dataset.original);
                const translation = decodeURIComponent(item.dataset.translation);
                
                this.inputText.value = original;
                this.currentTranslation = translation;
                this.outputArea.innerHTML = `<div class="translation-text">${translation}</div>`;
                
                // 启用按钮
                this.copyBtn.disabled = false;
                this.speakBtn.disabled = false;
                
                // 滚动到顶部
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    new WenyanTranslator();
});