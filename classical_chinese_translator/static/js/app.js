// 全局变量
let currentAudio = null;
let isTranslating = false;

// DOM元素引用
const elements = {
    inputText: null,
    outputText: null,
    translateBtn: null,
    clearBtn: null,
    copyBtn: null,
    audioBtn: null,
    modelSelect: null,
    promptType: null,
    loadingModal: null,
    toast: null,
    toastBody: null
};

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    bindEvents();
    loadHistory();
    loadStats();
    
    // 添加页面加载动画
    document.body.classList.add('fade-in');
});

// 初始化DOM元素引用
function initializeElements() {
    elements.inputText = document.getElementById('inputText');
    elements.outputText = document.getElementById('outputText');
    elements.translateBtn = document.getElementById('translateBtn');
    elements.clearBtn = document.getElementById('clearBtn');
    elements.copyBtn = document.getElementById('copyBtn');
    elements.audioBtn = document.getElementById('audioBtn');
    elements.modelSelect = document.getElementById('modelSelect');
    elements.promptType = document.getElementById('promptType');
    elements.loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
    elements.toast = new bootstrap.Toast(document.getElementById('toast'));
    elements.toastBody = document.getElementById('toast-body');
}

// 绑定事件
function bindEvents() {
    // 翻译按钮
    elements.translateBtn.addEventListener('click', handleTranslate);
    
    // 清空按钮
    elements.clearBtn.addEventListener('click', handleClear);
    
    // 复制按钮
    elements.copyBtn.addEventListener('click', handleCopy);
    
    // 朗读按钮
    elements.audioBtn.addEventListener('click', handleAudio);
    
    // 输入框回车键
    elements.inputText.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            handleTranslate();
        }
    });
    
    // 输入框变化
    elements.inputText.addEventListener('input', function() {
        updateButtonStates();
    });
    
    // 历史搜索
    const historySearch = document.getElementById('historySearch');
    if (historySearch) {
        let searchTimeout;
        historySearch.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchHistory(this.value);
            }, 500);
        });
    }
}

// 处理翻译
async function handleTranslate() {
    const text = elements.inputText.value.trim();
    
    if (!text) {
        showToast('请输入要翻译的文言文', 'warning');
        return;
    }
    
    if (text.length > 2000) {
        showToast('文本长度不能超过2000字符', 'error');
        return;
    }
    
    if (isTranslating) {
        return;
    }
    
    isTranslating = true;
    updateButtonStates();
    showLoading('正在翻译中，请稍候...');
    
    try {
        const response = await fetch('/api/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text,
                model: elements.modelSelect.value,
                prompt_type: elements.promptType.value
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            elements.outputText.value = data.translation;
            updateTranslationInfo(data);
            showToast('翻译成功！', 'success');
            
            // 刷新历史记录
            loadHistory();
        } else {
            showToast(data.error || '翻译失败', 'error');
        }
        
    } catch (error) {
        console.error('Translation error:', error);
        showToast('网络错误，请稍后重试', 'error');
    } finally {
        isTranslating = false;
        updateButtonStates();
        hideLoading();
    }
}

// 处理清空
function handleClear() {
    elements.inputText.value = '';
    elements.outputText.value = '';
    document.getElementById('inputCounter').textContent = '0/2000';
    document.getElementById('translationInfo').textContent = '';
    updateButtonStates();
    elements.inputText.focus();
}

// 处理复制
async function handleCopy() {
    const text = elements.outputText.value;
    
    if (!text) {
        showToast('没有可复制的内容', 'warning');
        return;
    }
    
    try {
        await navigator.clipboard.writeText(text);
        showToast('复制成功！', 'success');
        
        // 添加复制成功动画
        elements.copyBtn.classList.add('copy-success');
        setTimeout(() => {
            elements.copyBtn.classList.remove('copy-success');
        }, 500);
        
    } catch (error) {
        // 兼容性备选方案
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        showToast('复制成功！', 'success');
    }
}

