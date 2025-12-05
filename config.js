// Supabase配置
const SUPABASE_CONFIG = {
  url: 'https://mjnyqbmqqynszilmdpyj.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qbnlxYm1xcXluc3ppbG1kcHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NDg2MDEsImV4cCI6MjA4MDQyNDYwMX0.uIOWVeQv97i2XFD8LBcAElQaIWvTJfePqPAJlkdDXZA'
};

// 初始化Supabase客户端
const supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);

// 导出配置
window.supabaseClient = supabase;

console.log('Supabase客户端已初始化');