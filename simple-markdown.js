// 简化的Markdown渲染器（不支持LaTeX）
class SimpleMarkdownRenderer {
  render(markdown) {
    let html = markdown;
    
    // 基础转换
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    
    // 加粗和斜体
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // 代码
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // 链接
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // 图片
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%;">');
    
    // 列表
    html = html.replace(/^\s*[-*]\s+(.*)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    
    // 段落和换行
    html = html.split('\n\n').map(para => {
      if (!para.match(/^<(ul|ol|li|h[1-3]|pre)/)) {
        return `<p>${para.replace(/\n/g, '<br>')}</p>`;
      }
      return para;
    }).join('\n');
    
    return html;
  }
}

window.simpleMarkdownRenderer = new SimpleMarkdownRenderer();