// 文章详情页初始化
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
    
    // 从URL获取文章slug
    function getSlugFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('slug');
    }
    
    // 加载文章内容
    async function loadArticle() {
        const slug = getSlugFromURL();
        if (!slug) {
            showError('文章链接无效');
            return;
        }
        
        const managerReady = await waitForArticleManager();
        if (!managerReady) {
            showError('文章系统初始化失败');
            return;
        }
        
        const result = await window.articleManager.getArticleBySlug(slug);
        
        if (result.success && result.data) {
            displayArticle(result.data);
        } else {
            showError(result.message || '文章不存在或已被删除');
        }
    }
    
    // 显示文章内容
    function displayArticle(article) {
        const loadingEl = document.getElementById('article-loading');
        const contentEl = document.getElementById('article-content');
        const errorEl = document.getElementById('article-error');
        
        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'none';
        if (contentEl) contentEl.style.display = 'block';
        
        // 设置文章信息
        document.getElementById('article-title').textContent = article.title;
        document.getElementById('article-author').textContent = `👤 ${article.author_name}`;
        document.getElementById('article-date').textContent = `📅 ${window.articleManager.formatDate(article.created_at)}`;
        document.getElementById('article-views').textContent = `👁️ ${article.view_count || 0} 次阅读`;
        
        // 设置标签
        const tagsContainer = document.getElementById('article-tags');
        if (article.tags && article.tags.length > 0) {
            tagsContainer.innerHTML = article.tags.map(tag => 
                `<span class="tag">${tag}</span>`
            ).join('');
        } else {
            tagsContainer.innerHTML = '';
        }
        
        // 设置文章内容
        const articleBody = document.getElementById('article-body');
        if (article.content) {
            // 简单Markdown转换（实际项目中可以使用marked.js等库）
            const htmlContent = convertMarkdownToHTML(article.content);
            articleBody.innerHTML = htmlContent;
        } else {
            articleBody.innerHTML = '<p>文章内容为空</p>';
        }
        
        // 更新页面标题
        document.title = `${article.title} - 文章系统`;
    }
    
    // 显示错误信息
    function showError(message) {
        const loadingEl = document.getElementById('article-loading');
        const errorEl = document.getElementById('article-error');
        
        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl) {
            errorEl.style.display = 'block';
            document.getElementById('error-message').textContent = message;
        }
    }
    
    // 简单Markdown到HTML转换
    function convertMarkdownToHTML(markdown) {
        return markdown
            // 标题
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            // 粗体
            .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
            // 斜体
            .replace(/\*(.*)\*/gim, '<em>$1</em>')
            // 代码块
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            // 行内代码
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            // 链接
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
            // 图片
            .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
            // 无序列表
            .replace(/^\s*\*\s+(.*)/gim, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
            // 有序列表
            .replace(/^\s*\d+\.\s+(.*)/gim, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>')
            // 引用
            .replace(/^>\s*(.*)/gim, '<blockquote>$1</blockquote>')
            // 水平线
            .replace(/^-{3,}/gim, '<hr>')
            // 换行
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            // 包裹段落
            .replace(/<p><\/p>/g, '')
            .replace(/^(?!<[^>]*>)(.*)/gim, '<p>$1</p>');
    }
    
    // 打印文章
    window.printArticle = function() {
        window.print();
    };
    
    // 分享文章
    window.shareArticle = function() {
        const title = document.getElementById('article-title').textContent;
        const url = window.location.href;
        
        if (navigator.share) {
            navigator.share({
                title: title,
                text: `分享文章: ${title}`,
                url: url
            });
        } else {
            // 复制链接到剪贴板
            navigator.clipboard.writeText(url).then(() => {
                alert('文章链接已复制到剪贴板');
            });
        }
    };
    
    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadArticle);
    } else {
        setTimeout(loadArticle, 100);
    }
})();