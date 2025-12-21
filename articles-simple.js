// 简化的文章管理器
(function() {
    'use strict';
    
    class SimpleArticleManager {
        constructor() {
            // 等待supabaseClient就绪
            this.waitForSupabase();
        }
        
        async waitForSupabase() {
            let attempts = 0;
            const maxAttempts = 50;
            
            while (!window.supabaseClient && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (window.supabaseClient) {
                console.log('ArticleManager: Supabase客户端已就绪');
            } else {
                console.warn('ArticleManager: Supabase客户端未就绪');
            }
        }
        
        get supabase() {
            return window.supabaseClient;
        }
        
        async getAllArticles(page = 1, limit = 10) {
            if (!this.supabase) {
                return { success: false, message: '数据库连接未初始化' };
            }
            
            try {
                const start = (page - 1) * limit;
                const { data, error, count } = await this.supabase
                    .from('articles')
                    .select('*, author_name', { count: 'exact' })
                    .eq('published', true)
                    .order('created_at', { ascending: false })
                    .range(start, start + limit - 1);
                
                if (error) throw error;
                return { 
                    success: true, 
                    data: data || [], 
                    total: count || 0,
                    page: page,
                    totalPages: Math.ceil((count || 0) / limit)
                };
            } catch (error) {
                console.error('获取文章失败:', error);
                return { success: false, message: error.message };
            }
        }
        
        async getArticleBySlug(slug) {
            if (!this.supabase) {
                return { success: false, message: '数据库连接未初始化' };
            }
            
            try {
                const { data, error } = await this.supabase
                    .from('articles')
                    .select('*, author_name')
                    .eq('slug', slug)
                    .eq('published', true)
                    .single();
                
                if (error) throw error;
                
                // 增加浏览次数
                if (data) {
                    await this.incrementViewCount(data.id);
                }
                
                return { success: true, data };
            } catch (error) {
                console.error('获取文章失败:', error);
                return { success: false, message: error.message };
            }
        }
        
        async incrementViewCount(articleId) {
            if (!this.supabase) return;
            
            try {
                const { data } = await this.supabase
                    .from('articles')
                    .select('view_count')
                    .eq('id', articleId)
                    .single();
                
                if (data) {
                    await this.supabase
                        .from('articles')
                        .update({ view_count: (data.view_count || 0) + 1 })
                        .eq('id', articleId);
                }
            } catch (error) {
                console.error('更新浏览次数失败:', error);
            }
        }
        
        async createArticle(articleData, userId, username) {
            if (!this.supabase) {
                return { success: false, message: '数据库连接未初始化' };
            }
            
            if (!window.authManager || !window.authManager.isLoggedIn) {
                return { success: false, message: '请先登录' };
            }
            
            try {
                const slug = this.generateSlug(articleData.title);
                
                const { data, error } = await this.supabase
                    .from('articles')
                    .insert([
                        {
                            title: articleData.title,
                            content: articleData.content,
                            slug: slug,
                            excerpt: articleData.excerpt || this.generateExcerpt(articleData.content),
                            author_id: userId,
                            author_name: username,
                            tags: articleData.tags || [],
                            published: articleData.published !== undefined ? articleData.published : true
                        }
                    ]);
                
                if (error) throw error;
                return { success: true, message: '文章创建成功', data };
            } catch (error) {
                console.error('创建文章失败:', error);
                return { success: false, message: error.message };
            }
        }
        
        async updateArticle(id, articleData, userId) {
            if (!this.supabase) {
                return { success: false, message: '数据库连接未初始化' };
            }
            
            try {
                const { data, error } = await this.supabase
                    .from('articles')
                    .update({
                        title: articleData.title,
                        content: articleData.content,
                        excerpt: articleData.excerpt || this.generateExcerpt(articleData.content),
                        updated_at: new Date().toISOString(),
                        tags: articleData.tags || [],
                        published: articleData.published
                    })
                    .eq('id', id);
                
                if (error) throw error;
                return { success: true, message: '文章更新成功', data };
            } catch (error) {
                console.error('更新文章失败:', error);
                return { success: false, message: error.message };
            }
        }
        
        async deleteArticle(id, userId) {
            if (!this.supabase) {
                return { success: false, message: '数据库连接未初始化' };
            }
            
            try {
                const { error } = await this.supabase
                    .from('articles')
                    .delete()
                    .eq('id', id);
                
                if (error) throw error;
                return { success: true, message: '文章删除成功' };
            } catch (error) {
                console.error('删除文章失败:', error);
                return { success: false, message: error.message };
            }
        }
        
        async searchArticles(query) {
            if (!this.supabase) {
                return { success: false, message: '数据库连接未初始化' };
            }
            
            try {
                const { data, error } = await this.supabase
                    .from('articles')
                    .select('*, author_name')
                    .or(`title.ilike.%${query}%,content.ilike.%${query}%,tags.cs.{${query}}`)
                    .eq('published', true)
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                return { success: true, data: data || [] };
            } catch (error) {
                console.error('搜索文章失败:', error);
                return { success: false, message: error.message };
            }
        }
        
        generateSlug(title) {
            return title
                .toLowerCase()
                .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
                .replace(/^-+|-+$/g, '')
                .replace(/-+/g, '-');
        }
        
        generateExcerpt(content, length = 150) {
            const text = content
                .replace(/[#*`\[\]()!]/g, '')
                .replace(/!\[.*?\]\(.*?\)/g, '')
                .replace(/<[^>]*>/g, '')
                .replace(/\n/g, ' ');
            
            return text.length > length ? text.substring(0, length) + '...' : text;
        }
        
        formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }
    
    // 创建全局实例
    window.articleManager = new SimpleArticleManager();
    console.log('ArticleManager已初始化');
})();