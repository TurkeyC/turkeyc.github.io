// 初始化播放器
let player = null;
let playlist = [];
let currentIndex = 0;

function initPlayer(song) {
  if (player) {
    player.unload();
  }

  player = new Howl({
    src: [song.url],
    html5: true,
    onplay: () => updatePlayerUI(true),
    onpause: () => updatePlayerUI(false),
    onend: () => playNext(),
    onloaderror: (id, err) => console.error('加载错误:', err)
  });

  updateSongInfo(song);
  player.play();
}

function updateSongInfo(song) {
  document.querySelector('.song-title').textContent = song.title;
  document.querySelector('.song-artist').textContent = song.artist;
  document.querySelector('.album-cover').src = song.cover;
  // 更新歌词显示
  loadLyrics(song.lyrics);
}

// 控制函数
function togglePlay() {
  if (!player) return;
  player.playing() ? player.pause() : player.play();
}

function playNext() {
  if (currentIndex < playlist.length - 1) {
    currentIndex++;
    initPlayer(playlist[currentIndex]);
  }
}

function playPrev() {
  if (currentIndex > 0) {
    currentIndex--;
    initPlayer(playlist[currentIndex]);
  }
}