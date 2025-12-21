// 搜索页面初始化
(function() {
    'use strict';
    
    // 等待articleManager就绪
    function waitForArticleManager() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 50;
            
            const checkInterval = setInterval(() => {
                attempts++;
                if (window.articleManager) {
                    clearInterval(checkInterval);
                    resolve(true);
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    resolve(false);
                }
            }, 100);
        });
    }
    
    // 执行搜索
    async function performSearch(query) {
        const resultsEl = document.getElementById('search-results');
        const infoEl = document.getElementById('search-info');
        
        if (!query || query.trim() === '') {
            resultsEl.innerHTML = '<p>请输入搜索关键词</p>';
            if (infoEl) infoEl.textContent = '';
            return;
        }
        
        resultsEl.innerHTML = '<p>正在搜索...</p>';
        
        const managerReady = await waitForArticleManager();
        if (!managerReady) {
            resultsEl.innerHTML = '<div class="alert alert-error">搜索系统初始化失败</div>';
            return;
        }
        
        const result = await window.articleManager.searchArticles(query);
        
        if (result.success) {
            const articles = result.data;
            
            if (articles.length === 0) {
                resultsEl.innerHTML = `<p>没有找到与"${query}"相关的文章</p>`;
            } else {
                resultsEl.innerHTML = `
                    <div class="articles-grid">
                        ${articles.map(article => `
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
                        `).join('')}
                    </div>
                `;
            }
            
            if (infoEl) {
                infoEl.textContent = `找到 ${articles.length} 条结果 (关键词: "${query}")`;
            }
        } else {
            resultsEl.innerHTML = `<div class="alert alert-error">搜索失败: ${result.message}</div>`;
            if (infoEl) infoEl.textContent = '';
        }
    }
    
    // 初始化搜索功能
    async function initSearch() {
        const searchInput = document.getElementById('search-input');
        const searchBtn = document.getElementById('search-btn');
        
        if (!searchInput || !searchBtn) return;
        
        // 搜索按钮点击事件
        searchBtn.addEventListener('click', () => {
            performSearch(searchInput.value.trim());
        });
        
        // 回车键搜索
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch(searchInput.value.trim());
            }
        });
        
        // 从URL获取搜索参数
        const params = new URLSearchParams(window.location.search);
        const query = params.get('q');
        if (query) {
            searchInput.value = query;
            performSearch(query);
        }
    }
    
    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSearch);
    } else {
        setTimeout(initSearch, 100);
    }
})();