// 处理朗读
async function handleAudio() {
    const text = elements.outputText.value;
    
    if (!text) {
        showToast('没有可朗读的内容', 'warning');
        return;
    }
    
    if (text.length > 500) {
        showToast('文本太长，无法朗读', 'warning');
        return;
    }
    
    // 停止当前播放
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
        elements.audioBtn.classList.remove('audio-playing');
        elements.audioBtn.innerHTML = '<i class="fas fa-volume-up me-1"></i>朗读';
        return;
    }
    
    try {
        elements.audioBtn.disabled = true;
        elements.audioBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>生成中...';
        
        const response = await fetch('/api/audio/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text,
                language: 'zh'
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            currentAudio = new Audio(data.url);
            
            currentAudio.addEventListener('loadstart', () => {
                elements.audioBtn.classList.add('audio-playing');
                elements.audioBtn.innerHTML = '<i class="fas fa-stop me-1"></i>停止';
            });
            
            currentAudio.addEventListener('ended', () => {
                elements.audioBtn.classList.remove('audio-playing');
                elements.audioBtn.innerHTML = '<i class="fas fa-volume-up me-1"></i>朗读';
                currentAudio = null;
            });
            
            currentAudio.addEventListener('error', () => {
                showToast('音频播放失败', 'error');
                elements.audioBtn.classList.remove('audio-playing');
                elements.audioBtn.innerHTML = '<i class="fas fa-volume-up me-1"></i>朗读';
                currentAudio = null;
            });
            
            await currentAudio.play();
            
        } else {
            showToast(data.error || '音频生成失败', 'error');
        }
        
    } catch (error) {
        console.error('Audio error:', error);
        showToast('音频生成失败', 'error');
    } finally {
        elements.audioBtn.disabled = false;
        if (!currentAudio) {
            elements.audioBtn.innerHTML = '<i class="fas fa-volume-up me-1"></i>朗读';
        }
    }
}

// 更新按钮状态
function updateButtonStates() {
    const hasInput = elements.inputText.value.trim().length > 0;
    const hasOutput = elements.outputText.value.trim().length > 0;
    
    elements.translateBtn.disabled = !hasInput || isTranslating;
    elements.clearBtn.disabled = !hasInput && !hasOutput;
    elements.copyBtn.disabled = !hasOutput;
    elements.audioBtn.disabled = !hasOutput;
    
    // 更新翻译按钮文本
    if (isTranslating) {
        elements.translateBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>翻译中...';
    } else {
        elements.translateBtn.innerHTML = '<i class="fas fa-language me-2"></i>AI智能翻译';
    }
}

// 更新翻译信息
function updateTranslationInfo(data) {
    const info = document.getElementById('translationInfo');
    const modelName = elements.modelSelect.selectedOptions[0].text;
    const cacheStatus = data.from_cache ? '(来自缓存)' : '(新翻译)';
    const accessCount = data.access_count ? `访问次数: ${data.access_count}` : '';
    
    info.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <span>
                <i class="fas fa-robot me-1"></i>模型: ${modelName} ${cacheStatus}
            </span>
            <span>
                ${accessCount}
                <i class="fas fa-clock ms-2 me-1"></i>${formatDate(data.created_at)}
            </span>
        </div>
    `;
}

// 加载历史记录
async function loadHistory() {
    try {
        const response = await fetch('/api/history?limit=5');
        const data = await response.json();
        
        const historyList = document.getElementById('historyList');
        
        if (response.ok && data.translations && data.translations.length > 0) {
            historyList.innerHTML = data.translations.map(item => `
                <div class="history-item" onclick="loadTranslation('${escapeHtml(item.original_text)}', '${escapeHtml(item.translated_text)}')">
                    <div class="original-text">${truncateText(item.original_text, 50)}</div>
                    <div class="translated-text">${truncateText(item.translated_text, 80)}</div>
                    <div class="meta-info">
                        <span>
                            <i class="fas fa-robot me-1"></i>${item.model_used}
                        </span>
                        <span>
                            <i class="fas fa-clock me-1"></i>${formatDate(item.created_at)}
                        </span>
                    </div>
                </div>
            `).join('');
        } else {
            historyList.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-clock fa-2x mb-2"></i>
                    <p>暂无翻译历史</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Load history error:', error);
    }
}

// 加载统计信息
async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        
        const statsList = document.getElementById('statsList');
        
        if (response.ok) {
            statsList.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <div class="stat-item">
                            <span class="stat-number">${data.total_translations}</span>
                            <div class="stat-label">总翻译次数</div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="stat-item">
                            <span class="stat-number">${data.available_models}</span>
                            <div class="stat-label">可用模型</div>
                        </div>
                    </div>
                </div>
                <div class="mt-3">
                    <h6 class="text-muted mb-2">模型使用统计:</h6>
                    ${Object.values(data.model_stats).map(model => `
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <span>${model.name}</span>
                            <span class="badge badge-primary">${model.count}次</span>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            statsList.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                    <p>加载统计信息失败</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Load stats error:', error);
    }
}

