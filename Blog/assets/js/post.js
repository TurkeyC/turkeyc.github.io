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
      showError('加载博客失败，请稍后再试');
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
  }

  // 加载相关文章
  function loadRelatedPosts(currentPost) {
    if (!posts || posts.length === 0 || !relatedPosts) {
      return;
    }

    // 查找同类别或相同标签的文章
    let related = posts.filter(post =>
      post.id !== currentPost.id && (
        post.category === currentPost.category ||
        post.tags.some(tag => currentPost.tags.includes(tag))
      )
    );

    // 如果没有相关文章，显示最近的文章
    if (related.length === 0) {
      related = posts.filter(post => post.id !== currentPost.id)
        .slice(0, 5);
    } else {
      // 最多显示5篇相关文章
      related = related.slice(0, 5);
    }

    // 清空当前列表
    relatedPosts.innerHTML = '';

    if (related.length === 0) {
      const emptyMsg = document.createElement('li');
      emptyMsg.textContent = '没有相关文章';
      relatedPosts.appendChild(emptyMsg);
      return;
    }

    // 添加相关文章
    related.forEach(post => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `post.html?id=${post.id}`;
      a.textContent = post.title;

      li.appendChild(a);
      relatedPosts.appendChild(li);
    });
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