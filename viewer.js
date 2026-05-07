const canvas = document.getElementById('spineCanvas');
const ctx = canvas.getContext('2d');
let skeleton, animState, canvasMgr;
let animList = [];

function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// 固定读取根目录 spine.json / spine.atlas
const basePath = "";
const jsonUrl = basePath + "spine.json";
const atlasUrl = basePath + "spine.atlas";

async function loadSpine() {
  try {
    const atlas = await spine.Atlas.load(atlasUrl);
    const loader = new spine.SkeletonJson(new spine.AtlasAttachmentLoader(atlas));
    const res = await fetch(jsonUrl);
    const jsonData = await res.json();
    const skelData = loader.readSkeletonData(jsonData);

    skeleton = new spine.Skeleton(skelData);
    const stateData = new spine.AnimationStateData(skelData);
    animState = new spine.AnimationState(stateData);

    // 填充动画列表
    const select = document.getElementById('animSelect');
    select.innerHTML = '';
    animList = skelData.animations.map(a => a.name);
    animList.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.innerText = name;
      select.appendChild(opt);
    });

    if (animList.length) animState.setAnimation(0, animList[0], true);

    canvasMgr = new spine.CanvasManager(canvas);
    requestAnimationFrame(renderLoop);
  } catch (e) {
    console.error('加载失败：', e);
    alert('未找到 spine.json / spine.atlas，请放到仓库根目录');
  }
}

function renderLoop() {
  const bg = document.getElementById('bgColor').value;
  canvas.style.backgroundColor = bg;

  const speed = parseFloat(document.getElementById('speedVal').value) || 1;
  const scale = parseFloat(document.getElementById('scaleVal').value) || 1;
  const offX = parseFloat(document.getElementById('offsetX').value) || 0;
  const offY = parseFloat(document.getElementById('offsetY').value) || 0;

  const delta = 0.016 * speed;
  animState.update(delta);
  animState.apply(skeleton);

  skeleton.x = canvas.width / 2 + offX;
  skeleton.y = canvas.height / 2 + offY;
  skeleton.scaleX = scale;
  skeleton.scaleY = scale;
  skeleton.updateWorldTransform();

  canvasMgr.clear();
  canvasMgr.drawSkeleton(skeleton);

  requestAnimationFrame(renderLoop);
}

// 切换动画
document.getElementById('animSelect').addEventListener('change', e => {
  if (!animState) return;
  animState.setAnimation(0, e.target.value, true);
});

// 重载按钮
document.getElementById('reloadBtn').addEventListener('click', () => {
  loadSpine();
});

// 初始化
loadSpine();