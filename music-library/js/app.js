// 全局应用数据
let appData = {
  songs: [],
  albums: [],
  artists: [],
  currentPlaylist: [],
  currentSong: null,
  isLoaded: false
};

// 页面初始化
async function initApp() {
  try {
    // 显示加载状态
    document.querySelector('.content-container').innerHTML = '<div class="loading">正在加载数据...</div>';

    // 加载所有数据
    await Promise.all([
      loadSongs(),
      loadAlbums(),
      loadArtists()
    ]);

    // 标记数据已加载
    appData.isLoaded = true;

    // 渲染首页
    renderHomePage();

    // 设置导航事件
    setupNavigation();

  } catch (error) {
    console.error('初始化应用失败:', error);
    document.querySelector('.content-container').innerHTML = '<div class="error">数据加载失败，请刷新页面重试</div>';
  }
}

// 加载歌曲数据
async function loadSongs() {
  const response = await fetch('data/songs.json');
  const data = await response.json();
  appData.songs = data.songs;
}

// 加载专辑数据
async function loadAlbums() {
  const response = await fetch('data/albums.json');
  const data = await response.json();
  appData.albums = data.albums;
}

// 加载艺术家数据
async function loadArtists() {
  const response = await fetch('data/artists.json');
  const data = await response.json();
  appData.artists = data.artists;
}

// 设置导航事件
function setupNavigation() {
  const navLinks = document.querySelectorAll('.nav-links a');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.getAttribute('data-page');

      // 高亮当前菜单
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      // 根据点击的菜单渲染不同页面
      switch (page) {
        case 'home':
          renderHomePage();
          break;
        case 'albums':
          renderAlbumsPage();
          break;
        case 'artists':
          renderArtistsPage();
          break;
        case 'playlists':
          renderPlaylistsPage();
          break;
      }
    });
  });

  // 默认激活首页菜单
  navLinks[0].classList.add('active');
}

// 渲染首页
function renderHomePage() {
  const container = document.querySelector('.content-container');

  let html = `
    <h1>欢迎使用个人曲库</h1>
    <h2>最近添加的歌曲</h2>
    <div class="music-grid">
  `;

  // 显示最近添加的5首歌曲
  const recentSongs = appData.songs.slice(0, 5);

  recentSongs.forEach(song => {
    html += `
      <div class="music-card" data-id="${song.id}" onclick="playSong('${song.id}')">
        <img src="${song.cover}" alt="${song.title}">
        <div class="info">
          <div class="title">${song.title}</div>
          <div class="artist">${song.artist}</div>
        </div>
      </div>
    `;
  });

  html += '</div>';

  // 添加热门专辑部分
  html += `
    <h2>热门专辑</h2>
    <div class="music-grid">
  `;

  // 显示前5张专辑
  const featuredAlbums = appData.albums.slice(0, 5);

  featuredAlbums.forEach(album => {
    html += `
      <div class="music-card" data-id="${album.id}" onclick="showAlbum('${album.id}')">
        <img src="${album.cover}" alt="${album.title}">
        <div class="info">
          <div class="title">${album.title}</div>
          <div class="artist">${album.artist}</div>
        </div>
      </div>
    `;
  });

  html += '</div>';

  container.innerHTML = html;
}

