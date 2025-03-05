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
      setupSidebarToggle();
      setupDarkMode();
      setupBackToTop();
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

  // 侧边栏切换功能
  function setupSidebarToggle() {
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const blogContainer = document.querySelector('.blog-container');
    const sidebar = document.querySelector('.sidebar');

    // 计算并设置按钮位置的函数
    function updateTogglePosition() {
      if (blogContainer.classList.contains('sidebar-collapsed')) {
        sidebarToggle.style.left = '0';
      } else {
        // 获取侧边栏的实际宽度和位置
        const sidebarRect = sidebar.getBoundingClientRect();
        sidebarToggle.style.left = `${sidebarRect.right}px`;
      }
    }

    // 初始计算位置
    updateTogglePosition();

    // 窗口大小变化时重新计算
    window.addEventListener('resize', updateTogglePosition);

    // 切换事件
    if (sidebarToggle) {
      // 恢复用户偏好设置
      const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
      if (isCollapsed) {
        blogContainer.classList.add('sidebar-collapsed');
        updateTogglePosition();
      }

      // 切换事件
      sidebarToggle.addEventListener('click', () => {
        blogContainer.classList.toggle('sidebar-collapsed');

        // 立即更新一次位置
        updateTogglePosition();

        // 等待过渡完成后再次更新位置（侧边栏过渡是0.3秒）
        setTimeout(updateTogglePosition, 350);

        // 保存用户偏好到本地存储
        localStorage.setItem(
          'sidebarCollapsed',
          blogContainer.classList.contains('sidebar-collapsed')
        );
      });
    }

    // 监听过渡结束事件，确保按钮位置正确
    sidebar.addEventListener('transitionend', updateTogglePosition);
  }

  // 设置事件监听器
  function setupEventListeners() {
    // 返回文章列表按钮
    if (backToList) {
      backToList.addEventListener('click', () => {
        postDetail.style.display = 'none';
        postsContainer.style.display = 'grid';
      });
    }

    // 搜索输入框
    if (searchInput) {
      searchInput.addEventListener('input', debounce(() => {
        currentSearch = searchInput.value.trim();
        renderPosts();
      }, 300));
    }

    // 搜索按钮切换
    if (searchToggle) {
      searchToggle.addEventListener('click', (e) => {
        e.preventDefault();
        if (searchInput) searchInput.focus();
      });
    }

    // 分类标签点击
    if (categoryList) {
      categoryList.addEventListener('click', (e) => {
        if (e.target.classList.contains('tag')) {
          // 移除之前的active类
          const activeTag = document.querySelector('.tag.active');
          if (activeTag) activeTag.classList.remove('active');

          // 添加新的active类
          e.target.classList.add('active');

          currentCategory = e.target.dataset.category;
          renderPosts();
        }
      });
    }

    // 暗黑模式切换
    if (themeToggle) {
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
  }

  // 设置暗黑模式
  function setupDarkMode() {
    // 检查本地存储中的主题设置
    const selectedTheme = localStorage.getItem('selected-theme');
    if (selectedTheme === 'dark') {
      document.body.classList.add('dark-theme');
      const icon = themeToggle?.querySelector('i');
      if (icon) icon.classList.replace('uil-moon', 'uil-sun');
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

  // 初始化博客
  init();
});