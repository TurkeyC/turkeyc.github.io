document.addEventListener('DOMContentLoaded', () => {
  // 全局变量
  const postContent = document.getElementById('post-content');
  const detailTitle = document.getElementById('detail-title');
  const detailDate = document.getElementById('detail-date');
  const detailReadingTime = document.getElementById('detail-reading-time');
  const detailTag = document.getElementById('detail-tag');
  const detailTags = document.getElementById('detail-tags');
  const backToList = document.getElementById('back-to-list');
  const relatedPosts = document.getElementById('related-posts');
  const postToc = document.getElementById('post-toc');

  // 全局文章数据
  let posts = [];

  // 初始化
  function init() {
    setupEventListeners();
    setupSidebarToggle();
    setupDarkMode();
    setupBackToTop();

    // 显示加载状态，隐藏内容
    document.getElementById('post-header-content').style.display = 'none';
    document.getElementById('loading-indicator').style.display = 'block';

    // 从URL获取文章ID或文件名
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    const postFilename = urlParams.get('filename');

    // 根据ID或文件名加载文章
    if (postId) {
      loadAllPosts().then(() => {
        const post = posts.find(p => p.id == postId);
        if (post) {
          loadPostDetail(post);
          document.title = `${post.title} - CaoTurkey的博客`;
          loadRelatedPosts(post);
        } else {
          showError('找不到该文章');
        }
      });
    } else if (postFilename) {
      loadPostByFilename(postFilename);
    } else {
      showError('文章参数错误');
    }
  }

  // 显示错误信息
  function showError(message) {
    postContent.innerHTML = `<div class="error">${message}</div>`;
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
      const response = await fetch('/Blog/posts/index.json');
      if (!response.ok) {
        throw new Error('无法加载文章索引');
      }

      const indexData = await response.json();
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

      // 更新posts 变量，按日期排序
      posts = loadedPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
      console.log('已加载所有文章:', posts.length);
    } catch (error) {
      console.error('加载文章失败:', error);
      showError('加载博客失败，请稍后再试');
    }
  }

  // 添加这两个辅助函数
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
        directory: directoryName,
        date: metadata.date || '未知日期',
        category: metadata.category === '原创' ? 'Original' : 'Repost',
        tags: metadata.tags || [],
        readingTime: estimateReadingTime(content) + ' 分钟',
        content: content
      };
    } catch (error) {
      console.error(`加载文件 ${filePath} 失败:`, error);
      return null;
    }
  }

  // 通过文件名直接加载文章
  async function loadPostByFilename(filename) {
    try {
      const postResponse = await fetch(`/Blog/posts/${filename}`);

      if (!postResponse.ok) {
        console.error(`文件 ${filename} 加载失败:`, postResponse.status);
        showError('文章加载失败');
        return;
      }

      const markdown = await postResponse.text();
      const { content, metadata } = parseFrontMatter(markdown);

      // 确定分类
      const category = metadata.category === '原创' ? 'Original' : 'Repost';

      const post = {
        title: metadata.title || filename.replace('.md', ''),
        filename: filename,
        date: metadata.date || '未知日期',
        category: category,
        tags: metadata.tags || [],
        readingTime: estimateReadingTime(content) + ' 分钟',
        content: content
      };

      loadPostDetail(post);
      document.title = `${post.title} - CaoTurkey的博客`;

      // 加载相关文章
      loadAllPosts().then(() => {
        loadRelatedPosts(post);
      });

    } catch (error) {
      console.error('加载文章失败:', error);
      showError('文章加载失败，请稍后再试');
    }
  }

  // 估算阅读时间
  function estimateReadingTime(text) {
    const wordCount = text.trim().split(/\s+/).length;
    // 假设平均阅读速度为每分钟 200 个词
    return Math.ceil(wordCount / 200);
  }

  // 加载文章详情
  function loadPostDetail(post) {
    document.getElementById('loading-indicator').style.display = 'none';
    document.getElementById('post-header-content').style.display = 'block';

    detailTitle.textContent = post.title;
    detailDate.innerHTML = `<i class="uil uil-calendar-alt"></i> ${post.date}`;
    detailReadingTime.innerHTML = `<i class="uil uil-clock"></i> ${post.readingTime}`;

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

    // 渲染文章内容
    postContent.innerHTML = marked.parse(post.content);

    // 生成目录
    generateTableOfContents();

    // 代码高亮
    hljs.highlightAll();

    // 添加复制按钮
    addCopyButtons();
  }

  // 生成文章目录
  function generateTableOfContents() {
    const headings = document.querySelectorAll('.post-content h1, .post-content h2, .post-content h3');

    if (headings.length === 0) {
      postToc.innerHTML = '<p>本文无目录</p>';
      return;
    }

    const toc = document.createElement('ul');
    toc.className = 'toc-list';

    headings.forEach((heading, index) => {
      // 为每个标题添加ID，以便锚点链接
      const headingId = `heading-${index}`;
      heading.id = headingId;

      const listItem = document.createElement('li');
      listItem.className = `toc-item toc-${heading.tagName.toLowerCase()}`;

      const link = document.createElement('a');
      link.href = `#${headingId}`;
      link.textContent = heading.textContent;
      link.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById(headingId).scrollIntoView({
          behavior: 'smooth'
        });
      });

      listItem.appendChild(link);
      toc.appendChild(listItem);
    });

    postToc.innerHTML = '';
    postToc.appendChild(toc);

    // 添加滚动监听来更新活动目录项
    const tocLinks = document.querySelectorAll('.toc-item a');
    const headingElements = Array.from(headings);

    // 创建ID到目录项的映射
    const idToTocMap = {};
    tocLinks.forEach(link => {
      const targetId = link.getAttribute('href').substring(1);
      idToTocMap[targetId] = link;
    });

    // 添加滚动事件监听
    function updateActiveHeading() {
      // 设置一个偏移量，使标题在接近顶部时就标记为活动状态
      const offset = 100;

      // 找到当前可见的标题
      let activeHeading = null;

      // 从后往前找，这样可以确保找到的是最上面的可见标题
      for (let i = headingElements.length - 1; i >= 0; i--) {
        const heading = headingElements[i];
        const rect = heading.getBoundingClientRect();

        // 如果标题在视窗内或刚刚滚过
        if (rect.top <= offset) {
          activeHeading = heading;
          break;
        }
      }

      // 移除所有当前激活的类
      tocLinks.forEach(link => {
        link.classList.remove('active');
        link.parentElement.classList.remove('active');
      });

      // 如果找到了活动标题，则高亮对应的目录项
      if (activeHeading) {
        const activeLink = idToTocMap[activeHeading.id];
        if (activeLink) {
          activeLink.classList.add('active');
          activeLink.parentElement.classList.add('active');
        }
      }
    }

    // 初始调用一次更新函数
    updateActiveHeading();

    // 添加滚动事件监听
    window.addEventListener('scroll', updateActiveHeading, {passive: true});
  }

  // 添加相关文章项目函数
  function addRelatedPostItem(post, score) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `post.html?filename=${encodeURIComponent(post.filename)}`;
    a.textContent = post.title;
    li.appendChild(a);

    // 可选：添加一个描述时间的小标签
    const dateSpan = document.createElement('span');
    dateSpan.className = 'post-date';
    dateSpan.textContent = post.date.split(' ')[0]; // 只显示日期部分
    li.appendChild(dateSpan);

    relatedPosts.appendChild(li);
  }

  // 加载相关文章
  function loadRelatedPosts(currentPost) {
    if (!relatedPosts) {
      console.error('找不到相关文章容器元素');
      return;
    }

  // 确保有文章数据
  if (!posts || posts.length === 0) {
    console.log('尚未加载文章数据，延迟处理相关文章');
    // 设置最大重试次数，避免无限循环
    if (!window.relatedPostsRetries) window.relatedPostsRetries = 0;
    window.relatedPostsRetries++;

    if (window.relatedPostsRetries < 10) {
      setTimeout(() => loadRelatedPosts(currentPost), 500);
    } else {
      console.warn('相关文章加载失败：数据未能及时加载');
      relatedPosts.innerHTML = '<li>暂无相关文章</li>';
    }
    return;
  }

  console.log('正在计算相关文章，当前文章:', currentPost.title);
  console.log('可用于推荐的文章数量:', posts.length);

    // 计算每篇文章的相关性分数
    const scoredPosts = posts
      .filter(post => post.filename !== currentPost.filename)
      .map(post => {
        let score = 0;

        // 相同分类加分 (30分)
        if (post.category === currentPost.category) {
          score += 30;
        }

        // 标签匹配加分 (每个匹配标签20分)
        if (currentPost.tags && currentPost.tags.length && post.tags && post.tags.length) {
          const matchingTags = post.tags.filter(tag =>
            currentPost.tags.includes(tag)
          );
          score += matchingTags.length * 20;

          // 记录匹配了哪些标签
          if (matchingTags.length > 0) {
            console.log(`文章 "${post.title}" 匹配了 ${matchingTags.length} 个标签: ${matchingTags.join(', ')}`);
          }
        }

        // 目录相似性加分 (同一目录25分)
        if (post.path && currentPost.path && post.path === currentPost.path) {
          score += 25;
        }

        // 标题相似度加分 (每个匹配关键词10分)
        const currentTitleWords = currentPost.title.toLowerCase().split(/\W+/).filter(word => word.length > 2);
        const postTitleWords = post.title.toLowerCase().split(/\W+/).filter(word => word.length > 2);
        const matchingWords = currentTitleWords.filter(word => postTitleWords.includes(word));
        score += matchingWords.length * 10;

        // 时间接近度加分
        try {
          const currentDate = new Date(currentPost.date);
          const postDate = new Date(post.date);
          // 确保日期有效
          if (!isNaN(currentDate) && !isNaN(postDate)) {
            const daysDifference = Math.abs((currentDate - postDate) / (1000 * 60 * 60 * 24));
            if (daysDifference < 30) { // 一个月内的文章
              score += Math.max(0, 10 - Math.floor(daysDifference / 3));
            }
          }
        } catch (e) {
          console.warn('日期计算错误:', e);
        }

        return { post, score };
      })
      .sort((a, b) => b.score - a.score) // 按分数降序排序
      .filter(item => item.score > -10);   // 只保留有相关性的文章

    console.log('找到的相关文章及得分:', scoredPosts.map(p => ({title: p.post.title, score: p.score})));

    // 清空当前列表
    relatedPosts.innerHTML = '';

    // 如果没有相关性高的文章，显示最近的文章
    if (scoredPosts.length === 0) {
      console.log('没有找到相关文章，显示最近文章');

      const recentPosts = posts
        .filter(post => post.filename !== currentPost.filename)
        .sort((a, b) => {
          try {
            return new Date(b.date) - new Date(a.date)
          } catch(e) {
            return 0;
          }
        })
        .slice(0, 5);

      if (recentPosts.length === 0) {
        relatedPosts.innerHTML = '<li class="no-related">没有找到相关文章</li>';
        return;
      }

      const recentHeader = document.createElement('li');
      recentHeader.className = 'related-header';
      recentHeader.textContent = '最近文章';
      relatedPosts.appendChild(recentHeader);

      recentPosts.forEach(post => {
        addRelatedPostItem(post);
      });

      console.log('相关文章处理完成:');
      console.log('- 相关文章容器元素存在:', relatedPosts !== null);
      console.log('- 文章列表项数量:', relatedPosts ? relatedPosts.children.length : 0);
      console.log('- 当前页面文章标题:', currentPost.title);
      console.log('- 总文章数量:', posts.length);

      return;
    }

    // 显示最多5篇相关文章
    const displayPosts = scoredPosts.slice(0, 5);

    // 添加相关文章标题
    const relatedHeader = document.createElement('li');
    relatedHeader.className = 'related-header';
    // relatedHeader.textContent = '相关文章';
    relatedPosts.appendChild(relatedHeader);

    // 添加相关文章
    displayPosts.forEach(({post, score}) => {
      addRelatedPostItem(post, score);
    });

    // 如果相关文章不足3篇，添加一些最近文章
    if (displayPosts.length < 3) {
      const recentPosts = posts
        .filter(post =>
          post.filename !== currentPost.filename &&
          !displayPosts.find(p => p.post.filename === post.filename)
        )
        .sort((a, b) => {
          try {
            return new Date(b.date) - new Date(a.date)
          } catch(e) {
            return 0;
          }
        })
        .slice(0, 5 - displayPosts.length);

      if (recentPosts.length > 0) {
        const recentHeader = document.createElement('li');
        recentHeader.className = 'related-header';
        recentHeader.textContent = '其他文章';
        relatedPosts.appendChild(recentHeader);

        recentPosts.forEach(post => {
          addRelatedPostItem(post);
        });
      }
    }
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
      copyButton.innerHTML = '<i class="uil uil-copy"></i>'; // 使用复制图标

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

  // 设置事件监听器
  function setupEventListeners() {
    // 返回列表按钮
    if (backToList) {
      backToList.addEventListener('click', () => {
        window.location.href = 'index.html';
      });
    }

    // 搜索切换按钮
    const searchToggle = document.getElementById('search-toggle');
    if (searchToggle) {
      searchToggle.addEventListener('click', (e) => {
        e.preventDefault();
        // 不再聚焦右侧搜索框，而是跳转到搜索页面
        window.location.href = 'search.html';
      });
    }

    // 暗黑模式切换
    const themeToggle = document.getElementById('theme-toggle');
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

      // 设置暗黑模式
      function setupDarkMode() {
        // 检查本地存储中的主题设置
        const selectedTheme = localStorage.getItem('selected-theme');
        const themeToggle = document.getElementById('theme-toggle');

        if (selectedTheme === 'dark') {
          document.body.classList.add('dark-theme');
          const icon = themeToggle?.querySelector('i');
          if (icon) icon.classList.replace('uil-moon', 'uil-sun');
        }
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

      // 图片点击放大功能
      function setupImageViewer() {
        const images = document.querySelectorAll('.post-content img');

        // 创建图片查看器
        const viewer = document.createElement('div');
        viewer.className = 'image-viewer';
        viewer.innerHTML = `
          <div class="viewer-overlay"></div>
          <div class="viewer-container">
            <img class="viewer-img" src="" alt="预览图">
            <button class="viewer-close"><i class="uil uil-times"></i></button>
          </div>
        `;
        document.body.appendChild(viewer);

        const viewerOverlay = viewer.querySelector('.viewer-overlay');
        const viewerImage = viewer.querySelector('.viewer-img');
        const closeBtn = viewer.querySelector('.viewer-close');

        // 关闭查看器
        function closeViewer() {
          viewer.classList.remove('active');
          document.body.style.overflow = '';
        }

        // 设置关闭按钮事件
        closeBtn.addEventListener('click', closeViewer);
        viewerOverlay.addEventListener('click', closeViewer);

        // 设置图片点击事件
        images.forEach(img => {
          img.style.cursor = 'zoom-in';
          img.addEventListener('click', () => {
            viewerImage.src = img.src;
            viewer.classList.add('active');
            document.body.style.overflow = 'hidden';
          });
        });

        // ESC键关闭查看器
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && viewer.classList.contains('active')) {
            closeViewer();
          }
        });
      }

      // 添加CSS样式
      function addCustomStyles() {
        // 为文章目录添加样式
        const style = document.createElement('style');
        style.textContent = `
          .toc-list {
            padding-left: 0;
            list-style: none;
          }
          
          .toc-item {
            margin-bottom: 8px;
          }
          
          .toc-item a {
            color: var(--blog-text-color);
            text-decoration: none;
            display: block;
            padding: 4px 0;
            transition: all 0.2s;
          }
          
          .toc-item a:hover {
            color: var(--blog-primary-color);
          }
          
          .toc-h2 {
            padding-left: 16px;
          }
          
          .toc-h3 {
            padding-left: 32px;
          }
          
          /* 图片查看器样式 */
          .image-viewer {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 9999;
            display: none;
          }
          
          .image-viewer.active {
            display: block;
          }
          
          .viewer-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
          }
          
          .viewer-container {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            max-width: 90%;
            max-height: 90%;
          }
          
          .viewer-img {
            max-width: 100%;
            max-height: 90vh;
            object-fit: contain;
          }
          
          .viewer-close {
            position: absolute;
            top: -40px;
            right: 0;
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
          }
            
          /* 活动目录项样式 */
          .toc-item.active > a,
          .toc-item a.active {
            color: var(--blog-primary-color);
            font-weight: bold;
            border-left: 2px solid var(--blog-primary-color);
            padding-left: 8px;
            margin-left: -10px;
          }
          
          /* 为目录项添加平滑过渡效果 */
          .toc-item a {
            transition: all 0.3s ease;
          }
        `;
        document.head.appendChild(style);
      }

      // 在文档加载后初始化其他功能
      window.addEventListener('load', () => {
        setupImageViewer();
        addCustomStyles();
      });

      // 初始化
      init();
    });