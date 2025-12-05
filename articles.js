// 文章管理器（修复版）
class ArticleManager {
  constructor() {
    this.currentArticle = null;
  }

  // 获取所有已发布的文章
  async getAllArticles(page = 1, limit = 10) {
    try {
      const start = (page - 1) * limit;
      const { data, error, count } = await supabaseClient
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

  // 获取用户自己的所有文章
  async getUserArticles(userId) {
    try {
      const { data, error } = await supabaseClient
        .from('articles')
        .select('*')
        .eq('author_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('获取用户文章失败:', error);
      return { success: false, message: error.message };
    }
  }

  // 获取单篇文章
  async getArticle(id) {
    try {
      const { data, error } = await supabaseClient
        .from('articles')
        .select('*, author_name')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('获取文章失败:', error);
      return { success: false, message: error.message };
    }
  }

  // 根据slug获取文章
  async getArticleBySlug(slug) {
    try {
      const { data, error } = await supabaseClient
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

  // 增加文章浏览次数
  async incrementViewCount(articleId) {
    try {
      const { data } = await supabaseClient
        .from('articles')
        .select('view_count')
        .eq('id', articleId)
        .single();
      
      if (data) {
        await supabaseClient
          .from('articles')
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq('id', articleId);
      }
    } catch (error) {
      console.error('更新浏览次数失败:', error);
    }
  }

  // 创建文章
  async createArticle(articleData, userId, username) {
    if (!authManager.isLoggedIn) {
      return { success: false, message: '请先登录' };
    }
    
    // 检查用户是否被封禁
    const user = await authManager.getCurrentUserInfo();
    if (user && user.is_banned) {
      return { success: false, message: '您的账户已被封禁，无法发布文章' };
    }
    
    // 检查用户是否已激活（管理员不需要激活）
    if (!user.is_active && !user.is_admin) {
      return { success: false, message: '您的账户未激活，请联系管理员激活' };
    }
    
    try {
      // 生成slug
      const slug = articleData.slug || this.generateSlug(articleData.title);
      
      const { data, error } = await supabaseClient
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

  // 更新文章
  async updateArticle(id, articleData, userId) {
    if (!authManager.isLoggedIn) {
      return { success: false, message: '请先登录' };
    }
    
    // 检查用户是否被封禁
    const user = await authManager.getCurrentUserInfo();
    if (user && user.is_banned) {
      return { success: false, message: '您的账户已被封禁，无法修改文章' };
    }
    
    // 检查用户是否已激活（管理员不需要激活）
    if (!user.is_active && !user.is_admin) {
      return { success: false, message: '您的账户未激活，请联系管理员激活' };
    }
    
    try {
      // 如果是普通用户，检查文章是否属于该用户
      if (!user.is_admin) {
        const article = await this.getArticle(id);
        if (!article.success) {
          return article;
        }
        
        if (article.data.author_id !== userId) {
          return { success: false, message: '您只能修改自己的文章' };
        }
      }
      
      const { data, error } = await supabaseClient
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

  // 删除文章
  async deleteArticle(id, userId) {
    if (!authManager.isLoggedIn) {
      return { success: false, message: '请先登录' };
    }
    
    // 检查用户是否被封禁
    const user = await authManager.getCurrentUserInfo();
    if (user && user.is_banned) {
      return { success: false, message: '您的账户已被封禁，无法删除文章' };
    }
    
    try {
      // 如果是普通用户，检查文章是否属于该用户
      if (!user.is_admin) {
        const article = await this.getArticle(id);
        if (!article.success) {
          return article;
        }
        
        if (article.data.author_id !== userId) {
          return { success: false, message: '您只能删除自己的文章' };
        }
      }
      
      const { error } = await supabaseClient
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

  // 搜索文章
  async searchArticles(query) {
    try {
      const { data, error } = await supabaseClient
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

  // 生成slug
  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-');
  }

  // 生成摘要
  generateExcerpt(content, length = 150) {
    // 移除Markdown标记
    const text = content
      .replace(/[#*`\[\]()!]/g, '')
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/<[^>]*>/g, '')
      .replace(/\n/g, ' ');
    
    return text.length > length ? text.substring(0, length) + '...' : text;
  }

  // 格式化日期
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

  // 获取文章作者信息
  async getArticleAuthor(articleId) {
    try {
      const { data, error } = await supabaseClient
        .from('articles')
        .select('author_name, author_id')
        .eq('id', articleId)
        .single();
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('获取作者信息失败:', error);
      return { success: false, message: error.message };
    }
  }
}

// 创建全局文章管理器
const articleManager = new ArticleManager();
window.articleManager = articleManager;