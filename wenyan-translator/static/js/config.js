// 配置管理
class ConfigManager {
    constructor() {
        this.config = null;
        this.init();
    }
    
    async init() {
        await this.loadConfig();
        this.bindEvents();
    }
    
    async loadConfig() {
        try {
            const response = await fetch('/api/config');
            if (response.ok) {
                this.config = await response.json();
                this.displayConfig();
            } else {
                throw new Error('加载配置失败');
            }
        } catch (error) {
            showToast(error.message, 'error');
        }
    }
    
    displayConfig() {
        // 通义千问配置
        document.getElementById('qwen-enabled').checked = this.config.models.qwen.enabled;
        document.getElementById('qwen-api-key').value = this.config.models.qwen.api_key || '';
        document.getElementById('qwen-model').value = this.config.models.qwen.model;
        document.getElementById('qwen-prompt').value = this.config.models.qwen.prompt;
        
        // OpenAI配置
        document.getElementById('openai-enabled').checked = this.config.models.openai.enabled;
        document.getElementById('openai-api-key').value = this.config.models.openai.api_key || '';
        document.getElementById('openai-base-url').value = this.config.models.openai.base_url;
        document.getElementById('openai-model').value = this.config.models.openai.model;
        document.getElementById('openai-prompt').value = this.config.models.openai.prompt;
        
        // 系统配置
        document.getElementById('cache-enabled').checked = this.config.cache.enabled;
        document.getElementById('cache-max-size').value = this.config.cache.max_size;
        document.getElementById('server-port').value = this.config.server.port;
    }
    
    bindEvents() {
        // 模型标签切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                document.querySelectorAll('.model-config').forEach(config => {
                    config.style.display = 'none';
                });
                
                const modelId = btn.dataset.model;
                document.getElementById(`${modelId}-config`).style.display = 'block';
            });
        });
        
        // 模型启用切换
        document.querySelectorAll('.model-enabled').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                // 确保至少有一个模型启用
                const enabledCount = document.querySelectorAll('.model-enabled:checked').length;
                if (enabledCount === 0) {
                    checkbox.checked = true;
                    showToast('至少需要启用一个模型', 'error');
                }
            });
        });
        
        // 保存配置
        document.getElementById('save-config').addEventListener('click', () => {
            this.saveConfig();
        });
        
        // 重置配置
        document.getElementById('reset-config').addEventListener('click', () => {
            if (confirm('确定要重置为默认配置吗？')) {
                this.resetConfig();
            }
        });
    }
    
    collectConfig() {
        const newConfig = JSON.parse(JSON.stringify(this.config));
        
        // 通义千问配置
        newConfig.models.qwen.enabled = document.getElementById('qwen-enabled').checked;
        const qwenApiKey = document.getElementById('qwen-api-key').value;
        if (qwenApiKey && qwenApiKey !== '******') {
            newConfig.models.qwen.api_key = qwenApiKey;
        }
        newConfig.models.qwen.model = document.getElementById('qwen-model').value;
        newConfig.models.qwen.prompt = document.getElementById('qwen-prompt').value;
        
        // OpenAI配置
        newConfig.models.openai.enabled = document.getElementById('openai-enabled').checked;
        const openaiApiKey = document.getElementById('openai-api-key').value;
        if (openaiApiKey && openaiApiKey !== '******') {
            newConfig.models.openai.api_key = openaiApiKey;
        }
        newConfig.models.openai.base_url = document.getElementById('openai-base-url').value;
        newConfig.models.openai.model = document.getElementById('openai-model').value;
        newConfig.models.openai.prompt = document.getElementById('openai-prompt').value;
        
        // 系统配置
        newConfig.cache.enabled = document.getElementById('cache-enabled').checked;
        newConfig.cache.max_size = parseInt(document.getElementById('cache-max-size').value);
        newConfig.server.port = parseInt(document.getElementById('server-port').value);
        
        return newConfig;
    }
    
    async saveConfig() {
        const saveBtn = document.getElementById('save-config');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner"></span> 保存中...';
        
        try {
            const newConfig = this.collectConfig();
            
            // 验证配置
            if (!newConfig.models.qwen.enabled && !newConfig.models.openai.enabled) {
                throw new Error('至少需要启用一个模型');
            }
            
            const response = await fetch('/api/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newConfig)
            });
            
            if (response.ok) {
                showToast('配置保存成功', 'success');
                // 重新加载配置
                await this.loadConfig();
            } else {
                const data = await response.json();
                throw new Error(data.error || '保存失败');
            }
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<span class="icon">💾</span> 保存配置';
        }
    }
    
    async resetConfig() {
        try {
            // 加载默认配置
            const response = await fetch('/config/default_config.json');
            if (response.ok) {
                const defaultConfig = await response.json();
                
                // 保存默认配置
                const saveResponse = await fetch('/api/config', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(defaultConfig)
                });
                
                if (saveResponse.ok) {
                    showToast('已重置为默认配置', 'success');
                    await this.loadConfig();
                } else {
                    throw new Error('重置失败');
                }
            }
        } catch (error) {
            showToast(error.message, 'error');
        }
    }
}

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

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    new ConfigManager();
});