// 从历史记录加载翻译
function loadTranslation(original, translated) {
    elements.inputText.value = original;
    elements.outputText.value = translated;
    updateButtonStates();
    
    // 更新计数器
    const counter = document.getElementById('inputCounter');
    counter.textContent = `${original.length}/2000`;
    
    showToast('已加载历史翻译', 'info');
}

// 显示历史记录模态框
function showHistory() {
    const modal = new bootstrap.Modal(document.getElementById('historyModal'));
    loadHistoryModal();
    modal.show();
}

// 显示统计信息模态框
function showStats() {
    const modal = new bootstrap.Modal(document.getElementById('statsModal'));
    loadStatsModal();
    modal.show();
}

// 加载历史记录模态框内容
async function loadHistoryModal() {
    const content = document.getElementById('historyModalContent');
    content.innerHTML = '<div class="text-center py-4"><div class="spinner-border" role="status"></div></div>';
    
    try {
        const response = await fetch('/api/history?limit=20');
        const data = await response.json();
        
        if (response.ok && data.translations && data.translations.length > 0) {
            content.innerHTML = data.translations.map(item => `
                <div class="history-item mb-3">
                    <div class="original-text">${escapeHtml(item.original_text)}</div>
                    <div class="translated-text">${escapeHtml(item.translated_text)}</div>
                    <div class="meta-info">
                        <span>
                            <i class="fas fa-robot me-1"></i>${item.model_used}
                            <i class="fas fa-eye ms-2 me-1"></i>${item.access_count}次
                        </span>
                        <span>
                            <i class="fas fa-clock me-1"></i>${formatDate(item.created_at)}
                            <button class="btn btn-sm btn-outline-danger ms-2" onclick="deleteHistory(${item.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </span>
                    </div>
                </div>
            `).join('');
        } else {
            content.innerHTML = '<div class="text-center text-muted py-4">暂无历史记录</div>';
        }
        
    } catch (error) {
        content.innerHTML = '<div class="text-center text-danger py-4">加载失败</div>';
    }
}

