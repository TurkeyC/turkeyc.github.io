---
title: 我的学习笔记 - 我的第3篇博客
date: 2025-01-15
tags: [博客, 学习, 实践]
category: 原创
---

# 我的学习笔记

这是我最近学习的一些笔记总结。

## 学习要点

1. 第一点
2. 第二点
3. 第三点

### 子要点

- A
- B
- C

## 实践项目

接下来我将开始一个实践项目，应用所学知识。

```javascript
// 1. 添加解析 front matter 的函数
function parseFrontMatter(markdown) {
  if (!markdown.startsWith('---')) {
    return { content: markdown, metadata: {} };
  }
  
  const endOfFrontMatter = markdown.indexOf('---', 3);
  if (endOfFrontMatter === -1) {
    return { content: markdown, metadata: {} };
  }
  
  const frontMatter = markdown.substring(3, endOfFrontMatter).trim();
  const content = markdown.substring(endOfFrontMatter + 3).trim();
  
  // 解析 YAML
  const metadata = {};
  frontMatter.split('\n').forEach(line => {
    const colonPos = line.indexOf(':');
    if (colonPos !== -1) {
      const key = line.substring(0, colonPos).trim();
      let value = line.substring(colonPos + 1).trim();
      
      // 处理标签数组
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.substring(1, value.length - 1)
          .split(',')
          .map(item => item.trim());
      }
      
      metadata[key] = value;
    }
  });
  
  return { content, metadata };
}

// 2. 修改初始化函数，动态加载文章
async function init() {
  await loadAllPosts();
  renderPosts();
  generateArchives();
  setupEventListeners();
  setupDarkMode();
}

// 3. 添加加载所有文章的函数
async function loadAllPosts() {
  try {
    // 先加载文章索引（一个包含所有文章文件名的JSON）
    const response = await fetch('posts/index.json');
    if (!response.ok) throw new Error('无法加载文章索引');
    
    const postFilenames = await response.json();
    const loadedPosts = [];
    
    for (let i = 0; i < postFilenames.length; i++) {
      const filename = postFilenames[i];
      const postResponse = await fetch(`posts/${filename}`);
      if (!postResponse.ok) continue;
      
      const markdown = await postResponse.text();
      const { metadata } = parseFrontMatter(markdown);
      
      loadedPosts.push({
        id: i + 1,
        title: metadata.title || '无标题文章',
        filename: filename,
        date: metadata.date || '未知日期',
        category: metadata.category === '原创' ? 'Original' : 'Repost',
        tags: metadata.tags || [],
        readingTime: estimateReadingTime(markdown) + ' 分钟'
      });
    }
    
    // 更新全局 posts 变量
    posts = loadedPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.error('加载文章失败:', error);
    postsContainer.innerHTML = '<div class="error">加载博客失败，请稍后再试</div>';
  }
}

// 4. 修改文章加载函数以排除 front matter
function loadPostDetail(post) {
  // 其他代码保持不变...
  
  fetch(`posts/${post.filename}`)
    .then(response => response.text())
    .then(markdown => {
      const { content } = parseFrontMatter(markdown);
      postContent.innerHTML = marked.parse(content);
    })
    .catch(error => {
      postContent.innerHTML = `<div class="error">加载文章失败：${error.message}</div>';
    });
}

// 5. 添加阅读时间估算函数
function estimateReadingTime(text) {
  const wordCount = text.trim().split(/\s+/).length;
  // 假设平均阅读速度为每分钟 200 个词
  return Math.ceil(wordCount / 200);
}```