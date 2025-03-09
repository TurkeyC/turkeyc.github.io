// search.js - 搜索功能实现

// 获取搜索表单和输入框
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');

// 初始化搜索功能
function initSearch() {
  if (!searchForm || !searchInput) return;

  searchForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const query = searchInput.value.trim();

    if (query.length >= 1) {
      performSearch(query);
    }
  });
}

// 执行搜索
function performSearch(query) {
  query = query.toLowerCase();

  // 搜索结果
  const results = {
    songs: [],
    albums: [],
    artists: []
  };

  // 搜索歌曲
  results.songs = appData.songs.filter(song =>
    song.title.toLowerCase().includes(query) ||
    song.artist.toLowerCase().includes(query)
  );

  // 搜索专辑
  results.albums = appData.albums.filter(album =>
    album.title.toLowerCase().includes(query) ||
    album.artist.toLowerCase().includes(query)
  );

  // 搜索艺术家
  results.artists = appData.artists.filter(artist =>
    artist.name.toLowerCase().includes(query)
  );

  // 显示搜索结果
  displaySearchResults(results, query);
}

// 显示搜索结果
function displaySearchResults(results, query) {
  const container = document.querySelector('.content-container');

  let html = `
    <h1>搜索结果: "${query}"</h1>
    <div class="search-results">
  `;

  // 显示歌曲结果
  html += `<h2>歌曲 (${results.songs.length})</h2>`;

  if (results.songs.length > 0) {
    html += `
      <div class="song-list">
        <table>
          <thead>
            <tr>
              <th>标题</th>
              <th>艺术家</th>
              <th>专辑</th>
              <th>时长</th>
            </tr>
          </thead>
          <tbody>
    `;

    results.songs.forEach(song => {
      const minutes = Math.floor(song.duration / 60);
      const seconds = song.duration % 60;
      const duration = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

      html += `
        <tr onclick="playSong('${song.id}')">
          <td>${song.title}</td>
          <td>${song.artist}</td>
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
  } else {
    html += `<p>未找到匹配的歌曲</p>`;
  }

  // 显示专辑结果
  html += `<h2>专辑 (${results.albums.length})</h2>`;

  if (results.albums.length > 0) {
    html += `<div class="music-grid">`;

    results.albums.forEach(album => {
      html += `
        <div class="music-card" onclick="showAlbum('${album.id}')">
          <img src="${album.cover}" alt="${album.title}">
          <div class="info">
            <div class="title">${album.title}</div>
            <div class="artist">${album.artist}</div>
          </div>
        </div>
      `;
    });

    html += `</div>`;
  } else {
    html += `<p>未找到匹配的专辑</p>`;
  }

  // 显示艺术家结果
  html += `<h2>艺术家 (${results.artists.length})</h2>`;

  if (results.artists.length > 0) {
    html += `<div class="music-grid">`;

    results.artists.forEach(artist => {
      html += `
        <div class="music-card" onclick="showArtist('${artist.id}')">
          <img src="${artist.cover}" alt="${artist.name}">
          <div class="info">
            <div class="title">${artist.name}</div>
            <div class="artist">${artist.albums.length} 张专辑</div>
          </div>
        </div>
      `;
    });

    html += `</div>`;
  } else {
    html += `<p>未找到匹配的艺术家</p>`;
  }

  html += `</div>`;
  container.innerHTML = html;
}

// 页面加载完成后初始化搜索功能
document.addEventListener('DOMContentLoaded', initSearch);