// 加载统计信息模态框内容
async function loadStatsModal() {
    const content = document.getElementById('statsModalContent');
    content.innerHTML = '<div class="text-center py-4"><div class="spinner-border" role="status"></div></div>';
    
    try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        
        if (response.ok) {
            content.innerHTML = `
                <div class="row mb-4">
                    <div class="col-md-4">
                        <div class="stat-item">
                            <span class="stat-number">${data.total_translations}</span>
                            <div class="stat-label">总翻译次数</div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="stat-item">
                            <span class="stat-number">${data.available_models}</span>
                            <div class="stat-label">可用模型</div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="stat-item">
                            <span class="stat-number">${Object.values(data.model_stats).reduce((sum, model) => sum + model.count, 0)}</span>
                            <div class="stat-label">模型调用次数</div>
                        </div>
                    </div>
                </div>
                
                <h5 class="mb-3">模型使用详情</h5>
                <div class="row">
                    ${Object.values(data.model_stats).map(model => `
                        <div class="col-md-6 mb-3">
                            <div class="card">
                                <div class="card-body text-center">
                                    <h6 class="card-title">${model.name}</h6>
                                    <div class="stat-number text-primary">${model.count}</div>
                                    <small class="text-muted">使用次数</small>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="text-center mt-4">
                    <button class="btn btn-outline-warning" onclick="cleanupData()">
                        <i class="fas fa-broom me-1"></i>清理过期数据
                    </button>
                </div>
            `;
        } else {
            content.innerHTML = '<div class="text-center text-danger py-4">加载失败</div>';
        }
        
    } catch (error) {
        content.innerHTML = '<div class="text-center text-danger py-4">加载失败</div>';
    }
}

// 搜索历史记录
async function searchHistory(keyword) {
    if (!keyword.trim()) {
        loadHistoryModal();
        return;
    }
    
    const content = document.getElementById('historyModalContent');
    content.innerHTML = '<div class="text-center py-4"><div class="spinner-border" role="status"></div></div>';
    
    try {
        const response = await fetch(`/api/history?keyword=${encodeURIComponent(keyword)}`);
        const data = await response.json();
        
        if (response.ok && data.translations && data.translations.length > 0) {
            content.innerHTML = data.translations.map(item => `
                <div class="history-item mb-3">
                    <div class="original-text">${highlightKeyword(escapeHtml(item.original_text), keyword)}</div>
                    <div class="translated-text">${highlightKeyword(escapeHtml(item.translated_text), keyword)}</div>
                    <div class="meta-info">
                        <span>
                            <i class="fas fa-robot me-1"></i>${item.model_used}
                            <i class="fas fa-eye ms-2 me-1"></i>${item.access_count}次
                        </span>
                        <span>
                            <i class="fas fa-clock me-1"></i>${formatDate(item.created_at)}
                            <button class="btn btn-sm btn-outline-danger ms-2" onclick="deleteHistory(${item.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </span>
                    </div>
                </div>
            `).join('');
        } else {
            content.innerHTML = '<div class="text-center text-muted py-4">未找到相关记录</div>';
        }
        
    } catch (error) {
        content.innerHTML = '<div class="text-center text-danger py-4">搜索失败</div>';
    }
}

// 删除历史记录
async function deleteHistory(id) {
    if (!confirm('确定要删除这条记录吗？')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/history/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('删除成功', 'success');
            loadHistoryModal();
            loadHistory();
            loadStats();
        } else {
            showToast('删除失败', 'error');
        }
        
    } catch (error) {
        showToast('删除失败', 'error');
    }
}

// 清理过期数据
async function cleanupData() {
    if (!confirm('确定要清理过期数据吗？这将删除30天前的翻译记录。')) {
        return;
    }
    
    try {
        const response = await fetch('/api/cleanup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ days: 30 })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast(`清理完成！删除了 ${data.deleted_translations} 条翻译记录和 ${data.deleted_audio_files} 个音频文件`, 'success');
            loadStatsModal();
            loadHistory();
        } else {
            showToast('清理失败', 'error');
        }
        
    } catch (error) {
        showToast('清理失败', 'error');
    }
}

// 工具函数
function showToast(message, type = 'info') {
    const toastHeader = elements.toastBody.parentNode.querySelector('.toast-header');
    const icon = toastHeader.querySelector('i');
    
    // 更新图标和颜色
    switch (type) {
        case 'success':
            icon.className = 'fas fa-check-circle text-success me-2';
            break;
        case 'error':
            icon.className = 'fas fa-exclamation-circle text-danger me-2';
            break;
        case 'warning':
            icon.className = 'fas fa-exclamation-triangle text-warning me-2';
            break;
        default:
            icon.className = 'fas fa-info-circle text-primary me-2';
    }
    
    elements.toastBody.textContent = message;
    elements.toast.show();
}

function showLoading(text = '加载中...') {
    document.getElementById('loadingText').textContent = text;
    elements.loadingModal.show();
}

function hideLoading() {
    elements.loadingModal.hide();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    
    return date.toLocaleDateString('zh-CN');
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return escapeHtml(text);
    return escapeHtml(text.substring(0, maxLength)) + '...';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function highlightKeyword(text, keyword) {
    if (!keyword) return text;
    const regex = new RegExp(`(${escapeRegExp(keyword)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}