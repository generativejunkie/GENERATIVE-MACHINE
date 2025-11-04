
// BGMオーディオ設定
const bgm = new Audio('sound/ambient-loop.mp3'); // 実際のファイル名に変更してください
bgm.loop = true;
bgm.volume = 0.5;

const total = 394;

function getRandomImagePath() {
  const index = Math.floor(Math.random() * total) + 1;
  const padded = String(index).padStart(3, '0');
  return `photos/photo${padded}.webp`;
}

function analyzeBrightness(img) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, img.naturalHeight - 10, img.naturalWidth, 10); // 最下部10px
  const data = imageData.data;

  let totalBrightness = 0;
  for (let i = 0; i < data.length; i += 4) {
    const brightness = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
    totalBrightness += brightness;
  }
  const avgBrightness = totalBrightness / (data.length / 4);
  return avgBrightness;
}

function setLogoColor(img) {
  const avg = analyzeBrightness(img);
  const logo = document.querySelector(".logo-footer");
  if (avg >= 128) {
    logo.src = "logo/gj_logo_black.png";
    document.querySelector("footer").style.color = "#000";
  } else {
    logo.src = "logo/gj_logo_white.png";
    document.querySelector("footer").style.color = "#fff";
  }
}

function changeBackground() {
  const path = getRandomImagePath();
  const img = document.getElementById("main-img");

  const preload = new Image();
  preload.src = path;
  preload.onload = () => {
    img.src = path;
    img.classList.remove("portrait", "landscape");

    const isPortrait = preload.height >= preload.width;
    img.classList.add(isPortrait ? "portrait" : "landscape");

    // PCのみ明度分析
    if (window.innerWidth > 768) {
      setLogoColor(preload);
    }
  };
}

document.addEventListener("DOMContentLoaded", () => {
  // サウンドON/OFF切替
  const soundToggle = document.getElementById("sound-toggle");
  let soundOn = false;

  soundToggle.addEventListener("click", () => {
    soundOn = !soundOn;
    if (soundOn) {
      bgm.play();
      soundToggle.textContent = "♪ OFF";
    } else {
      bgm.pause();
      soundToggle.textContent = "♪ ON";
    }
  });

  const img = document.getElementById("main-img");
  const initial = img.src;

  const preload = new Image();
  preload.src = initial;
  preload.onload = () => {
    const isPortrait = preload.height >= preload.width;
    img.classList.add(isPortrait ? "portrait" : "landscape");

    if (window.innerWidth > 768) {
      setLogoColor(preload);
    }
  };

  const button = document.querySelector("button");
  button.addEventListener("mouseenter", () => button.classList.remove("faded"));
  button.addEventListener("mouseleave", () => button.classList.add("faded"));
});
