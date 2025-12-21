// 简化的Supabase配置 - 无变量冲突
(function() {
    'use strict';
    
    // 配置
    const SUPABASE_URL = 'https://mjnyqbmqqynszilmdpyj.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_IH8wLUO5eKgukqVouADpAg_njq3euTX';
    
    // 检查Supabase库是否加载
    if (typeof supabase === 'undefined') {
        console.error('Supabase库未加载');
        document.addEventListener('DOMContentLoaded', function() {
            const container = document.getElementById('articles-container');
            if (container) {
                container.innerHTML = '<div class="alert alert-error">Supabase库加载失败，请刷新页面</div>';
            }
        });
        return;
    }
    
    // 创建Supabase客户端
    try {
        const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        
        // 测试连接
        supabaseClient.from('users')
            .select('count', { count: 'exact', head: true })
            .then(({ data, error }) => {
                if (error) {
                    console.error('Supabase连接测试失败:', error.message);
                } else {
                    console.log('Supabase连接成功，用户数量:', data.count);
                }
            })
            .catch(error => {
                console.error('Supabase连接测试异常:', error.message);
            });
        
        // 导出到全局
        window.supabaseClient = supabaseClient;
        console.log('Supabase客户端已初始化');
        
    } catch (error) {
        console.error('初始化Supabase客户端失败:', error);
        document.addEventListener('DOMContentLoaded', function() {
            const container = document.getElementById('articles-container');
            if (container) {
                container.innerHTML = '<div class="alert alert-error">数据库连接失败</div>';
            }
        });
    }
})();