// 显示专辑详情
function showAlbum(albumId) {
  const album = appData.albums.find(a => a.id === albumId);
  if (!album) return;

  const container = document.querySelector('.content-container');

  let html = `
    <div class="album-header">
      <img src="${album.cover}" alt="${album.title}" class="album-cover-large">
      <div class="album-info">
        <h1>${album.title}</h1>
        <h2>${album.artist} · ${album.year}</h2>
        <button onclick="playAlbum('${albumId}')" class="play-album-btn">播放专辑</button>
      </div>
    </div>
    <div class="song-list">
      <h3>歌曲列表</h3>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>标题</th>
            <th>艺术家</th>
            <th>时长</th>
          </tr>
        </thead>
        <tbody>
  `;

  // 获取专辑中的所有歌曲
  const albumSongs = album.songs.map(songId => {
    return appData.songs.find(s => s.id === songId);
  }).filter(song => song !== undefined);

  albumSongs.forEach((song, index) => {
    const minutes = Math.floor(song.duration / 60);
    const seconds = song.duration % 60;
    const duration = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    html += `
      <tr onclick="playSong('${song.id}')">
        <td>${index + 1}</td>
        <td>${song.title}</td>
        <td>${song.artist}</td>
        <td>${duration}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  </div>
  `;

  container.innerHTML = html;
}

// 渲染专辑页面
function renderAlbumsPage() {
  const container = document.querySelector('.content-container');

  let html = `
    <h1>所有专辑</h1>
    <div class="music-grid">
  `;

  appData.albums.forEach(album => {
    html += `
      <div class="music-card" data-id="${album.id}" onclick="showAlbum('${album.id}')">
        <img src="${album.cover}" alt="${album.title}">
        <div class="info">
          <div class="title">${album.title}</div>
          <div class="artist">${album.artist}</div>
        </div>
      </div>
    `;
  });

  html += '</div>';

  container.innerHTML = html;
}

// 渲染艺术家页面
function renderArtistsPage() {
  const container = document.querySelector('.content-container');

  let html = `
    <h1>所有艺术家</h1>
    <div class="music-grid">
  `;

  appData.artists.forEach(artist => {
    html += `
      <div class="music-card" data-id="${artist.id}" onclick="showArtist('${artist.id}')">
        <img src="${artist.cover}" alt="${artist.name}">
        <div class="info">
          <div class="title">${artist.name}</div>
          <div class="artist">${artist.albums.length} 张专辑</div>
        </div>
      </div>
    `;
  });

  html += '</div>';

  container.innerHTML = html;
}

// 显示艺术家详情
function showArtist(artistId) {
  const artist = appData.artists.find(a => a.id === artistId);
  if (!artist) return;

  const container = document.querySelector('.content-container');

  let html = `
    <div class="artist-header">
      <img src="${artist.cover}" alt="${artist.name}" class="artist-cover-large">
      <div class="artist-info">
        <h1>${artist.name}</h1>
        <p>${artist.description}</p>
      </div>
    </div>
    
    <h2>专辑</h2>
    <div class="music-grid">
  `;

  // 获取艺术家的专辑
  const artistAlbums = artist.albums.map(albumId => {
    return appData.albums.find(a => a.id === albumId);
  }).filter(album => album !== undefined);

  artistAlbums.forEach(album => {
    html += `
      <div class="music-card" data-id="${album.id}" onclick="showAlbum('${album.id}')">
        <img src="${album.cover}" alt="${album.title}">
        <div class="info">
          <div class="title">${album.title}</div>
          <div class="artist">${album.year}</div>
        </div>
      </div>
    `;
  });

  html += '</div>';

  // 添加热门歌曲
  html += `
    <h2>热门歌曲</h2>
    <div class="song-list">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>标题</th>
            <th>专辑</th>
            <th>时长</th>
          </tr>
        </thead>
        <tbody>
  `;

  // 获取艺术家的歌曲
  const artistSongs = artist.songs.map(songId => {
    return appData.songs.find(s => s.id === songId);
  }).filter(song => song !== undefined);

  artistSongs.forEach((song, index) => {
    const minutes = Math.floor(song.duration / 60);
    const seconds = song.duration % 60;
    const duration = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    html += `
      <tr onclick="playSong('${song.id}')">
        <td>${index + 1}</td>
        <td>${song.title}</td>
        <td>${song.album}</td>
        <td>${duration}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  </div>
  `;

  container.innerHTML = html;
}

// 渲染播放列表页面
function renderPlaylistsPage() {
  const container = document.querySelector('.content-container');

  // 从本地存储获取播放列表
  const savedPlaylists = JSON.parse(localStorage.getItem('playlists') || '{}');
  const playlistNames = Object.keys(savedPlaylists);

  let html = `
    <h1>我的播放列表</h1>
    <button id="create-playlist" class="btn">创建新播放列表</button>
    
    <div class="playlists-container">
  `;

  if (playlistNames.length === 0) {
    html += '<p class="no-playlists">你还没有创建任何播放列表</p>';
  } else {
    playlistNames.forEach(name => {
      const songCount = savedPlaylists[name].length;

      html += `
        <div class="playlist-card" onclick="showPlaylist('${name}')">
          <div class="playlist-name">${name}</div>
          <div class="playlist-count">${songCount} 首歌曲</div>
        </div>
      `;
    });
  }

  html += '</div>';

  container.innerHTML = html;

  // 添加创建播放列表的事件
  document.getElementById('create-playlist').addEventListener('click', () => {
    const playlistName = prompt('请输入播放列表名称:');
    if (playlistName && playlistName.trim()) {
      // 保存空播放列表
      const playlists = JSON.parse(localStorage.getItem('playlists') || '{}');
      playlists[playlistName] = [];
      localStorage.setItem('playlists', JSON.stringify(playlists));

      // 刷新页面
      renderPlaylistsPage();
    }
  });
}

// 显示播放列表详情
function showPlaylist(name) {
  // 从本地存储获取播放列表
  const savedPlaylists = JSON.parse(localStorage.getItem('playlists') || '{}');
  const playlist = savedPlaylists[name] || [];

  const container = document.querySelector('.content-container');

  let html = `
    <h1>播放列表: ${name}</h1>
    <button onclick="playPlaylist('${name}')" class="play-playlist-btn">播放全部</button>
    <button onclick="deletePlaylist('${name}')" class="delete-playlist-btn">删除播放列表</button>
    
    <div class="song-list">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>标题</th>
            <th>艺术家</th>
            <th>专辑</th>
            <th>时长</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
  `;

  // 获取播放列表中的所有歌曲
  const playlistSongs = playlist.map(songId => {
    return appData.songs.find(s => s.id === songId);
  }).filter(song => song !== undefined);

  playlistSongs.forEach((song, index) => {
    const minutes = Math.floor(song.duration / 60);
    const seconds = song.duration % 60;
    const duration = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    html += `
      <tr>
        <td>${index + 1}</td>
        <td>${song.title}</td>
        <td>${song.artist}</td>
        <td>${song.album}</td>
        <td>${duration}</td>
        <td>
          <button onclick="playSong('${song.id}')" class="play-btn">播放</button>
          <button onclick="removeFromPlaylist('${name}', '${song.id}')" class="remove-btn">移除</button>
        </td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  </div>
  `;

  container.innerHTML = html;
}