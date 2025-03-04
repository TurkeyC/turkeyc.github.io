document.addEventListener('DOMContentLoaded', () => {
  // 全局变量
  const postsContainer = document.getElementById('posts-container');
  const postDetail = document.getElementById('post-detail');
  const postContent = document.getElementById('post-content');
  const detailTitle = document.getElementById('detail-title');
  const detailDate = document.getElementById('detail-date');
  const detailReadingTime = document.getElementById('detail-reading-time');
  const detailTag = document.getElementById('detail-tag');
  const detailTags = document.getElementById('detail-tags');
  const backToList = document.getElementById('back-to-list');
  const searchInput = document.getElementById('search-input');
  const searchToggle = document.getElementById('search-toggle');
  const themeToggle = document.getElementById('theme-toggle');
  const categoryList = document.getElementById('category-list');
  const archiveList = document.getElementById('archive-list');

  // 全局文章数据
  let posts = [];

  // 当前选中的分类
  let currentCategory = 'all';
  // 当前搜索关键词
  let currentSearch = '';

  // 初始化
  function init() {
    loadAllPosts().then(() => {
      renderPosts();
      generateArchives();
      setupEventListeners();
      setupDarkMode();
      setupBackToTop();
      setupSidebar();
      loadDirectoryStructure();
    });
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

  // 加载所有文章
  async function loadAllPosts() {
    try {
      // 使用绝对路径
      const response = await fetch('/Blog/posts/index.json');

      if (!response.ok) {
        console.error('无法加载索引文件:', response.status);
        throw new Error('无法加载文章索引');
      }

      const postFilenames = await response.json();
      console.log('成功加载索引文件，文件列表:', postFilenames);

      const loadedPosts = [];

      for (let i = 0; i < postFilenames.length; i++) {
        const filename = postFilenames[i];
        console.log('正在尝试加载文件:', filename);
        // 使用绝对路径
        const postResponse = await fetch(`/Blog/posts/${filename}`);

        if (!postResponse.ok) {
          console.error(`文件 ${filename} 加载失败:`, postResponse.status);
          continue;
        }

        const markdown = await postResponse.text();
        const { content, metadata } = parseFrontMatter(markdown);

        // 确定分类
        const category = metadata.category === '原创' ? 'Original' : 'Repost';

        loadedPosts.push({
          id: i + 1,
          title: metadata.title || filename.replace('.md', ''),
          filename: filename,
          date: metadata.date || '未知日期',
          category: category,
          tags: metadata.tags || [],
          readingTime: estimateReadingTime(content) + ' 分钟',
          content: content
        });
      }

      // 更新全局 posts 变量，按日期排序
      posts = loadedPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
      console.error('加载文章失败:', error);
      postsContainer.innerHTML = '<div class="error">加载博客失败，请稍后再试</div>';
    }
  }

  // 估算阅读时间
  function estimateReadingTime(text) {
    const wordCount = text.trim().split(/\s+/).length;
    // 假设平均阅读速度为每分钟 200 个词
    return Math.ceil(wordCount / 200);
  }

  // 渲染文章列表
  function renderPosts() {
    postsContainer.innerHTML = '';

    // 过滤文章
    let filteredPosts = posts;

    if (currentCategory !== 'all') {
      filteredPosts = filteredPosts.filter(post => post.category === currentCategory);
    }

    if (currentSearch) {
      const searchLower = currentSearch.toLowerCase();
      filteredPosts = filteredPosts.filter(post =>
        post.title.toLowerCase().includes(searchLower) ||
        (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    }

    // 没有文章时显示提示
    if (filteredPosts.length === 0) {
      postsContainer.innerHTML = '<div class="no-posts">没有找到符合条件的文章</div>';
      return;
    }

    // 渲染文章卡片
    filteredPosts.forEach(post => {
      const postCard = document.createElement('div');
      postCard.className = 'post-card';
      postCard.dataset.id = post.id;

      const categoryClass = post.category.toLowerCase();
      const categoryText = post.category === 'Original' ? '原创' : '转载';

      // 创建标签HTML
      let tagsHTML = '';
      if (post.tags && post.tags.length > 0) {
        tagsHTML = '<div class="post-tags">' +
          post.tags.map(tag => `<span class="post-tag-item">${tag}</span>`).join('') +
          '</div>';
      }

      postCard.innerHTML = `
        <span class="post-tag ${categoryClass}">${categoryText}</span>
        <h2 class="post-title">${post.title}</h2>
        <div class="post-meta">
          <span class="post-date"><i class="uil uil-calendar-alt"></i> ${post.date}</span>
          <span class="post-reading-time"><i class="uil uil-clock"></i> ${post.readingTime}</span>
        </div>
        ${tagsHTML}
      `;

      postCard.addEventListener('click', () => {
        loadPostDetail(post);
      });

      postsContainer.appendChild(postCard);
    });
  }

  // 加载文章详情
  function loadPostDetail(post) {
    // 显示加载状态
    postContent.innerHTML = '<div class="loading">加载中...</div>';
    detailTitle.textContent = post.title;
    detailDate.innerHTML = `<i class="uil uil-calendar-alt"></i> ${post.date}`;
    detailReadingTime.innerHTML = `<i class="uil uil-clock"></i> ${post.readingTime}`;

    const categoryText = post.category === 'Original' ? '原创' : '转载';
    const categoryClass = post.category.toLowerCase();
    detailTag.className = `post-tag ${categoryClass}`;
    detailTag.textContent = categoryText;

    // 显示标签
    if (detailTags) {
      detailTags.innerHTML = '';
      if (post.tags && post.tags.length > 0) {
        post.tags.forEach(tag => {
          const tagSpan = document.createElement('span');
          tagSpan.className = 'detail-tag-item';
          tagSpan.textContent = tag;
          detailTags.appendChild(tagSpan);
        });
        detailTags.style.display = 'flex';
      } else {
        detailTags.style.display = 'none';
      }
    }

    // 隐藏文章列表，显示文章详情
    postsContainer.style.display = 'none';
    postDetail.style.display = 'block';

    // 直接使用已加载的内容
    postContent.innerHTML = marked.parse(post.content);

    // 在这里添加代码高亮
    hljs.highlightAll();

    // 添加复制按钮函数
  addCopyButtons();
  }

  // 添加代码复制功能
  function addCopyButtons() {
  const codeBlocks = document.querySelectorAll('pre code');
  codeBlocks.forEach(codeBlock => {
    // 创建按钮容器以便定位
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'copy-button-container';

    // 创建复制按钮
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-button';
    copyButton.innerHTML = '<i class="uil uil-copy"></i>'; // 使用复制图标替代文本

    // 添加复制功能
    copyButton.addEventListener('click', () => {
      const code = codeBlock.textContent;
      navigator.clipboard.writeText(code).then(() => {
        // 复制成功时的反馈
        copyButton.innerHTML = '<i class="uil uil-check"></i>'; // 变为对勾图标
        setTimeout(() => {
          copyButton.innerHTML = '<i class="uil uil-copy"></i>'; // 还原为复制图标
        }, 2000);
      });
    });

    // 调整代码块父元素样式
    codeBlock.parentNode.style.position = 'relative';

    // 添加按钮到容器，再添加容器到代码块父元素
    buttonContainer.appendChild(copyButton);
    codeBlock.parentNode.appendChild(buttonContainer);
    });
  }

  // 生成归档列表
  function generateArchives() {
    // 按年份分组
    const years = {};
    posts.forEach(post => {
      const year = post.date.split('-')[0];
      if (!years[year]) {
        years[year] = [];
      }
      years[year].push(post);
    });

    // 生成归档HTML
    archiveList.innerHTML = '';

    // 按年份降序排序
    const sortedYears = Object.keys(years).sort((a, b) => b - a);

    sortedYears.slice(0, 3).forEach(year => {
      const count = years[year].length;
      const li = document.createElement('li');
      li.innerHTML = `<a href="#archives">${year}年 <span>${count}篇</span></a>`;
      li.addEventListener('click', () => {
        // 这里可以添加点击年份后的操作
      });
      archiveList.appendChild(li);
    });
  }

  // 设置事件监听器
  function setupEventListeners() {
    // 返回文章列表按钮
    backToList.addEventListener('click', () => {
      postDetail.style.display = 'none';
      postsContainer.style.display = 'grid';
    });

    // 搜索输入框
    searchInput.addEventListener('input', debounce(() => {
      currentSearch = searchInput.value.trim();
      renderPosts();
    }, 300));

    // 搜索按钮切换
    searchToggle.addEventListener('click', (e) => {
      e.preventDefault();
      searchInput.focus();
    });

    // 分类标签点击
    categoryList.addEventListener('click', (e) => {
      if (e.target.classList.contains('tag')) {
        // 移除之前的active类
        document.querySelector('.tag.active').classList.remove('active');
        // 添加新的active类
        e.target.classList.add('active');

        currentCategory = e.target.dataset.category;
        renderPosts();
      }
    });

    // 暗黑模式切换
    themeToggle.addEventListener('click', (e) => {
      e.preventDefault();

      // 切换暗黑模式
      document.body.classList.toggle('dark-theme');

      // 更新图标
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

  // 设置暗黑模式
  function setupDarkMode() {
    const themeButton = document.getElementById('theme-toggle');
    const selectedTheme = localStorage.getItem('selected-theme');

    if (selectedTheme === 'dark') {
      document.body.classList.add('dark-theme');
      themeButton.querySelector('i').classList.replace('uil-moon', 'uil-sun');
    } else {
      document.body.classList.remove('dark-theme');
      themeButton.querySelector('i').classList.replace('uil-sun', 'uil-moon');
    }
  }

  // 防抖函数
  function debounce(func, delay) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), delay);
    };
  }

  // 回到顶部按钮功能
  function setupBackToTop() {
    // 创建回到顶部按钮
    const backToTopBtn = document.createElement('button');
    backToTopBtn.id = 'back-to-top';
    backToTopBtn.className = 'back-to-top';
    backToTopBtn.setAttribute('aria-label', '回到顶部');

    // 创建图标
    const icon = document.createElement('i');
    icon.className = 'uil uil-arrow-up';
    backToTopBtn.appendChild(icon);

    // 添加到文档
    document.body.appendChild(backToTopBtn);

    // 检查滚动位置决定是否显示按钮
    window.addEventListener('scroll', () => {
      if (window.pageYOffset > 300) {
        backToTopBtn.classList.add('show');
      } else {
        backToTopBtn.classList.remove('show');
      }
    });

    // 点击按钮回到顶部
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // 在blog.js中添加以下函数
  function setupSidebar() {
    // 创建切换按钮
    const sidebarToggle = document.createElement('button');
    sidebarToggle.id = 'sidebar-toggle';
    sidebarToggle.className = 'sidebar-toggle';
    sidebarToggle.innerHTML = '<i class="uil uil-angle-left"></i>';

    // 添加到侧边栏
    const sidebar = document.querySelector('.sidebar');
    sidebar.prepend(sidebarToggle);

    // 创建目录容器
    const postsDirectory = document.createElement('div');
    postsDirectory.className = 'posts-directory';
    postsDirectory.innerHTML = '<h3>文章分类</h3><ul id="directory-list"></ul>';

    // 添加到侧边栏（在导航菜单后面）
    const navMenu = document.querySelector('.nav-menu');
    sidebar.insertBefore(postsDirectory, navMenu.nextSibling);

    // 添加事件监听
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');

      // 切换图标
      const icon = sidebarToggle.querySelector('i');
      if (sidebar.classList.contains('collapsed')) {
        icon.className = 'uil uil-angle-right';
      } else {
        icon.className = 'uil uil-angle-left';
      }

      // 保存状态到本地存储
      localStorage.setItem('sidebar-state', sidebar.classList.contains('collapsed') ? 'collapsed' : 'expanded');
    });

    // 从本地存储恢复状态
    const savedState = localStorage.getItem('sidebar-state');
    if (savedState === 'collapsed') {
      sidebar.classList.add('collapsed');
      sidebarToggle.querySelector('i').className = 'uil uil-angle-right';
    }
  }

  // 用于跟踪当前目录
  let currentDirectory = '';

  async function loadDirectoryStructure() {
    try {
      const response = await fetch('/Blog/directory-structure.json');
      if (!response.ok) {
        throw new Error('目录结构加载失败');
      }
      const data = await response.json();
      renderDirectories(data.directories);
    } catch (error) {
      console.error('加载目录结构失败:', error);
    }
  }

  function renderDirectories(directories) {
    const directoryList = document.getElementById('directory-list');
    directoryList.innerHTML = '';

    // 添加主目录
    const mainItem = document.createElement('li');
    mainItem.innerHTML = `<a href="#" data-path="" class="dir-link"><i class="uil uil-folder"></i> 全部文章</a>`;
    directoryList.appendChild(mainItem);

    // 将扁平的目录列表转换为树形结构
    const directoryTree = organizeDirectories(directories);

    // 渲染树形结构
    directoryTree.forEach(dir => {
      const item = renderDirectoryItem(dir);
      directoryList.appendChild(item);
    });

    // 添加目录点击事件
    addDirectoryClickEvents();
  }

  function organizeDirectories(directories) {
    const tree = [];
    const map = {};

    // 首先创建一个查找映射
    directories.forEach(dir => {
      const path = dir.path;
      const parts = path.split('/');
      const name = parts[parts.length - 1];

      map[path] = {
        name: name,
        path: path,
        children: []
      };
    });

    // 然后构建树形结构
    directories.forEach(dir => {
      const path = dir.path;
      const parts = path.split('/');

      if (parts.length === 1) {
        // 顶级目录
        tree.push(map[path]);
      } else {
        // 子目录，找到父目录
        const parentPath = parts.slice(0, -1).join('/');
        if (map[parentPath]) {
          map[parentPath].children.push(map[path]);
        }
      }
    });

    return tree;
  }

  function renderDirectoryItem(dir) {
    const item = document.createElement('li');
    item.innerHTML = `<a href="#" data-path="${dir.path}" class="dir-link"><i class="uil uil-folder"></i> ${dir.name}</a>`;

    // 如果有子目录，递归添加
    if (dir.children && dir.children.length > 0) {
      const subList = document.createElement('ul');
      subList.className = 'subdirectory';

      dir.children.forEach(subdir => {
        const subItem = renderDirectoryItem(subdir);
        subList.appendChild(subItem);
      });

      item.appendChild(subList);
    }

    return item;
  }

  function addDirectoryClickEvents() {
    const dirLinks = document.querySelectorAll('.dir-link');
    dirLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        // 移除所有active类
        document.querySelectorAll('.dir-link.active').forEach(el => {
          el.classList.remove('active');
        });

        // 添加active类到当前点击的目录
        link.classList.add('active');

        // 设置当前目录
        currentDirectory = link.dataset.path;

        // 重新渲染文章列表
        renderPosts();
      });
    });
  }

  // 修改fetchPosts函数
  async function fetchPosts() {
    try {
      const response = await fetch('/Blog/posts/index.json');
      if (!response.ok) {
        throw new Error('文章列表加载失败');
      }
      const fileList = await response.json();

      posts = [];
      for (const file of fileList) {
        try {
          const postResponse = await fetch(`/Blog/posts/${file}`);
          if (!postResponse.ok) continue;

          const content = await postResponse.text();
          const post = parseMarkdown(content, file);
          posts.push(post);
        } catch (err) {
          console.error(`加载文章失败: ${file}`, err);
        }
      }

      renderPosts();
      generateArchives();
    } catch (error) {
      console.error('获取文章列表失败:', error);
      postsContainer.innerHTML = '<div class="error">加载文章失败，请刷新页面重试。</div>';
    }
  }

  // 修改parseMarkdown函数，添加目录路径提取
  function parseMarkdown(content, filePath) {
    // 提取文章的YAML front matter
    const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    const frontMatter = frontMatterMatch ? frontMatterMatch[1] : '';

    // 提取各字段
    const titleMatch = frontMatter.match(/title:\s*(.*)/);
    const dateMatch = frontMatter.match(/date:\s*(.*)/);
    const tagsMatch = frontMatter.match(/tags:\s*(.*)/);
    const categoryMatch = frontMatter.match(/category:\s*(.*)/);

    // 获取文章路径信息
    const pathParts = filePath.split('/');
    const fileName = pathParts.pop();
    const directoryPath = pathParts.join('/');

    // 计算阅读时间
    const textContent = content.replace(/^---\n[\s\S]*?\n---/, '');
    const wordCount = textContent.replace(/\W/g, ' ').split(/\s+/).filter(Boolean).length;
    const readingTime = Math.ceil(wordCount / 200); // 假设每分钟阅读200字

    return {
      title: titleMatch ? titleMatch[1].trim() : '无标题',
      date: dateMatch ? dateMatch[1].trim() : '未知日期',
      tags: tagsMatch ? tagsMatch[1].trim().split(',').map(tag => tag.trim()) : [],
      category: categoryMatch ? categoryMatch[1].trim() : 'Uncategorized',
      content: content,
      path: filePath,
      directory: directoryPath,
      readingTime: readingTime
    };
  }

  // 修改renderPosts函数，添加目录过滤
  function renderPosts() {
    // 过滤当前目录
    let filteredPosts = posts;

    // 先按目录过滤
    if (currentDirectory) {
      filteredPosts = posts.filter(post => post.directory === currentDirectory);
    }

    // 再按分类过滤
    if (currentCategory !== 'all') {
      filteredPosts = filteredPosts.filter(post => post.category === currentCategory);
    }

    // 再按搜索过滤
    if (currentSearch) {
      const searchLower = currentSearch.toLowerCase();
      filteredPosts = filteredPosts.filter(post => {
        return post.title.toLowerCase().includes(searchLower) ||
               post.content.toLowerCase().includes(searchLower) ||
               post.tags.some(tag => tag.toLowerCase().includes(searchLower));
      });
    }

    // 渲染过滤后的文章列表
    if (filteredPosts.length === 0) {
      postsContainer.innerHTML = '<div class="no-posts">没有找到符合条件的文章</div>';
      return;
    }

    postsContainer.innerHTML = '';
    filteredPosts.forEach(post => {
      const article = document.createElement('article');
      article.className = 'post-card';
      article.innerHTML = `
        <div class="post-card-content">
          <h2>${post.title}</h2>
          <div class="post-meta">
            <span class="post-date">${post.date}</span>
            <span class="post-reading-time">${post.readingTime} 分钟阅读</span>
            <span class="post-tag ${post.category}">${getCategoryName(post.category)}</span>
          </div>
        </div>
      `;

      article.addEventListener('click', () => showPostDetail(post));
      postsContainer.appendChild(article);
    });
  }

  // 初始化博客
  init();
});