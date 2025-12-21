// 登录页面初始化
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
    
    // 初始化登录表单
    async function initLoginForm() {
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
        
        const form = document.getElementById('login-form');
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const messageEl = document.getElementById('message');
            
            if (!messageEl) return;
            
            const result = await window.authManager.login(username, password);
            
            if (result.success) {
                messageEl.innerHTML = `
                    <div class="alert alert-success">${result.message}</div>
                `;
                setTimeout(() => {
                    window.location.href = 'dashboard-external.html';
                }, 1000);
            } else {
                messageEl.innerHTML = `
                    <div class="alert alert-error">${result.message}</div>
                `;
            }
        });
    }
    
    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLoginForm);
    } else {
        setTimeout(initLoginForm, 100);
    }
})();