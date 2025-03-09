// player.js - 播放器核心功能

// 播放器状态
let player = null;
let currentPlaylist = [];
let currentIndex = 0;
let isPlaying = false;
let isMuted = false;
let repeatMode = 'none'; // none, one, all
let volume = 1;

// DOM 元素
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const muteBtn = document.getElementById('mute-btn');
const volumeSlider = document.getElementById('volume-slider');
const progressBar = document.querySelector('.progress');
const currentTimeDisplay = document.querySelector('.current-time');
const totalTimeDisplay = document.querySelector('.total-time');

// 初始化播放器控件
function initPlayerControls() {
  // 播放/暂停
  playBtn.addEventListener('click', togglePlay);

  // 上一首/下一首
  prevBtn.addEventListener('click', playPrevious);
  nextBtn.addEventListener('click', playNext);

  // 音量控制
  muteBtn.addEventListener('click', toggleMute);
  volumeSlider.addEventListener('input', handleVolumeChange);

  // 进度条点击
  document.querySelector('.progress-bar').addEventListener('click', seekToPosition);

  // 初始化音量
  volumeSlider.value = volume * 100;
}

// 播放指定歌曲
function playSong(songId) {
  const song = appData.songs.find(s => s.id === songId);
  if (!song) return;

  // 如果已经有播放器实例，先卸载
  if (player) {
    player.unload();
  }

  // 创建新的播放器实例
  player = new Howl({
    src: [song.url],
    html5: true,
    volume: volume,
    onplay: () => updatePlayerUI(true),
    onpause: () => updatePlayerUI(false),
    onend: handleSongEnd,
    onload: () => updateDuration(),
    onseek: () => updateProgress()
  });

  // 更新界面
  updateSongInfo(song);
  appData.currentSong = song;

  // 播放
  player.play();
  isPlaying = true;

  // 设置进度更新定时器
  startProgressTimer();
}

// 播放专辑
function playAlbum(albumId) {
  const album = appData.albums.find(a => a.id === albumId);
  if (!album) return;

  // 获取专辑中的所有歌曲
  currentPlaylist = album.songs;
  currentIndex = 0;

  // 播放第一首歌
  playSong(currentPlaylist[currentIndex]);
}

// 播放播放列表
function playPlaylist(name) {
  const savedPlaylists = JSON.parse(localStorage.getItem('playlists') || '{}');
  const playlist = savedPlaylists[name];

  if (playlist && playlist.length > 0) {
    currentPlaylist = playlist;
    currentIndex = 0;
    playSong(currentPlaylist[currentIndex]);
  }
}

// 播放/暂停切换
function togglePlay() {
  if (!player) return;

  if (player.playing()) {
    player.pause();
    isPlaying = false;
  } else {
    player.play();
    isPlaying = true;
  }

  updatePlayerUI(isPlaying);
}

// 播放上一首
function playPrevious() {
  if (!currentPlaylist.length || currentIndex <= 0) return;

  currentIndex--;
  playSong(currentPlaylist[currentIndex]);
}

// 播放下一首
function playNext() {
  if (!currentPlaylist.length || currentIndex >= currentPlaylist.length - 1) return;

  currentIndex++;
  playSong(currentPlaylist[currentIndex]);
}

// 处理歌曲结束
function handleSongEnd() {
  if (repeatMode === 'one') {
    // 单曲循环
    player.play();
  } else if (repeatMode === 'all') {
    // 列表循环
    if (currentIndex < currentPlaylist.length - 1) {
      playNext();
    } else {
      currentIndex = 0;
      playSong(currentPlaylist[currentIndex]);
    }
  } else if (currentIndex < currentPlaylist.length - 1) {
    // 默认模式，播放下一首
    playNext();
  }
}

// 静音切换
function toggleMute() {
  if (!player) return;

  if (isMuted) {
    player.volume(volume);
    volumeSlider.value = volume * 100;
  } else {
    player.volume(0);
    volumeSlider.value = 0;
  }

  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? '取消静音' : '静音';
}

// 音量控制
function handleVolumeChange() {
  if (!player) return;

  volume = volumeSlider.value / 100;
  player.volume(volume);

  if (volume === 0) {
    isMuted = true;
    muteBtn.textContent = '取消静音';
  } else if (isMuted) {
    isMuted = false;
    muteBtn.textContent = '静音';
  }
}

// 进度条控制
function seekToPosition(e) {
  if (!player || !player.duration()) return;

  const progressBar = document.querySelector('.progress-bar');
  const rect = progressBar.getBoundingClientRect();
  const percent = (e.clientX - rect.left) / rect.width;

  const seekTime = player.duration() * percent;
  player.seek(seekTime);
}

// 进度更新计时器
let progressTimer;
function startProgressTimer() {
  if (progressTimer) clearInterval(progressTimer);

  progressTimer = setInterval(() => {
    if (player && player.playing()) {
      updateProgress();
    }
  }, 1000);
}

// 更新进度条
function updateProgress() {
  if (!player) return;

  const currentTime = player.seek();
  const duration = player.duration();

  if (currentTime && duration) {
    const percent = (currentTime / duration) * 100;
    progressBar.style.width = `${percent}%`;

    currentTimeDisplay.textContent = formatTime(currentTime);
  }
}

// 更新总时长
function updateDuration() {
  if (!player) return;

  const duration = player.duration();
  totalTimeDisplay.textContent = formatTime(duration);
}

// 更新歌曲信息
function updateSongInfo(song) {
  document.querySelector('.song-title').textContent = song.title;
  document.querySelector('.song-artist').textContent = song.artist;
  document.querySelector('.album-cover').src = song.cover;
}

// 更新播放器UI
function updatePlayerUI(isPlaying) {
  playBtn.textContent = isPlaying ? '暂停' : '播放';
}

// 格式化时间 (秒 -> mm:ss)
function formatTime(seconds) {
  if (!seconds) return '0:00';

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

// 页面加载完成后初始化播放器控件
document.addEventListener('DOMContentLoaded', initPlayerControls);