// 加载并渲染站点数据
document.addEventListener('DOMContentLoaded', function() {
  // 获取JSON数据
  fetch('assets/data/sites.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('网络响应异常');
      }
      return response.json();
    })
    .then(data => {
      renderSections(data.sections);
      renderSectionNav(data.sections);
    })
    .catch(error => {
      console.error('加载站点数据失败:', error);
    });
});

// 渲染分区导航
function renderSectionNav(sections) {
  const sectionNavContainer = document.querySelector('.section__nav');
  sectionNavContainer.innerHTML = '';

  sections.forEach(section => {
    const link = document.createElement('a');
    link.href = `#${section.id}`;
    link.className = 'section__link';
    link.textContent = section.title;
    sectionNavContainer.appendChild(link);
  });

  // 添加平滑滚动效果
  addSmoothScrolling();
}

// 添加平滑滚动功能
function addSmoothScrolling() {
  const sectionLinks = document.querySelectorAll('.section__link');
  const headerHeight = document.querySelector('.header').offsetHeight;

  sectionLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();

      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

// 渲染所有分区和站点
function renderSections(sections) {
  const mainContent = document.querySelector('.main');
  const searchSection = document.querySelector('.main > .section');

  // 清除原有内容，保留搜索部分
  const elements = Array.from(mainContent.children);
  elements.forEach(el => {
    if (el !== searchSection) {
      el.remove();
    }
  });

  // 渲染每个分区
  sections.forEach(section => {
    const sectionElement = createSection(section);
    mainContent.appendChild(sectionElement);
  });
}

// 创建单个分区元素
function createSection(section) {
  const sectionElement = document.createElement('section');
  sectionElement.className = 'section';
  sectionElement.id = section.id;

  const titleElement = document.createElement('h2');
  titleElement.className = 'section__title';
  titleElement.textContent = section.title;

  const cardsContainer = document.createElement('div');
  cardsContainer.className = 'cards';

  // 创建该分区下的所有站点卡片
  section.sites.forEach(site => {
    const card = createCard(site);
    cardsContainer.appendChild(card);
  });

  sectionElement.appendChild(titleElement);
  sectionElement.appendChild(cardsContainer);

  return sectionElement;
}

// 创建单个站点卡片
function createCard(site) {
  const card = document.createElement('a');
  card.href = site.url;
  card.target = '_blank';
  card.className = 'card';

  const img = document.createElement('img');
  img.src = site.icon;
  img.alt = site.name;
  img.onerror = function() {
    this.src = 'assets/img/default-icon.png'; // 设置默认图标
  };

  const info = document.createElement('div');
  info.className = 'info';

  const title = document.createElement('span');
  title.className = 'title';
  title.textContent = site.name;

  const description = document.createElement('span');
  description.className = 'description';
  description.textContent = site.description;

  info.appendChild(title);
  info.appendChild(description);

  card.appendChild(img);
  card.appendChild(info);

  return card;
}