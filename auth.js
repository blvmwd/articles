// 简化的认证管理器（避开复杂的RLS策略）
class AuthManager {
  constructor() {
    this.currentUser = null;
    this.isLoggedIn = false;
    this.isAdmin = false;
  }

  // SHA256哈希函数
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // 注册新用户
  async register(username, password) {
    const passwordHash = await this.hashPassword(password);
    
    try {
      const { data, error } = await supabaseClient
        .from('users')
        .insert([
          {
            username: username,
            password_hash: passwordHash,
            is_active: false,
            is_admin: false
          }
        ]);
      
      if (error) {
        if (error.code === '23505') {
          return { success: false, message: '用户名已存在' };
        }
        throw error;
      }
      
      return { 
        success: true, 
        message: '注册成功！请等待管理员激活您的账户。请联系 bilibilivmware 激活。'
      };
    } catch (error) {
      console.error('注册失败:', error);
      return { success: false, message: error.message };
    }
  }

  // 登录验证
  async login(username, password) {
    try {
      const passwordHash = await this.hashPassword(password);
      
      // 获取用户信息
      const { data: users, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password_hash', passwordHash);
      
      if (error) throw error;
      
      if (!users || users.length === 0) {
        return { success: false, message: '用户名或密码错误' };
      }
      
      const user = users[0];
      
      // 检查账户是否被封禁
      if (user.is_banned) {
        return { success: false, message: '账户已被封禁' };
      }
      
      // 检查账户是否已激活（管理员账户不需要激活）
      if (!user.is_active && !user.is_admin) {
        return { success: false, message: '账户未激活，请联系管理员激活' };
      }
      
      this.currentUser = {
        id: user.id,
        username: user.username,
        is_active: user.is_active,
        is_admin: user.is_admin,
        is_banned: user.is_banned
      };
      this.isLoggedIn = true;
      this.isAdmin = user.is_admin;
      
      // 更新最后登录时间
      await supabaseClient
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);
      
      // 存储登录状态到sessionStorage
      sessionStorage.setItem('user_token', btoa(JSON.stringify({
        id: user.id,
        username: user.username,
        is_admin: user.is_admin,
        timestamp: Date.now(),
        hash: passwordHash.slice(0, 32)
      })));
      
      return { success: true, message: '登录成功' };
    } catch (error) {
      console.error('登录失败:', error);
      return { success: false, message: error.message };
    }
  }

  // 检查登录状态
  checkAuth() {
    const token = sessionStorage.getItem('user_token');
    
    if (!token) {
      this.isLoggedIn = false;
      this.isAdmin = false;
      return false;
    }
    
    try {
      const data = JSON.parse(atob(token));
      // 检查token是否过期（8小时）
      if (Date.now() - data.timestamp > 8 * 60 * 60 * 1000) {
        this.logout();
        return false;
      }
      
      this.currentUser = { 
        id: data.id, 
        username: data.username,
        is_admin: data.is_admin 
      };
      this.isLoggedIn = true;
      this.isAdmin = data.is_admin;
      
      return true;
    } catch (error) {
      this.logout();
      return false;
    }
  }

  // 获取当前用户信息
  async getCurrentUserInfo() {
    if (!this.isLoggedIn || !this.currentUser) return null;
    
    try {
      const { data, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('id', this.currentUser.id)
        .single();
      
      if (error) throw error;
      
      this.currentUser = {
        id: data.id,
        username: data.username,
        is_active: data.is_active,
        is_admin: data.is_admin,
        is_banned: data.is_banned
      };
      this.isAdmin = data.is_admin;
      
      return this.currentUser;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }
  }

  // 注销
  logout() {
    sessionStorage.removeItem('user_token');
    this.currentUser = null;
    this.isLoggedIn = false;
    this.isAdmin = false;
  }

  // 删除当前用户账户
  async deleteCurrentUser() {
    if (!this.isLoggedIn || !this.currentUser) {
      return { success: false, message: '请先登录' };
    }
    
    try {
      // 先删除用户的所有文章
      await supabaseClient
        .from('articles')
        .delete()
        .eq('author_id', this.currentUser.id);
      
      // 然后删除用户
      const { error } = await supabaseClient
        .from('users')
        .delete()
        .eq('id', this.currentUser.id);
      
      if (error) throw error;
      
      this.logout();
      return { success: true, message: '账户已删除' };
    } catch (error) {
      console.error('删除账户失败:', error);
      return { success: false, message: error.message };
    }
  }

  // 管理员：激活用户
  async activateUser(userId) {
    if (!this.isAdmin) {
      return { success: false, message: '权限不足' };
    }
    
    try {
      const { error } = await supabaseClient
        .from('users')
        .update({ is_active: true })
        .eq('id', userId);
      
      if (error) throw error;
      return { success: true, message: '用户已激活' };
    } catch (error) {
      console.error('激活用户失败:', error);
      return { success: false, message: error.message };
    }
  }

  // 管理员：封禁用户
  async banUser(userId, banStatus = true) {
    if (!this.isAdmin) {
      return { success: false, message: '权限不足' };
    }
    
    try {
      const { error } = await supabaseClient
        .from('users')
        .update({ is_banned: banStatus })
        .eq('id', userId);
      
      if (error) throw error;
      
      // 如果封禁用户，隐藏其所有文章
      if (banStatus) {
        await supabaseClient
          .from('articles')
          .update({ published: false })
          .eq('author_id', userId);
      }
      
      return { success: true, message: `用户已${banStatus ? '封禁' : '解封'}` };
    } catch (error) {
      console.error('封禁用户失败:', error);
      return { success: false, message: error.message };
    }
  }

  // 管理员：删除用户
  async deleteUser(userId) {
    if (!this.isAdmin) {
      return { success: false, message: '权限不足' };
    }
    
    // 不能删除自己
    if (userId === this.currentUser.id) {
      return { success: false, message: '不能删除自己的账户' };
    }
    
    try {
      // 先删除用户的所有文章
      await supabaseClient
        .from('articles')
        .delete()
        .eq('author_id', userId);
      
      // 然后删除用户
      const { error } = await supabaseClient
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
      return { success: true, message: '用户已删除' };
    } catch (error) {
      console.error('删除用户失败:', error);
      return { success: false, message: error.message };
    }
  }

  // 管理员：获取所有用户
  async getAllUsers() {
    if (!this.isAdmin) {
      return { success: false, message: '权限不足' };
    }
    
    try {
      const { data, error } = await supabaseClient
        .from('users')
        .select('id, username, is_active, is_banned, is_admin, created_at, last_login')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('获取用户列表失败:', error);
      return { success: false, message: error.message };
    }
  }
}

// 创建全局认证管理器
const auth = new AuthManager();
window.authManager = auth;