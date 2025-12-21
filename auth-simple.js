// 简化的认证管理器
(function() {
    'use strict';
    
    class SimpleAuthManager {
        constructor() {
            this.currentUser = null;
            this.isLoggedIn = false;
            this.isAdmin = false;
            this.restoreFromStorage();
        }
        
        restoreFromStorage() {
            const token = sessionStorage.getItem('user_token');
            if (token) {
                try {
                    const data = JSON.parse(atob(token));
                    if (Date.now() - data.timestamp < 8 * 60 * 60 * 1000) {
                        this.currentUser = { 
                            id: data.id, 
                            username: data.username,
                            is_admin: data.is_admin 
                        };
                        this.isLoggedIn = true;
                        this.isAdmin = data.is_admin;
                    } else {
                        sessionStorage.removeItem('user_token');
                    }
                } catch (error) {
                    sessionStorage.removeItem('user_token');
                }
            }
        }
        
        async hashPassword(password) {
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }
        
        async register(username, password) {
            if (!window.supabaseClient) {
                return { success: false, message: '数据库连接未初始化' };
            }
            
            const passwordHash = await this.hashPassword(password);
            
            try {
                const { data, error } = await window.supabaseClient
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
        
        async login(username, password) {
            if (!window.supabaseClient) {
                return { success: false, message: '数据库连接未初始化' };
            }
            
            try {
                const passwordHash = await this.hashPassword(password);
                
                const { data: users, error } = await window.supabaseClient
                    .from('users')
                    .select('*')
                    .eq('username', username);
                
                if (error) throw error;
                
                if (!users || users.length === 0) {
                    return { success: false, message: '用户名或密码错误' };
                }
                
                const user = users[0];
                
                if (user.password_hash !== passwordHash) {
                    return { success: false, message: '用户名或密码错误' };
                }
                
                if (user.is_banned) {
                    return { success: false, message: '账户已被封禁' };
                }
                
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
                
                await window.supabaseClient
                    .from('users')
                    .update({ last_login: new Date().toISOString() })
                    .eq('id', user.id);
                
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
        
        checkAuth() {
            return this.isLoggedIn;
        }
        
        logout() {
            sessionStorage.removeItem('user_token');
            this.currentUser = null;
            this.isLoggedIn = false;
            this.isAdmin = false;
        }
    }
    
    // 创建全局实例
    window.authManager = new SimpleAuthManager();
    console.log('AuthManager已初始化');
})();