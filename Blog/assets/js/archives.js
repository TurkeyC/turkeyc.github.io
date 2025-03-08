// archives.js - 整合了 archives-main.js、archive-view.js 和 archive-page.js 的功能
document.addEventListener('DOMContentLoaded', () => {
  let allPosts = [];
  let archiveData = {};
  let currentFilter = 'time';

  // ==================== 归档数据生成 (原 archives-main.js) ====================

  // 生成归档数据
  function generateArchives(posts) {
    // 按时间归档
    const timeArchives = {};
    // 按分类归档
    const categoryArchives = {};
    // 按标签归档
    const tagArchives = {};
    // 按目录归档
    const directoryArchives = {};

    posts.forEach(post => {
      // 提取年月信息
      const date = new Date(post.date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      // 时间归档
      if (!timeArchives[year]) timeArchives[year] = {};
      if (!timeArchives[year][month]) timeArchives[year][month] = [];
      timeArchives[year][month].push(post);

      // 分类归档
      if (post.category) {
        if (!categoryArchives[post.category]) categoryArchives[post.category] = [];
        categoryArchives[post.category].push(post);
      }

      // 标签归档
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => {
          if (!tagArchives[tag]) tagArchives[tag] = [];
          tagArchives[tag].push(post);
        });
      }

      // 目录归档
      const directory = post.directory || '未分类';
      if (!directoryArchives[directory]) directoryArchives[directory] = [];
      directoryArchives[directory].push(post);
    });

    return {
      timeArchives,
      categoryArchives,
      tagArchives,
      directoryArchives
    };
  }

  // ==================== 归档视图渲染 (原 archive-view.js) ====================

  // 渲染归档页面
  function renderArchives(archives, filterType = 'time') {
    const container = document.getElementById('archives-container');
    container.innerHTML = '';

    switch(filterType) {
      case 'time':
        container.appendChild(renderTimeArchives(archives.timeArchives));
        break;
      case 'category':
        container.appendChild(renderCategoryArchives(archives.categoryArchives));
        break;
      case 'tag':
        container.appendChild(renderTagArchives(archives.tagArchives));
        break;
      case 'directory':
        container.appendChild(renderDirectoryArchives(archives.directoryArchives));
        break;
      default:
        container.appendChild(renderTimeArchives(archives.timeArchives));
    }
  }

  // 辅助函数：计算一年中的文章总数
  function countPostsInYear(yearData) {
    return Object.values(yearData).reduce((total, monthPosts) => total + monthPosts.length, 0);
  }

  // 渲染时间归档
  function renderTimeArchives(timeArchives) {
    const fragment = document.createDocumentFragment();
    const years = Object.keys(timeArchives).sort((a, b) => b - a);

    years.forEach(year => {
      const yearSection = document.createElement('div');
      yearSection.className = 'archive-year';

      // 年份标题与切换按钮
      const yearToggle = document.createElement('div');
      yearToggle.className = 'archive-year-toggle';
      yearToggle.innerHTML = `<i class="uil uil-angle-down"></i>${year}年 <span class="count">(${countPostsInYear(timeArchives[year])}篇)</span>`;

      // 月份容器
      const monthsContainer = document.createElement('div');
      monthsContainer.className = 'archive-months';

      // 获取并排序该年的所有月份
      const months = Object.keys(timeArchives[year]).sort((a, b) => b - a);

      months.forEach(month => {
        const monthDiv = document.createElement('div');
        monthDiv.className = 'archive-month';

        // 月份标题
        const monthHeader = document.createElement('div');
        monthHeader.className = 'archive-month-header';
        monthHeader.innerHTML = `<i class="uil uil-angle-down"></i>${month}月 <span class="count">(${timeArchives[year][month].length}篇)</span>`;

        // 文章列表
        const postsDiv = document.createElement('div');
        postsDiv.className = 'archive-posts';

        // 排序该月的文章（按日期倒序）
        const monthPosts = timeArchives[year][month].sort((a, b) => new Date(b.date) - new Date(a.date));

        monthPosts.forEach(post => {
          // 提取日期中的日
          const day = new Date(post.date).getDate();
          const postItem = document.createElement('div');
          postItem.className = 'archive-post-item';
          postItem.innerHTML = `
            <a href="post.html?filename=${encodeURIComponent(post.filename)}" class="archive-post-link">
              ${day}日 - ${post.title}
              ${post.pinned ? '<i class="uil uil-location-point"></i>' : ''}
            </a>
            <span class="archive-post-meta">${post.category === 'Original' ? '原创' : '转载'}</span>
          `;
          postsDiv.appendChild(postItem);
        });

        // 添加展开/折叠功能
        monthHeader.addEventListener('click', () => {
          monthHeader.classList.toggle('collapsed');
          postsDiv.style.display = postsDiv.style.display === 'none' ? 'block' : 'none';
        });

        monthDiv.appendChild(monthHeader);
        monthDiv.appendChild(postsDiv);
        monthsContainer.appendChild(monthDiv);
      });

      // 添加年份展开/折叠功能
      yearToggle.addEventListener('click', () => {
        yearToggle.classList.toggle('collapsed');
        monthsContainer.style.display = monthsContainer.style.display === 'none' ? 'block' : 'none';
      });

      yearSection.appendChild(yearToggle);
      yearSection.appendChild(monthsContainer);
      fragment.appendChild(yearSection);
    });

    return fragment;
  }

  // 渲染分类归档
  function renderCategoryArchives(categoryArchives) {
    const fragment = document.createDocumentFragment();
    const categories = Object.keys(categoryArchives).sort();

    categories.forEach(category => {
      const categorySection = document.createElement('div');
      categorySection.className = 'category-section';

      const displayName = category === 'Original' ? '原创' :
                        category === 'Repost' ? '转载' : category;

      // 分类标题
      const categoryHeader = document.createElement('div');
      categoryHeader.className = 'category-name';
      categoryHeader.innerHTML = `<i class="uil uil-angle-down"></i>${displayName} <span class="count">(${categoryArchives[category].length}篇)</span>`;

      // 文章列表
      const postsDiv = document.createElement('div');
      postsDiv.className = 'category-posts';

      // 排序该分类的文章
      const categoryPosts = categoryArchives[category].sort((a, b) => new Date(b.date) - new Date(a.date));

      categoryPosts.forEach(post => {
        const dateStr = new Date(post.date).toLocaleDateString('zh-CN');
        const postItem = document.createElement('div');
        postItem.className = 'archive-post-item';
        postItem.innerHTML = `
          <a href="post.html?filename=${encodeURIComponent(post.filename)}" class="archive-post-link">
            ${post.title}
            ${post.pinned ? '<i class="uil uil-location-point"></i>' : ''}
          </a>
          <span class="archive-post-meta">${dateStr}</span>
        `;
        postsDiv.appendChild(postItem);
      });

      // 添加展开/折叠功能
      categoryHeader.addEventListener('click', () => {
        categoryHeader.classList.toggle('collapsed');
        postsDiv.style.display = postsDiv.style.display === 'none' ? 'block' : 'none';
      });

      categorySection.appendChild(categoryHeader);
      categorySection.appendChild(postsDiv);
      fragment.appendChild(categorySection);
    });

    return fragment;
  }

  // 渲染标签归档
  function renderTagArchives(tagArchives) {
    const fragment = document.createDocumentFragment();
    const tags = Object.keys(tagArchives).sort();

    tags.forEach(tag => {
      const tagSection = document.createElement('div');
      tagSection.className = 'tag-section';

      // 标签标题
      const tagHeader = document.createElement('div');
      tagHeader.className = 'tag-name';
      tagHeader.innerHTML = `<i class="uil uil-angle-down"></i>#${tag} <span class="count">(${tagArchives[tag].length}篇)</span>`;

      // 文章列表
      const postsDiv = document.createElement('div');
      postsDiv.className = 'tag-posts';

      // 排序该标签的文章
      const tagPosts = tagArchives[tag].sort((a, b) => new Date(b.date) - new Date(a.date));

      tagPosts.forEach(post => {
        const dateStr = new Date(post.date).toLocaleDateString('zh-CN');
        const postItem = document.createElement('div');
        postItem.className = 'archive-post-item';
        postItem.innerHTML = `
          <a href="post.html?filename=${encodeURIComponent(post.filename)}" class="archive-post-link">
            ${post.title}
            ${post.pinned ? '<i class="uil uil-location-point"></i>' : ''}
          </a>
          <span class="archive-post-meta">${dateStr} · ${post.category === 'Original' ? '原创' : '转载'}</span>
        `;
        postsDiv.appendChild(postItem);
      });

      // 添加展开/折叠功能
      tagHeader.addEventListener('click', () => {
        tagHeader.classList.toggle('collapsed');
        postsDiv.style.display = postsDiv.style.display === 'none' ? 'block' : 'none';
      });

      tagSection.appendChild(tagHeader);
      tagSection.appendChild(postsDiv);
      fragment.appendChild(tagSection);
    });

    return fragment;
  }

  // 渲染目录归档
  function renderDirectoryArchives(directoryArchives) {
    const fragment = document.createDocumentFragment();
    const directories = Object.keys(directoryArchives).sort();

    directories.forEach(directory => {
      const dirSection = document.createElement('div');
      dirSection.className = 'directory-archive';

      // 目录路径
      const dirHeader = document.createElement('div');
      dirHeader.className = 'directory-path';
      dirHeader.innerHTML = `<i class="uil uil-folder"></i> ${directory} <span class="count">(${directoryArchives[directory].length}篇)</span>`;

      // 文章列表
      const itemsDiv = document.createElement('div');
      itemsDiv.className = 'directory-items';

      // 排序该目录的文章
      const dirPosts = directoryArchives[directory].sort((a, b) => new Date(b.date) - new Date(a.date));

      dirPosts.forEach(post => {
        const dateStr = new Date(post.date).toLocaleDateString('zh-CN');
        const postItem = document.createElement('div');
        postItem.className = 'archive-post-item';
        postItem.innerHTML = `
          <a href="post.html?filename=${encodeURIComponent(post.filename)}" class="archive-post-link">
            ${post.title}
            ${post.pinned ? '<i class="uil uil-location-point"></i>' : ''}
          </a>
          <span class="archive-post-meta">${dateStr} · ${post.tags.join(', ')}</span>
        `;
        itemsDiv.appendChild(postItem);
      });

      dirSection.appendChild(dirHeader);
      dirSection.appendChild(itemsDiv);
      fragment.appendChild(dirSection);
    });

    return fragment;
  }

  // ==================== 页面初始化和事件处理 (原 archive-page.js) ====================

  // 初始化
  async function init() {
    await loadAllPosts();
    archiveData = generateArchives(allPosts);
    renderArchives(archiveData, currentFilter);
    setupFilterButtons();
    setupSidebarToggle();
    setupDarkMode();
  }

  // 加载所有文章
  async function loadAllPosts() {
    try {
      const response = await fetch('/Blog/posts/index.json');
      if (!response.ok) throw new Error('无法加载索引文件');

      const indexData = await response.json();
      allPosts = await collectAllPosts(indexData);

      // 按日期排序
      allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
      console.error('加载文章失败:', error);
      document.getElementById('archives-container').innerHTML =
        '<div class="error">加载归档数据失败，请稍后再试</div>';
    }
  }

  // 收集所有文章
  async function collectAllPosts(indexData) {
    const loadedPosts = [];

    // 加载未分类文件
    if (indexData.uncategorized && Array.isArray(indexData.uncategorized)) {
      for (const filename of indexData.uncategorized) {
        const post = await loadSinglePost(filename);
        if (post) loadedPosts.push(post);
      }
    }

    // 加载分类目录中的文件
    if (indexData.categories && Array.isArray(indexData.categories)) {
      for (const category of indexData.categories) {
        const categoryPosts = await loadCategoryPosts(category);
        loadedPosts.push(...categoryPosts);
      }
    }

    return loadedPosts;
  }

  // 递归加载目录中的所有文章
  async function loadCategoryPosts(category, basePath = '') {
    const loadedPosts = [];
    const path = basePath ? `${basePath}/${category.path}` : category.path;

    // 加载当前目录的文件
    if (category.files && Array.isArray(category.files)) {
      for (const filename of category.files) {
        const post = await loadSinglePost(filename, path, category.name);
        if (post) loadedPosts.push(post);
      }
    }

    // 递归加载子目录
    if (category.subcategories && Array.isArray(category.subcategories)) {
      for (const subcategory of category.subcategories) {
        const subPosts = await loadCategoryPosts(subcategory, path);
        loadedPosts.push(...subPosts);
      }
    }

    return loadedPosts;
  }

  // 加载单个文章
  async function loadSinglePost(filename, path = '', directoryName = '未分类') {
    const filePath = path ? `${path}/${filename}` : filename;

    try {
      const postResponse = await fetch(`/Blog/posts/${filePath}`);
      if (!postResponse.ok) return null;

      const markdown = await postResponse.text();
      const { content, metadata } = parseFrontMatter(markdown);

      return {
        id: Date.now() + Math.random().toString(36).substring(2),
        title: metadata.title || filename.replace('.md', ''),
        filename: filePath,
        path: path,
        date: metadata.date || '未知日期',
        category: metadata.category === '原创' ? 'Original' : 'Repost',
        directory: directoryName,
        tags: metadata.tags || [],
        readingTime: estimateReadingTime(content) + ' 分钟',
        content: content,
        pinned: metadata.pinned || false
      };
    } catch (error) {
      console.error(`加载文件 ${filePath} 失败:`, error);
      return null;
    }
  }

  // 解析 front matter
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

    const metadata = {};
    frontMatter.split('\n').forEach(line => {
      const colonPos = line.indexOf(':');
      if (colonPos !== -1) {
        const key = line.substring(0, colonPos).trim();
        let value = line.substring(colonPos + 1).trim();

        if (value.startsWith('[') && value.endsWith(']')) {
          value = value.substring(1, value.length - 1)
            .split(',')
            .map(item => item.trim());
        } else if (value === 'true' || value === 'false') {
          value = value === 'true';
        }

        metadata[key] = value;
      }
    });

    return { content, metadata };
  }

  // 估算阅读时间
  function estimateReadingTime(text) {
    const wordCount = text.trim().split(/\s+/).length;
    return Math.ceil(wordCount / 200);
  }

  // 设置过滤按钮事件
  function setupFilterButtons() {
    const filterBtns = document.querySelectorAll('.filter-btn');

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // 更新激活状态
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // 更新过滤类型并重新渲染
        currentFilter = btn.dataset.filter;
        renderArchives(archiveData, currentFilter);
      });
    });
  }

  // 侧边栏切换功能
  function setupSidebarToggle() {
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const blogContainer = document.querySelector('.blog-container');

    // 恢复用户偏好设置
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (isCollapsed) {
      blogContainer.classList.add('sidebar-collapsed');
    }

    // 切换事件
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => {
        blogContainer.classList.toggle('sidebar-collapsed');
        localStorage.setItem(
          'sidebarCollapsed',
          blogContainer.classList.contains('sidebar-collapsed')
        );
      });
    }
  }

  // 暗黑模式
  function setupDarkMode() {
    const themeToggle = document.getElementById('theme-toggle');

    // 检查本地存储中的主题设置
    const selectedTheme = localStorage.getItem('selected-theme');
    if (selectedTheme === 'dark') {
      document.body.classList.add('dark-theme');
      const icon = themeToggle?.querySelector('i');
      if (icon) icon.classList.replace('uil-moon', 'uil-sun');
    }

    // 添加切换事件
    if (themeToggle) {
      themeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        document.body.classList.toggle('dark-theme');
        const icon = themeToggle.querySelector('i');

        if (document.body.classList.contains('dark-theme')) {
          icon.classList.replace('uil-moon', 'uil-sun');
          localStorage.setItem('selected-theme', 'dark');
        } else {
          icon.classList.replace('uil-sun', 'uil-moon');
          localStorage.setItem('selected-theme', 'light');
        }
      });
    }
  }

  // 启动初始化
  init();
});