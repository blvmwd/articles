// 初始化脚本 - 无内联脚本
(function() {
    'use strict';
    
    // 等待所有组件就绪
    function waitForComponents() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 100; // 10秒超时
            
            const checkInterval = setInterval(() => {
                attempts++;
                
                // 检查所有必要的组件
                const hasSupabase = !!window.supabaseClient;
                const hasAuthManager = !!window.authManager;
                const hasArticleManager = !!window.articleManager;
                
                if (hasSupabase && hasAuthManager && hasArticleManager) {
                    clearInterval(checkInterval);
                    console.log('所有组件已就绪');
                    resolve(true);
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    console.warn('组件初始化超时');
                    resolve(false);
                }
            }, 100);
        });
    }
    
    // 加载文章
    async function loadArticles(page = 1) {
        const container = document.getElementById('articles-container');
        const pagination = document.getElementById('pagination');
        
        if (!container) return;
        
        container.innerHTML = '<p>正在加载文章...</p>';
        
        if (!window.articleManager) {
            container.innerHTML = '<div class="alert alert-error">文章管理器未初始化</div>';
            return;
        }
        
        const result = await window.articleManager.getAllArticles(page, 9);
        
        if (result.success) {
            const articles = result.data;
            
            if (articles.length === 0) {
                container.innerHTML = '<p>暂无文章</p>';
                if (pagination) pagination.innerHTML = '';
                return;
            }
            
            container.innerHTML = articles.map(article => `
                <div class="article-card">
                    <h3><a href="article-external.html?slug=${article.slug}">${article.title}</a></h3>
                    ${article.excerpt ? `<p class="excerpt">${article.excerpt}</p>` : ''}
                    <div class="meta">
                        <span>👤 ${article.author_name}</span>
                        <span>📅 ${window.articleManager.formatDate(article.created_at)}</span>
                        <span>👁️ ${article.view_count || 0} 次阅读</span>
                    </div>
                    ${article.tags && article.tags.length > 0 ? `
                        <div class="tags">
                            ${article.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                    <a href="article-external.html?slug=${article.slug}" class="btn">阅读全文</a>
                </div>
            `).join('');
            
            updatePagination(result.totalPages, page);
        } else {
            container.innerHTML = `<p class="alert alert-error">加载失败: ${result.message}</p>`;
            if (pagination) pagination.innerHTML = '';
        }
    }
    
    // 更新分页
    function updatePagination(totalPages, currentPage) {
        const pagination = document.getElementById('pagination');
        if (!pagination || totalPages <= 1) {
            if (pagination) pagination.innerHTML = '';
            return;
        }
        
        let html = '';
        
        if (currentPage > 1) {
            html += `<button class="btn" onclick="window.loadArticles(${currentPage - 1})">上一页</button>`;
        }
        
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, startPage + 4);
        
        for (let i = startPage; i <= endPage; i++) {
            if (i === currentPage) {
                html += `<button class="btn active">${i}</button>`;
            } else {
                html += `<button class="btn" onclick="window.loadArticles(${i})">${i}</button>`;
            }
        }
        
        if (currentPage < totalPages) {
            html += `<button class="btn" onclick="window.loadArticles(${currentPage + 1})">下一页</button>`;
        }
        
        pagination.innerHTML = html;
    }
    
    // 初始化应用
    async function initializeApp() {
        console.log('开始初始化应用...');
        
        // 等待组件就绪
        const componentsReady = await waitForComponents();
        
        if (!componentsReady) {
            const container = document.getElementById('articles-container');
            if (container) {
                container.innerHTML = '<div class="alert alert-error">系统初始化失败，请刷新页面</div>';
            }
            return;
        }
        
        // 导出函数到全局
        window.loadArticles = loadArticles;
        
        // 加载第一页文章
        await loadArticles();
        
        console.log('应用初始化完成');
    }
    
    // 页面加载完成后开始初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
        setTimeout(initializeApp, 100);
    }
})();