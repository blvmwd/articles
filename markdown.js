// Markdown和LaTeX渲染器
class MarkdownRenderer {
  constructor() {
    this.rules = {
      heading: /^(#{1,6})\s+(.+)$/gm,
      bold: /\*\*(.+?)\*\*/g,
      italic: /\*(.+?)\*/g,
      code: /`([^`]+)`/g,
      codeBlock: /```([\s\S]*?)```/g,
      blockquote: /^>\s+(.+)$/gm,
      unorderedList: /^[\*\-]\s+(.+)$/gm,
      orderedList: /^\d+\.\s+(.+)$/gm,
      link: /\[([^\]]+)\]\(([^)]+)\)/g,
      image: /!\[([^\]]*)\]\(([^)]+)\)/g,
      horizontalRule: /^\s*[-*_]{3,}\s*$/gm
    };
  }

  // 渲染Markdown为HTML
  render(markdown) {
    let html = markdown;
    
    // 代码块（需要优先处理）
    html = html.replace(this.rules.codeBlock, (match, code) => {
      return `<pre><code>${this.escapeHtml(code.trim())}</code></pre>`;
    });
    
    // 标题
    html = html.replace(this.rules.heading, (match, hashes, text) => {
      const level = hashes.length;
      return `<h${level}>${text}</h${level}>`;
    });
    
    // 加粗
    html = html.replace(this.rules.bold, '<strong>$1</strong>');
    
    // 斜体
    html = html.replace(this.rules.italic, '<em>$1</em>');
    
    // 行内代码
    html = html.replace(this.rules.code, '<code>$1</code>');
    
    // 引用
    html = html.replace(this.rules.blockquote, '<blockquote>$1</blockquote>');
    
    // 无序列表
    html = html.replace(this.rules.unorderedList, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    
    // 有序列表
    html = html.replace(this.rules.orderedList, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ol>$&</ol>');
    
    // 链接
    html = html.replace(this.rules.link, '<a href="$2" target="_blank">$1</a>');
    
    // 图片
    html = html.replace(this.rules.image, '<img src="$2" alt="$1" style="max-width: 100%;">');
    
    // 水平线
    html = html.replace(this.rules.horizontalRule, '<hr>');
    
    // 段落和换行
    html = html.split('\n\n').map(para => {
      if (!para.match(/^<(ul|ol|li|h[1-6]|blockquote|pre|hr)/)) {
        return `<p>${para.replace(/\n/g, '<br>')}</p>`;
      }
      return para;
    }).join('\n');
    
    // 处理LaTeX数学公式
    html = this.renderLatex(html);
    
    return html;
  }

  // 渲染LaTeX数学公式
  renderLatex(html) {
    // 行内公式：$...$
    html = html.replace(/\$(.+?)\$/g, (match, formula) => {
      return `<span class="latex-inline">\\(${this.escapeHtml(formula)}\\)</span>`;
    });
    
    // 块级公式：$$...$$
    html = html.replace(/\$\$(.+?)\$\$/g, (match, formula) => {
      return `<div class="latex-block">\\[${this.escapeHtml(formula)}\\]</div>`;
    });
    
    return html;
  }

  // HTML转义
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 初始化MathJax
  initMathJax() {
    if (typeof MathJax !== 'undefined') {
      MathJax.typesetPromise();
    }
  }
}

// 创建全局Markdown渲染器
const markdownRenderer = new MarkdownRenderer();
window.markdownRenderer = markdownRenderer;