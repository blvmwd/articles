// 注册页面初始化
(function() {
    'use strict';
    
    // 等待authManager就绪
    function waitForAuthManager() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 50;
            
            const checkInterval = setInterval(() => {
                attempts++;
                if (window.authManager) {
                    clearInterval(checkInterval);
                    resolve(true);
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    resolve(false);
                }
            }, 100);
        });
    }
    
    // 初始化注册表单
    async function initRegisterForm() {
        // 检查是否已登录
        if (window.authManager && window.authManager.checkAuth()) {
            window.location.href = 'dashboard-external.html';
            return;
        }
        
        const authReady = await waitForAuthManager();
        if (!authReady) {
            const messageEl = document.getElementById('message');
            if (messageEl) {
                messageEl.innerHTML = '<div class="alert alert-error">认证系统初始化失败</div>';
            }
            return;
        }
        
        const form = document.getElementById('register-form');
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const messageEl = document.getElementById('message');
            
            if (!messageEl) return;
            
            // 验证输入
            if (username.length < 3 || username.length > 20) {
                messageEl.innerHTML = '<div class="alert alert-error">用户名应为3-20个字符</div>';
                return;
            }
            
            if (password.length < 6) {
                messageEl.innerHTML = '<div class="alert alert-error">密码至少6个字符</div>';
                return;
            }
            
            if (password !== confirmPassword) {
                messageEl.innerHTML = '<div class="alert alert-error">两次输入的密码不一致</div>';
                return;
            }
            
            // 检查用户名格式（只允许字母数字和下划线）
            if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                messageEl.innerHTML = '<div class="alert alert-error">用户名只能包含字母、数字和下划线</div>';
                return;
            }
            
            // 禁用提交按钮
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = '注册中...';
            
            try {
                const result = await window.authManager.register(username, password);
                
                if (result.success) {
                    messageEl.innerHTML = `
                        <div class="alert alert-success">
                            ${result.message}
                        </div>
                    `;
                    form.reset();
                    
                    // 5秒后跳转到登录页面
                    setTimeout(() => {
                        window.location.href = 'login-external.html';
                    }, 5000);
                } else {
                    messageEl.innerHTML = `
                        <div class="alert alert-error">${result.message}</div>
                    `;
                }
            } catch (error) {
                messageEl.innerHTML = `
                    <div class="alert alert-error">注册失败: ${error.message}</div>
                `;
                console.error('注册异常:', error);
            } finally {
                // 恢复提交按钮
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
    
    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initRegisterForm);
    } else {
        setTimeout(initRegisterForm, 100);
    }
})();