document.addEventListener('DOMContentLoaded', () => {
    // 全局变量
    const postsContainer = document.getElementById('posts-container');
    const searchInput = document.getElementById('search-input');
    const searchResultsTitle = document.getElementById('search-results-title');
    const themeToggle = document.getElementById('theme-toggle');

    // 全局文章数据
    let posts = [];
    let currentSearch = '';

    // 初始化
    function init() {
        setupSidebarToggle();
        setupDarkMode();
        setupBackToTop();
        setupEventListeners();

        // 检查URL参数是否有搜索关键词
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('q');

        if (searchQuery) {
            searchInput.value = searchQuery;
            currentSearch = searchQuery;

            // 立即执行搜索
            loadAllPosts().then(() => {
                searchAndRender();
            });
        } else {
            // 无搜索关键词时，只加载文章数据但不显示结果
            loadAllPosts();
        }
    }

    // 解析 front matter (与blog.js相同)
    function parseFrontMatter(markdown) {
        if (!markdown.startsWith('---')) {
            return {content: markdown, metadata: {}};
        }

        const endOfFrontMatter = markdown.indexOf('---', 3);
        if (endOfFrontMatter === -1) {
            return {content: markdown, metadata: {}};
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
                }

                metadata[key] = value;
            }
        });

        return {content, metadata};
    }

    // 加载所有文章 (与blog.js相同)
    async function loadAllPosts() {
        try {
            const response = await fetch('/Blog/posts/index.json');

            if (!response.ok) {
                console.error('无法加载索引文件:', response.status);
                throw new Error('无法加载文章索引');
            }

            const postFilenames = await response.json();
            const loadedPosts = [];

            for (let i = 0; i < postFilenames.length; i++) {
                const filename = postFilenames[i];
                const postResponse = await fetch(`/Blog/posts/${filename}`);

                if (!postResponse.ok) {
                    console.error(`文件 ${filename} 加载失败:`, postResponse.status);
                    continue;
                }

                const markdown = await postResponse.text();
                const {content, metadata} = parseFrontMatter(markdown);

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

            posts = loadedPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
            return posts;
        } catch (error) {
            console.error('加载文章失败:', error);
            postsContainer.innerHTML = '<div class="error">加载博客失败，请稍后再试</div>';
            return [];
        }
    }

    // 估算阅读时间 (与blog.js相同)
    function estimateReadingTime(text) {
        const wordCount = text.trim().split(/\s+/).length;
        return Math.ceil(wordCount / 200);
    }

    // 搜索并渲染结果
    function searchAndRender() {
        if (!currentSearch.trim()) {
            postsContainer.innerHTML = '<div class="no-posts">请输入关键词进行搜索</div>';
            searchResultsTitle.textContent = '搜索结果';
            return;
        }

        const searchLower = currentSearch.toLowerCase();
        const filteredPosts = posts.filter(post =>
            post.title.toLowerCase().includes(searchLower) ||
            post.content.toLowerCase().includes(searchLower) ||
            (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchLower)))
        );

        if (filteredPosts.length === 0) {
            postsContainer.innerHTML = `<div class="no-posts">没有找到与 "${currentSearch}" 相关的文章</div>`;
            searchResultsTitle.textContent = `搜索结果: 0 篇文章`;
        } else {
            postsContainer.innerHTML = '';
            searchResultsTitle.textContent = `搜索结果: ${filteredPosts.length} 篇文章`;

            filteredPosts.forEach(post => {
                const postCard = renderPost(post);
                postsContainer.appendChild(postCard);
            });
        }
    }

    // 渲染单篇文章卡片 (与blog.js相同)
    function renderPost(post) {
        const postCard = document.createElement('div');
        postCard.className = 'post-card';
        postCard.dataset.id = post.id;

        const categoryClass = post.category.toLowerCase();
        const categoryText = post.category === 'Original' ? '原创' : '转载';

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
            window.location.href = `post.html?id=${post.id}`;
        });

        return postCard;
    }

    // 设置事件监听器
    function setupEventListeners() {
        if (searchInput) {
            searchInput.addEventListener('input', debounce(() => {
                currentSearch = searchInput.value.trim();
                // 更新URL参数以便分享搜索结果
                const url = new URL(window.location);
                if (currentSearch) {
                    url.searchParams.set('q', currentSearch);
                } else {
                    url.searchParams.delete('q');
                }
                history.replaceState({}, '', url);

                searchAndRender();
            }, 300));

            // 回车键提交搜索
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    currentSearch = searchInput.value.trim();
                    searchAndRender();
                }
            });
        }
    }

    // 侧边栏切换功能 (与blog.js相同)
    function setupSidebarToggle() {
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        const blogContainer = document.querySelector('.blog-container');
        const sidebar = document.querySelector('.sidebar');

        function updateTogglePosition() {
            if (blogContainer.classList.contains('sidebar-collapsed')) {
                sidebarToggle.style.left = '0';
            } else {
                const sidebarRect = sidebar.getBoundingClientRect();
                sidebarToggle.style.left = `${sidebarRect.right}px`;
            }
        }

        updateTogglePosition();
        window.addEventListener('resize', updateTogglePosition);

        if (sidebarToggle) {
            const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
            if (isCollapsed) {
                blogContainer.classList.add('sidebar-collapsed');
                updateTogglePosition();
            }

            sidebarToggle.addEventListener('click', () => {
                blogContainer.classList.toggle('sidebar-collapsed');
                updateTogglePosition();
                setTimeout(updateTogglePosition, 350);
                localStorage.setItem(
                    'sidebarCollapsed',
                    blogContainer.classList.contains('sidebar-collapsed')
                );
            });
        }

        sidebar.addEventListener('transitionend', updateTogglePosition);
    }

    // 设置暗黑模式 (与blog.js相同)
    function setupDarkMode() {
        const selectedTheme = localStorage.getItem('selected-theme');
        if (selectedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            const icon = themeToggle?.querySelector('i');
            if (icon) icon.classList.replace('uil-moon', 'uil-sun');
        }

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

    // 防抖函数 (与blog.js相同)
    function debounce(func, delay) {
        let timeout;
        return function () {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }

    // 回到顶部按钮功能 (与blog.js相同)
    function setupBackToTop() {
        const backToTopBtn = document.createElement('button');
        backToTopBtn.id = 'back-to-top';
        backToTopBtn.className = 'back-to-top';
        backToTopBtn.setAttribute('aria-label', '回到顶部');

        const icon = document.createElement('i');
        icon.className = 'uil uil-arrow-up';
        backToTopBtn.appendChild(icon);

        document.body.appendChild(backToTopBtn);

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

    // 加载相关文章推荐
    function loadRelatedPosts(currentPost) {
        if (!posts || posts.length === 0) {
            return [];
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

        return related;
    }

    // 高亮搜索结果中的匹配文本
    function highlightSearchText(text, searchTerm) {
        if (!searchTerm) return text;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    // 搜索内容高亮显示
    function renderSearchCard(post) {
        const postCard = document.createElement('div');
        postCard.className = 'post-card';
        postCard.dataset.id = post.id;

        const categoryClass = post.category.toLowerCase();
        const categoryText = post.category === 'Original' ? '原创' : '转载';

        // 高亮标题中的搜索词
        const highlightedTitle = highlightSearchText(post.title, currentSearch);

        // 从内容中提取包含搜索词的片段
        let contentPreview = '';
        if (post.content.toLowerCase().includes(currentSearch.toLowerCase())) {
            const index = post.content.toLowerCase().indexOf(currentSearch.toLowerCase());
            const start = Math.max(0, index - 50);
            const end = Math.min(post.content.length, index + currentSearch.length + 50);
            contentPreview = `...${highlightSearchText(post.content.substring(start, end), currentSearch)}...`;
        }

        let tagsHTML = '';
        if (post.tags && post.tags.length > 0) {
            tagsHTML = '<div class="post-tags">' +
                post.tags.map(tag => `<span class="post-tag-item">${highlightSearchText(tag, currentSearch)}</span>`).join('') +
                '</div>';
        }

        postCard.innerHTML = `
            <span class="post-tag ${categoryClass}">${categoryText}</span>
            <h2 class="post-title">${highlightedTitle}</h2>
            <div class="post-meta">
                <span class="post-date"><i class="uil uil-calendar-alt"></i> ${post.date}</span>
                <span class="post-reading-time"><i class="uil uil-clock"></i> ${post.readingTime}</span>
            </div>
            ${tagsHTML}
            ${contentPreview ? `<div class="post-content-preview">${contentPreview}</div>` : ''}
        `;

        postCard.addEventListener('click', () => {
            window.location.href = `post.html?id=${post.id}`;
        });

        return postCard;
    }

    // 完整的searchAndRender函数
    function searchAndRender() {
        if (!currentSearch.trim()) {
            postsContainer.innerHTML = '<div class="no-posts">请输入关键词进行搜索</div>';
            searchResultsTitle.textContent = '搜索结果';
            return;
        }

        const searchLower = currentSearch.toLowerCase();
        const filteredPosts = posts.filter(post =>
            post.title.toLowerCase().includes(searchLower) ||
            post.content.toLowerCase().includes(searchLower) ||
            (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchLower)))
        );

        if (filteredPosts.length === 0) {
            postsContainer.innerHTML = `<div class="no-posts">没有找到与 "${currentSearch}" 相关的文章</div>`;
            searchResultsTitle.textContent = `搜索结果: 0 篇文章`;
        } else {
            postsContainer.innerHTML = '';
            searchResultsTitle.textContent = `搜索结果: ${filteredPosts.length} 篇文章`;

            filteredPosts.forEach(post => {
                const postCard = renderSearchCard(post); // 使用特殊的搜索卡片渲染
                postsContainer.appendChild(postCard);
            });
        }
    }

    // 完成init函数缺失部分
    function init() {
        setupSidebarToggle();
        setupDarkMode();
        setupBackToTop();
        setupEventListeners();

        // 检查URL参数是否有搜索关键词
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('q');

        if (searchQuery) {
            searchInput.value = searchQuery;
            currentSearch = searchQuery;

            // 立即执行搜索
            loadAllPosts().then(() => {
                searchAndRender();
            });
        } else {
            // 无搜索关键词时，只加载文章数据但不显示结果
            loadAllPosts();
        }
    }

    // 初始化
    init();
});