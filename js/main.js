let currentStep = 'home';
let activeCareerKey = null;
let activeOptIdx = null;
let activeVariantIdx = null;
let ownedParts = new Set();
let activeComponents = [];
let detailsView = 'diagram'; // 'diagram' = sơ đồ lắp ráp | 'list' = danh sách & mua linh kiện

const retailShops = ['GearVN', 'Phong Vũ', 'An Phát', 'Hoàng Hà'];

function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

function toggleTheme() {
  const body = document.getElementById('app-body');
  body.classList.toggle('light-mode');
  const isLight = body.classList.contains('light-mode');
  const icon = document.getElementById('theme-icon');
  icon.classList.toggle('fa-moon', !isLight);
  icon.classList.toggle('fa-sun', isLight);
  updateNeonAvailability();
  if (activeAccentKey === 'neon' && isLight) applyAccent('sky');
  if (document.getElementById('isoStage') && detailsView === 'diagram' && activeComponents.length) isoMount(isoFullBuild(activeComponents));   // vẽ lại vỏ case theo theme
}

/* ── Hệ accent (đồng bộ PC MASTER BUILDER) ── */
const ACCENTS = {
  sky:     { a: '#0ea5e9', c: '#7dd3fc' },
  ruby:    { a: '#ef4444', c: '#fb7185' },
  emerald: { a: '#34d399', c: '#6ee7b7' },
  violet:  { a: '#a78bfa', c: '#f9a8d4' },
  amber:   { a: '#fbbf24', c: '#fcd34d' },
  cyan:    { a: '#22d3ee', c: '#7dd3fc' },
  rose:    { a: '#fb7185', c: '#fda4af' },
  mint:    { a: '#2dd4bf', c: '#a3e635' },
  rainbow: { a: '#ff3b30', c: '#af52de' },
  neon:    { a: '#00f5d4', c: '#b8ff00' },
  mono:    { a: '#f1f5f9', c: '#cbd5e1' }
};
let activeAccentKey = null;
let rainbowTimer = null;
let accentSwitchFrame = 0;

function hexToRgbStr(hex) {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}
function hslToRgbStr(h, s = 0.88, l = 0.60) {
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)].map(v => Math.round(v * 255)).join(', ');
}

function setAccentVars(aHex, cHex, glowAlpha) {
  const s = document.body.style;
  s.setProperty('--accent', hexToRgbStr(aHex));
  s.setProperty('--accent-light', hexToRgbStr(cHex));
  s.setProperty('--accent-hex', aHex);
  s.setProperty('--accent-light-hex', cHex);
  s.setProperty('--accent-glow', `rgba(${hexToRgbStr(aHex)}, ${glowAlpha})`);
  s.setProperty('--accent-card-border', `rgba(${hexToRgbStr(aHex)}, 0.18)`);
  s.setProperty('--accent-card-hover', `rgba(${hexToRgbStr(cHex)}, 0.55)`);
  s.setProperty('--accent-card-shadow', `rgba(${hexToRgbStr(aHex)}, 0.22)`);
}
function stopRainbow() {
  if (rainbowTimer) clearTimeout(rainbowTimer);
  rainbowTimer = null;
}
function startRainbow() {
  stopRainbow();
  const startedAt = performance.now();
  const tick = () => {
    if (activeAccentKey !== 'rainbow') return;
    const hue = ((performance.now() - startedAt) * 0.012) % 360;
    const a = `hsl(${hue.toFixed(1)}, 88%, 60%)`;
    const c = `hsl(${((hue + 62) % 360).toFixed(1)}, 86%, 72%)`;
    const rgbA = hslToRgbStr(hue, 0.88, 0.60);
    const rgbC = hslToRgbStr((hue + 62) % 360, 0.86, 0.72);
    const s = document.body.style;
    s.setProperty('--accent', rgbA);
    s.setProperty('--accent-light', rgbC);
    s.setProperty('--accent-hex', a);
    s.setProperty('--accent-light-hex', c);
    s.setProperty('--accent-glow', `hsla(${hue.toFixed(1)}, 88%, 60%, 0.20)`);
    s.setProperty('--accent-card-border', `rgba(${rgbA}, 0.18)`);
    s.setProperty('--accent-card-hover', `rgba(${rgbC}, 0.55)`);
    s.setProperty('--accent-card-shadow', `rgba(${rgbA}, 0.22)`);
    rainbowTimer = setTimeout(tick, 90);
  };
  tick();
}
function updateNeonAvailability() {
  const isLight = document.getElementById('app-body').classList.contains('light-mode');
  document.querySelectorAll('.swatch').forEach(sw => {
    const unavailable = sw.dataset.accent === 'neon' && isLight;
    sw.disabled = unavailable;
    sw.classList.toggle('is-unavailable', unavailable);
  });
}
function applyAccent(name, save = true) {
  const body = document.getElementById('app-body');
  if (name === 'neon' && body.classList.contains('light-mode')) name = 'sky';
  if (accentSwitchFrame) cancelAnimationFrame(accentSwitchFrame);
  body.classList.add('accent-switching');
  const c = ACCENTS[name] || ACCENTS.violet;
  activeAccentKey = ACCENTS[name] ? name : 'violet';
  stopRainbow();
  document.body.classList.toggle('accent-mono', activeAccentKey === 'mono');
  if (activeAccentKey === 'rainbow') {
    setAccentVars(c.a, c.c, 0.18);
    startRainbow();
  } else if (activeAccentKey === 'neon') {
    setAccentVars(c.a, c.c, 0.26);
  } else {
    setAccentVars(c.a, c.c, 0.18);
  }
  document.querySelectorAll('.swatch').forEach(sw => {
    sw.classList.toggle('active', sw.dataset.accent === activeAccentKey);
  });
  if (save) { try { localStorage.setItem('pmb-accent', activeAccentKey); } catch (e) {} }
  accentSwitchFrame = requestAnimationFrame(() => {
    body.classList.remove('accent-switching');
    accentSwitchFrame = 0;
  });
}
function togglePalette(e) {
  if (e) e.stopPropagation();
  const pop = document.getElementById('palettePop');
  pop.classList.toggle('open');
}
function initPalette() {
  const pop = document.getElementById('palettePop');
  pop.addEventListener('click', e => e.stopPropagation());
  document.addEventListener('click', e => {
    if (pop.classList.contains('open') && !pop.contains(e.target)) pop.classList.remove('open');
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') pop.classList.remove('open'); });
  pop.querySelectorAll('.swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      const body = document.getElementById('app-body');
      const wasMono = body.classList.contains('accent-mono');
      if (wasMono) body.classList.add('palette-switching');
      applyAccent(sw.dataset.accent);
      if (wasMono) {
        const release = () => {
          body.classList.remove('palette-switching');
          document.removeEventListener('pointermove', release, true);
        };
        document.addEventListener('pointermove', release, true);
        setTimeout(release, 350);
      }
    });
  });
  const handle = pop.querySelector('.palette-drag-handle');
  let drag = null;
  const clamp = (value, min, max) => Math.min(Math.max(value, min), Math.max(min, max));
  const setPalettePosition = (left, top) => {
    pop.style.setProperty('--palette-x', left + 'px');
    pop.style.setProperty('--palette-y', top + 'px');
  };
  const renderDrag = () => {
    if (!drag) return;
    drag.frame = 0;
    const margin = 8;
    const maxLeft = Math.max(margin, window.innerWidth - drag.width - margin);
    const maxTop = Math.max(margin, window.innerHeight - drag.height - margin);
    drag.left = clamp(drag.nextLeft, margin, maxLeft);
    drag.top = clamp(drag.nextTop, margin, maxTop);
    setPalettePosition(drag.left, drag.top);
  };
  const stopDrag = e => {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    if (drag.frame) cancelAnimationFrame(drag.frame);
    renderDrag();
    drag = null;
    pop.classList.remove('dragging');
    if (e && handle.hasPointerCapture?.(e.pointerId)) handle.releasePointerCapture(e.pointerId);
  };
  handle.addEventListener('pointerdown', e => {
    if (e.button !== undefined && e.button !== 0) return;
    const r = pop.getBoundingClientRect();
    /* Đặt bảng về gốc 0,0 rồi di chuyển bằng transform để tránh layout reflow. */
    setPalettePosition(r.left, r.top);
    pop.classList.add('positioned');
    drag = {
      id: e.pointerId,
      offsetX: e.clientX - r.left,
      offsetY: e.clientY - r.top,
      width: r.width,
      height: r.height,
      left: r.left,
      top: r.top,
      nextLeft: r.left,
      nextTop: r.top,
      frame: 0
    };
    pop.classList.add('dragging');
    try { handle.setPointerCapture(e.pointerId); } catch (err) { /* pointer đã mất: vẫn cho phép kết thúc an toàn */ }
    e.preventDefault();
  });
  handle.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    drag.nextLeft = e.clientX - drag.offsetX;
    drag.nextTop = e.clientY - drag.offsetY;
    if (!drag.frame) drag.frame = requestAnimationFrame(renderDrag);
  });
  handle.addEventListener('pointerup', stopDrag);
  handle.addEventListener('pointercancel', stopDrag);
  handle.addEventListener('lostpointercapture', () => { if (drag) stopDrag(); });
  const keepPaletteInViewport = () => {
    if (!pop.classList.contains('positioned')) return;
    const margin = 8;
    const r = pop.getBoundingClientRect();
    const maxLeft = Math.max(margin, window.innerWidth - r.width - margin);
    const maxTop = Math.max(margin, window.innerHeight - r.height - margin);
    const left = clamp(parseFloat(pop.style.getPropertyValue('--palette-x')) || r.left, margin, maxLeft);
    const top = clamp(parseFloat(pop.style.getPropertyValue('--palette-y')) || r.top, margin, maxTop);
    setPalettePosition(left, top);
  };
  window.addEventListener('resize', keepPaletteInViewport, { passive: true });
  let saved = null;
  try { saved = localStorage.getItem('pmb-accent'); } catch (e2) {}
  if (saved) applyAccent(saved, false);
  else {
    activeAccentKey = 'violet';
    document.querySelectorAll('.swatch').forEach(sw => {
      sw.classList.toggle('active', sw.dataset.accent === 'violet');
    });
  }
  updateNeonAvailability();
}
initPalette();

/* ── Cursor glow ── */
(function () {
  const glow = document.getElementById('cursorGlow');
  if (!glow || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const smooth = 0.16;
  let tx = -500, ty = -500, cx = tx, cy = ty, frame = null;
  function render() {
    cx += (tx - cx) * smooth;
    cy += (ty - cy) * smooth;
    glow.style.transform = 'translate3d(' + cx + 'px, ' + cy + 'px, 0)';
    if (Math.abs(tx - cx) > .2 || Math.abs(ty - cy) > .2) frame = requestAnimationFrame(render);
    else frame = null;
  }
  window.addEventListener('mousemove', e => {
    tx = e.clientX; ty = e.clientY;
    glow.classList.add('is-visible');
    if (!frame) frame = requestAnimationFrame(render);
  });
  document.addEventListener('mouseleave', () => glow.classList.remove('is-visible'));
})();

/* ── Navbar shadow khi cuộn ── */
window.addEventListener('scroll', () => {
  document.querySelector('nav').classList.toggle('nav-scrolled', window.scrollY > 8);
}, { passive: true });

function makeCareer(title, icon, badge, question, subtitle, benchmarks, profiles) {
  return {
    title, icon, badge, question, subtitle, benchmarks,
    options: profiles.map((p, i) => ({
      tag: p.tag,
      name: p.name,
      desc: p.desc,
      score: p.score,
      scoreLabel: p.scoreLabel,
      specs: p.specs,
      tip: p.tip,
      components: [
        { type: 'CPU', name: p.cpu, desc: 'CPU phù hợp workload ngành', price: p.cpuPrice ?? 4500000, icon: '⚡', color: 'border-l-purple-500' },
        { type: 'GPU', name: p.gpu, desc: 'GPU xử lý đồ họa và tăng tốc ứng dụng', price: p.gpuPrice ?? 7500000, icon: '🎮', color: 'border-l-indigo-500' },
        { type: 'RAM', name: p.ram, desc: 'Dung lượng RAM cho đa nhiệm và project lớn', price: p.ramPrice ?? 2800000, icon: '💾', color: 'border-l-purple-500' },
        { type: 'Storage', name: p.storage, desc: 'SSD NVMe cho project, dữ liệu và phần mềm', price: p.storagePrice ?? 2200000, icon: '💿', color: 'border-l-cyan-500' },
        { type: 'Mainboard', name: p.board, desc: 'Nền tảng ổn định, dễ nâng cấp', price: p.boardPrice ?? 3000000, icon: '🔧', color: 'border-l-pink-500' },
        { type: 'PSU', name: p.psu, desc: 'Nguồn ổn định cho hệ thống hoạt động lâu dài', price: p.psuPrice ?? 1700000, icon: '🔌', color: 'border-l-emerald-500' },
        { type: 'Cooler', name: p.cooler, desc: 'Tản nhiệt giữ xung ổn định khi chạy nặng', price: p.coolerPrice ?? 600000, icon: '🥶', color: 'border-l-cyan-500' }
      ]
    }))
  };
}
function genericProfiles(label, parts) {
  return [
    { tag: 'Cơ bản', name: `${label} Starter`, desc: `Cấu hình nhập môn cho ${label}.`, score: 7.6, scoreLabel: 'Workload cơ bản', specs: [`CPU: ${parts.cpu}`, `RAM: ${parts.ram}`, `SSD: ${parts.storage}`], tip: 'Phù hợp học tập và project quy mô nhỏ.', ...parts },
    { tag: 'Chuyên nghiệp', name: `${label} Professional`, desc: `Cấu hình cân bằng cho ${label} chuyên nghiệp.`, score: 8.8, scoreLabel: 'Workload chuyên nghiệp', specs: [`CPU: ${parts.cpu}`, `RAM: ${parts.ram}`, `GPU: ${parts.gpu}`], tip: 'Cân bằng tốt giữa hiệu năng và khả năng nâng cấp.', ...parts },
    { tag: 'Studio / Enterprise', name: `${label} Workstation`, desc: `Cấu hình cao cấp cho project lớn và chạy dài giờ.`, score: 9.5, scoreLabel: 'Workload nặng / production', specs: [`CPU: ${parts.cpu}`, `RAM: ${parts.ram}`, `GPU: ${parts.gpu}`], tip: 'RAM và SSD lớn giúp xử lý project nặng ổn định.', ...parts }
  ];
}

const careersData = {
  ai: {
    title: "AI Engineer / Deep Learning",
    icon: "🤖",
    badge: "AI & Data Science",
    question: "Ngân sách & Quy mô Model AI của bạn?",
    subtitle: "Phân khúc VRAM GPU tối ưu cho thuật toán Deep Learning & Machine Learning.",
    benchmarks: [
      { app: "Python · Jupyter · NumPy / Pandas", opt1: "🟢 Mượt", opt2: "⚡ Rất mượt", opt3: "🚀 Dữ liệu lớn" },
      { app: "PyTorch · TensorFlow · YOLO / ResNet", opt1: "🟡 Chạy model nhẹ", opt2: "🟢 Train tốt", opt3: "⚡ Train nhanh" },
      { app: "Llama 3 8B · SDXL · vLLM local", opt1: "🔴 Hạn chế VRAM", opt2: "🟡 Chạy được", opt3: "🟢 Phù hợp 24/7" }
    ],
    options: [
      {
        tag: "Giá Rẻ / Sinh Viên",
        name: "Computer Vision & Fine-Tune Nhẹ",
        desc: "Phù hợp học tập, làm đồ án tốt nghiệp, chạy model YOLO, ResNet, LLM 7B/8B Quantized.",
        score: 7.5,
        scoreLabel: "Hiệu năng học tập / Sinh viên",
        specs: ["GPU: RTX 4060 Ti 16GB VRAM", "CPU: Intel i5-13400F", "RAM: 32GB DDR5"],
        tip: "Mẹo: Bản RTX 4060 Ti 16GB VRAM là món hời lớn nhất cho sinh viên AI nhờ lượng VRAM dồi dào.",
                    components: [
          { type: 'CPU', name: 'Intel Core i5-13400F', desc: '10 nhân 16 luồng xử lý mượt dữ liệu', price: 4800000, icon: '⚡', color: 'border-l-purple-500' },
          { type: 'GPU', name: 'NVIDIA RTX 4060 Ti 16GB', desc: '16GB VRAM tốt nhất tầm giá dưới 13 triệu', price: 12500000, icon: '🎮', color: 'border-l-indigo-500' },
          { type: 'RAM', name: 'Corsair Vengeance 32GB (2x16GB) DDR5', desc: 'Xung nhịp 5600MHz load dataset nhanh', price: 2900000, icon: '💾', color: 'border-l-purple-500' },
          { type: 'Storage', name: 'Kingston KC3000 1TB NVMe PCIe 4.0', desc: 'Tốc độ đọc ghi 7000MB/s', price: 2400000, icon: '💿', color: 'border-l-amber-500' },
          { type: 'PSU', name: 'MSI MAG A750BN 750W 80+ Bronze', desc: 'Nguồn công suất thực an toàn', price: 1750000, icon: '🔌', color: 'border-l-emerald-500' },
          { type: 'Mainboard', name: 'MSI B760M GAMING PLUS WIFI', desc: 'Mainboard mATX bền bỉ', price: 3600000, icon: '🔧', color: 'border-l-pink-500' },
          { type: 'Cooler', name: 'Thermalright Assassin X 120 ARGB', desc: 'Tản tháp đơn giải nhiệt hiệu quả', price: 450000, icon: '🥶', color: 'border-l-cyan-500' }
        ]
      },
      {
        tag: "Tầm Trung / Research",
        name: "LLM Fine-Tuning & Multi-Task",
        desc: "Cấu hình tiêu chuẩn cho kỹ sư AI chuyên nghiệp: Fine-tune Llama 3, Stable Diffusion XL.",
        score: 8.8,
        scoreLabel: "Hiệu năng Nghiên cứu & Thực chiến",
        specs: ["GPU: RTX 4080 Super 16GB", "CPU: Intel i7-14700K", "RAM: 64GB DDR5"],
        tip: "Mẹo: RAM 64GB giúp xử lý tập dữ liệu tiền xử lý (Preprocessing) mượt mà không lo giật lag.",
                    components: [
          { type: 'CPU', name: 'Intel Core i7-14700K', desc: '20 nhân 28 luồng xử lý song song cực tốt', price: 10600000, icon: '⚡', color: 'border-l-purple-500' },
          { type: 'GPU', name: 'ASUS TUF RTX 4080 Super 16GB', desc: 'Xử lý CUDA & Tensor Cores cực mạnh', price: 28900000, icon: '🎮', color: 'border-l-indigo-500' },
          { type: 'RAM', name: 'G.Skill Trident Z5 64GB (2x32GB) DDR5', desc: 'Băng thông cao chống tràn RAM', price: 6200000, icon: '💾', color: 'border-l-purple-500' },
          { type: 'Storage', name: 'Samsung 990 PRO 2TB NVMe PCIe 4.0', desc: 'Tốc độ đọc ghi cực nhanh cho Dataset', price: 4900000, icon: '💿', color: 'border-l-amber-500' },
          { type: 'PSU', name: 'Corsair RM850e 850W Gold ATX 3.0', desc: 'Cung cấp điện ổn định', price: 3400000, icon: '🔌', color: 'border-l-emerald-500' },
          { type: 'Mainboard', name: 'ASUS TUF GAMING Z790-PLUS WIFI', desc: 'Bo mạch chủ Z790 cao cấp', price: 6800000, icon: '🔧', color: 'border-l-pink-500' },
          { type: 'Cooler', name: 'DeepCool LT720 360mm AIO', desc: 'Tản nước 360mm giải nhiệt i7', price: 3100000, icon: '🥶', color: 'border-l-cyan-500' }
        ]
      },
      {
        tag: "Cao Cấp / Enterprise",
        name: "VRAM 24GB & Train Model Local",
        desc: "Trạm làm việc AI đỉnh cao: Train model Local 24/7, chạy vLLM Server, xử lý Dataset khổng lồ.",
        score: 9.8,
        scoreLabel: "Hiệu năng Enterprise / Doanh nghiệp",
        specs: ["GPU: RTX 4090 24GB VRAM", "CPU: Ryzen 9 7950X", "RAM: 128GB DDR5"],
        tip: "Mẹo: RTX 4090 sở hữu 24GB VRAM chuẩn GDDR6X là GPU cá nhân duy nhất load mượt các Model lớn.",
                    components: [
          { type: 'CPU', name: 'AMD Ryzen 9 7950X', desc: '16 nhân 32 luồng xử lý thuật toán cực nhanh', price: 14800000, icon: '⚡', color: 'border-l-red-500' },
          { type: 'GPU', name: 'MSI GeForce RTX 4090 SUPRIM X 24GB', desc: 'Đỉnh cao VRAM cho Deep Learning', price: 53900000, icon: '🎮', color: 'border-l-purple-500' },
          { type: 'RAM', name: 'Corsair Vengeance 128GB (4x32GB) DDR5', desc: 'Dung lượng RAM tối đa cho Big Data', price: 12500000, icon: '💾', color: 'border-l-indigo-500' },
          { type: 'Storage', name: 'Samsung 990 PRO 2TB + WD Black 4TB', desc: 'Tổng lưu trữ 6TB tốc độ cao', price: 9800000, icon: '💿', color: 'border-l-amber-500' },
          { type: 'PSU', name: 'Corsair RM1000x Shift 1000W Gold', desc: 'Nguồn ATX 3.0 cân RTX 4090 100% load', price: 5100000, icon: '🔌', color: 'border-l-emerald-500' },
          { type: 'Mainboard', name: 'ASUS ROG STRIX X670E-F GAMING', desc: 'Mainboard cao cấp đủ làn PCIe', price: 10200000, icon: '🔧', color: 'border-l-pink-500' },
          { type: 'Cooler', name: 'NZXT Kraken Elite 360 RGB', desc: 'Tản nhiệt nước xịn nhất phân khúc', price: 7400000, icon: '🥶', color: 'border-l-cyan-500' }
        ]
      }
    ]
  },
  "3d": {
    title: "3D Designer / Animator",
    icon: "🎨",
    badge: "3D Graphics",
    question: "Ngân sách & Quy mô dự án 3D của bạn?",
    subtitle: "Cấu hình tối ưu GPU VRAM cho Render Engine Real-time & Sức mạnh dựng hình Viewport.",
    benchmarks: [
      { app: "Blender · Modeling / Viewport", opt1: "🟢 Mượt", opt2: "⚡ Rất mượt", opt3: "🚀 Scene lớn" },
      { app: "Blender Cycles · V-Ray · Corona", opt1: "🟡 Render cơ bản", opt2: "🟢 Render nhanh", opt3: "⚡ Production" },
      { app: "Unreal Engine 5 · Lumen / Nanite", opt1: "🟡 30 FPS", opt2: "🟢 60+ FPS", opt3: "⚡ Realtime nặng" }
    ],
    options: [
      {
        tag: "Giá Rẻ / Nhập Môn",
        name: "Blender & Dựng Hình Cơ Bản",
        desc: "Dành cho học viên 3D, dựng model Low-poly, Render Blender Cycles nhẹ nhàng.",
        score: 7.2,
        scoreLabel: "Khả năng Dựng hình Cơ bản",
        specs: ["GPU: RTX 3060 12GB VRAM", "CPU: Intel i5-12400F", "RAM: 32GB DDR4"],
        tip: "Mẹo: VRAM 12GB giúp bạn chứa đủ Texture mà không bị tràn bộ nhớ khi bấm Render.",
        variants: [
          { label: "Intel + ASUS + Kingston", tags: ["Intel", "ASUS", "Kingston"], components: [
            { type: 'CPU', name: 'Intel Core i5-12400F', desc: '6 nhân 12 luồng giá tốt nhất phân khúc', price: 2600000, icon: '⚡', color: 'border-l-purple-500' },
            { type: 'GPU', name: 'ASUS Dual RTX 3060 12GB OC', desc: '12GB VRAM render Blender ngon bổ rẻ', price: 7200000, icon: '🎮', color: 'border-l-indigo-500' },
            { type: 'RAM', name: 'Kingston Fury Beast 32GB (2x16GB) DDR4', desc: 'Dung lượng RAM chuẩn cho 3D cơ bản', price: 1800000, icon: '💾', color: 'border-l-purple-500' },
            { type: 'Storage', name: 'Kingston NV2 1TB NVMe PCIe 4.0', desc: 'Lưu trữ file 3D thoải mái', price: 1700000, icon: '💿', color: 'border-l-amber-500' },
            { type: 'PSU', name: 'Antec Atom V650 650W', desc: 'Nguồn công suất thực đủ dùng', price: 1100000, icon: '🔌', color: 'border-l-emerald-500' },
            { type: 'Mainboard', name: 'MSI PRO B760M-A DDR4', desc: 'Bo mạch chủ gánh i5 mượt mà', price: 2900000, icon: '🔧', color: 'border-l-pink-500' },
            { type: 'Cooler', name: 'Thermalright Assassin X 120 SE', desc: 'Tản tháp đơn êm ái', price: 350000, icon: '🥶', color: 'border-l-cyan-500' }
          ]},
          { label: "AMD + MSI + Corsair", tags: ["AMD", "MSI", "Corsair"], components: [
            { type: 'CPU', name: 'AMD Ryzen 5 5600', desc: '6 nhân 12 luồng AM4, hiệu năng ổn định', price: 2800000, icon: '⚡', color: 'border-l-red-500' },
            { type: 'GPU', name: 'MSI Gaming X RTX 3060 12GB', desc: 'Tản nhiệt TWIN FROZR 8 mạnh mẽ', price: 7500000, icon: '🎮', color: 'border-l-indigo-500' },
            { type: 'RAM', name: 'Corsair Vengeance LPX 32GB (2x16GB) DDR4', desc: 'RAM thấp profile phù hợp mọi case', price: 1750000, icon: '💾', color: 'border-l-purple-500' },
            { type: 'Storage', name: 'Crucial P5 Plus 1TB NVMe PCIe 4.0', desc: 'Tốc độ đọc 6600MB/s ổn định', price: 1600000, icon: '💿', color: 'border-l-amber-500' },
            { type: 'PSU', name: 'MSI MAG A650BN 650W 80+ Bronze', desc: 'Nguồn MSI đáng tin cậy', price: 1200000, icon: '🔌', color: 'border-l-emerald-500' },
            { type: 'Mainboard', name: 'MSI PRO B550M-VC WIFI', desc: 'Hỗ trợ AM4, có WiFi tiện lợi', price: 2500000, icon: '🔧', color: 'border-l-pink-500' },
            { type: 'Cooler', name: 'DeepCool AG400 ARGB', desc: 'Tản tháp đơn 120mm làm mát tốt', price: 500000, icon: '🥶', color: 'border-l-cyan-500' }
          ]},
          { label: "Intel + Gigabyte + G.Skill", tags: ["Intel", "Gigabyte", "G.Skill"], components: [
            { type: 'CPU', name: 'Intel Core i5-13400F', desc: '10 nhân 16 luồng mạnh hơn gen trước', price: 4800000, icon: '⚡', color: 'border-l-purple-500' },
            { type: 'GPU', name: 'Gigabyte RTX 3060 Gaming OC 12GB', desc: 'WINDFORCE 3X làm mát ổn định', price: 7300000, icon: '🎮', color: 'border-l-indigo-500' },
            { type: 'RAM', name: 'G.Skill Ripjaws V 32GB (2x16GB) DDR4', desc: 'RAM hiệu năng cao, thiết kế thấp', price: 1700000, icon: '💾', color: 'border-l-purple-500' },
            { type: 'Storage', name: 'WD Blue SN580 1TB NVMe PCIe 4.0', desc: 'Đọc 4150MB/s giá tốt nhất', price: 1500000, icon: '💿', color: 'border-l-amber-500' },
            { type: 'PSU', name: 'Gigabyte GP-P650B 650W 80+ Bronze', desc: 'Nguồn Gigabyte bảo vệ đa lớp', price: 1500000, icon: '🔌', color: 'border-l-emerald-500' },
            { type: 'Mainboard', name: 'Gigabyte B760M DS3H DDR4', desc: 'Bo mạch mATX cơ bản ổn định', price: 2600000, icon: '🔧', color: 'border-l-pink-500' },
            { type: 'Cooler', name: 'ID-Cooling SE-214-XT ARGB', desc: 'Tản tháp 4 ống đồng giá rẻ', price: 400000, icon: '🥶', color: 'border-l-cyan-500' }
          ]},
          { label: "AMD + Zotac + TeamGroup", tags: ["AMD", "Zotac", "TeamGroup"], components: [
            { type: 'CPU', name: 'AMD Ryzen 5 5600X', desc: '6 nhân xung boost 4.6GHz mượt 3D', price: 3200000, icon: '⚡', color: 'border-l-red-500' },
            { type: 'GPU', name: 'Zotac Gaming RTX 3060 12GB AMP', desc: 'Thiết kế IceStorm 2.0 compact hiệu quả', price: 7100000, icon: '🎮', color: 'border-l-indigo-500' },
            { type: 'RAM', name: 'TeamGroup T-Force Vulcan 32GB (2x16GB) DDR4', desc: 'Xung 3600MHz tốt cho Ryzen', price: 1650000, icon: '💾', color: 'border-l-purple-500' },
            { type: 'Storage', name: 'Kingston NV2 1TB NVMe PCIe 4.0', desc: 'Tốc độ đọc 3500MB/s giá hợp lý', price: 1700000, icon: '💿', color: 'border-l-amber-500' },
            { type: 'PSU', name: 'Cooler Master MWE Bronze 650W V2', desc: 'Nguồn 80+ Bronze bền bỉ', price: 1300000, icon: '🔌', color: 'border-l-emerald-500' },
            { type: 'Mainboard', name: 'ASRock B550M Pro4', desc: 'Full feature B550 mATX tốt nhất tầm giá', price: 2400000, icon: '🔧', color: 'border-l-pink-500' },
            { type: 'Cooler', name: 'Thermalright Peerless Assassin 120 SE', desc: 'Tản tháp đôi hiệu năng phân khúc vô địch', price: 650000, icon: '🥶', color: 'border-l-cyan-500' }
          ]},
          { label: "Intel + PowerColor + Crucial", tags: ["Intel", "PowerColor", "Crucial"], components: [
            { type: 'CPU', name: 'Intel Core i5-12500', desc: '6 nhân 12 luồng có iGPU dự phòng', price: 3100000, icon: '⚡', color: 'border-l-purple-500' },
            { type: 'GPU', name: 'PowerColor Hellhound RX 7600 8GB', desc: 'RX 7600 chiến game 1080p mát mẻ, êm ái', price: 7500000, icon: '🎮', color: 'border-l-indigo-500' },
            { type: 'RAM', name: 'Crucial Ballistix 32GB (2x16GB) DDR4 3200', desc: 'RAM ổn định, nhiệt độ thấp', price: 1600000, icon: '💾', color: 'border-l-purple-500' },
            { type: 'Storage', name: 'Crucial P3 Plus 1TB NVMe PCIe 4.0', desc: 'Tốc độ 5000MB/s giá cực tốt', price: 1450000, icon: '💿', color: 'border-l-amber-500' },
            { type: 'PSU', name: 'Seasonic Focus GX-650 650W Gold', desc: 'Nguồn 80+ Gold bền bỉ nhất phân khúc', price: 2100000, icon: '🔌', color: 'border-l-emerald-500' },
            { type: 'Mainboard', name: 'ASRock B760M-HDV/M.2 D4', desc: 'Bo mạch tối giản tiết kiệm chi phí', price: 2200000, icon: '🔧', color: 'border-l-pink-500' },
            { type: 'Cooler', name: 'be quiet! Pure Rock 2', desc: 'Tản tháp Đức êm ái và ổn định', price: 600000, icon: '🥶', color: 'border-l-cyan-500' }
          ]}
        ],
        components: [
          { type: 'CPU', name: 'Intel Core i5-12400F', desc: '6 nhân 12 luồng giá tốt', price: 2600000, icon: '⚡', color: 'border-l-purple-500' },
          { type: 'GPU', name: 'ASUS Dual RTX 3060 12GB', desc: '12GB VRAM render Blender ngon bổ rẻ', price: 7200000, icon: '🎮', color: 'border-l-indigo-500' },
          { type: 'RAM', name: 'Kingston Fury Beast 32GB (2x16GB) DDR4', desc: 'Dung lượng RAM chuẩn cho 3D cơ bản', price: 1800000, icon: '💾', color: 'border-l-purple-500' },
          { type: 'Storage', name: 'Kingston NV2 1TB NVMe PCIe 4.0', desc: 'Lưu trữ file 3D thoải mái', price: 1700000, icon: '💿', color: 'border-l-amber-500' },
          { type: 'PSU', name: 'Antec Atom V650 650W', desc: 'Nguồn công suất thực đủ dùng', price: 1100000, icon: '🔌', color: 'border-l-emerald-500' },
          { type: 'Mainboard', name: 'MSI PRO B760M-A DDR4', desc: 'Bo mạch chủ gánh i5 mượt mà', price: 2900000, icon: '🔧', color: 'border-l-pink-500' },
          { type: 'Cooler', name: 'Thermalright Assassin X 120 SE', desc: 'Tản tháp đơn êm ái', price: 350000, icon: '🥶', color: 'border-l-cyan-500' }
        ]
      },
      {
        tag: "Tầm Trung / Chuyên Nghiệp",
        name: "Unreal Engine 5 & ArchViz",
        desc: "Dựng kiến trúc, diễn họa 3D, Unreal Engine 5 Nanite/Lumen, 3ds Max + V-Ray.",
        score: 8.6,
        scoreLabel: "Khả năng Diễn họa & ArchViz",
        specs: ["GPU: RTX 4070 Ti Super 16GB", "CPU: Intel i7-14700K", "RAM: 64GB DDR5"],
        tip: "Mẹo: RTX 4070 Ti Super sở hữu 16GB VRAM bus 256-bit render nhanh hơn hẳn bản tiêu chuẩn.",
        components: [
          { type: 'CPU', name: 'Intel Core i7-14700K', desc: '20 nhân render CPU & Preview Viewport nhanh', price: 10600000, icon: '⚡', color: 'border-l-purple-500' },
          { type: 'GPU', name: 'GIGABYTE RTX 4070 Ti Super 16GB', desc: 'Render Octane / Redshift / UE5 siêu mượt', price: 23500000, icon: '🎮', color: 'border-l-indigo-500' },
          { type: 'RAM', name: 'Corsair Vengeance 64GB (2x32GB) DDR5', desc: 'Xử lý file cảnh phức tạp', price: 5800000, icon: '💾', color: 'border-l-purple-500' },
          { type: 'Storage', name: 'Kingston KC3000 2TB PCIe 4.0 NVMe', desc: 'Lưu cache & texture dự án nặng', price: 4200000, icon: '💿', color: 'border-l-amber-500' },
          { type: 'PSU', name: 'Corsair RM850e 850W Gold', desc: 'Nguồn chuẩn ATX 3.0 cấp điện GPU', price: 3400000, icon: '🔌', color: 'border-l-emerald-500' },
          { type: 'Mainboard', name: 'MSI MAG Z790 TOMAHAWK WIFI', desc: 'Bo mạch chủ dòng Z siêu bền', price: 7200000, icon: '🔧', color: 'border-l-pink-500' },
          { type: 'Cooler', name: 'DeepCool LT720 360mm AIO', desc: 'Giữ mát CPU khi treo render liên tục', price: 3100000, icon: '🥶', color: 'border-l-cyan-500' }
        ]
      },
      {
        tag: "Cao Cấp / Studio AAA",
        name: "Hollywood CGI & Virtual Production",
        desc: "Dành cho Studio 3D chuyên nghiệp, làm phim kĩ xảo CGI, Unreal Engine 5 Virtual Set.",
        score: 9.7,
        scoreLabel: "Khả năng Kỹ xảo Điện ảnh",
        specs: ["GPU: RTX 4090 24GB", "CPU: Ryzen 9 7950X3D", "RAM: 128GB DDR5"],
        tip: "Mẹo: Ryzen 9 7950X3D kết hợp RTX 4090 là cỗ máy dựng hình & render mạnh nhất hiện tại.",
        components: [
          { type: 'CPU', name: 'AMD Ryzen 9 7950X3D', desc: 'Công nghệ 3D V-Cache mượt Viewport UE5', price: 16500000, icon: '⚡', color: 'border-l-red-500' },
          { type: 'GPU', name: 'ASUS ROG Strix RTX 4090 24GB', desc: 'Card đồ họa khủng nhất thế giới', price: 56900000, icon: '🎮', color: 'border-l-purple-500' },
          { type: 'RAM', name: 'G.Skill Trident Z5 128GB (4x32GB) DDR5', desc: 'Dung lượng khổng lồ không lo crash', price: 12800000, icon: '💾', color: 'border-l-indigo-500' },
          { type: 'Storage', name: 'Samsung 990 PRO 4TB PCIe 4.0 NVMe', desc: 'Tốc độ đọc 7450MB/s', price: 9200000, icon: '💿', color: 'border-l-amber-500' },
          { type: 'PSU', name: 'Super Flower Leadex VII Gold 1000W', desc: 'Nguồn chuẩn ATX 3.0 an toàn tuyệt đối', price: 4600000, icon: '🔌', color: 'border-l-emerald-500' },
          { type: 'Mainboard', name: 'GIGABYTE X670E AORUS MASTER', desc: 'Bo mạch chủ Flagship', price: 11500000, icon: '🔧', color: 'border-l-pink-500' },
          { type: 'Cooler', name: 'NZXT Kraken Elite 360 RGB', desc: 'Màn hình LCD theo dõi nhiệt độ GPU/CPU', price: 7400000, icon: '🥶', color: 'border-l-cyan-500' }
        ]
      }
    ]
  },
  editor: {
    title: "Video Editor / Filmmaker",
    icon: "🎬",
    badge: "Video Editing",
    question: "Ngân sách & Độ phân giải Video của bạn?",
    subtitle: "Tối ưu hóa băng thông SSD NVMe Gen4 & Khả năng Preview Timeline Premiere/DaVinci.",
    benchmarks: [
      { app: "CapCut PC & Premiere Full HD/4K Nhẹ", opt1: "🟢 Recommended (Mượt 60fps)", opt2: "⚡ Ultra", opt3: "🚀 Overkill" },
      { app: "DaVinci Resolve 4K RAW & Color", opt1: "🟡 Minimum (Xem nhẹ)", opt2: "🟢 Recommended (Chuyên nghiệp)", opt3: "⚡ Ultra (Render cực tốc)" },
      { app: "Premiere Pro / After Effects 8K VFX", opt1: "🔴 Không khuyến nghị", opt2: "🟡 Minimum (File vừa)", opt3: "🟢 Recommended (Production Studio)" }
    ],
    options: [
      {
        tag: "Giá Rẻ / TikToker",
        name: "Dựng Video Full HD - 4K Nhẹ",
        desc: "Dành cho Content Creator, TikToker, YouTuber dựng CapCut PC, Premiere Pro Full HD.",
        score: 7.4,
        scoreLabel: "Khả năng Dựng Video Ngắn",
        specs: ["GPU: RTX 3060 12GB", "CPU: Intel Core i5-13400", "RAM: 32GB DDR4"],
        tip: "Mẹo: Chọn CPU có đuôi non-F (i5-13400) để tận dụng nhân đồ họa iGPU Intel QuickSync decode video rất mượt.",
        components: [
          { type: 'CPU', name: 'Intel Core i5-13400 (Có iGPU)', desc: 'Tích hợp Intel QuickSync preview mượt', price: 5200000, icon: '⚡', color: 'border-l-purple-500' },
          { type: 'GPU', name: 'ASUS Dual RTX 3060 12GB', desc: '12GB VRAM render video 4K không trễ', price: 7200000, icon: '🎮', color: 'border-l-indigo-500' },
          { type: 'RAM', name: 'Kingston Fury Beast 32GB (2x16GB) DDR4', desc: 'Đủ dung lượng dựng Premiere & After Effects', price: 1800000, icon: '💾', color: 'border-l-purple-500' },
          { type: 'Storage', name: 'Samsung 980 PRO 1TB NVMe Gen4', desc: 'Đọc/ghi mượt mà file footage', price: 2600000, icon: '💿', color: 'border-l-amber-500' },
          { type: 'PSU', name: 'Cooler Master MWE Gold 650W', desc: 'Nguồn chuẩn 80 Plus Gold', price: 2100000, icon: '🔌', color: 'border-l-emerald-500' },
          { type: 'Mainboard', name: 'MSI B760M GAMING PLUS', desc: 'Mainboard mATX chắc chắn', price: 3400000, icon: '🔧', color: 'border-l-pink-500' },
          { type: 'Cooler', name: 'Thermalright Assassin X 120 SE', desc: 'Tản tháp giải nhiệt tốt', price: 350000, icon: '🥶', color: 'border-l-cyan-500' }
        ]
      },
      {
        tag: "Tầm Trung / Filmmaker",
        name: "Phim Ngắn 4K RAW & Color Grading",
        desc: "Dựng phim ngắn, MV ca nhạc, Chỉnh màu DaVinci Resolve Studio, file ProRes / BRAW 4K.",
        score: 8.7,
        scoreLabel: "Khả năng Dựng Phim 4K Chuyên Nghiệp",
        specs: ["GPU: RTX 4070 Super 12GB", "CPU: Intel i7-14700K", "RAM: 64GB DDR5"],
        tip: "Mẹo: 64GB RAM DDR5 giúp bạn vừa phát Preview vừa bật After Effects làm hiệu ứng không giật lag.",
        components: [
          { type: 'CPU', name: 'Intel Core i7-14700K', desc: '20 nhân 28 luồng xử lý xuất file tốc độ', price: 10600000, icon: '⚡', color: 'border-l-purple-500' },
          { type: 'GPU', name: 'ASUS Dual RTX 4070 Super 12GB', desc: '12GB VRAM gánh mượt DaVinci Resolve', price: 17800000, icon: '🎮', color: 'border-l-indigo-500' },
          { type: 'RAM', name: 'Kingston Fury Beast 64GB (2x32GB) DDR5', desc: 'Dung lượng RAM chuẩn dựng 4K RAW', price: 5600000, icon: '💾', color: 'border-l-purple-500' },
          { type: 'Storage', name: 'Samsung 990 PRO 2TB NVMe Gen4', desc: 'Tốc độ ghi siêu cao cho footage 4K', price: 4900000, icon: '💿', color: 'border-l-amber-500' },
          { type: 'PSU', name: 'MSI MAG A850GL 850W Gold', desc: 'Cung cấp nguồn ổn định 24/7', price: 3100000, icon: '🔌', color: 'border-l-emerald-500' },
          { type: 'Mainboard', name: 'ASUS TUF GAMING Z790-PLUS WIFI', desc: 'Cổng Thunderbolt & USB3.2 truyền dữ liệu fast', price: 6800000, icon: '🔧', color: 'border-l-pink-500' },
          { type: 'Cooler', name: 'DeepCool LT720 360mm AIO', desc: 'Giữ CPU luôn mát khi Render video dài', price: 3100000, icon: '🥶', color: 'border-l-cyan-500' }
        ]
      },
      {
        tag: "Cao Cấp / Production",
        name: "Phim Điện Ảnh 8K & VFX Studio",
        desc: "Phim chiếu rạp 8K RAW, Color Grading chuyên nghiệp, VFX kĩ xảo nặng After Effects.",
        score: 9.6,
        scoreLabel: "Khả năng Dựng Phim 8K & VFX",
        specs: ["GPU: RTX 4090 24GB", "CPU: Intel i9-14900K", "RAM: 128GB DDR5"],
        tip: "Mẹo: Mới nhất 2026, cấu hình i9-14900K + RTX 4090 + 128GB RAM là tiêu chuẩn của các Production House.",
        components: [
          { type: 'CPU', name: 'Intel Core i9-14900K', desc: '24 nhân 32 luồng xử lý xuất file khủng nhất', price: 14500000, icon: '⚡', color: 'border-l-purple-500' },
          { type: 'GPU', name: 'MSI RTX 4090 SUPRIM X 24GB', desc: '24GB VRAM cho dự án phim 8K RAW', price: 53900000, icon: '🎮', color: 'border-l-indigo-500' },
          { type: 'RAM', name: 'Corsair Vengeance 128GB (4x32GB) DDR5', desc: 'RAM max option chống tụt khung hình', price: 12500000, icon: '💾', color: 'border-l-purple-500' },
          { type: 'Storage', name: 'Samsung 990 PRO 2TB x2 (RAID 0 4TB)', desc: 'Tốc độ đọc lên tới 14.000 MB/s', price: 9800000, icon: '💿', color: 'border-l-amber-500' },
          { type: 'PSU', name: 'Corsair RM1000x Shift 1000W Gold', desc: 'Nguồn chuẩn ATX 3.0 cao cấp', price: 5100000, icon: '🔌', color: 'border-l-emerald-500' },
          { type: 'Mainboard', name: 'ASUS ROG MAXIMUS Z790 HERO', desc: 'Mainboard cao cấp nhất cho i9', price: 15800000, icon: '🔧', color: 'border-l-pink-500' },
          { type: 'Cooler', name: 'NZXT Kraken Elite 360 RGB', desc: 'Tản nước cao cấp giữ CPU ổn định', price: 7400000, icon: '🥶', color: 'border-l-cyan-500' }
        ]
      }
    ]
  },
  streamer: {
    title: "Professional Streamer / Gamer",
    icon: "🎮",
    badge: "Gaming & Streaming",
    question: "Ngân sách & Nhu cầu chơi Game / Stream của bạn?",
    subtitle: "Lựa chọn cấu hình phù hợp từ chơi game Esports 1080p đến Stream 4K chuyên nghiệp.",
    benchmarks: [
      { app: "Esports 1080p (Valorant / CS2 / LoL)", opt1: "🟢 Recommended (200+ FPS)", opt2: "⚡ Ultra (300+ FPS)", opt3: "🚀 Overkill" },
      { app: "Game AAA 2K & Livestream OBS 1080p", opt1: "🟡 Minimum (Thấp/Vừa)", opt2: "🟢 Recommended (60+ FPS)", opt3: "⚡ Ultra (High FPS)" },
      { app: "Game AAA 4K Max Ray Tracing & Stream 4K", opt1: "🔴 Không phù hợp", opt2: "🟡 Minimum (DLSS On)", opt3: "🟢 Recommended (Max Performance)" }
    ],
    options: [
      {
        tag: "Giá Rẻ / Nhập Môn",
        name: "Esports & Gaming 1080p Tối Ưu",
        desc: "Chiến mượt các game Esports (Valorant, CS2, LoL, FC Online) và Stream 720p/1080p nhẹ nhàng.",
        score: 7.0,
        scoreLabel: "Hiệu năng Game Esports & Stream nhẹ",
        specs: ["GPU: RTX 3060 12GB VRAM", "CPU: Intel Core i5-12400F", "RAM: 16GB DDR4 3200MHz"],
        tip: "Mẹo: VRAM 12GB của RTX 3060 giúp bạn chơi game thế giới mở rất thoải mái mà không lo tràn bộ nhớ đồ họa.",
        components: [
          { type: 'CPU', name: 'Intel Core i5-12400F', desc: '6 nhân 12 luồng quốc dân cho game thủ', price: 2600000, icon: '⚡', color: 'border-l-purple-500' },
          { type: 'GPU', name: 'ASUS Dual GeForce RTX 3060 12GB', desc: 'Xử lý hình ảnh game 1080p mượt mà', price: 7200000, icon: '🎮', color: 'border-l-indigo-500' },
          { type: 'RAM', name: 'Kingston Fury Beast 16GB (2x8GB) DDR4', desc: 'Đủ dung lượng cho các game Esports', price: 950000, icon: '💾', color: 'border-l-purple-500' },
          { type: 'Storage', name: 'Kingston NV2 500GB NVMe PCIe 4.0', desc: 'Tốc độ khởi động game cực nhanh', price: 1150000, icon: '💿', color: 'border-l-amber-500' },
          { type: 'PSU', name: 'Antec Atom V550 550W', desc: 'Nguồn công suất thực đủ dùng', price: 750000, icon: '🔌', color: 'border-l-emerald-500' },
          { type: 'Mainboard', name: 'MSI PRO H610M-E DDR4', desc: 'Bo mạch chủ giá rẻ bền bỉ', price: 1850000, icon: '🔧', color: 'border-l-pink-500' },
          { type: 'Cooler', name: 'Thermalright Assassin X 120 Refined SE', desc: 'Tản tháp đơn mát mẻ êm ái', price: 350000, icon: '🥶', color: 'border-l-cyan-500' }
        ]
      },
      {
        tag: "Tầm Trung / Phổ Biến",
        name: "Gaming 2K & Stream Full HD Mượt Mà",
        desc: "Chiến mượt các tựa game AAA ở độ phân giải 2K, hỗ trợ mã hóa NVENC livestream 1080p60fps.",
        score: 8.4,
        scoreLabel: "Hiệu năng Game 2K & Livestream chuẩn",
        specs: ["GPU: RTX 4060 Ti 8GB", "CPU: AMD Ryzen 5 7600X", "RAM: 32GB DDR5 Bus 6000"],
        tip: "Mẹo: Card đồ họa RTX 40-series hỗ trợ công nghệ DLSS 3 Frame Generation giúp nhân đôi FPS trong game.",
        components: [
          { type: 'CPU', name: 'AMD Ryzen 5 7600X (Box)', desc: '6 nhân 12 luồng xung nhịp cao kéo FPS mượt', price: 5200000, icon: '⚡', color: 'border-l-red-500' },
          { type: 'GPU', name: 'GIGABYTE RTX 4060 Ti Gaming OC 8GB', desc: 'Cân mượt game 2K & mã hóa Stream sắc nét', price: 11200000, icon: '🎮', color: 'border-l-purple-500' },
          { type: 'RAM', name: 'Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000', desc: 'Chuẩn DDR5 thế hệ mới băng thông cao', price: 3500000, icon: '💾', color: 'border-l-indigo-500' },
          { type: 'Storage', name: 'WD Black SN850X 1TB NVMe PCIe 4.0', desc: 'Tốc độ đọc ghi 7300MB/s load game chớp mắt', price: 2800000, icon: '💿', color: 'border-l-amber-500' },
          { type: 'PSU', name: 'Corsair RM750e 750W 80+ Gold', desc: 'Chuẩn ATX 3.0 an tâm vận hành dài lâu', price: 2800000, icon: '🔌', color: 'border-l-emerald-500' },
          { type: 'Mainboard', name: 'MSI MAG B650M MORTAR WIFI', desc: 'Tản nhiệt VRM xịn cáng tốt dòng Ryzen 7000', price: 4300000, icon: '🔧', color: 'border-l-pink-500' },
          { type: 'Cooler', name: 'Thermalright Peerless Assassin 120 SE', desc: 'Tản khí tháp đôi hiệu năng phân khúc vô địch', price: 950000, icon: '🥶', color: 'border-l-cyan-500' }
        ]
      },
      {
        tag: "Cao Cấp / Hardcore",
        name: "Vua Gaming 4K & Stream Chuyên Nghiệp",
        desc: "Trải nghiệm max setting mọi game AAA ở độ phân giải 4K, Stream đa nền tảng không sụt FPS.",
        score: 9.5,
        scoreLabel: "Hiệu năng Game 4K Max Settings",
        specs: ["GPU: RTX 4080 Super 16GB", "CPU: Ryzen 7 7800X3D", "RAM: 32GB DDR5 6000MHz"],
        tip: "Mẹo: Ryzen 7 7800X3D kết hợp RTX 4080 Super là combo chuẩn mực cao cấp nhất để thi đấu Esports & Stream chuyên nghiệp.",
        components: [
          { type: 'CPU', name: 'AMD Ryzen 7 7800X3D', desc: 'CPU Gaming mạnh nhất hiện tại với 3D V-Cache', price: 10200000, icon: '⚡', color: 'border-l-red-500' },
          { type: 'GPU', name: 'ASUS TUF Gaming RTX 4080 Super 16GB', desc: 'Sức mạnh đồ họa đỉnh cao cân mọi tựa game 4K', price: 28900000, icon: '🎮', color: 'border-l-purple-500' },
          { type: 'RAM', name: 'G.Skill Trident Z5 RGB 32GB (2x16GB) DDR5 6000', desc: 'Tốc độ xung nhịp cực cao kèm LED RGB', price: 3800000, icon: '💾', color: 'border-l-indigo-500' },
          { type: 'Storage', name: 'Samsung 990 PRO 2TB NVMe PCIe 4.0', desc: 'Dung lượng 2TB chứa hàng chục game AAA nặng', price: 4900000, icon: '💿', color: 'border-l-amber-500' },
          { type: 'PSU', name: 'Corsair RM850x Shift 850W 80+ Gold', desc: 'Cung cấp nguồn chuẩn PCIe 5.0 xịn đét', price: 3900000, icon: '🔌', color: 'border-l-emerald-500' },
          { type: 'Mainboard', name: 'MSI MAG B650 TOMAHAWK WIFI', desc: 'Dòng bo mạch chủ cao cấp cực kỳ ổn định', price: 5600000, icon: '🔧', color: 'border-l-pink-500' },
          { type: 'Cooler', name: 'DeepCool LT720 360mm AIO Liquid', desc: 'Tản nhiệt nước 360mm làm mát tối ưu', price: 3100000, icon: '🥶', color: 'border-l-cyan-500' }
        ]
      }
    ]
  },
  coder: {
    title: "Coder / Software Developer",
    icon: "💻",
    badge: "Coding & Dev",
    question: "Ngân sách & Môi trường Lập trình của bạn?",
    subtitle: "Cấu hình tối ưu dung lượng RAM cho Docker Container, Virtual Machine & Tốc độ Compile Code.",
    benchmarks: [
      { app: "Python · VS Code · Jupyter · Django", opt1: "🟢 Mượt", opt2: "⚡ Rất mượt", opt3: "🚀 Đa project" },
      { app: "C++ / Java / C# · Compile & IDE", opt1: "🟡 Build cơ bản", opt2: "🟢 Build nhanh", opt3: "⚡ Build project lớn" },
      { app: "Docker · Android Studio · WSL2 / Linux", opt1: "🟡 Ít container", opt2: "🟢 Chạy êm", opt3: "⚡ Multi-container / K8s" }
    ],
    options: [
      {
        tag: "Giá Rẻ / Sinh Viên",
        name: "Lập Trình Web / Mobile App Basic",
        desc: "Chạy VS Code, Android Studio nhẹ, NodeJS, React, Python script cơ bản.",
        score: 7.3,
        scoreLabel: "Khả năng Lập trình Cơ bản & Web",
        specs: ["GPU: RTX 3050 6GB", "CPU: Intel i5-12400", "RAM: 16GB - 32GB DDR4"],
        tip: "Mẹo: Nên nâng ngay lên 32GB RAM để chạy Android Emulator không bị đứng máy.",
        components: [
          { type: 'CPU', name: 'Intel Core i5-12400 (Có iGPU)', desc: '6 nhân 12 luồng compile code nhanh', price: 3400000, icon: '⚡', color: 'border-l-purple-500' },
          { type: 'GPU', name: 'Palit StormX RTX 3050 6GB', desc: 'Card rời CUDA, tăng tốc render preview & AI nhẹ', price: 4800000, icon: '🎮', color: 'border-l-indigo-500' },
          { type: 'RAM', name: 'Kingston Fury Beast 32GB (2x16GB) DDR4', desc: 'Chạy tab Chrome & IDE nhẹ nhàng', price: 1800000, icon: '💾', color: 'border-l-purple-500' },
          { type: 'Storage', name: 'Kingston NV2 1TB NVMe PCIe 4.0', desc: 'Khởi động máy & load dự án nhanh', price: 1700000, icon: '💿', color: 'border-l-amber-500' },
          { type: 'PSU', name: 'Antec Atom V550 550W', desc: 'Nguồn công suất thực bền bỉ', price: 750000, icon: '🔌', color: 'border-l-emerald-500' },
          { type: 'Mainboard', name: 'MSI PRO B760M-E DDR4', desc: 'Mainboard giá tốt hỗ trợ đầy đủ', price: 2300000, icon: '🔧', color: 'border-l-pink-500' },
          { type: 'Cooler', name: 'Thermalright Assassin X 120 SE', desc: 'Tản tháp giải nhiệt êm ái', price: 350000, icon: '🥶', color: 'border-l-cyan-500' }
        ]
      },
      {
        tag: "Tầm Trung / Fullstack",
        name: "Microservices, Docker & K8s",
        desc: "Chạy đồng thời nhiều Docker Container, Máy ảo Linux, Kubernetes Cluster Local, IntelliJ.",
        score: 8.6,
        scoreLabel: "Khả năng Đa nhiệm & Docker/VM",
        specs: ["GPU: RTX 3050 6GB", "CPU: Intel i7-14700", "RAM: 64GB DDR5"],
        tip: "Mẹo: 64GB RAM là chuẩn vàng cho Backend / DevOps Engineer làm việc chuyên nghiệp.",
        components: [
          { type: 'CPU', name: 'Intel Core i7-14700 (Non-K)', desc: '20 nhân 28 luồng compile code cực nhanh', price: 9800000, icon: '⚡', color: 'border-l-purple-500' },
          { type: 'GPU', name: 'ASUS Phoenix RTX 3050 6GB', desc: 'Xuất 3-4 màn hình lập trình đa nhiệm', price: 4600000, icon: '🎮', color: 'border-l-indigo-500' },
          { type: 'RAM', name: 'Corsair Vengeance 64GB (2x32GB) DDR5', desc: 'Chạy Docker, Database local thả ga', price: 5800000, icon: '💾', color: 'border-l-purple-500' },
          { type: 'Storage', name: 'Kingston KC3000 1TB NVMe PCIe 4.0', desc: 'Tốc độ đọc ghi build project chớp mắt', price: 2400000, icon: '💿', color: 'border-l-amber-500' },
          { type: 'PSU', name: 'Cooler Master MWE Gold 650W', desc: 'Tiết kiệm điện chạy liên tục', price: 2100000, icon: '🔌', color: 'border-l-emerald-500' },
          { type: 'Mainboard', name: 'ASRock B760 Pro RS DDR5', desc: 'Full-size ATX hỗ trợ nâng cấp', price: 3800000, icon: '🔧', color: 'border-l-pink-500' },
          { type: 'Cooler', name: 'DeepCool AG620 ARGB', desc: 'Tản nhiệt khí hiệu năng cao', price: 1200000, icon: '🥶', color: 'border-l-cyan-500' }
        ]
      },
      {
        tag: "Cao Cấp / Senior Lead",
        name: "Virtualization & Heavy Compile",
        desc: "Dành cho System Architect, Lead Dev build source code siêu khủng (Linux Kernel, C++, Game Engine).",
        score: 9.6,
        scoreLabel: "Khả năng Compile Siêu tốc & Hệ thống Lớn",
        specs: ["GPU: RTX 4070 12GB", "CPU: Ryzen 9 7950X", "RAM: 128GB DDR5"],
        tip: "Mẹo: Ryzen 9 7950X có 16 nhân thực 32 luồng xử lý các job compile song song nhanh nhất hiện tại.",
        components: [
          { type: 'CPU', name: 'AMD Ryzen 9 7950X', desc: '16 nhân 32 luồng compile code cực tốc', price: 14800000, icon: '⚡', color: 'border-l-red-500' },
          { type: 'GPU', name: 'ASUS Dual RTX 4070 12GB', desc: 'Xuất nhiều màn hình 4K sắc nét', price: 16200000, icon: '🎮', color: 'border-l-indigo-500' },
          { type: 'RAM', name: 'Corsair Vengeance 128GB (4x32GB) DDR5', desc: 'Chạy hàng chục VM cùng lúc', price: 12500000, icon: '💾', color: 'border-l-purple-500' },
          { type: 'Storage', name: 'Samsung 990 PRO 2TB NVMe Gen4', desc: 'Tốc độ đọc ghi 7450MB/s cực đỉnh', price: 4900000, icon: '💿', color: 'border-l-amber-500' },
          { type: 'PSU', name: 'Corsair RM850e 850W Gold', desc: 'Nguồn chuẩn ATX 3.0', price: 3400000, icon: '🔌', color: 'border-l-emerald-500' },
          { type: 'Mainboard', name: 'MSI MAG X670E TOMAHAWK WIFI', desc: 'Bo mạch chủ cao cấp cho Ryzen 9', price: 8200000, icon: '🔧', color: 'border-l-pink-500' },
          { type: 'Cooler', name: 'DeepCool LT720 360mm AIO', desc: 'Tản nước giữ CPU luôn mát mẻ', price: 3100000, icon: '🥶', color: 'border-l-cyan-500' }
        ]
      }
    ]
  },
  office: {
    title: "Office Worker / Student",
    icon: "📚",
    badge: "Office & Study",
    question: "Ngân sách & Nhu cầu Văn phòng / Học tập?",
    subtitle: "Máy tính bền bỉ, mượt mà, tiết kiệm điện năng và tối ưu chi phí.",
    benchmarks: [
      { app: "Word · Excel · PowerPoint · Google Docs", opt1: "🟢 Mượt", opt2: "⚡ Rất mượt", opt3: "🚀 Dư sức" },
      { app: "Zoom · Teams · Meet · đa nhiệm trình duyệt", opt1: "🟢 Ổn định", opt2: "⚡ Nhiều tab", opt3: "🚀 Đa màn hình" },
      { app: "Excel Pivot · Power BI · Photoshop nhẹ", opt1: "🟡 Cơ bản", opt2: "🟢 Tốt", opt3: "⚡ Dữ liệu lớn" }
    ],
    options: [
      {
        tag: "Giá Rẻ / Tiết Kiệm",
        name: "Học Tập & Văn Phòng Cơ Bản",
        desc: "Soạn thảo Word, Excel, PowerPoint, học Zoom, lướt web hàng chục tab nhẹ nhàng.",
        score: 7.5,
        scoreLabel: "Độ mượt mà Tác vụ Văn phòng",
        specs: ["CPU: Core i3-12100", "RAM: 16GB DDR4", "SSD: 500GB NVMe"],
        tip: "Mẹo: Cấu hình nhỏ gọn, tiết kiệm điện, mượt mà cho mọi tác vụ học tập văn phòng.",
        components: [
          { type: 'CPU', name: 'Intel Core i3-12100 (Có iGPU)', desc: '4 nhân 8 luồng mượt mà', price: 2700000, icon: '⚡', color: 'border-l-purple-500' },
          { type: 'GPU', name: 'PowerColor Fighter RX 6400 4GB', desc: 'Card rời gọn nhẹ, xuất 2 màn hình 4K mượt', price: 3500000, icon: '🎮', color: 'border-l-indigo-500' },
          { type: 'RAM', name: 'Kingston Fury Beast 16GB (2x8GB) DDR4', desc: 'RAM dư dả cho tab Chrome', price: 950000, icon: '💾', color: 'border-l-indigo-500' },
          { type: 'Storage', name: 'Kingston NV2 500GB NVMe PCIe 4.0', desc: 'Khởi động Windows trong 5 giây', price: 1150000, icon: '💿', color: 'border-l-amber-500' },
          { type: 'PSU', name: 'Antec Atom V550 550W', desc: 'Nguồn phổ thông bền bỉ', price: 750000, icon: '🔌', color: 'border-l-emerald-500' },
          { type: 'Mainboard', name: 'ASRock H610M-HDV/M.2', desc: 'Bo mạch nhỏ gọn tiết kiệm', price: 1850000, icon: '🔧', color: 'border-l-pink-500' },
          { type: 'Cooler', name: 'Intel Stock Cooler (Đi kèm CPU)', desc: 'Tản stock êm ái đủ dùng', price: 0, icon: '🥶', color: 'border-l-cyan-500' }
        ]
      },
      {
        tag: "Tầm Trung / Đa Nhiệm",
        name: "Văn Phòng Cao Cấp & Kế Toán",
        desc: "Xử lý file Excel hàng trăm ngàn dòng, chỉnh sửa ảnh Photoshop nhẹ, mở 100 tab Chrome.",
        score: 8.8,
        scoreLabel: "Khả năng Xử lý Dữ liệu Lớn & Đa nhiệm",
        specs: ["CPU: Core i5-13400", "RAM: 32GB DDR4", "SSD: 1TB NVMe"],
        tip: "Mẹo: 32GB RAM giúp kế toán mở nhiều file Excel dung lượng lớn không bao giờ bị giật.",
        components: [
          { type: 'CPU', name: 'Intel Core i5-13400 (Có iGPU)', desc: '10 nhân 16 luồng xử lý đa nhiệm mượt', price: 5200000, icon: '⚡', color: 'border-l-purple-500' },
          { type: 'GPU', name: 'Palit StormX RTX 3050 6GB', desc: 'Card rời đa nhiệm, xuất 3 màn hình 4K làm việc', price: 4800000, icon: '🎮', color: 'border-l-indigo-500' },
          { type: 'RAM', name: 'Kingston Fury Beast 32GB (2x16GB) DDR4', desc: 'Không lo tràn bộ nhớ khi mở nhiều file', price: 1800000, icon: '💾', color: 'border-l-indigo-500' },
          { type: 'Storage', name: 'Kingston KC3000 1TB NVMe PCIe 4.0', desc: 'Tốc độ siêu nhanh lưu dữ liệu', price: 2400000, icon: '💿', color: 'border-l-amber-500' },
          { type: 'PSU', name: 'Cooler Master Elite V4 600W', desc: 'Nguồn chất lượng cao', price: 1250000, icon: '🔌', color: 'border-l-emerald-500' },
          { type: 'Mainboard', name: 'MSI PRO B760M-A WIFI DDR4', desc: 'Có sẵn WiFi 6 & Bluetooth tiện lợi', price: 3400000, icon: '🔧', color: 'border-l-pink-500' },
          { type: 'Cooler', name: 'Thermalright Assassin X 120 SE', desc: 'Giúp máy luôn mát mẻ yên tĩnh', price: 350000, icon: '🥶', color: 'border-l-cyan-500' }
        ]
      },
      {
        tag: "Cao Cấp / Mini PC",
        name: "Mini PC Siêu Gọn & Sang Trọng",
        desc: "Thích hợp để bàn làm việc tối giản, kích thước siêu nhỏ như cuốn sách, hiệu năng vượt trội.",
        score: 9.0,
        scoreLabel: "Độ Cơ động & Thẩm mỹ Tối giản",
        specs: ["CPU: Core i7-13700H", "RAM: 32GB DDR5", "SSD: 1TB Gen4"],
        tip: "Mẹo: Máy Mini PC nhỏ gọn đặt góc bàn làm việc cực sang trọng và hiện đại.",
        components: [
          { type: 'Barebone', name: 'Mini PC ASUS NUC 13 Pro', desc: 'Thiết kế nhôm nguyên khối siêu nhỏ gọn', price: 13500000, icon: '📦', color: 'border-l-purple-500' },
          { type: 'CPU', name: 'Intel Core i7-13700H Tích hợp', desc: '14 nhân 20 luồng siêu mạnh', price: 0, icon: '⚡', color: 'border-l-indigo-500' },
          { type: 'RAM', name: 'Crucial 32GB (2x16GB) DDR5 SODIMM', desc: 'RAM laptop bus 4800MHz', price: 2800000, icon: '💾', color: 'border-l-purple-500' },
          { type: 'Storage', name: 'Samsung 980 PRO 1TB NVMe Gen4', desc: 'Tốc độ cực cao', price: 2600000, icon: '💿', color: 'border-l-amber-500' },
          { type: 'Adapter', name: 'Nguồn Adapter 120W Tích hợp', desc: 'Tiết kiệm điện năng tuyệt đối', price: 0, icon: '🔌', color: 'border-l-emerald-500' }
        ]
      }
    ]
  },
  data: makeCareer("Data Analyst / Data Scientist", "📈", "Data Analytics", "Bạn phân tích dữ liệu ở quy mô nào?", "Tối ưu cho Python, SQL, Power BI, Tableau, Jupyter và dataset lớn.", [
    { app: "Excel nâng cao · Power BI · Tableau", opt1: "🟢 Mượt", opt2: "⚡ Dashboard lớn", opt3: "🚀 Dữ liệu rất lớn" },
    { app: "Python · Jupyter · Pandas · NumPy", opt1: "🟢 Tốt", opt2: "⚡ Phân tích nhanh", opt3: "🚀 Dataset lớn" },
    { app: "SQL · PostgreSQL · Spark local", opt1: "🟡 Cơ bản", opt2: "🟢 Tốt", opt3: "⚡ ETL nặng" }
  ], [
    { tag: "Sinh viên / Cơ bản", name: "Data Analyst Starter", desc: "Học Excel, SQL, Python và dashboard cơ bản.", score: 7.5, scoreLabel: "Phân tích dữ liệu cơ bản", specs: ["CPU: Core i5 / Ryzen 5", "RAM: 16GB", "SSD: 1TB NVMe"], tip: "16GB RAM đủ cho học tập và dataset vừa.", cpu: "Intel Core i5-13400", gpu: "RTX 3050 6GB", ram: "16GB DDR5", storage: "Kingston NV2 1TB", board: "MSI PRO B760M-A", psu: "MSI MAG A650BN", cooler: "DeepCool AG400" },
    { tag: "Chuyên nghiệp", name: "BI & Data Science Workstation", desc: "Chạy dashboard nặng, notebook và database local.", score: 8.8, scoreLabel: "Phân tích & trực quan hóa chuyên nghiệp", specs: ["CPU: Core i7", "RAM: 32GB", "GPU: RTX 4060"], tip: "32GB giúp chạy Power BI, browser và notebook cùng lúc.", cpu: "Intel Core i7-14700", gpu: "RTX 4060 8GB", ram: "32GB DDR5", storage: "Samsung 990 PRO 1TB", board: "ASUS TUF B760M", psu: "Corsair RM750e", cooler: "Thermalright PA120" },
    { tag: "Big Data / ML", name: "Data Science Heavy Workstation", desc: "Xử lý dataset lớn, Spark local và mô hình ML.", score: 9.5, scoreLabel: "Dataset lớn & đa nhiệm nặng", specs: ["CPU: Ryzen 9", "RAM: 64GB", "GPU: RTX 4070 Super"], tip: "64GB RAM là lựa chọn an toàn cho dataset lớn.", cpu: "AMD Ryzen 9 7950X", gpu: "RTX 4070 Super 12GB", ram: "64GB DDR5", storage: "Samsung 990 PRO 2TB", board: "ASUS X670E", psu: "Corsair RM850e", cooler: "DeepCool LT720" }
  ]),
  architecture: makeCareer("Kiến trúc sư / Kỹ sư xây dựng", "🏗️", "Architecture & BIM", "Bạn làm CAD/BIM hay render kiến trúc?", "Cân bằng CPU đơn nhân, GPU VRAM và khả năng render realtime.", [
    { app: "AutoCAD · Revit · SketchUp", opt1: "🟢 Mượt", opt2: "⚡ Project lớn", opt3: "🚀 BIM nặng" },
    { app: "Lumion · Enscape · Twinmotion", opt1: "🟡 Cơ bản", opt2: "🟢 Realtime tốt", opt3: "⚡ Scene lớn" },
    { app: "V-Ray · Corona · Render kiến trúc", opt1: "🟡 Render chậm", opt2: "🟢 Tốt", opt3: "⚡ Production" }
  ], [
    { tag: "CAD cơ bản", name: "AutoCAD & SketchUp Starter", desc: "Bản vẽ 2D, mô hình 3D nhẹ và học tập.", score: 7.4, scoreLabel: "CAD / BIM cơ bản", specs: ["GPU: RTX 3060", "RAM: 32GB", "SSD: 1TB"], tip: "GPU 12GB giúp viewport SketchUp thoải mái.", cpu: "Intel Core i5-13400F", gpu: "RTX 3060 12GB", ram: "32GB DDR4", storage: "WD Blue SN580 1TB", board: "MSI B760M DDR4", psu: "Antec 650W", cooler: "DeepCool AG400" },
    { tag: "BIM chuyên nghiệp", name: "Revit & Enscape Professional", desc: "Dự án BIM, phối cảnh realtime và đa nhiệm.", score: 8.8, scoreLabel: "BIM & realtime chuyên nghiệp", specs: ["GPU: RTX 4070", "RAM: 32GB", "CPU: Core i7"], tip: "RTX 4070 cân Enscape và Twinmotion tốt ở 2K.", cpu: "Intel Core i7-14700K", gpu: "RTX 4070 Super 12GB", ram: "32GB DDR5", storage: "Samsung 990 PRO 2TB", board: "ASUS Z790", psu: "Corsair RM850e", cooler: "DeepCool LT720" },
    { tag: "Studio / Render", name: "Architectural Visualization Studio", desc: "Render V-Ray, Corona và scene kiến trúc lớn.", score: 9.6, scoreLabel: "Render studio & scene lớn", specs: ["GPU: RTX 4090", "RAM: 64GB", "CPU: Ryzen 9"], tip: "VRAM 24GB hữu ích cho texture và scene nhiều vật thể.", cpu: "AMD Ryzen 9 7950X", gpu: "RTX 4090 24GB", ram: "64GB DDR5", storage: "Samsung 990 PRO 2TB", board: "ASUS X670E", psu: "Corsair RM1000x", cooler: "NZXT Kraken 360" }
  ]),
  security: makeCareer("Cybersecurity / DevSecOps", "🛡️", "Cybersecurity", "Bạn cần bao nhiêu máy ảo và container?", "Tối ưu cho Kali Linux, Wireshark, Burp Suite, VMware, Docker và lab bảo mật.", [
    { app: "Kali Linux · Wireshark · Burp Suite", opt1: "🟢 Mượt", opt2: "⚡ Lab lớn", opt3: "🚀 Phân tích nặng" },
    { app: "VMware · VirtualBox · nhiều VM", opt1: "🟡 1–2 VM", opt2: "🟢 4–6 VM", opt3: "⚡ 8+ VM" },
    { app: "Docker · Kubernetes · SIEM lab", opt1: "🟡 Lab nhỏ", opt2: "🟢 Chạy êm", opt3: "⚡ Enterprise lab" }
  ], [
    { tag: "Học tập", name: "Security Lab Starter", desc: "Kali, Wireshark và một vài máy ảo.", score: 7.6, scoreLabel: "Pentest cơ bản & lab nhỏ", specs: ["CPU: Core i5", "RAM: 32GB", "SSD: 1TB"], tip: "RAM quan trọng hơn GPU khi chạy máy ảo.", cpu: "Intel Core i5-13400", gpu: "RTX 3050 6GB", ram: "32GB DDR5", storage: "Kingston KC3000 1TB", board: "MSI B760M", psu: "MSI MAG A650BN", cooler: "DeepCool AG400" },
    { tag: "DevSecOps", name: "Virtualization & Container Lab", desc: "Nhiều VM, Docker, Kubernetes và pipeline CI/CD.", score: 8.9, scoreLabel: "Virtualization chuyên nghiệp", specs: ["CPU: Core i7", "RAM: 64GB", "SSD: 2TB"], tip: "64GB RAM giúp lab nhiều VM không bị swap.", cpu: "Intel Core i7-14700", gpu: "RTX 4060 8GB", ram: "64GB DDR5", storage: "Samsung 990 PRO 2TB", board: "ASUS B760", psu: "Corsair RM750e", cooler: "Thermalright PA120" },
    { tag: "Enterprise Lab", name: "Cyber Range Workstation", desc: "Mô phỏng mạng lớn, SIEM, nhiều VM và container.", score: 9.5, scoreLabel: "Cyber range & enterprise lab", specs: ["CPU: Ryzen 9", "RAM: 128GB", "SSD: 4TB"], tip: "128GB RAM phù hợp lab mô phỏng nhiều node.", cpu: "AMD Ryzen 9 7950X", gpu: "RTX 4070 12GB", ram: "128GB DDR5", storage: "2TB NVMe + 2TB NVMe", board: "ASUS X670E", psu: "Corsair RM850e", cooler: "DeepCool LT720" }
  ]),
  music: makeCareer("Music Producer / Audio Engineer", "🎵", "Music Production", "Bạn sản xuất nhạc ở quy mô nào?", "Tối ưu cho FL Studio, Ableton, Cubase, Kontakt và Pro Tools.", [
    { app: "FL Studio · Ableton Live · Cubase", opt1: "🟢 Mượt", opt2: "⚡ Nhiều track", opt3: "🚀 Studio" },
    { app: "Kontakt · Omnisphere · sample library", opt1: "🟡 Cơ bản", opt2: "🟢 Nhiều instrument", opt3: "⚡ Template lớn" },
    { app: "Pro Tools · Mixing · Mastering", opt1: "🟢 Tốt", opt2: "⚡ Production", opt3: "🚀 Chuyên nghiệp" }
  ], genericProfiles("Music Producer", { cpu: "Intel Core i7-14700", gpu: "RTX 4060 8GB", ram: "64GB DDR5", storage: "Samsung 990 PRO 2TB", board: "ASUS B760", psu: "Corsair RM750e", cooler: "Noctua NH-D15" })),
  product: makeCareer("Product / Interior Designer", "🧰", "Product Design", "Bạn thiết kế sản phẩm hay không gian nội thất?", "Tối ưu cho Rhino, 3ds Max, KeyShot, V-Ray, Corona và Substance 3D.", [
    { app: "Rhino · 3ds Max · SketchUp", opt1: "🟢 Mượt", opt2: "⚡ Model lớn", opt3: "🚀 Studio" },
    { app: "KeyShot · V-Ray · Corona", opt1: "🟡 Cơ bản", opt2: "🟢 Render tốt", opt3: "⚡ Render nhanh" },
    { app: "Figma · Substance 3D · Photoshop", opt1: "🟢 Tốt", opt2: "⚡ Đa nhiệm", opt3: "🚀 Production" }
  ], genericProfiles("Product Design", { cpu: "Intel Core i7-14700", gpu: "RTX 4070 Super 12GB", ram: "64GB DDR5", storage: "Samsung 990 PRO 2TB", board: "ASUS B760", psu: "Corsair RM850e", cooler: "DeepCool LT720" })),
  mobile: makeCareer("Mobile Developer", "📱", "Mobile Development", "Bạn phát triển Android, iOS hay đa nền tảng?", "Tối ưu cho Android Studio, Xcode, Flutter, React Native và emulator.", [
    { app: "Android Studio · Gradle · Emulator", opt1: "🟢 Mượt", opt2: "⚡ Build nhanh", opt3: "🚀 Nhiều emulator" },
    { app: "Flutter · React Native · VS Code", opt1: "🟢 Tốt", opt2: "⚡ Đa project", opt3: "🚀 Monorepo lớn" },
    { app: "Docker · Firebase · local backend", opt1: "🟡 Cơ bản", opt2: "🟢 Chạy êm", opt3: "⚡ Full stack local" }
  ], genericProfiles("Mobile Development", { cpu: "Intel Core i7-14700", gpu: "RTX 4060 8GB", ram: "64GB DDR5", storage: "Samsung 990 PRO 2TB", board: "ASUS B760", psu: "Corsair RM750e", cooler: "Thermalright PA120" })),
  web3: makeCareer("Blockchain / Web3 Developer", "⛓️", "Blockchain & Web3", "Bạn build smart contract hay chạy node local?", "Tối ưu cho Solidity, Foundry, Hardhat, Docker, local node và database.", [
    { app: "Solidity · Hardhat · Foundry", opt1: "🟢 Mượt", opt2: "⚡ Test nhanh", opt3: "🚀 Monorepo lớn" },
    { app: "Docker · Local node · Indexer", opt1: "🟡 Ít service", opt2: "🟢 Chạy êm", opt3: "⚡ Nhiều chain" },
    { app: "PostgreSQL · Redis · GraphQL", opt1: "🟢 Tốt", opt2: "⚡ Dữ liệu lớn", opt3: "🚀 Full stack" }
  ], genericProfiles("Blockchain Development", { cpu: "AMD Ryzen 9 7950X", gpu: "RTX 4070 12GB", ram: "128GB DDR5", storage: "2TB NVMe + 2TB NVMe", board: "ASUS X670E", psu: "Corsair RM850e", cooler: "DeepCool LT720" })),
  science: makeCareer("Nghiên cứu khoa học / Kỹ thuật", "🔬", "Scientific Computing", "Bạn mô phỏng, tính toán hay xử lý dữ liệu khoa học?", "Tối ưu cho MATLAB, Simulink, Mathematica, R, Python, SciPy và mô phỏng kỹ thuật.", [
    { app: "MATLAB · Simulink · Mathematica", opt1: "🟢 Tốt", opt2: "⚡ Tính nhanh", opt3: "🚀 Mô hình lớn" },
    { app: "Python · R · Jupyter · SciPy", opt1: "🟢 Mượt", opt2: "⚡ Dataset lớn", opt3: "🚀 Tính toán nặng" },
    { app: "FEM · CFD · mô phỏng kỹ thuật", opt1: "🟡 Cơ bản", opt2: "🟢 Tốt", opt3: "⚡ Mesh lớn" }
  ], genericProfiles("Scientific Computing", { cpu: "AMD Ryzen 9 7950X", gpu: "RTX 4070 Super 12GB", ram: "128GB DDR5", storage: "2TB NVMe + 2TB NVMe", board: "ASUS X670E", psu: "Corsair RM850e", cooler: "DeepCool LT720" })),
  mac: {
    icon: "🍎",
    badge: "Apple Ecosystem",
    question: "Lựa chọn thiết bị Apple Silicon của bạn?",
    subtitle: "Hệ sinh thái Apple tối ưu hóa năng lượng, hiệu năng mượt mà và giữ giá tốt.",
    benchmarks: [
      { app: "Final Cut Pro 4K & Xcode Web Dev", opt1: "🟢 Recommended (Rất mượt)", opt2: "⚡ Ultra", opt3: "🚀 Overkill" },
      { app: "Xcode App Build & Logic Pro Audio", opt1: "🟡 Minimum (16GB RAM)", opt2: "🟢 Recommended (Nhanh)", opt3: "⚡ Ultra" },
      { app: "Studio 8K ProRes Video & Metal 3D", opt1: "🔴 Xem nhẹ", opt2: "🟡 Minimum (Khá tốt)", opt3: "🟢 Recommended (Studio Master)" }
    ],
    options: [
      {
        tag: "Giá Rẻ / Quốc Dân",
        name: "Mac mini M4 (2026)",
        desc: "Chi phí tối ưu nhất để vào hệ sinh thái Mac, chip M4 sức mạnh ấn tượng.",
        score: 8.0,
        scoreLabel: "Độ tối ưu Kinh tế Hệ sinh thái",
        specs: ["Chip: Apple M4 (10-core CPU/GPU)", "RAM: 16GB Unified", "Storage: 512GB SSD"],
        tip: "Mẹo: Mac mini M4 bản 16GB RAM mặc định là thiết bị hời nhất của Apple hiện tại.",
        components: [
          { type: 'SoC', name: 'Apple M4 Chip (10-core CPU, 10-core GPU)', desc: 'Xử lý mượt đồ họa, dựng video 4K', price: 14990000, icon: '🍎', color: 'border-l-slate-400' },
          { type: 'RAM', name: '16GB Unified Memory', desc: 'Bộ nhớ hợp nhất tốc độ cao', price: 0, icon: '💾', color: 'border-l-indigo-500' },
          { type: 'Storage', name: '512GB Fast SSD Storage', desc: 'Ổ cứng SSD Apple tốc độ cao', price: 4000000, icon: '💿', color: 'border-l-amber-500' },
          { type: 'Power', name: 'Built-in Power Supply 150W', desc: 'Nguồn tích hợp siêu nhỏ gọn', price: 0, icon: '🔌', color: 'border-l-emerald-500' }
        ]
      },
      {
        tag: "Tầm Trung / Di Động",
        name: "MacBook Pro 14 inch M4 Pro",
        desc: "Dành cho lập trình viên, Creator di chuyển nhiều, màn hình Liquid Retina XDR 120Hz.",
        score: 9.0,
        scoreLabel: "Hiệu năng Di động Chuẩn Màu & Đồ họa",
        specs: ["Chip: Apple M4 Pro (12-core CPU, 16-core GPU)", "RAM: 24GB Unified", "Storage: 512GB SSD"],
        tip: "Mẹo: Màn hình XDR 120Hz chuẩn màu là lợi thế tuyệt đối của MacBook Pro.",
        components: [
          { type: 'Laptop', name: 'MacBook Pro 14 inch Space Black', desc: 'Thiết kế nhôm cao cấp, pin 18 tiếng', price: 49990000, icon: '💻', color: 'border-l-slate-400' },
          { type: 'SoC', name: 'Apple M4 Pro Chip', desc: '12 nhân CPU, 16 nhân GPU mạnh mẽ', price: 0, icon: '⚡', color: 'border-l-indigo-500' },
          { type: 'RAM', name: '24GB Unified Memory', desc: 'Đa nhiệm ứng dụng chuyên nghiệp', price: 0, icon: '💾', color: 'border-l-purple-500' },
          { type: 'Storage', name: '512GB NVMe SSD Fast Storage', desc: 'Tốc độ đọc ghi cực cao', price: 0, icon: '💿', color: 'border-l-amber-500' }
        ]
      },
      {
        tag: "Cao Cấp / Trạm Làm Việc",
        name: "Mac Studio M4 Max",
        desc: "Trạm làm việc đỉnh cao cho Studio dựng phim 8K, Render 3D, âm thanh chuyên nghiệp.",
        score: 9.8,
        scoreLabel: "Khả năng Studio Chuyên nghiệp Tối đa",
        specs: ["Chip: Apple M4 Max (16-core CPU, 40-core GPU)", "RAM: 64GB Unified", "Storage: 1TB SSD"],
        tip: "Mẹo: Băng thông bộ nhớ lên tới 400GB/s giúp xử lý dự án dung lượng khổng lồ không giật trễ.",
        components: [
          { type: 'SoC', name: 'Apple M4 Max Chip', desc: '40-core GPU gánh mọi phần mềm nặng', price: 54990000, icon: '🍎', color: 'border-l-slate-400' },
          { type: 'RAM', name: '64GB Unified Memory', desc: 'Băng thông bộ nhớ 400GB/s', price: 10000000, icon: '💾', color: 'border-l-indigo-500' },
          { type: 'Storage', name: '1TB NVMe SSD High Speed', desc: 'Lưu trữ thoải mái dự án lớn', price: 6000000, icon: '💿', color: 'border-l-amber-500' },
          { type: 'Power', name: 'Power Supply 370W Tích hợp', desc: 'Tản nhiệt lồng sóc yên tĩnh 100%', price: 0, icon: '🔌', color: 'border-l-emerald-500' }
        ]
      }
    ]
  }
};

/* ── Tự sinh 5 biến thể máy cho mọi lựa chọn (giống nghề AI) ── */
function roundPrice(p) { return Math.round(p / 10000) * 10000; }

const VARIANT_PROFILES = [
  { idx: 0, label: 'ASUS + Corsair',         gpu: ['ASUS', 'TUF Gaming', 1.00],    ram: ['Corsair', 1.00],   ssd: ['Kingston', 'KC3000', 1.00], psu: ['Corsair', 1.00],   board: ['ASUS', 1.00],     cooler: 0 },
  { idx: 1, label: 'MSI + G.Skill',          gpu: ['MSI', 'Gaming X', 0.99],       ram: ['G.Skill', 0.97],   ssd: ['Samsung', '990 PRO', 1.06], psu: ['MSI', 0.99],       board: ['MSI', 0.98],      cooler: 1 },
  { idx: 2, label: 'Gigabyte + Kingston',    gpu: ['Gigabyte', 'Gaming OC', 0.98], ram: ['Kingston', 0.96],  ssd: ['WD Black', 'SN850X', 1.03], psu: ['Gigabyte', 0.97],  board: ['GIGABYTE', 0.97], cooler: 2 },
  { idx: 3, label: 'Zotac + Crucial',        gpu: ['Zotac', 'AMP', 0.96],          ram: ['Crucial', 0.95],   ssd: ['Crucial', 'T500', 0.97],    psu: ['Seasonic', 1.02],  board: ['ASRock', 0.94],   cooler: 3 },
  { idx: 4, label: 'PowerColor + TeamGroup', gpu: ['PowerColor', 'Hellhound', 0.97], ram: ['TeamGroup', 0.94], ssd: ['TeamGroup', 'MP44', 0.93],  psu: ['be quiet!', 1.03], board: ['MSI', 0.95],      cooler: 4 },
];
/* Pool GPU: mỗi máy 1 model khác nhau (NVIDIA / Radeon / Intel Arc) cùng tầm giá */
const GPU_POOL = {
  '4090': [
    ['RTX 4090 24GB', 1.00, 'nvidia'], ['RX 7900 XTX 24GB', 0.82, 'amd'], ['RTX 4090 24GB OC', 1.02, 'nvidia'], ['RX 7900 XTX 24GB OC', 0.84, 'amd'], ['RX 7900 XTX 24GB Liquid', 0.95, 'amd']
  ],
  '4080 super': [
    ['RTX 4080 Super 16GB', 1.00, 'nvidia'], ['RX 7900 XTX 24GB', 0.80, 'amd'], ['RTX 4080 16GB', 0.92, 'nvidia'], ['RX 7900 XT 20GB', 0.75, 'amd'], ['RX 7900 XTX 24GB OC', 0.82, 'amd']
  ],
  '4080': [
    ['RTX 4080 16GB', 1.00, 'nvidia'], ['RX 7900 XTX 24GB', 0.87, 'amd'], ['RX 7900 XT 20GB OC', 0.78, 'amd'], ['RTX 4080 Super 16GB', 1.08, 'nvidia'], ['RX 7900 XTX 24GB OC', 0.89, 'amd']
  ],
  '4070 ti super': [
    ['RTX 4070 Ti Super 16GB', 1.00, 'nvidia'], ['RX 7900 XT 20GB', 0.85, 'amd'], ['RTX 4070 Ti 12GB', 0.80, 'nvidia'], ['RX 7900 GRE 16GB', 0.72, 'amd'], ['RX 7900 XT 20GB OC', 0.87, 'amd']
  ],
  '4070 ti': [
    ['RTX 4070 Ti 12GB', 1.00, 'nvidia'], ['RX 7900 XT 20GB', 1.05, 'amd'], ['RX 7900 GRE 16GB', 0.85, 'amd'], ['RTX 4070 Ti Super 16GB', 1.25, 'nvidia'], ['RX 7900 XT 20GB OC', 1.07, 'amd']
  ],
  '4070 super': [
    ['RTX 4070 Super 12GB', 1.00, 'nvidia'], ['RX 7800 XT 16GB', 0.88, 'amd'], ['RTX 4070 12GB', 0.90, 'nvidia'], ['RX 7700 XT 12GB OC', 0.75, 'amd'], ['RX 7800 XT 16GB OC', 0.90, 'amd']
  ],
  '4070': [
    ['RTX 4070 12GB', 1.00, 'nvidia'], ['RX 7800 XT 16GB', 0.98, 'amd'], ['RX 7700 XT 12GB OC', 0.80, 'amd'], ['RTX 4070 Super 12GB', 1.10, 'nvidia'], ['RX 7800 XT 16GB OC', 1.00, 'amd']
  ],
  '4060 ti 8gb': [
    ['RTX 4060 Ti 8GB', 1.00, 'nvidia'], ['RTX 4060 Ti 8GB OC', 1.02, 'nvidia'], ['RX 7700 XT 12GB', 1.00, 'amd'], ['Intel Arc A770 16GB', 0.95, 'intel'], ['RX 7600 XT 16GB', 0.85, 'amd']
  ],
  '4060 ti': [
    ['RTX 4060 Ti 16GB', 1.00, 'nvidia'], ['RTX 4060 Ti 16GB OC', 1.02, 'nvidia'], ['RX 7800 XT 16GB', 1.05, 'amd'], ['Intel Arc B580 12GB', 0.85, 'intel'], ['RX 7700 XT 12GB', 0.92, 'amd']
  ],
  '4060': [
    ['RTX 4060 8GB', 1.00, 'nvidia'], ['RTX 4060 8GB OC', 1.02, 'nvidia'], ['RX 7600 XT 16GB', 1.00, 'amd'], ['Intel Arc A750 8GB', 0.75, 'intel'], ['Intel Arc B580 12GB', 0.95, 'intel']
  ],
  '3060': [
    ['RTX 3060 12GB', 1.00, 'nvidia'], ['RTX 3060 12GB OC', 1.02, 'nvidia'], ['RX 6750 XT 12GB', 1.05, 'amd'], ['Intel Arc A750 8GB', 1.00, 'intel'], ['Intel Arc B580 12GB', 1.08, 'intel']
  ],
  '3050': [
    ['RTX 3050 6GB', 1.00, 'nvidia'], ['RTX 3050 6GB OC', 1.02, 'nvidia'], ['RX 6600 8GB', 1.10, 'amd'], ['Intel Arc A580 8GB', 1.05, 'intel'], ['RX 6600 8GB OC', 1.15, 'amd']
  ],
};
const AMD_LINE = { 'ASUS': ['ASUS', 'TUF Gaming'], 'MSI': ['MSI', 'Gaming X'], 'Gigabyte': ['Gigabyte', 'Gaming OC'], 'PowerColor': ['PowerColor', 'Hellhound'], 'Zotac': ['Sapphire', 'Nitro+'] };
const INTEL_BRAND = { 'ASUS': 'ASUS', 'MSI': 'MSI', 'Gigabyte': 'Gigabyte' };
/* v2: đổi platform Intel ↔ AMD */
const CPU_SWAP = {
  'i3-12100':   { name: 'AMD Ryzen 5 5600GT', desc: '6 nhân 12 luồng AM4, iGPU Radeon Vega 7', price: 2800000, socket: 'AM4', igpu: 'AMD Radeon Vega 7 Graphics (Tích hợp)' },
  'i5-12400f':  { name: 'AMD Ryzen 5 5600', desc: '6 nhân 12 luồng AM4, hiệu năng ổn định', price: 2800000, socket: 'AM4' },
  'i5-12400':   { name: 'AMD Ryzen 5 5600GT', desc: '6 nhân 12 luồng AM4, iGPU Radeon Vega 7', price: 2800000, socket: 'AM4', igpu: 'AMD Radeon Vega 7 Graphics (Tích hợp)' },
  'i5-13400f':  { name: 'AMD Ryzen 5 7600', desc: '6 nhân 12 luồng AM5, hiệu năng đơn nhân xuất sắc', price: 5200000, socket: 'AM5' },
  'i5-13400':   { name: 'AMD Ryzen 5 8600G', desc: '6 nhân 12 luồng AM5, iGPU Radeon 760M mạnh', price: 5400000, socket: 'AM5', igpu: 'AMD Radeon 760M Graphics (Tích hợp)' },
  'i5-13500':   { name: 'AMD Ryzen 7 7700', desc: '8 nhân 16 luồng AM5 đa nhiệm tốt', price: 8500000, socket: 'AM5' },
  'i7-14700k':  { name: 'AMD Ryzen 7 7700X', desc: '8 nhân 16 luồng AM5, xung cao nhất tầm giá', price: 8500000, socket: 'AM5' },
  'i7-14700':   { name: 'AMD Ryzen 7 7700', desc: '8 nhân 16 luồng AM5 đa nhiệm tốt', price: 8200000, socket: 'AM5' },
  'i9-14900k':  { name: 'AMD Ryzen 9 7900X', desc: '12 nhân 24 luồng AM5 hiệu năng đỉnh', price: 10200000, socket: 'AM5' },
  'i9-13900ks': { name: 'AMD Ryzen 9 7950X', desc: '16 nhân 32 luồng AM5 đa nhân mạnh nhất', price: 14800000, socket: 'AM5' },
  'i9-13900k':  { name: 'AMD Ryzen 9 7950X', desc: '16 nhân 32 luồng AM5 đa nhân mạnh nhất', price: 14800000, socket: 'AM5' },
  'ryzen 5 5600x': { name: 'Intel Core i5-12400F', desc: '6 nhân 12 luồng LGA1700 giá tốt', price: 2600000, socket: 'LGA1700' },
  'ryzen 5 5600':  { name: 'Intel Core i5-12400F', desc: '6 nhân 12 luồng LGA1700 giá tốt', price: 2600000, socket: 'LGA1700' },
  'ryzen 5 7600x': { name: 'Intel Core i5-14600K', desc: '14 nhân 20 luồng LGA1700 xung cao', price: 6400000, socket: 'LGA1700' },
  'ryzen 5 7600':  { name: 'Intel Core i5-13400F', desc: '10 nhân 16 luồng LGA1700 giá tốt', price: 4800000, socket: 'LGA1700' },
  'ryzen 7 7800x3d': { name: 'Intel Core i7-14700K', desc: '20 nhân 28 luồng, gaming + stream mượt', price: 10600000, socket: 'LGA1700' },
  'ryzen 7 7700x': { name: 'Intel Core i7-14700K', desc: '20 nhân 28 luồng xử lý song song cực tốt', price: 10600000, socket: 'LGA1700' },
  'ryzen 7 7700':  { name: 'Intel Core i7-14700', desc: '20 nhân 28 luồng đa nhiệm mượt mà', price: 9800000, socket: 'LGA1700' },
  'ryzen 9 7900x': { name: 'Intel Core i9-14900K', desc: '24 nhân 32 luồng hiệu năng đỉnh cao', price: 14500000, socket: 'LGA1700' },
  'ryzen 9 7950x3d': { name: 'Intel Core i9-14900KS', desc: '24 nhân 32 luồng, boost 6.2GHz', price: 17900000, socket: 'LGA1700' },
  'ryzen 9 7950x': { name: 'Intel Core i9-14900K', desc: '24 nhân 32 luồng hiệu năng đỉnh cao', price: 14500000, socket: 'LGA1700' },
};
/* v4: đổi platform lần 2 — model khác v2 */
const CPU_SWAP4 = {
  'i3-12100':   { name: 'AMD Ryzen 5 5600G', desc: '6 nhân 12 luồng AM4, iGPU Radeon Vega 7', price: 2900000, socket: 'AM4', igpu: 'AMD Radeon Vega 7 Graphics (Tích hợp)' },
  'i5-12400f':  { name: 'AMD Ryzen 5 5500', desc: '6 nhân 12 luồng AM4 siêu tiết kiệm', price: 2400000, socket: 'AM4' },
  'i5-12400':   { name: 'AMD Ryzen 5 5600G', desc: '6 nhân 12 luồng AM4, iGPU Radeon Vega 7', price: 2900000, socket: 'AM4', igpu: 'AMD Radeon Vega 7 Graphics (Tích hợp)' },
  'i5-13400f':  { name: 'AMD Ryzen 5 7500F', desc: '6 nhân 12 luồng AM5 giá cực tốt', price: 3900000, socket: 'AM5' },
  'i5-13400':   { name: 'AMD Ryzen 5 8500G', desc: '6 nhân 12 luồng AM5, iGPU Radeon 740M', price: 4500000, socket: 'AM5', igpu: 'AMD Radeon 740M Graphics (Tích hợp)' },
  'i5-13500':   { name: 'AMD Ryzen 7 7700', desc: '8 nhân 16 luồng AM5 đa nhiệm', price: 8200000, socket: 'AM5' },
  'i7-14700k':  { name: 'AMD Ryzen 7 7700', desc: '8 nhân 16 luồng AM5 cân mọi tác vụ', price: 8200000, socket: 'AM5' },
  'i7-14700':   { name: 'AMD Ryzen 7 7700X', desc: '8 nhân 16 luồng AM5 xung cao', price: 8500000, socket: 'AM5' },
  'i9-14900k':  { name: 'AMD Ryzen 9 7950X', desc: '16 nhân 32 luồng AM5 đa nhân mạnh nhất', price: 14800000, socket: 'AM5' },
  'i9-13900ks': { name: 'AMD Ryzen 9 7900X', desc: '12 nhân 24 luồng AM5 hiệu năng đỉnh', price: 10200000, socket: 'AM5' },
  'i9-13900k':  { name: 'AMD Ryzen 9 7900X', desc: '12 nhân 24 luồng AM5 hiệu năng đỉnh', price: 10200000, socket: 'AM5' },
  'ryzen 5 5600x': { name: 'Intel Core i5-13400F', desc: '10 nhân 16 luồng LGA1700 thế hệ 13', price: 4800000, socket: 'LGA1700' },
  'ryzen 5 5600':  { name: 'Intel Core i5-13400F', desc: '10 nhân 16 luồng LGA1700 thế hệ 13', price: 4800000, socket: 'LGA1700' },
  'ryzen 5 7600x': { name: 'Intel Core i5-14400F', desc: '10 nhân 16 luồng LGA1700 thế hệ 14', price: 5000000, socket: 'LGA1700' },
  'ryzen 5 7600':  { name: 'Intel Core i5-12400F', desc: '6 nhân 12 luồng LGA1700 giá tốt', price: 2600000, socket: 'LGA1700' },
  'ryzen 7 7800x3d': { name: 'Intel Core i7-13700K', desc: '16 nhân 24 luồng LGA1700 thế hệ 13', price: 9500000, socket: 'LGA1700' },
  'ryzen 7 7700x': { name: 'Intel Core i7-13700K', desc: '16 nhân 24 luồng LGA1700 thế hệ 13', price: 9500000, socket: 'LGA1700' },
  'ryzen 7 7700':  { name: 'Intel Core i7-13700', desc: '16 nhân 24 luồng LGA1700 đa nhiệm', price: 9000000, socket: 'LGA1700' },
  'ryzen 9 7900x': { name: 'Intel Core i9-13900K', desc: '24 nhân 32 luồng thế hệ 13', price: 13500000, socket: 'LGA1700' },
  'ryzen 9 7950x3d': { name: 'Intel Core i9-13900KS', desc: '24 nhân 32 luồng phiên bản đặc biệt', price: 17900000, socket: 'LGA1700' },
  'ryzen 9 7950x': { name: 'Intel Core i9-13900K', desc: '24 nhân 32 luồng thế hệ 13', price: 13500000, socket: 'LGA1700' },
};
/* v3: cùng platform nhưng khác đời/thế hệ */
const CPU_GEN = {
  'i3-12100':  { name: 'Intel Core i3-13100', desc: '4 nhân 8 luồng thế hệ 13, có iGPU', price: 2900000, socket: 'LGA1700', igpu: 'Intel UHD Graphics 730 (Tích hợp)' },
  'i5-12400f': { name: 'Intel Core i5-13400F', desc: '10 nhân 16 luồng thế hệ 13', price: 4800000, socket: 'LGA1700' },
  'i5-12400':  { name: 'Intel Core i5-13400', desc: '10 nhân 16 luồng thế hệ 13, iGPU UHD 770', price: 5200000, socket: 'LGA1700', igpu: 'Intel UHD Graphics 770 (Tích hợp)' },
  'i5-13400f': { name: 'Intel Core i5-14400F', desc: '10 nhân 16 luồng thế hệ 14', price: 5000000, socket: 'LGA1700' },
  'i5-13400':  { name: 'Intel Core i5-14400', desc: '10 nhân 16 luồng thế hệ 14, iGPU UHD 770', price: 5500000, socket: 'LGA1700', igpu: 'Intel UHD Graphics 770 (Tích hợp)' },
  'i5-13500':  { name: 'Intel Core i5-14500', desc: '14 nhân 20 luồng thế hệ 14', price: 5800000, socket: 'LGA1700' },
  'i7-14700k': { name: 'Intel Core i7-13700K', desc: '16 nhân 24 luồng thế hệ 13', price: 9500000, socket: 'LGA1700' },
  'i7-14700':  { name: 'Intel Core i7-13700', desc: '16 nhân 24 luồng thế hệ 13', price: 9000000, socket: 'LGA1700' },
  'i9-14900k': { name: 'Intel Core i9-13900K', desc: '24 nhân 32 luồng thế hệ 13', price: 13500000, socket: 'LGA1700' },
  'ryzen 5 5600x': { name: 'AMD Ryzen 5 7600', desc: '6 nhân 12 luồng AM5 thế hệ 7000', price: 5200000, socket: 'AM5' },
  'ryzen 5 5600':  { name: 'AMD Ryzen 5 7600', desc: '6 nhân 12 luồng AM5 thế hệ 7000', price: 5200000, socket: 'AM5' },
  'ryzen 5 7600x': { name: 'AMD Ryzen 5 9600X', desc: '6 nhân 12 luồng AM5 thế hệ 9000', price: 6900000, socket: 'AM5' },
  'ryzen 5 7600':  { name: 'AMD Ryzen 5 9600X', desc: '6 nhân 12 luồng AM5 thế hệ 9000', price: 6900000, socket: 'AM5' },
  'ryzen 7 7800x3d': { name: 'AMD Ryzen 7 9800X3D', desc: '8 nhân 16 luồng AM5 X3D thế hệ 9000', price: 14900000, socket: 'AM5' },
  'ryzen 7 7700x': { name: 'AMD Ryzen 7 9700X', desc: '8 nhân 16 luồng AM5 thế hệ 9000', price: 9900000, socket: 'AM5' },
  'ryzen 7 7700':  { name: 'AMD Ryzen 7 9700X', desc: '8 nhân 16 luồng AM5 thế hệ 9000', price: 9900000, socket: 'AM5' },
  'ryzen 9 7900x': { name: 'AMD Ryzen 9 9900X', desc: '12 nhân 24 luồng AM5 thế hệ 9000', price: 12900000, socket: 'AM5' },
  'ryzen 9 7950x3d': { name: 'AMD Ryzen 9 9950X3D', desc: '16 nhân 32 luồng AM5 X3D thế hệ 9000', price: 21900000, socket: 'AM5' },
  'ryzen 9 7950x': { name: 'AMD Ryzen 9 9950X', desc: '16 nhân 32 luồng AM5 thế hệ 9000', price: 17500000, socket: 'AM5' },
};
function findCpuKey(name) {
  const n = (name || '').toLowerCase();
  if (/threadripper|13700h/.test(n)) return null;
  return Object.keys(CPU_SWAP).filter(k => n.includes(k)).sort((a, b) => b.length - a.length)[0] || null;
}
/* Mọi build đều dùng card rời — GPU giá 0 / tên onboard-iGPU đều thành card rời phổ thông */
const BUDGET_GPU = { name: 'Palit StormX RTX 3050 6GB', desc: 'Card rời phổ thông — xuất hình 4K và tăng tốc ứng dụng', price: 4800000, icon: '🎮', color: 'border-l-indigo-500' };
const isOnboardGpu = c => c.type === 'GPU' && (c.price <= 0 || /Onboard|Tích hợp|UHD Graphics|Vega|760M|740M/i.test(c.name || ''));
const fixOnboardGpu = c => isOnboardGpu(c) ? { ...c, ...BUDGET_GPU } : c;
function applyCpu(comps, entry) {
  if (!entry) return { comps: comps.map(fixOnboardGpu), socket: null };
  let out = comps.map(c => c.type === 'CPU' ? { ...c, name: entry.name, desc: entry.desc, price: entry.price } : c);
  if (entry.socket === 'AM5') {
    out = out.map(c => c.type === 'RAM' && /DDR4/i.test(c.name)
      ? { ...c, name: c.name.replace(/DDR4/i, 'DDR5'), price: roundPrice(c.price * 1.35) } : c);
  } else if (entry.socket === 'AM4') {
    out = out.map(c => c.type === 'RAM' && /DDR5/i.test(c.name)
      ? { ...c, name: c.name.replace(/DDR5/i, 'DDR4'), price: roundPrice(c.price * 0.75) } : c);
  }
  out = out.map(fixOnboardGpu);
  return { comps: out, socket: entry.socket };
}
const GPU_DESC = {
  'ASUS': 'Tản nhiệt TUF độ bền cao, ổn định dưới tải nặng',
  'MSI': 'Tản TWIN FROZR êm ái, hiệu năng ổn định',
  'Gigabyte': 'Tản WINDFORCE 3 quạt, làm mát mạnh mẽ',
  'Zotac': 'Thiết kế compact IceStorm, hiệu quả bất ngờ',
  'PowerColor': 'Tản 3 quạt Hellhound, hoạt động yên tĩnh',
  'Palit': 'Tản StormX/GamingPro mát mẻ, giá tốt cho build phổ thông'
};
const AIO_COOLERS = (mm) => [
  [`Thermalright Frozen Prism ${mm}mm AIO`, 'Tản nước AIO giá tốt, hiệu năng cao'],
  [`DeepCool LT720 ${mm}mm AIO`, 'Tản nước 2 quạt giải nhiệt mạnh'],
  [`NZXT Kraken ${mm}mm RGB AIO`, 'Tản nước RGB đẹp, bơm êm ái'],
  [`Corsair iCUE Elite LCD ${mm}mm AIO`, 'Tản nước cao cấp, màn LCD thông số'],
  [`Arctic Liquid Freezer III ${mm}mm`, 'Tản nước hiệu năng số 1 phân khúc']
];
const AIR_BIG_COOLERS = [
  ['Thermalright Peerless Assassin 120 SE', 'Tản khí 2 tháp, hiệu năng phân khúc vô địch'],
  ['DeepCool AK620', 'Tản khí 2 tháp 120mm áp lực cao'],
  ['ID-Cooling SE-224-XT ARGB', 'Tản 4 ống đồng, LED ARGB đẹp'],
  ['be quiet! Dark Rock Pro 4', 'Tản khí êm nhất thị trường'],
  ['Thermalright Phantom Spirit 120 SE', 'Tản 2 tháp 7 ống đồng giá tốt']
];
const AIR_SMALL_COOLERS = [
  ['DeepCool AG400 ARGB', 'Tản khí 120mm LED đẹp, giá tốt'],
  ['ID-Cooling SE-214-XT', 'Tản khí 120mm nhỏ gọn, êm ái'],
  ['Thermalright Assassin X 120 SE', 'Tản tháp đơn hiệu quả bất ngờ'],
  ['be quiet! Pure Rock 2', 'Tản khí êm ái thương hiệu Đức'],
  ['Cooler Master Hyper 212 Halo', 'Tản 120mm kinh điển, bền bỉ']
];

function swapComponent(c, p, platform, baseDdr4) {
  const n = c.name;
  switch (c.type) {
    case 'GPU': {
      if (/Onboard|Tích hợp|UHD Graphics|Vega|760M|740M/i.test(n)) return { ...c, ...BUDGET_GPU };
      if (c.price <= 0) return c;
      const mm = n.match(/((?:RTX|RX|Arc)\s*\d{3,4}(?:\s*(?:Ti|Super|XT))*)/i);
      const gb = n.match(/(\d+GB)\s*$/i);
      if (!mm) return c;
      const model = mm[1].replace(/\s+/g, ' ') + (gb ? ' ' + gb[1] : '');
      const poolKey = Object.keys(GPU_POOL).filter(k => model.toLowerCase().includes(k)).sort((a, b) => b.length - a.length)[0];
      const [chip, priceF, maker] = poolKey ? GPU_POOL[poolKey][p.idx] : [model, p.gpu[2], /^\s*RX\b/i.test(model) ? 'amd' : 'nvidia'];
      if (maker === 'amd') {
        const amd = AMD_LINE[p.gpu[0]] || ['Sapphire', 'Nitro+'];
        return { ...c, name: `${amd[0]} ${amd[1]} ${chip}`, price: roundPrice(c.price * priceF), desc: 'GPU Radeon — hiệu năng cùng tầm, giá cực cạnh tranh' };
      }
      if (maker === 'intel') {
        const b = INTEL_BRAND[p.gpu[0]] || 'Sparkle';
        return { ...c, name: `${b} Intel Arc ${chip.replace(/^Intel Arc\s*/i, '')}`, price: roundPrice(c.price * priceF), desc: 'Intel Arc — XeSS + AV1 encode cực mạnh cho stream/edit' };
      }
      let [brand, line] = p.gpu;
      if (brand === 'PowerColor') { brand = 'Palit'; line = 'GamingPro'; }   // PowerColor chỉ làm card AMD
      return { ...c, name: `${brand} ${line} ${chip}`, price: roundPrice(c.price * priceF), desc: GPU_DESC[brand] };
    }
    case 'Mainboard': {
      let chip, ddr4;
      if (platform) {
        if (platform.socket === 'AM4') { chip = platform.tier === 'high' ? 'B550' : platform.tier === 'budget' ? 'A520M' : 'B550M'; ddr4 = true; }
        else if (platform.socket === 'AM5') { chip = platform.tier === 'high' ? 'X670E' : platform.tier === 'budget' ? 'A620M' : 'B650M'; ddr4 = false; }
        else { chip = platform.tier === 'high' ? 'Z790' : platform.tier === 'budget' ? 'H610M' : 'B760M'; ddr4 = baseDdr4; }
      } else {
        const chipM = n.match(/\b([BHZXA]\d{3}[XHE]*M?)\b/i);
        if (!chipM) return c;
        chip = chipM[1].toUpperCase();
        ddr4 = /DDR4/i.test(n);
      }
      const ddr = ddr4 ? ' DDR4' : '';
      const isHigh = platform ? platform.tier === 'high' : (/^[XZ]/i.test(chip) || c.price >= 6000000);
      const isBudget = platform ? platform.tier === 'budget' : (/^[HA]/i.test(chip) || c.price <= 2500000);
      const brand = p.board[0];
      let name;
      if (brand === 'ASUS') name = isBudget ? `ASUS PRIME ${chip}-A${ddr}` : isHigh ? `ASUS ROG STRIX ${chip}-E GAMING WIFI` : `ASUS TUF GAMING ${chip}-PLUS WIFI${ddr}`;
      else if (brand === 'MSI') name = isBudget ? `MSI PRO ${chip}-A WIFI${ddr}` : isHigh ? `MSI MPG ${chip} EDGE WIFI` : `MSI MAG ${chip} ${chip.endsWith('M') ? 'MORTAR' : 'TOMAHAWK'} WIFI${ddr}`;
      else if (brand === 'GIGABYTE') name = isBudget ? `GIGABYTE ${chip} DS3H${ddr}` : isHigh ? `GIGABYTE ${chip} AORUS ELITE AX` : `GIGABYTE ${chip} GAMING X AX${ddr}`;
      else name = isBudget ? `ASRock ${chip} Pro RS${ddr}` : isHigh ? `ASRock ${chip} Taichi` : `ASRock ${chip} Steel Legend`;
      const tier = isHigh ? 'cao cấp' : isBudget ? 'giá tốt, ổn định' : 'tầm trung đầy đủ tính năng';
      return { ...c, name, price: roundPrice(c.price * p.board[1]), desc: `Bo mạch ${brand} ${tier} cho socket ${chip}` };
    }
    case 'RAM': {
      const rm = n.match(/(\d+)GB\s*\((\d+x\d+GB)\)\s*(DDR\d)(?:\s+(\d{4}))?/i);
      if (!rm) return c;
      const rgb = /RGB/i.test(n);
      const [brand, factor0] = p.ram;
      let factor = factor0;
      const ddr5 = /DDR5/i.test(n), spd = rm[4] ? +rm[4] : 0;
      let line;
      if (brand === 'Corsair') line = rgb ? (ddr5 && (spd >= 6400 || p.idx === 0) ? 'Dominator Platinum RGB' : 'Vengeance RGB') : 'Vengeance';
      else if (brand === 'G.Skill') line = !ddr5 ? 'Ripjaws V' : (rgb ? ((spd >= 6400 || p.idx === 1) ? 'Trident Z Royal RGB' : 'Trident Z5 RGB') : 'Trident Z5');
      else if (brand === 'Kingston') line = 'Fury Beast' + (rgb ? ' RGB' : '');
      else if (brand === 'Crucial') line = 'Pro';
      else line = (/DDR5/i.test(n) ? 'T-Force Delta' : 'T-Force Vulcan') + (rgb ? ' RGB' : '');
      let speed = rm[4] ? ' ' + rm[4] : '';
      if ((p.idx === 1 || p.idx === 3) && !rm[4]) {
        speed = rm[3].toUpperCase() === 'DDR5' ? ' 6000' : ' 3200';
        factor *= 1.05;
      }
      return { ...c, name: `${brand} ${line} ${rm[1]}GB (${rm[2]}) ${rm[3].toUpperCase()}${speed}${rgb ? ' RGB' : ''}`, price: roundPrice(c.price * factor), desc: `RAM ${rm[3].toUpperCase()}${speed.trim() ? ' ' + speed.trim() + 'MHz' : ''} chính hãng, bảo hành trọn đời` };
    }
    case 'Storage': {
      if (/RAID|x2|\+/i.test(n)) return c;
      const sm = n.match(/(\d+(?:TB|GB))/i);
      if (!sm) return c;
      const gen = n.match(/PCIe\s*(\d(?:\.0)?)|Gen\s*(\d)/i);
      const g = gen ? (gen[1] || gen[2]) : null;
      const [brand, model, factor] = p.ssd;
      return { ...c, name: `${brand} ${model} ${sm[1].toUpperCase()} NVMe${g ? ' PCIe ' + g + '.0' : ''}`, price: roundPrice(c.price * factor), desc: 'Ổ NVMe tốc độ cao, load hệ thống và dự án nhanh' };
    }
    case 'PSU': {
      if (c.price <= 0) return c;
      const w = n.match(/(\d{3,4})\s*W/i);
      if (!w) return c;
      const watt = w[1];
      const certM = n.match(/(Gold|Bronze|Platinum|Titanium)/i);
      const cert = certM ? certM[1] : null;
      const [brand, factor] = p.psu;
      let model;
      if (brand === 'Corsair') model = cert === 'Gold' ? `RM${watt}e ${watt}W 80+ Gold` : `CV${watt} ${watt}W${cert ? ' 80+ ' + cert : ''}`;
      else if (brand === 'MSI') model = cert === 'Gold' ? `MAG A${watt}GL ${watt}W 80+ Gold` : `MAG A${watt}BN ${watt}W${cert ? ' 80+ ' + cert : ''}`;
      else if (brand === 'Gigabyte') model = cert === 'Gold' ? `GP-UD${watt}GM PG5 ${watt}W Gold` : `GP-P${watt}B ${watt}W${cert ? ' 80+ ' + cert : ''}`;
      else if (brand === 'Seasonic') model = `Focus GX-${watt} ${watt}W${cert ? ' 80+ ' + cert : ''}`;
      else model = cert === 'Gold' ? `Pure Power 12 M ${watt}W Gold` : `System Power 10 ${watt}W${cert ? ' 80+ ' + cert : ''}`;
      return { ...c, name: `${brand} ${model}`, price: roundPrice(c.price * factor), desc: `Nguồn ${watt}W${cert ? ' chuẩn ' + cert : ''} — ổn định cho toàn bộ cấu hình` };
    }
    case 'Cooler': {
      if (c.price <= 0) return c;
      const aioM = n.match(/(\d{3})\s*mm/i);
      let name, desc;
      if (/AIO|Liquid/i.test(n) && aioM) {
        [name, desc] = AIO_COOLERS(aioM[1])[p.cooler];
      } else if (c.price >= 700000) {
        [name, desc] = AIR_BIG_COOLERS[p.cooler];
      } else {
        [name, desc] = AIR_SMALL_COOLERS[p.cooler];
      }
      return { ...c, name, desc };
    }
    default:
      return c;
  }
}

function miniVariants(base) {
  const find = t => base.find(c => c.type === t);
  const bare = find('Barebone'), cpu = find('CPU'), adapter = find('Adapter');
  const configs = [
    { label: 'NUC 13 Pro · i5-1340P · 16GB · 512GB', bare: 'Mini PC ASUS NUC 13 Pro (i5-1340P)', barePrice: 11900000, cpu: 'Intel Core i5-1340P Tích hợp', ram: 'Crucial 16GB (2x8GB) DDR5 SODIMM', ramPrice: 1600000, ssd: 'Samsung 980 PRO 512GB NVMe Gen4', ssdPrice: 1900000 },
    { label: 'NUC 13 Pro · i7-13700H · 32GB · 512GB' },
    { label: 'NUC 13 Pro · i7-13700H · 32GB · 1TB', ssd: 'Samsung 990 PRO 1TB NVMe Gen4', ssdPrice: 4000000 },
    { label: 'NUC 13 Pro · i7-13700H · 64GB · 1TB', ram: 'Crucial 64GB (2x32GB) DDR5 SODIMM', ramPrice: 5400000, ssd: 'Samsung 990 PRO 1TB NVMe Gen4', ssdPrice: 4000000 },
    { label: 'NUC 13 Pro · i7-13700H · 64GB · 2TB', ram: 'Crucial 64GB (2x32GB) DDR5 SODIMM', ramPrice: 5400000, ssd: 'Samsung 990 PRO 2TB NVMe Gen4', ssdPrice: 4900000 },
  ];
  return configs.map(cf => ({
    label: cf.label,
    tags: ['ASUS NUC', 'Intel', (cf.ram || find('RAM').name).split(' ')[0], 'Samsung'],
    components: [
      { type: 'Barebone', name: cf.bare || bare.name, desc: 'Mini PC nhỏ gọn, hiệu năng bất ngờ', price: cf.barePrice || bare.price, icon: '🖥️', color: 'border-l-purple-500' },
      { type: 'CPU', name: cf.cpu || cpu.name, desc: 'CPU mobile 13th gen tích hợp sẵn', price: 0, icon: '⚡', color: 'border-l-red-500' },
      { type: 'RAM', name: cf.ram || find('RAM').name, desc: 'RAM SODIMM DDR5 cho mini PC', price: cf.ramPrice !== undefined ? cf.ramPrice : find('RAM').price, icon: '💾', color: 'border-l-indigo-500' },
      { type: 'Storage', name: cf.ssd || find('Storage').name, desc: 'Ổ NVMe tốc độ cao', price: cf.ssdPrice !== undefined ? cf.ssdPrice : find('Storage').price, icon: '💿', color: 'border-l-amber-500' },
      { ...adapter }
    ]
  }));
}

function macVariants(opt, idx) {
  const C = (type, name, desc, price, icon, color) => ({ type, name, desc, price, icon, color });
  const V = (label, tags, comps) => ({ label, tags, components: comps });
  const SOC_D = 'Chip Apple Silicon hiệu năng khủng, tiết kiệm điện';
  if (idx === 0) {
    const mini = (label, tags, socName, socPrice, ssdName, ssdPrice) => V(label, tags, [
      C('SoC', socName, SOC_D, socPrice, '🍎', 'border-l-slate-400'),
      C('RAM', tags[1] + ' Unified Memory', 'Unified Memory dùng chung cho CPU/GPU', 0, '💾', 'border-l-indigo-500'),
      C('Storage', ssdName, 'SSD tốc độ cao tích hợp', ssdPrice, '💿', 'border-l-amber-500'),
      C('Power', 'Built-in Power Supply 150W', 'Nguồn tích hợp yên tĩnh 100%', 0, '🔌', 'border-l-emerald-500')
    ]);
    return [
      mini('Mac mini M4 · 16GB · 256GB', ['Apple M4', '16GB', '256GB'], 'Apple M4 Chip (10-core CPU, 10-core GPU)', 13490000, '256GB Fast SSD Storage', 2500000),
      mini('Mac mini M4 · 16GB · 512GB', ['Apple M4', '16GB', '512GB'], 'Apple M4 Chip (10-core CPU, 10-core GPU)', 14990000, '512GB Fast SSD Storage', 4000000),
      mini('Mac mini M4 · 24GB · 512GB', ['Apple M4', '24GB', '512GB'], 'Apple M4 Chip (10-core CPU, 10-core GPU)', 17490000, '512GB Fast SSD Storage', 4000000),
      mini('Mac mini M4 · 32GB · 512GB', ['Apple M4', '32GB', '512GB'], 'Apple M4 Chip (10-core CPU, 10-core GPU)', 20490000, '512GB Fast SSD Storage', 4000000),
      mini('Mac mini M4 Pro · 24GB · 512GB', ['Apple M4 Pro', '24GB', '512GB'], 'Apple M4 Pro Chip (12-core CPU, 16-core GPU)', 24990000, '512GB Fast SSD Storage', 4000000),
    ];
  }
  if (idx === 1) {
    const mbp = (label, tags, price, socName, ramName, ssdName) => V(label, tags, [
      C('Laptop', 'MacBook Pro 14 inch Space Black', 'Màn Liquid Retina XDR, khung nhôm nguyên khối', price, '💻', 'border-l-slate-400'),
      C('SoC', socName, SOC_D, 0, '🍎', 'border-l-purple-500'),
      C('RAM', ramName, 'Unified Memory dùng chung cho CPU/GPU', 0, '💾', 'border-l-indigo-500'),
      C('Storage', ssdName, 'SSD NVMe tốc độ cao', 0, '💿', 'border-l-amber-500')
    ]);
    return [
      mbp('MacBook Pro 14 · M4 · 16GB · 512GB', ['Apple M4', '16GB', '512GB'], 42990000, 'Apple M4 Chip', '16GB Unified Memory', '512GB NVMe SSD Fast Storage'),
      mbp('MacBook Pro 14 · M4 Pro · 24GB · 512GB', ['Apple M4 Pro', '24GB', '512GB'], 49990000, 'Apple M4 Pro Chip', '24GB Unified Memory', '512GB NVMe SSD Fast Storage'),
      mbp('MacBook Pro 14 · M4 Pro · 24GB · 1TB', ['Apple M4 Pro', '24GB', '1TB'], 55990000, 'Apple M4 Pro Chip', '24GB Unified Memory', '1TB NVMe SSD Fast Storage'),
      mbp('MacBook Pro 14 · M4 Max · 36GB · 1TB', ['Apple M4 Max', '36GB', '1TB'], 69990000, 'Apple M4 Max Chip', '36GB Unified Memory', '1TB NVMe SSD Fast Storage'),
      mbp('MacBook Pro 14 · M4 Max · 48GB · 1TB', ['Apple M4 Max', '48GB', '1TB'], 77990000, 'Apple M4 Max Chip', '48GB Unified Memory', '1TB NVMe SSD Fast Storage'),
    ];
  }
  const studio = (label, tags, socName, socPrice, ramName, ramPrice, ssdName, ssdPrice) => V(label, tags, [
    C('SoC', socName, SOC_D, socPrice, '🍎', 'border-l-slate-400'),
    C('RAM', ramName, 'Unified Memory dùng chung cho CPU/GPU', ramPrice, '💾', 'border-l-indigo-500'),
    C('Storage', ssdName, 'SSD NVMe tốc độ cao', ssdPrice, '💿', 'border-l-amber-500'),
    C('Power', 'Power Supply 370W Tích hợp', 'Nguồn tích hợp yên tĩnh 100%', 0, '🔌', 'border-l-emerald-500')
  ]);
  return [
    studio('Mac Studio · M4 Max · 36GB · 512GB', ['Apple M4 Max', '36GB', '512GB'], 'Apple M4 Max Chip (16-core CPU, 40-core GPU)', 49990000, '36GB Unified Memory', 6000000, '512GB NVMe SSD High Speed', 4000000),
    studio('Mac Studio · M4 Max · 64GB · 1TB', ['Apple M4 Max', '64GB', '1TB'], 'Apple M4 Max Chip (16-core CPU, 40-core GPU)', 54990000, '64GB Unified Memory', 10000000, '1TB NVMe SSD High Speed', 6000000),
    studio('Mac Studio · M4 Max · 128GB · 1TB', ['Apple M4 Max', '128GB', '1TB'], 'Apple M4 Max Chip (16-core CPU, 40-core GPU)', 54990000, '128GB Unified Memory', 18000000, '1TB NVMe SSD High Speed', 6000000),
    studio('Mac Studio · M4 Max · 128GB · 2TB', ['Apple M4 Max', '128GB', '2TB'], 'Apple M4 Max Chip (16-core CPU, 40-core GPU)', 54990000, '128GB Unified Memory', 18000000, '2TB NVMe SSD High Speed', 10000000),
    studio('Mac Studio · M3 Ultra · 96GB · 1TB', ['Apple M3 Ultra', '96GB', '1TB'], 'Apple M3 Ultra Chip (28-core CPU, 60-core GPU)', 69990000, '96GB Unified Memory', 14000000, '1TB NVMe SSD High Speed', 6000000),
  ];
}

function autoVariants(opt) {
  const base = opt.components;
  if (base.some(c => c.type === 'Barebone')) return miniVariants(base);
  const baseCpu = (base.find(c => c.type === 'CPU') || {}).name || '';
  const baseBoard = base.find(c => c.type === 'Mainboard');
  const tier = !baseBoard ? 'mid' : baseBoard.price >= 6000000 ? 'high' : baseBoard.price <= 2500000 ? 'budget' : 'mid';
  const baseDdr4 = baseBoard ? /DDR4/i.test(baseBoard.name) : false;
  const basePlatform = /ryzen|threadripper/i.test(baseCpu) ? 'AMD' : 'Intel';
  return VARIANT_PROFILES.map(p => {
    let comps = base.map(c => ({ ...c }));
    let platformLabel = basePlatform;
    let platform = null;
    const cpuKey = findCpuKey(baseCpu);
    if (cpuKey && p.idx >= 1 && p.idx <= 3) {
      const entry = p.idx === 1 ? CPU_SWAP[cpuKey] : p.idx === 2 ? CPU_GEN[cpuKey] : CPU_SWAP4[cpuKey];
      const res = applyCpu(comps, entry);
      comps = res.comps;
      if (res.socket) {
        platform = { socket: res.socket, tier };
        platformLabel = /ryzen/i.test((comps.find(c => c.type === 'CPU') || {}).name || '') ? 'AMD' : 'Intel';
      }
    }
    comps = comps.map(c => swapComponent(c, p, platform, baseDdr4));
    const gpuOk = !/Onboard|Tích hợp/i.test((comps.find(c => c.type === 'GPU') || {}).name || '');
    return {
      label: `${platformLabel} + ${p.gpu[0]} + ${p.ram[0]}`,
      tags: [platformLabel, gpuOk ? p.gpu[0] : p.board[0], p.ram[0], p.psu[0]],
      components: comps
    };
  });
}

Object.entries(careersData).forEach(([careerKey, career]) => {
  career.options.forEach((opt, optIdx) => {
    if (!opt.variants) {
      opt.variants = careerKey === 'mac' ? macVariants(opt, optIdx) : autoVariants(opt);
    }
  });
});


/* ── Hình 3D (SVG) ── */
const PAL={blue:['#9be0ff','#3b9cf0','#1c5fc0'],navy:['#5d7fb5','#34548a','#1e3358'],purple:['#d2c4ff','#8b5cf6','#5632c4'],pink:['#ffc2de','#ee6aa9','#b3367a'],amber:['#ffe49a','#f6b330','#c27a0c'],green:['#9ff5cb','#31c88a','#178a5d'],red:['#ffb0b0','#f05252','#b32626'],cyan:['#a6f4ff','#30c8e2','#1590aa'],slate:['#eef3fa','#b4c1d6','#7f8ea8'],dark:['#56647e','#2f394e','#1b2234'],wood:['#f6d3a6','#dca064','#a96d3a']};
const ART_DEFS=`<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<linearGradient id="gloss" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></linearGradient>
<radialGradient id="hil" cx=".3" cy=".25" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<radialGradient id="shd" cx=".35" cy=".3" r=".85"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></radialGradient>
<linearGradient id="cyl" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".3"/><stop offset=".3" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient>
<linearGradient id="scr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c3aed"/><stop offset=".55" stop-color="#d946ef"/><stop offset="1" stop-color="#fb7185"/></linearGradient>
<linearGradient id="scr2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#38bdf8"/></linearGradient>
<linearGradient id="shield" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#60a5fa"/><stop offset="1" stop-color="#1d4ed8"/></linearGradient>
<linearGradient id="liq" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6ee7b7"/><stop offset="1" stop-color="#059669"/></linearGradient></defs></svg>`;
const F=(pts,c)=>`<polygon points="${pts}" fill="${c}" stroke="${c}" stroke-width="2" stroke-linejoin="round"/>`;
const BX2=(x,y,w,d,h,p)=>{const R=[x+w,y+w/2],L=[x-d,y+d/2],Fr=[x+w-d,y+(w+d)/2],j=a=>a.join(','),top=`${x},${y} ${j(R)} ${j(Fr)} ${j(L)}`;
 return F(`${j(L)} ${j(Fr)} ${Fr[0]},${Fr[1]+h} ${L[0]},${L[1]+h}`,p[1])+F(`${j(Fr)} ${j(R)} ${R[0]},${R[1]+h} ${Fr[0]},${Fr[1]+h}`,p[2])+F(top,p[0])+`<polygon points="${top}" fill="url(#gloss)"/>`;};
const TP=(x,y,w,d,u,v)=>[x+u*w-v*d,y+u*w/2+v*d/2];
const SP=(x,y,r,c)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/><circle cx="${x}" cy="${y}" r="${r}" fill="url(#shd)"/><circle cx="${x}" cy="${y}" r="${r}" fill="url(#hil)"/>`;
const CY=(x,y,r,h,c)=>{const e=`rx="${r}" ry="${r/2.4}"`;return `<rect x="${x-r}" y="${y}" width="${2*r}" height="${h}" fill="${c}"/><rect x="${x-r}" y="${y}" width="${2*r}" height="${h}" fill="url(#cyl)"/><ellipse cx="${x}" cy="${y+h}" ${e} fill="${c}"/><ellipse cx="${x}" cy="${y+h}" ${e} fill="url(#cyl)"/><ellipse cx="${x}" cy="${y}" ${e} fill="${c}"/><ellipse cx="${x}" cy="${y}" ${e} fill="#fff" opacity=".32"/>`;};
const LN=(a,b,c,w,o=1)=>`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" opacity="${o}"/>`;
const ART={
ai:()=>{const n=[[24,26],[60,12],[96,26],[38,48],[82,48]];return [[0,3],[1,3],[1,4],[2,4],[0,1],[1,2],[3,4]].map(([a,b])=>LN(n[a],n[b],'#8fb4ff',1.6,.7)).join('')+BX2(60,54,34,34,12,PAL.blue)+BX2(60,60,18,18,4,PAL.purple)+n.map((p,i)=>SP(p[0],p[1],i==1?8:6,['#a78bfa','#ec4899','#38bdf8','#34d399','#fbbf24'][i])).join('')},
'3d':()=>BX2(50,26,34,30,40,PAL.purple)+`<polygon points="50,26 84,43 54,56 20,41" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.2"/>`+CY(24,76,11,20,'#30c8e2')+SP(92,86,15,'#ee6aa9'),
editor:()=>CY(58,40,34,28,'#f05252')+[[58,31],[58,49],[42,40],[74,40]].map(([x,y])=>`<ellipse cx="${x}" cy="${y}" rx="7" ry="3" fill="#7f1d1d" opacity=".7"/>`).join('')+`<polygon points="53,36 53,45 66,40.5" fill="#fff"/>`+BX2(98,74,18,10,8,PAL.dark)+[0,1,2].map(i=>`<rect x="${88+i*7}" y="${81+i*3.5}" width="4" height="3" fill="#cbd5e1" opacity=".7"/>`).join(''),
streamer:()=>`<path d="M26 50 Q26 88 60 88 Q94 88 94 50" stroke="#c8d3e6" stroke-width="5" fill="none" stroke-linecap="round"/><rect x="57" y="88" width="6" height="12" fill="#7f8ea8"/><ellipse cx="60" cy="102" rx="20" ry="5.5" fill="#4b5870"/><rect x="44" y="8" width="32" height="68" rx="16" fill="#8b5cf6"/><rect x="44" y="8" width="32" height="68" rx="16" fill="url(#cyl)"/>`+[18,26,34,42,50].map(y=>`<line x1="49" y1="${y}" x2="71" y2="${y}" stroke="#3b1d8f" stroke-opacity=".45" stroke-width="2" stroke-linecap="round"/>`).join('')+`<rect x="44" y="58" width="32" height="6" fill="#c8d3e6"/><rect x="84" y="10" width="30" height="15" rx="7.5" fill="#ef4444"/><circle cx="93" cy="17.5" r="3" fill="#fff"/><text x="104" y="21" text-anchor="middle" font-size="7.5" font-weight="800" fill="#fff" font-family="sans-serif">LIVE</text>`,
coder:()=>BX2(96,70,16,16,14,PAL.amber)+BX2(80,82,12,12,10,PAL.amber)+`<g transform="matrix(1 -.16 0 1 0 12)"><rect x="10" y="22" width="86" height="62" rx="7" fill="#12203d" stroke="#3b9cf0" stroke-width="1.5"/><path d="M10 29 a7 7 0 0 1 7 -7 h72 a7 7 0 0 1 7 7 v5 h-86z" fill="#1e3358"/>`+['#f87171','#fbbf24','#34d399'].map((c,i)=>`<circle cx="${18+i*7}" cy="28" r="2.2" fill="${c}"/>`).join('')+[[16,44,30,'#7dd3fc'],[24,53,40,'#c4b5fd'],[24,62,24,'#86efac'],[16,71,34,'#fcd34d']].map(([x,y,w,c])=>`<rect x="${x}" y="${y}" width="${w}" height="4.5" rx="2.2" fill="${c}"/>`).join('')+`<text x="76" y="76" text-anchor="middle" font-size="15" font-weight="800" font-family="monospace" fill="#38bdf8" opacity=".9">&lt;/&gt;</text></g>`,
office:()=>`<g transform="translate(0 -10)"><rect x="15" y="62" width="5" height="28" fill="#a96d3a"/><rect x="71" y="90" width="5" height="26" fill="#8a5a30"/><rect x="103" y="74" width="5" height="26" fill="#a96d3a"/>`+BX2(52,40,56,34,6,PAL.wood)+BX2(46,42,14,10,5,PAL.pink)+BX2(46,37,14,10,5,PAL.blue)+`<polygon points="66,56 92,69 92,40 66,27" fill="#1b2234"/><polygon points="69,56 89,66 89,44 69,34" fill="#3b9cf0"/><polygon points="69,34 89,44 89,50 69,40" fill="#fff" opacity=".25"/>`+BX2(66,56,26,18,3,PAL.slate)+CY(95,58,5,8,'#fff')+`</g>`,
mac:()=>`<rect x="14" y="12" width="92" height="62" rx="8" fill="#eef3fa"/><rect x="14" y="12" width="92" height="62" rx="8" fill="url(#gloss)"/><rect x="19" y="17" width="82" height="46" rx="3" fill="url(#scr)"/><polygon points="19,17 101,17 50,63 19,63" fill="#fff" opacity=".13"/><circle cx="60" cy="68.5" r="2.6" fill="#9aa8bd"/><polygon points="53,74 67,74 72,98 48,98" fill="#b4c1d6"/><ellipse cx="60" cy="100" rx="26" ry="6" fill="#aab8cf"/><rect x="86" y="54" width="26" height="44" rx="6" fill="#1b2234" stroke="#7f8ea8" stroke-width="1.5"/><rect x="89" y="58" width="20" height="36" rx="3" fill="url(#scr2)"/>`,
data:()=>BX2(60,52,40,40,6,PAL.dark)+BX2(80,29,10,10,22,PAL.green)+BX2(62,31,10,10,34,PAL.amber)+BX2(44,45,10,10,14,PAL.blue)+`<polyline points="30,40 52,30 72,20 98,10" fill="none" stroke="#67e8f9" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`+[[30,40],[52,30],[72,20],[98,10]].map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="#fff" stroke="#22d3ee" stroke-width="1.5"/>`).join(''),
architecture:()=>BX2(60,70,44,40,5,PAL.dark)+BX2(50,16,22,22,56,PAL.blue)+[1,2,3,4,5,6].map(k=>LN([28,27+k*8],[50,38+k*8],'#fff',1.2,.4)+LN([50,38+k*8],[72,27+k*8],'#fff',1.2,.25)).join('')+BX2(88,52,18,18,30,PAL.slate)+[1,2,3].map(k=>LN([70,61+k*8],[88,70+k*8],'#7f8ea8',1.2,.6)).join('')+LN([50,16],[50,6],'#cbd5e1',2),
security:()=>`<path d="M52 8 L92 22 V54 C92 78 74 92 52 102 C30 92 12 78 12 54 V22 Z" fill="url(#shield)" stroke="#60a5fa" stroke-width="2" stroke-linejoin="round"/><path d="M52 8 L92 22 V54 C92 78 74 92 52 102 Z" fill="#000" opacity=".22"/><path d="M52 8 L12 22 V54 C12 62 15 68 19 73 L52 20 Z" fill="#fff" opacity=".18"/><polyline points="34,52 47,65 70,38" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M76 64 V56 a13 13 0 0 1 26 0 V64" fill="none" stroke="#d8e1ee" stroke-width="6" stroke-linecap="round"/><rect x="66" y="62" width="46" height="36" rx="8" fill="#f6b330"/><rect x="66" y="62" width="46" height="36" rx="8" fill="url(#gloss)"/><circle cx="89" cy="76" r="5" fill="#7c4a03"/><rect x="87" y="78" width="4" height="11" rx="2" fill="#7c4a03"/>`,
music:()=>{const x=58,y=36,w=56,d=32;let o=BX2(x,y,w,d,14,['#6b7a96','#3a465e','#222b40']);for(let i=0;i<5;i++){const u=.12+i*.19;o+=LN(TP(x,y,w,d,u,.4),TP(x,y,w,d,u,.9),'#0b1120',2.6);const c=TP(x,y,w,d,u,.4+((i*37)%5)*.1);o+=CY(c[0],c[1]-2,3,2,['#f05252','#fbbf24','#31c88a','#3b9cf0','#ee6aa9'][i]);const k=TP(x,y,w,d,u,.17);o+=CY(k[0],k[1]-3,3.4,3,['#a6f4ff','#ffe49a','#d2c4ff','#9ff5cb','#ffc2de'][i]);}return o},
product:()=>BX2(62,28,44,7,22,PAL.cyan)+BX2(58,54,44,22,12,PAL.cyan)+LN([100,28],[100,96],'#94a3b8',3)+`<polygon points="89,30 111,30 106,14 94,14" fill="#f6b330"/><polygon points="89,30 111,30 106,14 94,14" fill="url(#gloss)"/><ellipse cx="100" cy="98" rx="9" ry="3" fill="#64748b"/>`,
mobile:()=>`<g transform="rotate(-8 60 60)"><rect x="36" y="8" width="48" height="98" rx="12" fill="#1b2234" stroke="#7f8ea8" stroke-width="1.5"/><rect x="41" y="13" width="38" height="88" rx="8" fill="url(#scr2)"/><rect x="52" y="16" width="16" height="4.5" rx="2.2" fill="#0b1120"/>`+['#f472b6','#fbbf24','#34d399','#f87171','#a78bfa','#22d3ee','#fb923c','#4ade80','#60a5fa','#e879f9','#facc15','#2dd4bf'].map((c,i)=>`<rect x="${45+(i%3)*11.5}" y="${28+Math.floor(i/3)*16}" width="9.5" height="11" rx="3" fill="${c}"/>`).join('')+`<polygon points="41,13 79,13 41,60" fill="#fff" opacity=".13"/></g>`,
web3:()=>LN([60,30],[30,72],'#f6b330',5)+LN([60,30],[90,72],'#f6b330',5)+LN([30,72],[90,72],'#f6b330',5)+BX2(60,14,16,16,16,PAL.pink)+BX2(30,56,16,16,16,PAL.cyan)+BX2(90,56,16,16,16,PAL.purple)+[[45,51],[75,51],[60,72]].map(p=>SP(p[0],p[1],4.5,'#fde68a')).join(''),
science:()=>`<rect x="42" y="6" width="26" height="8" rx="4" fill="#cbd5e1"/><path d="M45 14 H65 V40 L90 86 Q96 102 80 102 H30 Q14 102 20 86 L45 40 Z" fill="#dff3ff" fill-opacity=".22" stroke="#cfe8ff" stroke-width="3" stroke-linejoin="round"/><path d="M30 66 H80 L90 86 Q96 102 80 102 H30 Q14 102 20 86 Z" fill="url(#liq)"/><path d="M30 66 H80 L90 86 Q96 102 80 102 H55 Z" fill="#000" opacity=".18"/><path d="M30 66 Q55 72 80 66" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2"/><circle cx="46" cy="86" r="4.5" fill="#fff" opacity=".6"/><circle cx="64" cy="80" r="3" fill="#fff" opacity=".6"/><circle cx="58" cy="54" r="3.5" fill="#fff" opacity=".5"/><path d="M48 18 V40 L28 80" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2.5" stroke-linecap="round"/>`+SP(100,34,5,'#a78bfa')+SP(14,50,4,'#38bdf8'),
};
const artSVG=k=>`<svg viewBox="0 0 120 120"><ellipse cx="60" cy="109" rx="40" ry="5" fill="#000" opacity=".3"/>${(ART[k]||ART.coder)()}</svg>`;

/* ── Sơ đồ lắp ráp linh kiện (isometric thực tế) ── */
const TYPE_LABEL = { Mainboard: 'MAINBOARD', Barebone: 'MAIN BOARD', Laptop: 'MAIN UNIT', CPU: 'CPU', SoC: 'CHIP', Cooler: 'COOLER', Adapter: 'ADAPTER', GPU: 'VGA', RAM: 'RAM', Storage: 'STORAGE', PSU: 'PSU', Power: 'POWER' };

const RIG_DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <linearGradient id="isoGlass" x1="0" y1="0" x2=".8" y2="1"><stop offset="0" stop-color="#dff3ff" stop-opacity=".30"/><stop offset=".45" stop-color="#a9cdf0" stop-opacity=".08"/><stop offset="1" stop-color="#7fb6e8" stop-opacity=".20"/></linearGradient>
  <linearGradient id="isoStreak" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".42"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".24"/></linearGradient>
  <pattern id="isoMesh" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="1.5" fill="#0b1120" opacity=".5"/></pattern>
  <linearGradient id="isoMetal" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#eef2f7"/><stop offset=".5" stop-color="#aeb9c9"/><stop offset="1" stop-color="#7c8798"/></linearGradient>
  <radialGradient id="isoFanShade" cx=".5" cy=".5" r=".5"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
</defs></svg>`;

const ISO_REDUCE = (typeof window !== 'undefined' && window.matchMedia) ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;
/* ── 3D thật (three.js): toạ độ gốc (x,y,z) giữ nguyên, z hướng lên → three (x,z,y) ── */
/* Chỉ linh kiện có RGB mới phát sáng; không có thì để đen–trắng–xám */
const ISO_RGB_RE = /\b(a?rgb|aura|prism|mystic|dominator|trident|strix|aorus|suprim|kraken|icue|rog|lighting|led)\b/i;
let ISO_GPU_HUB = '#e3e8f0', ISO_RGB = true, ISO_G = null, ISO_ROOT = null, ISO_FANS = [], ISO_RINGS = [], ISO_GLOWS = [], ISO_CABLES = [], ISO_BREATH = [], ISO_CUR = null, ISO_BS = null, ISO_D = 420;
const isoV = (x, y, z) => new THREE.Vector3(x, z, y);
const isoCol = c => { const m = /rgba?\(([\d.\s,]+)\)/.exec(c); if (m) { const v = m[1].split(',').map(Number); return { c: new THREE.Color(v[0] / 255, v[1] / 255, v[2] / 255), o: v[3] == null ? 1 : v[3] }; } return { c: new THREE.Color(c), o: 1 }; };
const isoMat = c => { const k = isoCol(c); return new THREE.MeshStandardMaterial({ color: k.c, transparent: k.o < 1, opacity: k.o, side: THREE.DoubleSide, depthWrite: k.o >= 1, roughness: .46, metalness: .55, envMapIntensity: 1 }); };
const isoAccent = () => (getComputedStyle(document.body).getPropertyValue('--accent-hex') || '').trim() || '#a855f7';
function isoBox(x0, y0, z0, x1, y1, z1, base, tex) {
  const mt = isoMat(base); if (tex) { mt.map = tex; mt.color.set('#ffffff'); }
  const m = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x1 - x0) || .1, Math.abs(z1 - z0) || .1, Math.abs(y1 - y0) || .1), mt);
  m.position.set((x0 + x1) / 2, (z0 + z1) / 2, (y0 + y1) / 2); ISO_G.add(m); return '';
}
function isoFill(pts, fill) {
  if (fill === 'url(#isoGlass)') fill = 'rgba(169,205,240,.10)';
  if (!/^(#[0-9a-f]{3,6}$|rgba?)/i.test(fill) || /^#fff$/i.test(fill)) return '';
  const v = pts.map(q => isoV(q[0], q[1], q[2])), pos = [];
  for (let i = 1; i < v.length - 1; i++) pos.push(v[0].x, v[0].y, v[0].z, v[i].x, v[i].y, v[i].z, v[i + 1].x, v[i + 1].y, v[i + 1].z);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
  ISO_G.add(new THREE.Mesh(g, isoMat(fill))); return '';
}
function isoLine3(a, b, color, w, op) {
  const k = isoCol(color), g = new THREE.BufferGeometry().setFromPoints([isoV(a[0], a[1], a[2]), isoV(b[0], b[1], b[2])]);
  ISO_G.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: k.c, transparent: true, opacity: op * k.o }))); return '';
}
function isoSleeveTex() {
  const t = isoCanvasTex('sleeve', 128, 128, (k, w, h) => {
    k.fillStyle = '#d9dee5'; k.fillRect(0, 0, w, h);   // nền sáng để màu cáp gốc vẫn lên đúng
    k.strokeStyle = 'rgba(70,76,86,.85)'; k.lineWidth = 7;
    for (let i = -h; i < w + h; i += 18) { k.beginPath(); k.moveTo(i, 0); k.lineTo(i + h, h); k.stroke(); }
    k.strokeStyle = 'rgba(255,255,255,.5)'; k.lineWidth = 2;
    for (let i = -h; i < w + h; i += 18) { k.beginPath(); k.moveTo(i + 5, 0); k.lineTo(i + 5 + h, h); k.stroke(); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(26, 2);
  return t;
}
function isoCable(a, b, sag, color, w) {
  if (!a || !b) return '';
  const Av = isoV(a[0], a[1], a[2]), Bv = isoV(b[0], b[1], b[2]);
  const curve0 = new THREE.CatmullRomCurve3([Av, Bv]), len = curve0.getLength();
  const M = Av.clone().add(Bv).multiplyScalar(.5); M.y -= Math.abs(sag || 18) * .55;   // võng dây
  const up = new THREE.Vector3(0, 1, 0);
  let lat = new THREE.Vector3().crossVectors(Bv.clone().sub(Av).normalize(), up);
  if (lat.lengthSq() < .01) lat.set(1, 0, 0); lat.normalize();
  const bow = len * .02;   // cong chữ S tự nhiên
  const P1 = Av.clone().lerp(M, .5).addScaledVector(lat, bow);
  const P2 = M.clone().lerp(Bv, .5).addScaledVector(lat, -bow);
  const pts = [Av.clone(), P1, M.clone(), P2, Bv.clone()];
  const r = (w || 5) * .85;
  const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color || '#0d1117'), map: isoSleeveTex(), roughness: .62, metalness: .08 });
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 22, r, 7), mat);
  ISO_G.add(mesh);
  const cu0 = new THREE.CatmullRomCurve3(pts);
  const conn = (P, dir, plug) => { const m2 = new THREE.Mesh(new THREE.BoxGeometry(r * 1.9, r * 1.7, 9), isoMat(plug ? '#2b3038' : '#101318')); m2.position.copy(P).addScaledVector(dir, 3); m2.lookAt(P.clone().addScaledVector(dir, 20)); ISO_G.add(m2); };
  conn(Av, cu0.getTangentAt(0), false); conn(Bv, cu0.getTangentAt(1), true);   // đầu nối 2 đầu
  const combs = [];
  if ((w || 0) >= 7) for (const tt of [.35, .55, .75]) {   // lược chải cáp cho dây to (24-pin)
    const p = cu0.getPointAt(tt), tn = cu0.getTangentAt(tt);
    const cb = new THREE.Mesh(new THREE.BoxGeometry(r * 2.5, r * 1.15, 3), isoMat('#c9ced6'));
    cb.position.copy(p); cb.lookAt(p.clone().add(tn)); ISO_G.add(cb); combs.push({ m: cb, t: tt });
  }
  ISO_CABLES.push({ mesh, pts, lat, phase: Math.random() * 6.28, amp: Math.max(.5, r * .22), r, combs });
  return '';
}
function isoGlowTex() {
  return isoCanvasTex('glows', 128, 128, (k, w, h) => { const gd = k.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2); gd.addColorStop(0, 'rgba(255,255,255,.95)'); gd.addColorStop(.35, 'rgba(255,255,255,.4)'); gd.addColorStop(1, 'rgba(255,255,255,0)'); k.fillStyle = gd; k.fillRect(0, 0, w, h); });
}
function isoSprite(x, y, z, size, op) {
  const m = new THREE.SpriteMaterial({ map: isoGlowTex(), transparent: true, opacity: op == null ? .5 : op, blending: THREE.AdditiveBlending, depthWrite: false });
  const s = new THREE.Sprite(m); s.position.set(x, z, y); const sc = Math.max(size, .1); s.scale.set(sc, sc, 1); s.raycast = () => {}; ISO_G.add(s); return s;
}
function isoLedGlow(m, x0, y0, z0, x1, y1, z1) {
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), dz = Math.abs(z1 - z0);
  const L = Math.max(dx, dy, dz, .1);
  const n = Math.max(1, Math.min(8, Math.round(L / 30)));
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2;
  for (let i = 0; i < n; i++) {
    const f = n === 1 ? 0 : (i / (n - 1) - .5);
    const px = cx + (dx === L ? f * L * .9 : 0);
    const py = cy + (dy === L ? f * L * .9 : 0);
    const pz = cz + (dz === L ? f * L * .9 : 0);
    const h = isoSprite(px, py, pz, Math.min(L * .5, 26), .5);
    ISO_GLOWS.push({ s: m, h });
  }
}
function isoLed(x0, y0, z0, x1, y1, z1, col, fx) {
  if (!ISO_RGB) return '';
  const m = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x1 - x0) || .1, Math.abs(z1 - z0) || .1, Math.abs(y1 - y0) || .1), new THREE.MeshBasicMaterial({ color: col ? new THREE.Color(col) : 0xffffff }));
  m.position.set((x0 + x1) / 2, (z0 + z1) / 2, (y0 + y1) / 2); ISO_G.add(m);
  if (!col) { ISO_RINGS.push(m); isoLedGlow(m, x0, y0, z0, x1, y1, z1); }
  else if (fx === 'breath') {   // thở: sáng mạnh → mờ dần (kiểu LED nút nguồn / pump ngoài đời)
    const L = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0));
    const h = isoSprite((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, L * 2 + 3, .3);
    ISO_BREATH.push({ m, h, col: new THREE.Color(col), ph: ISO_BREATH.length * 1.4 });
  }
  return '';
}
function isoFan(cx, cy, cz, axis, r, tint = '#2b3648', glow = true, gpu = false, thick = false, caseFan = false, flip = false) {
  const g = new THREE.Group(); g.position.set(cx, cz, cy);
  if (axis === 'z') g.rotation.x = -Math.PI / 2; else if (axis === 'x') g.rotation.y = flip ? -Math.PI / 2 : Math.PI / 2;
  const T = thick ? 22 : 3, ex = (sh, d, mat, z) => { const geo = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false }); geo.translate(0, 0, -d / 2); const m = new THREE.Mesh(geo, mat); m.position.z = z || 0; return m; };
  const GS = gpu || (!caseFan && !thick);   // quạt GPU + mọi quạt linh kiện (tản AIO, tản khí, PSU) dùng chung một kiểu dựng
  if (!thick) {
    if (!caseFan) { const dk = new THREE.Mesh(new THREE.CircleGeometry(r, 40), isoMat(GS ? 'rgba(12,19,34,.3)' : '#2b3448')); dk.position.z = -.6; g.add(dk); }   // quạt case hở lưng để nhìn xuyên qua
    if (GS) g.add(new THREE.Mesh(new THREE.RingGeometry(r * .94, r * 1.13, 8, 1, Math.PI / 8), isoMat('#0e1218')));   // khung vuông quanh quạt linh kiện
  } else {                                            // khung quạt vuông dày 22mm, có lỗ tròn
    const h = r, f = new THREE.Shape(); f.moveTo(-h, -h); f.lineTo(h, -h); f.lineTo(h, h); f.lineTo(-h, h); f.lineTo(-h, -h);
    const hole = new THREE.Path(); hole.absarc(0, 0, r * .92, 0, Math.PI * 2, true); f.holes.push(hole);
    g.add(ex(f, T, isoMat('#1b212c')));
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(q => { const k = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, T + 2, 10), isoMat('#0b0e13')); k.rotation.x = Math.PI / 2; k.position.set(q[0] * h * .86, q[1] * h * .86, 0); g.add(k); });   // lỗ/ốc bắt quạt
  }
  const bl = new THREE.Group(), bd = thick ? 4 : GS ? 2.4 : 1.2;
  const sh = new THREE.Shape(); sh.moveTo(r * .20, 0);
  sh.bezierCurveTo(r * .28, -r * .30, r * .32, -r * .58, r * .44, -r * .74);
  sh.bezierCurveTo(r * .54, -r * .84, r * .64, -r * .80, r * .64, -r * .69);
  sh.bezierCurveTo(r * .63, -r * .54, r * .50, -r * .37, r * .38, -r * .19);
  sh.bezierCurveTo(r * .31, -r * .09, r * .24, -r * .03, r * .20, 0);
  const bg = new THREE.ExtrudeGeometry(sh, { depth: bd, bevelEnabled: false }); bg.translate(0, 0, -bd / 2);
  const spin = GS ? 12.8 : 16;   // quạt linh kiện = 80% tốc độ quạt case
  const bm = isoMat('#14161a');
  if (!caseFan) { bm.color.set('#000000'); bm.roughness = .9; bm.metalness = 0; bm.envMapIntensity = 0; }   // cánh quạt linh kiện đen nhám kiểu GPU
  const bmat = bm;
  if (caseFan) { bmat.transparent = true; bmat.opacity = .95; bmat.depthWrite = false; }   // cánh gần như đặc, chỉ hơi trong một chút
  for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(bg, bmat); b.rotation.order = 'ZXY'; b.rotation.x = thick ? .15 : 0; b.rotation.z = i * Math.PI * 2 / 9; bl.add(b); }
  g.add(bl);
  if (!gpu && caseFan && ISO_RGB) ISO_RINGS.push({ material: bmat, userData: { ph: 0, cf: 1 } });   // chỉ cánh quạt case đổi màu (quạt tản giữ cánh tối như thật)
  if (GS) { const hub = new THREE.Mesh(new THREE.CircleGeometry(r * .34, 40), isoMat('#1b1e24')); hub.position.z = 1.6; g.add(hub); const hr = new THREE.Mesh(new THREE.RingGeometry(r * .30, r * .34, 40), isoMat('#2e333b')); hr.position.z = 1.7; g.add(hr); const mo = new THREE.Mesh(new THREE.CylinderGeometry(r * .30, r * .30, 5, 32), isoMat('#101318')); mo.rotation.x = Math.PI / 2; mo.position.z = -2; g.add(mo); }   // hub + vành + mô-tơ kiểu quạt GPU (đứng yên, cánh quay quanh nó)
  else if (thick) { const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * .3, r * .3, 14, 24), isoMat('#10151d')); hub.rotation.x = Math.PI / 2; g.add(hub); if (caseFan && ISO_RGB) { hub.userData.ph = 0; hub.userData.cf = 1; ISO_RINGS.push(hub); } }
  if (caseFan) {
    const hb = new THREE.Mesh(new THREE.CircleGeometry(r * .17, 24), isoMat('#39445a')); hb.position.z = .5; g.add(hb);   // hub giữa (cánh ma bám quanh)
    if (ISO_RGB) { hb.userData.ph = 0; hb.userData.cf = 1; ISO_RINGS.push(hb); }   // hub quạt case phát sáng đồng bộ ring
  }
  let fanRg = null;
  if (glow && ISO_RGB) { const rg = new THREE.Mesh(thick ? new THREE.RingGeometry(r * .92, r * .96, 48) : new THREE.RingGeometry(r * .93, r * .99, 40), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })); rg.position.z = thick ? T / 2 + .2 : .3; g.add(rg); rg.userData.ph = GS ? ISO_FANS.length * .17 : 0; rg.userData.cf = (!GS && caseFan) ? 1 : 0; ISO_RINGS.push(rg); fanRg = rg;   // case fan đồng bộ pha + quay màu nhanh riêng
      const cm = isoCanvasTex('glow', 128, 128, (k, w, h) => { const gd = k.createRadialGradient(w / 2, h / 2, 8, w / 2, h / 2, w / 2); gd.addColorStop(0, 'rgba(255,255,255,.5)'); gd.addColorStop(.55, 'rgba(255,255,255,.16)'); gd.addColorStop(1, 'rgba(255,255,255,0)'); k.fillStyle = gd; k.fillRect(0, 0, w, h); });
      const hg = new THREE.Mesh(new THREE.PlaneGeometry(r * 2.5, r * 2.5), new THREE.MeshBasicMaterial({ map: cm, transparent: true, opacity: .45, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); hg.position.z = rg.position.z; hg.raycast = () => {}; g.add(hg); ISO_GLOWS.push({ s: rg, h: hg }); }
  if (caseFan && fanRg) { const sp = new THREE.Mesh(new THREE.RingGeometry(r * .3, r * .94, 40), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .22, depthWrite: false, side: THREE.DoubleSide })); sp.position.z = .1; sp.raycast = () => {}; g.add(sp); ISO_GLOWS.push({ s: fanRg, h: sp }); }
  ISO_FANS.push({ b: bl, s: spin });
  ISO_G.add(g); return '';
}

function parseIsoMeta(c) {
  const n = c.name || '', t = c.type || '';
  const m = { name: n, type: t };
  if (t === 'GPU') {
    m.fans = /3X|WINDFORCE|TUF|SUPRIM|GAMING X|TRIO|HELLHOUND|ROG STRIX|AERO|NITRO|MERC|QICK|QUICK|PHANTOM|RED DEVIL/i.test(n) ? 3 : 2;
    m.len = /4090|4080|7900|3090|5090|5080|Ti Super/i.test(n) ? 336 : /4060|3060|3050|7600/i.test(n) ? 245 : 300;   // chiều dài thật: 336 / 300 / 245 mm
    m.onboard = /Onboard|Tích hợp|UHD/i.test(n);
  } else if (t === 'RAM') {
    const mm = n.match(/\((\d)\s*[x×]/i);
    m.sticks = mm ? Math.max(1, Math.min(4, +mm[1])) : /128GB|64GB/.test(n) ? 4 : 2;
  } else if (t === 'Cooler' || t === 'Adapter') {
    m.aio = /AIO|Liquid|Kraken|Frozen|LT720|LT520|Freezer|Elite|Galahad|Eisbaer|Nước|nước|360mm|240mm/i.test(n) && !/GAMMAXX|Assassin|AG400|PA120|Peerless|Pure Rock|Hyper 212/i.test(n);
    m.radFans = /360/.test(n) ? 3 : 2;
  } else if (t === 'PSU') {
    const wm = n.match(/(\d{3,4})\s*W/i); m.watts = wm ? +wm[1] : 650;
  } else if (t === 'Storage') {
    m.two5 = /\+|SATA|2\.5|HDD|Black|860|870|Barracuda/i.test(n);
  }
  return m;
}

function isoKind(components) {
  const t = components.map(c => c.type);
  if (t.includes('Laptop')) return 'laptop';
  if (t.includes('SoC') || t.includes('Power')) return 'mac';
  if (t.includes('Barebone')) return 'barebone';
  return 'tower';
}

/* ── linh kiện thùng máy (tower) ── */
function partMainboard() {
  const ACC = (a, b, w, op) => isoLine3(a, b, isoAccent(), w, op);
  let s = isoBox(26, 12, 128, 331, 22, 372, '#242b38');               // PCB đen xám (bo mạch gaming đời mới)
  s += isoLine3([34, 22, 134], [324, 22, 134], '#3a4556', 1, .5);      // đường mạch in
  s += isoLine3([34, 22, 218], [324, 22, 218], '#3a4556', 1, .5);
  s += isoLine3([34, 22, 246], [324, 22, 246], '#3a4556', 1, .45);
  s += isoLine3([150, 22, 130], [150, 22, 370], '#3a4556', 1, .4);

  // I/O shroud
  s += isoBox(26, 12, 316, 46, 30, 372, '#1a2029');
  s += isoBox(28, 12, 320, 45, 28, 370, '#2b3441');
  for (let i = 0; i < 6; i++) s += isoBox(29, 12, 324 + i * 7, 44, 16, 328 + i * 7, '#0c1016');

  // Heatsink VRM (trên)
  s += isoBox(48, 12, 350, 182, 34, 372, '#1a2029');
  s += isoBox(52, 12, 360, 178, 32, 372, '#3a4452');
  for (let i = 0; i < 9; i++) { const fx = 56 + i * 14; s += isoLine3([fx, 34, 352], [fx, 34, 372], '#0d1219', 1.6, .6); }
  s += ACC([54, 34, 366], [176, 34, 366], 1.6, .85);
  // Heatsink VRM (trái)
  s += isoBox(26, 12, 252, 46, 34, 316, '#1a2029');
  s += isoBox(28, 12, 256, 44, 32, 312, '#3a4452');
  for (let i = 0; i < 5; i++) { const fz = 260 + i * 12; s += isoLine3([28, 34, fz], [46, 34, fz], '#0d1219', 1.4, .6); }

  // 4 khe DIMM (chốt màu accent)
  for (let i = 0; i < 4; i++) {
    const x = 150 + i * 11;
    s += isoBox(x, 20, 198, x + 6, 27, 336, '#0e131a');
    s += isoBox(x, 20, 330, x + 6, 27, 338, '#4a5568');
    s += ACC([x + 3, 28, 331], [x + 3, 28, 338], 1.4, .8);
  }

  // Heatsink chipset + logo
  s += isoBox(278, 12, 150, 330, 32, 212, '#1a2029');
  s += isoBox(282, 12, 154, 326, 30, 208, '#3a4452');
  s += isoBox(292, 30, 168, 316, 33, 194, '#12171f');
  s += ACC([290, 33, 181], [318, 33, 181], 2, .9);

  // PCIe x16 bọc thép + khe phụ
  s += isoBox(48, 20, 222, 254, 28, 240, '#0f151d');
  s += isoBox(46, 18, 221, 256, 29, 226, '#a3aebd');
  s += isoBox(46, 18, 236, 256, 29, 241, '#7d8998');
  s += isoBox(48, 20, 172, 254, 27, 184, '#0f151d');
  s += isoBox(46, 18, 171, 256, 28, 176, '#6f7b8b');

  // Tản M.2
  s += isoBox(56, 22, 190, 146, 28, 206, '#2b3441');
  s += isoBox(60, 22, 194, 142, 27, 202, '#3d4855');
  s += ACC([62, 29, 200], [142, 29, 200], 1.6, .8);

  // Đầu cắm 24-pin + SATA (cạnh phải)
  s += isoBox(304, 12, 236, 330, 32, 300, '#10151c');
  for (let i = 0; i < 6; i++) s += isoBox(306 + i * 4, 14, 240, 308 + i * 4, 30, 296, '#0c1016');
  s += isoBox(304, 12, 306, 330, 30, 344, '#151b23');
  for (let i = 0; i < 3; i++) s += isoBox(306, 12, 310 + i * 11, 328, 26, 318 + i * 11, '#0c1016');

  // Vài linh kiện nhỏ (tụ / chip)
  s += isoBox(200, 22, 348, 214, 26, 362, '#2f3a47');
  s += isoBox(222, 22, 350, 234, 25, 360, '#2f3a47');
  s += isoBox(250, 22, 150, 268, 26, 168, '#2f3a47');
  s += isoBox(240, 22, 362, 262, 34, 378, '#10151c') + isoBox(266, 22, 362, 288, 34, 378, '#10151c');   // đầu cấp nguồn CPU 8-pin
  s += isoBox(196, 22, 130, 300, 28, 138, '#10151c');                                       // header front-panel / USB
  [[34, 136], [322, 136], [34, 366], [322, 366], [150, 366], [250, 176]].forEach(q => { s += isoBox(q[0] - 3, 22, q[1] - 3, q[0] + 3, 25, q[1] + 3, '#c8d0dc'); });  // ốc vít
  isoLed(54, 34, 364, 176, 35.5, 368); isoLed(292, 33, 179, 316, 34.5, 183); isoLed(30, 34, 262, 42, 35.5, 306);
  return { svg: s, a: [70, 22, 150] };
}
function partCPU() {
  let s = isoBox(76, 22, 288, 146, 30, 352, '#3b4a61');        // retention frame
  s += isoBox(80, 30, 292, 142, 36, 349, '#25324a');           // socket bed
  s += isoBox(84, 36, 294, 138, 44, 348, '#c9d2de');           // IHS chip
  s += isoBox(96, 44, 306, 126, 46, 336, '#8b98a8');           // heatspreader detail
  return { svg: s, a: [110, 44, 320] };
}
function partCoolerAir() {
  const z0 = 360, z1 = 448, x0 = 58, x1 = 152, y0 = 30, y1 = 110;
  let s = '';
  for (let i = 0; i <= 12; i++) { const fx = x0 + i * (x1 - x0) / 12; s += isoBox(fx, y0, z0, fx + 2.6, y1, z1, i % 2 ? '#d8dfe9' : '#c6cfdb'); }
  s += isoBox(78, 22, 348, 144, 34, 362, '#9aa5b4');           // cold plate
  s += isoBox(88, 30, 342, 100, 58, 360, '#c27a0c');           // heatpipe
  s += isoBox(122, 30, 342, 134, 58, 360, '#c27a0c');          // heatpipe
  s += isoFan(160, 79, 414, 'x', 36, '#cdd5e0');
  return { svg: s, a: [106, 79, 406] };
}
function partCoolerAIO(m) {
  let s = isoBox(80, 22, 352, 142, 46, 404, '#2b3446') + isoBox(88, 30, 358, 134, 40, 398, '#3a465e');
  s += isoBox(104, 34, 402, 118, 48, 412, '#9be0ff');          // pump logo
  isoLed(88, 46, 362, 134, 47.5, 396);                         // mặt LED của pump head
  const xs = m.radFans === 3 ? [96, 196, 296] : [130, 250];
  xs.forEach(x => { s += isoFan(x, 82, 410, 'z', 50, '#2a3446'); });
  s += isoBox(40, 24, 414, 386, 148, 448, '#3a465e');          // radiator
  for (let i = 0; i < 15; i++) { const rx = 48 + i * 24; s += isoLine3([rx, 30, 448], [rx, 142, 448], '#111a2b', 1.4, .5); }
  s += isoCable([110, 46, 400], [150, 88, 424], -24, '#0b1120', 7);
  s += isoCable([120, 42, 396], [250, 88, 422], 12, '#111a2b', 6);
  return { svg: s, a: [213, 86, 446] };
}
function partRAM(m) {
  const baseX = 154, pitch = 11;
  let s = '';
  for (let i = 0; i < 4; i++) { const x0 = baseX + i * pitch; s += isoBox(x0, 22, 198, x0 + 7, 27, 334, '#0f1724'); }
  for (let i = 0; i < m.sticks; i++) {
    const x0 = baseX + i * pitch;
    s += isoBox(x0, 27, 200, x0 + 6, 35, 332, i % 2 ? '#5b6480' : '#3f4a63');
    s += isoBox(x0, 27, 322, x0 + 6, 35, 332, '#9be0ff');
    isoLed(x0 + 1, 35, 206, x0 + 5, 36.5, 318);                                      // thanh LED RGB trên RAM
  }
  return { svg: s, a: [176, 30, 328] };
}
function partGPU(m) {
  if (m.onboard) return { svg: isoBox(86, 22, 300, 136, 30, 352, '#2a3446'), a: [56, 26, 300] };
  const x0 = 12, x1 = x0 + m.len, y0 = 24, y1 = y0 + 124, z0 = 228, z1 = z0 + 42, cy = (y0 + y1) / 2;
  let s = isoBox(x0, y0, z0, x1, y1, z0 + 5, '#141a26');                               // PCB
  s += isoBox(x0 + 2, y0 + 2, z0 + 5, x1 - 2, y1 - 2, z1, '#1b212d');                  // thân shroud đen
  s += isoBox(x0 + 8, y0 + 8, z1, x1 - 8, y1 - 8, z1 + 3, '#232b3a');                 // mặt trên shroud
  const fN = m.fans, pitch = (m.len - 44) / fN, fr = Math.min(pitch * .5, (y1 - y0) * .55);
  for (let i = 0; i < fN; i++) {
    const fx = x0 + 22 + (i + .5) * pitch;
    for (let k = -5; k <= 5; k++) isoLine3([fx + k * fr / 6, cy - fr, z1 + 1.2], [fx + k * fr / 6, cy + fr, z1 + 1.2], '#6b778c', 1, .7);  // lá tản nhiệt dưới quạt
    isoFan(fx, cy, z1 + 3.6, 'z', fr, '#222a3b', false, true);
    if (i < fN - 1) { const gx = fx + pitch / 2, ey = i % 2 ? y0 + 12 : y1 - 12;       // 3 vạch RGB giữa các quạt
      for (let k = 0; k < 3; k++) isoLed(gx - 8 + k * 6, ey - 5, z1 + 3, gx - 5 + k * 6, ey + 5, z1 + 4.4); }
  }
  isoFill([[x0 + 10, y1 - 6, z1 + 3.3], [x0 + 64, y1 - 6, z1 + 3.3], [x0 + 10, y1 - 32, z1 + 3.3]], '#b8c0cc');   // góc bạc
  isoFill([[x1 - 10, y0 + 6, z1 + 3.3], [x1 - 64, y0 + 6, z1 + 3.3], [x1 - 10, y0 + 32, z1 + 3.3]], '#b8c0cc');
  s += isoBox(x0 - 8, y0, z0 - 10, x0 + 2, y1, z1, '#9aa5b4');                         // bracket PCIe
  s += isoBox(x0 - 8, y0 + 8, z0 - 2, x0 + 14, y0 + 34, z0 + 4, '#cbd5e1');            // cổng xuất hình
  isoLed(x0 + 30, y1, z0 + 12, x1 - 36, y1 + 2, z0 + 18);                              // dải LED RGB cạnh card
  for (let i = 0; i < 14; i++) isoLine3([x0 + 40 + i * 14, y1 + .3, z0 + 24], [x0 + 40 + i * 14, y1 + .3, z0 + 38], '#0b0f16', 1.4, .8);
  s += isoBox(x1 - 46, y1, z0 + 8, x1 - 10, y1 + 14, z0 + 34, '#10151c');              // 12V-2x6
  isoLed(x1 - 40, y1 + 14, z0 + 17, x1 - 16, y1 + 15.5, z0 + 25);
  s += isoBox(x0 + 40, y0 - 2, z0 + 8, x0 + 120, y0, z0 + 14, '#d4a83a');             // chân vàng PCIe
  return { svg: s, a: [(x0 + x1) / 2, cy, z1 + 4] };
}
function partStorage(m) {
  let s = isoBox(56, 22, 138, 152, 28, 162, '#0f1724');        // M.2 slot
  s += isoBox(58, 28, 140, 150, 32, 160, '#5b6b86');           // M.2 heatsink
  if (m.two5) s += isoBox(246, 40, 100, 346, 108, 116, '#3f4a63');  // 2.5" drive
  return { svg: s, a: [104, 30, 150] };
}
function partPSU(m) {
  const w = Math.min(160, 110 + (m.watts || 650) / 14);
  let s = isoBox(24, 30, 12, 24 + w, 178, 96, '#2b3444');
  s += isoBox(20 + w, 30, 18, 28 + w, 178, 92, '#1e2632');
  s += isoFan(24 + w / 2, 104, 96, 'z', 40, '#3a4763', false);
  for (let i = 0; i < 8; i++) s += isoBox(28 + w, 40 + i * 15, 26, 32 + w, 50 + i * 15, 44, '#0b0f16');   // cổng cáp modular
  s += isoBox(28 + w, 36, 56, 32 + w, 172, 62, '#c9a227');                                 // tem 80+ Gold
  s += isoQuadTex([[24, 178.6, 18], [24 + w, 178.6, 18], [24 + w, 178.6, 90], [24, 178.6, 90]], isoPsuTex());  // tem thông số mặt hông
  return { svg: s, a: [24 + w / 2, 104, 52] };
}

/* ══ Bản chi tiết "như thật" (kích thước ~mm, các hàm dưới đây ghi đè bản cũ) ══ */
function isoCyl(cx, cy, cz, r, len, axis, color) {
  if (color === 'led' && !ISO_RGB) color = '#1a2029';
  const led = color === 'led', m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 24), led ? new THREE.MeshBasicMaterial({ color: 0xffffff }) : isoMat(color));
  if (axis === 'x') m.rotation.z = Math.PI / 2; else if (axis === 'y') m.rotation.x = Math.PI / 2;
  m.position.set(cx, cz, cy); ISO_G.add(m);
  if (led) { ISO_RINGS.push(m); const h = new THREE.Mesh(new THREE.CylinderGeometry(r + 2.5, r + 2.5, len + 2, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .25, blending: THREE.AdditiveBlending, depthWrite: false })); h.rotation.copy(m.rotation); h.position.copy(m.position); h.raycast = () => {}; ISO_G.add(h); ISO_GLOWS.push({ s: m, h }); }
  return '';
}
function isoPrism(pts, z0, z1, color) {
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(q => new THREE.Vector2(q[0], q[1]))), { depth: z1 - z0, bevelEnabled: false });
  g.applyMatrix4(new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1));
  const m = new THREE.Mesh(g, isoMat(color)); m.position.y = z0; ISO_G.add(m); return '';
}
/* ── Profile mainboard theo dòng: pcb/wire/hs/hs2/ed/acc + chữ logo in trên PCB ── */
const ISO_MB = [
  [/ROG\s*STRIX|Strix/i, { pcb: '#171a20', wire: '#2f3644', hs: '#24282f', hs2: '#39404a', ed: '#c8cdd6', acc: '#ff2bd6', txt: 'ROG STRIX', tc: '#e9ecf2', big: 1, led: 1 }],
  [/ProArt/i,             { pcb: '#20222a', wire: '#3a4050', hs: '#2f333d', hs2: '#454c58', ed: '#cdd2dc', acc: '#d4b06a', txt: 'ProArt', tc: '#e6e2d6', led: 1 }],
  [/\bTUF\b/i,             { pcb: '#4a4741', wire: '#5e5a52', hs: '#3a362f', hs2: '#5e5a51', ed: '#d9dde3', acc: '#e8b53a', txt: 'TUF GAMING', tc: '#f0c648' }],
  [/\bPrime\b/i,           { pcb: '#1c1f26', wire: '#333a46', hs: '#282c34', hs2: '#3a414c', ed: '#d6dae1', acc: '#9aa3b0', txt: 'PRIME', tc: '#cfd5dd' }],
  [/\bMPG\b/i,             { pcb: '#1a1d24', wire: '#333a48', hs: '#262b34', hs2: '#3a414e', ed: '#d2d7df', acc: '#c9a227', txt: 'MPG', tc: '#dfe4ec', led: 1 }],
  [/\bMAG\b/i,             { pcb: '#22252b', wire: '#383d47', hs: '#2e323a', hs2: '#454b56', ed: '#d3d7df', acc: '#c9d15a', txt: 'MAG', tc: '#dde2e9' }],
  [/\bMEG\b/i,             { pcb: '#1b1d22', wire: '#3d424c', hs: '#33373f', hs2: '#4b515c', ed: '#dcdfe6', acc: '#c9a227', txt: 'MEG', tc: '#e6e9ee', big: 1 }],
  [/Pro\s*RS/i,            { pcb: '#232529', wire: '#373b43', hs: '#2d3036', hs2: '#3f444c', ed: '#c6cbd4', acc: '#8f98a5', txt: 'Pro RS', tc: '#c3c9d2' }],
  [/\bPRO\b/i,             { pcb: '#26282d', wire: '#3a3e46', hs: '#30333a', hs2: '#434852', ed: '#c6cbd4', acc: '#8f98a5', txt: 'PRO', tc: '#c3c9d2' }],
  [/AORUS/i,              { pcb: '#16191f', wire: '#2e3542', hs: '#242932', hs2: '#3a414e', ed: '#d2d7df', acc: '#e8b53a', txt: 'AORUS', tc: '#e4e8ee', led: 1 }],
  [/AERO/i,               { pcb: '#c9d1da', wire: '#aab4c0', hs: '#e6ebf1', hs2: '#b8c2ce', ed: '#8e99a8', acc: '#4aa3e0', txt: 'AERO', tc: '#5a6674', lt: 1 }],
  [/Steel\s*Legend/i,     { pcb: '#3e4249', wire: '#5a6069', hs: '#565c66', hs2: '#767d88', ed: '#e4e8ee', acc: '#4aa3e0', txt: 'STEEL LEGEND', tc: '#eef1f5' }],
  [/Taichi/i,             { pcb: '#1c1e24', wire: '#363b45', hs: '#2b2f38', hs2: '#434a55', ed: '#d6dae2', acc: '#c9a227', txt: 'TAICHI', tc: '#e2e6ec', big: 1 }],
];
function isoMbProfile(nm) {
  for (let i = 0; i < ISO_MB.length; i++) if (ISO_MB[i][0].test(nm)) return ISO_MB[i][1];
  return { pcb: '#1b212b', wire: '#2b3544', hs: '#3a4452', hs2: '#2a323e', ed: '#a3aebd', acc: '#9be0ff', txt: '', tc: '#dfe4ea' };
}
function partMainboard(m, c) {
  const Q = isoMbProfile((c && c.name) || '');
  let s = isoBox(26, 12, 128, 296, 22, 372, Q.pcb, isoPcbTex(Q.lt ? 'l' : 'd'));          // PCB có mạch in
  for (let k = 0; k < 6; k++) isoLine3([34, 22.1, 134 + k * 40], [288, 22.1, 134 + k * 40], Q.wire, 1, .5);   // đường mạch
  s += isoBox(26, 22, 290, 50, 50, 368, Q.hs) + isoBox(28, 22, 294, 48, 48, 366, Q.hs2);   // I/O shroud
  for (let i = 0; i < 6; i++) s += isoBox(24, 26, 304 + i * 10, 28, 44, 309 + i * 10, i < 4 ? '#2b6cd9' : '#0c1016');  // cổng USB/LAN
  isoLed(30, 48, 330, 46, 49.5, 336, Q.acc);
  const vb = Q.big ? 54 : 50;                                                          // dòng cao cấp có tản dày hơn
  s += isoBox(52, 22, 368 - (vb - 22), 150, vb, 368, Q.hs) + isoBox(52, 22, 368, 150, vb, 368, Q.hs2);   // heatsink VRM trên
  for (let i = 0; i < 14; i++) isoLine3([56 + i * 7, vb + .1, 342], [56 + i * 7, vb + .1, 368], '#0d1219', 1.4, .7);
  isoLed(54, vb, 350, 148, vb + 1.2, 353, Q.acc);
  s += isoBox(26, 22, 252, 46, vb, 296, Q.hs); for (let i = 0; i < 6; i++) isoLine3([26, vb + .1, 256 + i * 7], [46, vb + .1, 256 + i * 7], '#0d1219', 1.3, .7);
  for (let i = 0; i < 4; i++) { const x = 214 + i * 11; s += isoBox(x, 22, 232, x + 6, 29, 362, '#10151c') + isoBox(x, 22, 228, x + 6, 31, 236, Q.hs2) + isoBox(x, 22, 358, x + 6, 31, 366, Q.hs2); }   // khe DIMM + chốt (nằm gọn trong mép bo)
  s += isoBox(82, 22, 292, 138, 30, 348, Q.lt ? '#8d97a4' : '#3b4a61');               // socket CPU
  s += isoBox(44, 22, 150, 134, 30, 168, '#10151c') + isoBox(42, 30, 149, 136, 33, 154, Q.ed) + isoBox(42, 30, 164, 136, 33, 169, Q.ed);   // PCIe x16 bọc thép
  s += isoBox(44, 22, 196, 100, 28, 207, '#10151c');                                  // PCIe x1
  s += isoBox(238, 22, 130, 290, 31, 166, Q.hs) + isoBox(252, 31, 138, 276, 32, 158, '#12171f');   // heatsink chipset
  isoLed(256, 32, 148, 272, 33, 150, Q.acc);
  s += isoBox(268, 22, 236, 294, 40, 300, '#10151c'); for (let i = 0; i < 12; i++) s += isoBox(270 + (i % 2) * 11, 40, 240 + ((i / 2) | 0) * 9, 275 + (i % 2) * 11, 41, 246 + ((i / 2) | 0) * 9, '#05070a');   // 24-pin
  s += isoBox(268, 22, 306, 294, 34, 346, '#151b23');                                          // cổng SATA
  s += isoBox(160, 22, 346, 182, 36, 364, '#10151c') + isoBox(186, 22, 346, 208, 36, 364, '#10151c');   // CPU 8-pin
  s += isoBox(196, 22, 130, 286, 28, 138, '#10151c');                                          // header front-panel
  s += isoCyl(240, 24, 196, 10, 4, 'y', '#c8d0dc');                                            // pin CMOS
  for (let i = 0; i < 6; i++) s += isoCyl(180 + i * 12, 28, 144, 4.5, 12, 'y', '#c9a227');     // tụ điện
  for (let i = 0; i < 8; i++) s += isoBox(60 + i * 8, 22, 330, 66 + i * 8, 28, 336, '#0c1016');   // cuộn cảm
  [[34, 136], [286, 136], [34, 362], [286, 362], [150, 330], [252, 200]].forEach(q => { s += isoCyl(q[0], 24, q[1], 3, 3, 'y', '#c8d0dc'); });   // ốc vít
  if (Q.txt) isoText(Q.txt, 160, 196, 23.2, Q.lt ? 7 : 9, Q.tc, 'center', 0, 190);   // chữ dòng in trên PCB
  return { svg: s, a: [90, 50, 360] };
}
function partCPU() {
  let s = isoBox(84, 30, 294, 136, 33, 346, '#25324a');
  s += isoBox(92, 33, 302, 128, 37, 338, '#c9d2de') + isoBox(98, 37, 308, 122, 37.6, 332, '#8b98a8');   // IHS có khắc
  s += isoCyl(80, 31, 320, 1.6, 56, 'z', '#aeb7c4');                                           // cần khoá socket
  return { svg: s, a: [110, 38, 320] };
}
function partCoolerAir() {
  let s = isoBox(90, 28, 296, 130, 37, 344, '#aeb7c4');                                       // đế nickel
  for (let i = 0; i < 5; i++) s += isoCyl(98 + 0, 37, 300 + i * 10, 2.6, 118, 'y', '#c77f3d');   // ống đồng
  for (let i = 0; i < 28; i++) s += isoBox(70, 40 + i * 4, 286, 150, 41.2 + i * 4, 354, i % 2 ? '#c9d1dc' : '#b7c0cd');   // lá tản
  s += isoBox(70, 152, 286, 150, 156, 354, '#2b3340'); isoLed(80, 156, 318, 140, 157, 322);   // nắp trên
  s += isoFan(161, 96, 320, 'x', 34, '#cdd5e0', true, false, true) + isoFan(59, 96, 320, 'x', 34, '#cdd5e0', true, false, true);   // 2 quạt kẹp 2 bên
  return { svg: s, a: [110, 160, 320] };
}
function isoTube(pts, r, color) {
  const c = new THREE.CatmullRomCurve3(pts.map(q => isoV(q[0], q[1], q[2])));
  ISO_G.add(new THREE.Mesh(new THREE.TubeGeometry(c, 48, r, 12), new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: .5, metalness: .12 }))); return '';
}
/* ── texture vẽ bằng canvas cho chân thực: PCB, lưới mesh, tem nguồn ── */
let ISO_TEXCACHE = {};
function isoCanvasTex(key, w, h, draw) {
  if (ISO_TEXCACHE[key]) return ISO_TEXCACHE[key];
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8;
  ISO_TEXCACHE[key] = t; return t;
}
function isoPcbTex(v) {
  return isoCanvasTex('pcb' + (v || 'd'), 512, 512, (k, w, h) => {
    const lt = v === 'l';
    k.fillStyle = lt ? '#c9d1da' : '#141b28'; k.fillRect(0, 0, w, h);
    k.strokeStyle = lt ? 'rgba(90,108,130,.5)' : 'rgba(72,92,124,.55)'; k.lineWidth = 2;
    for (let i = 0; i < 48; i++) { k.beginPath(); let x = Math.random() * w, y = Math.random() * h; k.moveTo(x, y);
      for (let j = 0; j < 4; j++) { if (Math.random() < .5) x += (Math.random() - .5) * 190; else y += (Math.random() - .5) * 190; k.lineTo(x, y); } k.stroke(); }
    k.fillStyle = '#c9a227';
    for (let i = 0; i < 70; i++) { k.beginPath(); k.arc(Math.random() * w, Math.random() * h, 3, 0, 7); k.fill(); }
    k.strokeStyle = lt ? 'rgba(70,84,100,.55)' : 'rgba(222,230,240,.7)'; k.lineWidth = 2;
    for (let i = 0; i < 12; i++) k.strokeRect(Math.random() * w * .88, Math.random() * h * .88, 24 + Math.random() * 60, 14 + Math.random() * 30);
    k.fillStyle = lt ? 'rgba(45,58,72,.85)' : 'rgba(232,238,246,.92)'; k.font = '700 24px Arial';
    k.fillText('B850', 28, 52); k.fillText('PCIe 5.0', 28, h - 30);
  });
}
function isoPsuTex() {
  return isoCanvasTex('psu', 512, 256, (k, w, h) => {
    k.fillStyle = '#0b0e13'; k.fillRect(0, 0, w, h);
    k.strokeStyle = '#2c3542'; k.lineWidth = 3; k.strokeRect(8, 8, w - 16, h - 16);
    k.fillStyle = '#e9eef5'; k.font = '800 52px Arial'; k.fillText('850W', 30, 78);
    k.fillStyle = '#98a2b1'; k.font = '400 25px Arial';
    k.fillText('ATX 3.1  •  12V-2x6 READY', 30, 122);
    k.fillText('+12V RAIL  •  70.8A  •  JAPAN CAPS', 30, 160);
    k.fillStyle = '#262e3a'; k.fillRect(30, 184, w - 60, 8);
    k.fillStyle = '#c9a227'; k.fillRect(w - 158, 34, 122, 66);
    k.fillStyle = '#141414'; k.font = '800 30px Arial'; k.fillText('80+', w - 138, 78);
  });
}
function isoQuadTex(pts, tex, ghost) {
  const v = pts.map(q => isoV(q[0], q[1], q[2]));
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([v[0].x, v[0].y, v[0].z, v[1].x, v[1].y, v[1].z, v[2].x, v[2].y, v[2].z, v[0].x, v[0].y, v[0].z, v[2].x, v[2].y, v[2].z, v[3].x, v[3].y, v[3].z], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1], 2));
  g.computeVertexNormals();
  ISO_G.add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: tex, roughness: .82, metalness: .3, side: THREE.DoubleSide, transparent: !!ghost, depthWrite: !ghost }))); return '';
}
function isoGlass(pts, op) {
  const v = pts.map(q => isoV(q[0], q[1], q[2])), pos = [];
  for (let i = 1; i < v.length - 1; i++) pos.push(v[0].x, v[0].y, v[0].z, v[i].x, v[i].y, v[i].z, v[i + 1].x, v[i + 1].y, v[i + 1].z);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: new THREE.Color('#a8c8e8'), transparent: true, opacity: op == null ? .1 : op, roughness: .06, metalness: 0, envMapIntensity: 1.6, side: THREE.DoubleSide, depthWrite: false }));
  m.raycast = () => {}; ISO_G.add(m); return '';
}
function partCoolerAIO(m) {
  let s = isoCyl(110, 28, 320, 31, 30, 'y', '#2b3446');                                       // pump head tròn (ăn theo bo)
  isoCyl(110, 58.5, 320, 26, 1.6, 'y', 'led'); s += isoCyl(110, 60, 320, 12, 2, 'y', '#d5dbe4');

  s += isoCyl(80, 44, 332, 7, 6, 'x', '#c8d0dc') + isoCyl(80, 44, 308, 7, 6, 'x', '#c8d0dc');       // đầu nối pump (ăn theo bo)
  const g2 = new THREE.Group(); g2.userData.i = ISO_G.userData.i; ISO_ROOT.add(g2);          // két + ống: tọa độ case, không co giãn theo bo
  const keep = ISO_G; ISO_G = g2;
  const RD = (ISO_D || 420) - 34;                                                             // két dài theo case (full 386 / compact 346)
  const RC = (40 + RD) / 2, FO = 55;                                       // FO = bán kính ngoài khung vuông của quạt (không được chồng nhau, không tràn két)
  const sp3 = Math.min(112, (RD - 40 - 2 * FO) / 2), sp2 = Math.min(56, (RD - 40 - 2 * FO) / 2);
  const xs = m.radFans === 3 ? [RC - sp3, RC, RC + sp3] : [RC - sp2, RC + sp2];   // trải đều trong két, căn giữa
  xs.forEach(x => { s += isoFan(x, 82, 410, 'z', 50, '#2a3446'); });
  s += isoBox(40, 24, 414, RD, 148, 448, '#3a465e') + isoBox(30, 24, 414, 40, 148, 448, '#2a3446');
  const PX = x => 26 + (x - 26) * ISO_BS.x, PZ = z => 128 + (z - 128) * ISO_BS.z;              // đầu ống ở pump → quy về tọa độ case
  isoTube([[PX(80), 44, PZ(332)], [58, 46, 354], [34, 54, 392], [24, 60, 431]], 5.5, '#14181f');             // ống nước 1
  isoTube([[PX(80), 44, PZ(308)], [54, 62, 338], [30, 98, 388], [24, 112, 431]], 5.5, '#14181f');            // ống nước 2
  s += isoCyl(30, 60, 431, 7.5, 12, 'x', '#c8d0dc') + isoCyl(30, 112, 431, 7.5, 12, 'x', '#c8d0dc');   // đầu nối radiator
  const rn = Math.max(10, Math.round((RD - 48) / 8.4)); for (let i = 0; i < rn; i++) isoLine3([48 + i * (RD - 48) / Math.max(1, rn - 1), 24.1, 448.1], [48 + i * (RD - 48) / Math.max(1, rn - 1), 148, 448.1], '#111a2b', 1.2, .5);
  ISO_G = keep;
  return { svg: s, a: [213, 86, 446] };
}
/* Tản RAM theo đúng 8 dòng trong bảng ngoại hình (+ các dòng thường trên web) */
function partRAM(m, c) {
  const nm = (c && c.name) || '', rgb = /RGB/i.test(nm);
  const idx = m.sticks === 2 ? [1, 3] : [0, 1, 2, 3].slice(0, m.sticks); let s = '';
  const groove = (x, n, y0, y1, z0, z1, col) => { for (let i = 0; i < n; i++) { const gy = n === 1 ? (y0 + y1) / 2 : y0 + (y1 - y0 - 1.6) * i / (n - 1); s += isoBox(x + 6.4, gy, z0, x + 7, gy + 1.6, z1, col); s += isoBox(x - .6, gy, z0, x, gy + 1.6, z1, col); } };
  const T2 = (x, t, yc, z0, z1, w, col, font) => { isoTextX(t, x + 6.5, yc, z0, z1, w, col, 0, font); isoTextX(t, x - .1, yc, z0, z1, w, col, 1, font); };
  const F2 = (x, pts, col) => { isoFill(pts.map(q => [x + 6.5, q[0], q[1]]), col); isoFill(pts.map(q => [x - .1, q[0], q[1]]), col); };
  const barFull = (x, z0, z1, y1 = 69) => { s += isoBox(x - .2, 28, z0, x + 6.6, y1, z1, 'rgba(226,236,246,.3)'); isoLed(x + 1, 32, z0 + 1, x + 5.4, y1 - 4, z1 - 1); };
  const barSeg = (x, z0, z1, n) => { const wt = (41 - (n - 1)) / n; for (let i = 0; i < n; i++) { const a = 28 + i * (wt + 1); s += isoBox(x - .2, a, z0, x + 6.6, a + wt, z1, 'rgba(226,236,246,.42)'); isoLed(x + 1, a + 3, z0 + 1, x + 5.4, a + wt - 3, z1 - 1); } };
  const capDark = (x, z0, z1, col, y1 = 69) => { s += isoBox(x - .2, 28, z0, x + 6.6, y1, z1, col); };
  idx.forEach(k => {
    const x = 214 + k * 11; let top = 350;
    if (/royal/i.test(nm)) {
      top = 362;
      s += isoBox(x, 25, 232, x + 6.4, 70, 350, '#caa437');                        // thân vàng gold
      s += isoBox(x - .2, 30, 336, x + 6.6, 67, 342, '#f2e2a8');                  // viền sáng
      barSeg(x, 350, 362, 3);                                                     // thanh pha lê 3 khúc
      T2(x, 'TRIDENT Z', 48, 262, 322, 9, '#fff3cf');
      T2(x, 'Royal', 48, 244, 258, 7, '#fff3cf', 'italic 700 64px Georgia,serif'); // chữ script
    } else if (/dominator/i.test(nm)) {
      top = 366;
      s += isoBox(x, 25, 232, x + 6.4, 70, 348, '#101216');
      for (let i = 0; i < 8; i++) s += isoBox(x - .3, 30 + i * 4.9, 348, x + 6.7, 33.5 + i * 4.9, 358, '#232833');  // răng tản DHX
      barSeg(x, 358, 366, 3);                                                     // thanh RGB 3 khúc
      T2(x, 'DOMINATOR', 48, 268, 322, 9, '#e8ecf1');
      F2(x, [[40, 336], [57, 336], [48.5, 326]], '#c8ccd2');                       // logo đỉnh
    } else if (/vengeance|lpx/i.test(nm)) {
      top = rgb ? 357 : 351;
      s += isoBox(x, 25, 232, x + 6.4, 70, 348, '#15171c');
      groove(x, 6, 30, 67, 240, 344, 'rgba(0,0,0,.4)');                            // rãnh dọc
      T2(x, 'CORSAIR', 48, 318, 342, 6, '#c9ced4');
      T2(x, 'VENGEANCE', 48, 258, 312, 9, '#dfe3e8');
      if (rgb) { s += isoBox(x + 1, 29, 348, x + 5.4, 68, 357, 'rgba(226,236,246,.3)'); isoLed(x + 2, 32, 349, x + 4.4, 65, 356); }
      else capDark(x, 348, 351, '#15171c');
    } else if (/trident/i.test(nm)) {
      top = rgb ? 362 : 353;
      s += isoBox(x, 25, 232, x + 6.4, 70, 350, '#1b1e24');
      s += isoBox(x - .2, 30, 336, x + 6.6, 67, 342, '#c1272d');                  // viền đỏ
      if (rgb) {
        barFull(x, 350, 362);
        isoTextX('G.SKILL', x + 6.7, 48, 351, 361, 6, '#1c2f4a', 0); isoTextX('G.SKILL', x - .3, 48, 351, 361, 6, '#1c2f4a', 1);  // chữ trên thanh đèn
      } else capDark(x, 350, 353, '#1b1e24');
      T2(x, 'TRIDENT Z', 48, 264, 322, 9, '#eef1f4');
    } else if (/vulcan/i.test(nm)) {
      top = 351;
      s += isoBox(x, 25, 232, x + 6.4, 70, 348, '#2a2d33');
      groove(x, 5, 30, 67, 240, 344, 'rgba(0,0,0,.4)');
      T2(x, 'VULCAN', 48, 262, 322, 9, '#e8ebef');
      capDark(x, 348, 351, '#2a2d33');
    } else if (/delta|t-force|teamgroup/i.test(nm)) {
      top = rgb ? 364 : 351;
      s += isoBox(x, 25, 232, x + 6.4, 70, 350, '#101216');
      F2(x, [[32, 344], [42, 344], [48.5, 292]], 'rgba(0,0,0,.5)');                // cánh V trái
      F2(x, [[55, 344], [65, 344], [48.5, 292]], 'rgba(0,0,0,.5)');                // cánh V phải
      if (rgb) barFull(x, 350, 364); else capDark(x, 350, 351, '#101216');
      T2(x, 'T-FORCE', 48, 298, 330, 9, '#eaf6fa');
      T2(x, 'DELTA', 48, 258, 284, 7, '#9fb3bd');
    } else if (/fury|beast/i.test(nm)) {
      top = rgb ? 366 : 357;
      s += isoBox(x, 25, 232, x + 6.4, 56, 354, '#131418');                        // lùn compact nhưng kín đúng khe
      F2(x, [[33, 348], [41, 348], [33, 324]], 'rgba(255,255,255,.08)');
      F2(x, [[64, 348], [56, 348], [64, 324]], 'rgba(255,255,255,.08)');
      if (rgb) barFull(x, 354, 366, 54); else capDark(x, 354, 357, '#131418', 54);
      T2(x, 'FURY', 40, 318, 348, 9, '#eef1f4');
      T2(x, 'BEAST', 40, 288, 314, 7, '#8b939c');
    } else if (/viper|patriot/i.test(nm)) {
      top = 351;
      s += isoBox(x, 25, 232, x + 6.4, 70, 348, '#33373d');                        // xám súng
      groove(x, 9, 30, 67, 240, 344, 'rgba(0,0,0,.45)');
      F2(x, [[38, 322], [59, 322], [48.5, 286]], '#787f88');                      // đầu rắn Viper
      F2(x, [[43, 316], [54, 316], [48.5, 294]], '#33373d');                      // lõi tối
      capDark(x, 348, 351, '#33373d');
    } else if (/xpg|lancer/i.test(nm)) {
      top = rgb ? 360 : 351;
      s += isoBox(x, 25, 232, x + 6.4, 70, 348, '#141519');
      F2(x, [[34, 336], [37, 336], [63, 268], [60, 268]], '#2e333b');             // nét X chéo
      F2(x, [[63, 336], [60, 336], [37, 268], [34, 268]], '#2e333b');
      if (rgb) barFull(x, 350, 360); else capDark(x, 350, 351, '#141519');
      T2(x, 'XPG', 48, 282, 318, 9, '#eef1f4');
    } else if (/ripjaws/i.test(nm)) {
      top = 351;
      s += isoBox(x, 25, 232, x + 6.4, 70, 348, '#7e1215');                        // đỏ Ripjaws
      groove(x, 4, 30, 67, 240, 344, 'rgba(0,0,0,.4)');
      T2(x, 'RIPJAWS', 48, 262, 322, 9, '#f4f6f8');
      capDark(x, 348, 351, '#7e1215');
    } else if (/crucial|ballistix/i.test(nm)) {
      top = 351;
      s += isoBox(x, 25, 232, x + 6.4, 70, 348, /ballistix/i.test(nm) ? '#15171c' : '#101216');
      if (/ballistix/i.test(nm)) T2(x, 'BALLISTIX', 48, 262, 322, 9, '#e8ebef');
      capDark(x, 348, 351, '#15171c');
    } else if (/g\.skill/i.test(nm)) {
      top = 351;
      s += isoBox(x, 25, 232, x + 6.4, 70, 348, '#17191e');
      T2(x, 'G.SKILL', 48, 262, 322, 9, '#dfe3e8');
      capDark(x, 348, 351, '#17191e');
    } else {
      top = rgb ? 360 : 351;
      s += isoBox(x, 25, 232, x + 6.4, 70, 348, '#262b36');
      if (rgb) barFull(x, 350, 360); else capDark(x, 350, 351, '#262b36');
    }
    s += isoBox(x, 22, 238, x + 6.4, 25, Math.min(358, top + 2), '#c9a227');       // chân vàng kín khe
  });
  return { svg: s, a: [214 + (idx[0]) * 11 + 3, 74, 300] };
}
/* Vị trí logo & đèn LED theo từng dòng card: edge = chữ giữa cạnh hông, hub = tâm quạt, back = backplate (mặt lưng), led = none|strip|ring|white|red */

const ISO_GPU_PROFILES = [
  [/founders|\bFE\b/i,      { edge: 'GEFORCE RTX', corner: 1, sm: 1, col: '#ff6fb5', back: 'NVIDIA', led: 'white', sk: ['#a9afb8', '#c4cad2', '#2a2f38', '#1d232d', '#c9ced6'] }],
  [/\brog\b|strix/i,        { edge: 'ROG STRIX', hub: 'ROG', back: 'ROG', col: '#ff3ccf', led: 'ring', sk: ['#2b2a2e', '#3a373c', '#6b7280', '#1d222c', '#cfd5df'] }],
  [/\btuf\b/i,              { edge: 'TUF', h: 24, back: 'TUF GAMING', col: '#dfe4ec', led: 'white', sk: ['#5a5650', '#45423d', '#9aa1ab', '#1b1f27', '#d5dae2'] }],
  [/suprim/i,               { edge: 'SUPRIM', back: 'SUPRIM', led: 'strip', sk: ['#b5bcc6', '#cfd5dd', '#8d949f', '#2a2f38', '#d5dae2'] }],
  [/aorus/i,                { edge: 'AORUS', hub: 'AORUS', back: 'AORUS', led: 'ring', sk: ['#14171d', '#1c2028', '#5a616d', '#12151b', '#d0d6e0'] }],
  [/gigabyte/i,             { edge: 'GIGABYTE', sm: 1, col: '#ff5a8a', led: 'ring', sk: ['#161a21', '#222730', '#8a919c', '#1c212a', '#bfc6d1'] }],
  [/\bmsi\b|gaming x|slim/i, { edge: 'MSI', hub: 'MSI', back: 'MSI', col: '#ff2d3d', led: 'strip', sk: ['#15181f', '#1f232c', '#7a828f', '#181c24', '#e5e9f0'] }],
  [/zotac|airo/i,           { edge: 'ZOTAC', hub: 'ZOTAC', led: 'strip', sk: ['#cfd8e0', '#e6edf2', '#2fb7c9', '#2a3b48', '#e9f2f6'] }],
  [/colorful|igame/i,       { edge: 'iGAME', hub: 'iGAME', back: 'iGAME', led: 'strip', sk: ['#1a1c22', '#2a2d36', '#e6e9ef', '#1b1e26', '#e0e4ea'] }],
  [/nitro|sapphire/i,       { edge: 'NITRO+', hub: 'NITRO+', back: 'NITRO+', led: 'strip', sk: ['#8d949f', '#a3aab5', '#4a4f58', '#171a21', '#cfd5df'] }],
  [/hellhound|powercolor/i, { hub: 'HELLHOUND', back: 'HELLHOUND', led: 'strip', ledCol: '#2f7bff', sk: ['#15171d', '#1f2229', '#e5483a', '#c8d0db', '#cfd5df'] }],
  [/asrock|phantom/i,       { edge: 'PHANTOM GAMING', hub: 'ASROCK', led: 'strip', sk: ['#14161c', '#242831', '#c4202b', '#181b22', '#e8ebf0'] }],
  [/qick|quick/i,           { edge: 'XFX', led: 'none', sk: ['#17191f', '#23262d', '#c0392b', '#1a1d24', '#cfd5df'] }],
  [/xfx|merc/i,             { edge: 'XFX', hub: 'XFX', back: 'MERC', col: '#ff6fb5', led: 'white', sk: ['#16181e', '#20232a', '#7d8591', '#191c23', '#d9dee6'] }],
  [/reference/i,            { edge: 'RADEON', corner: 1, sm: 1, col: '#ed1c24', back: 'AMD', led: 'red', fN: 1, sk: ['#1c1f26', '#2a2e37', '#8a919c', '#2a2e37', '#9aa2ad'] }]
];
/* Bố cục mặt trên theo ảnh: fN số quạt, pos vị trí quạt (0–1 dọc card), vee/slash/strip/ptext = chi tiết mặt trên */
const ISO_GPU_TOP = [
  { fN: 2, pos: [.14, .86], vee: 1 },                          // Founders Edition
  { fN: 3, hubc: '#d04aa8' },                                  // ROG Strix
  { fN: 3, strip: '#6b7079' },                                 // TUF
  { fN: 1, pos: [.84], ptext: 'SUPRIM' },                      // SUPRIM
  { fN: 3, strip: '#2fd0e8' },                                 // AORUS
  { fN: 3 },                                                   // Gigabyte Gaming OC
  { fN: 2, pos: [.15, .85], slash: 1 },                        // MSI Gaming X / Slim
  { fN: 2, pos: [.26, .74], strip: '#2fb7c9' },                // ZOTAC AIRO
  { fN: 3 },                                                   // COLORFUL
  { fN: 3 },                                                   // Nitro+
  { fN: 3, strip: '#e5483a', hubc: '#d63a3a' },                // Red Devil / Hellhound
  { fN: 3 }, { fN: 3 }, { fN: 3 },                             // Phantom, Qick, Merc
  { fN: 2, pos: [.14, .86], vee: 1 }                           // AMD Reference
];
/* Lá tản nhiệt nhìn qua cửa sổ tấm lưng GPU */
function isoFinTex() {
  return isoCanvasTex('gbfin', 512, 128, (k, w, h) => {
    k.fillStyle = '#0c1015'; k.fillRect(0, 0, w, h);
    const n = 150, sw = w / n;
    for (let i = 0; i < n; i++) { k.fillStyle = i % 2 ? '#d3dae3' : '#8e99a6'; k.fillRect(i * sw + .5, 0, sw * .62, h); }
    k.fillStyle = 'rgba(0,0,0,.42)'; k.fillRect(0, 0, w, h * .42);      // phần trên trong bóng
    k.fillStyle = 'rgba(255,255,255,.07)'; k.fillRect(0, h * .58, w, 3);
  });
}
function isoGpuProfile(nm) {
  const k = ISO_GPU_PROFILES.findIndex(q => q[0].test(nm)); if (k >= 0) return Object.assign({}, ISO_GPU_PROFILES[k][1], ISO_GPU_TOP[k]);
  const bm = /\b(ASUS|GIGABYTE|MSI|ZOTAC|GALAX|PNY|PALIT|GAINWARD|INNO3D|EVGA|ASROCK)\b/i.exec(nm);
  return { edge: bm ? bm[1].toUpperCase() : '', led: ISO_RGB ? 'strip' : 'none' };
}
function isoText(t, x, y, z, h, color, align, flat, maxW) {
  const f = '700 64px "Arial Black",Arial,sans-serif', cv = document.createElement('canvas'), k = cv.getContext('2d');
  k.font = f; cv.width = Math.ceil(k.measureText(t).width) + 16; cv.height = 80;
  k.font = f; k.textBaseline = 'middle'; k.fillStyle = color; k.fillText(t, 8, 40);
  const tx = new THREE.CanvasTexture(cv); tx.anisotropy = 4; tx.encoding = THREE.sRGBEncoding; if (maxW) h = Math.min(h, maxW * 80 / cv.width); const pw = h * cv.width / 80;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(pw, h), new THREE.MeshBasicMaterial({ map: tx, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  if (flat) m.rotation.x = flat === 2 ? Math.PI / 2 : -Math.PI / 2;
  m.position.set(align === 'left' ? x + pw / 2 : x, z, y); ISO_G.add(m); return '';
}
/* Chữ trên mặt hông thanh RAM (mặt ±x): chạy dọc thân thanh, đọc từ dưới lên */
function isoTextX(t, x, yc, z0, z1, w, color, flip, font) {
  const f = font || '700 64px "Arial Black",Arial,sans-serif';
  const meas = document.createElement('canvas').getContext('2d'); meas.font = f;
  const cw = Math.ceil(meas.measureText(t).width) + 16;
  const cv = document.createElement('canvas'); cv.width = 80; cv.height = cw;
  const k = cv.getContext('2d');
  k.translate(40, cw - 8); k.rotate(-Math.PI / 2);
  k.font = f; k.textBaseline = 'middle'; k.fillStyle = color; k.fillText(t, 0, 0);
  const tx = new THREE.CanvasTexture(cv); tx.anisotropy = 4; tx.encoding = THREE.sRGBEncoding;
  let pw = w, ph = w * cw / 80;
  const maxH = Math.abs(z1 - z0); if (maxH > 0 && ph > maxH) { ph = maxH; pw = maxH * 80 / cw; }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), new THREE.MeshBasicMaterial({ map: tx, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  m.rotation.y = flip ? -Math.PI / 2 : Math.PI / 2;
  m.position.set(x, (z0 + z1) / 2, yc); ISO_G.add(m); return '';
}

function partGPU(m, c) {
  if (m.onboard) return { svg: isoBox(86, 22, 300, 136, 30, 352, '#2a3446'), a: [56, 26, 300] };
  const x0 = 12, x1 = x0 + m.len, y0 = 34, y1 = y0 + 142, z0 = 146, z1 = z0 + 56, cy = (y0 + y1) / 2;
  const nm = (c && c.name) || '', P = isoGpuProfile(nm), lc = P.ledCol || { white: '#ffffff', red: '#ff2020' }[P.led];
  ISO_RGB = false;   // không trang bị RGB cho bất kỳ GPU nào
  const SK = P.sk || ['#1b212d', '#232b3a', '#b8c0cc', '#222a3b', '#e3e8f0']; ISO_GPU_HUB = P.hubc || SK[4];
  let s = '';
  const wy0 = cy - 6, wy1 = y1 - 16, wx0 = x0 + 32, wx1 = x1 - 32, ch = 18;
  const isRd = /RADEON|\bRX\b|\bARC\b/i.test(nm) || (!/\bRTX\b/i.test(nm) && /\b(6600|6650|6750|7600|7700|7800|7900|6950|9070)\b/i.test(nm));   // card AMD: tấm lưng kiểu GIGABYTE Radeon (cửa sổ lộ tản nhiệt)
  { const bp = new THREE.Shape();     // tấm lưng kiểu GIGABYTE: khoét cửa sổ lớn, thương hiệu in trên dải dưới
    bp.moveTo(x0, y0); bp.lineTo(x1, y0); bp.lineTo(x1, y1); bp.lineTo(x0, y1); bp.closePath();
    const w = new THREE.Path();
    if (isRd) { const W = wx1 - wx0, xa = wx0 + W * .60;        // Radeon: mép dưới cửa sổ bậc lên, lộ tản nhiệt + ống đồng
      w.moveTo(wx0, cy - 24); w.lineTo(xa, cy - 24); w.lineTo(xa + 16, cy + 4); w.lineTo(wx1, cy + 4);
      w.lineTo(wx1, y1 - 14); w.lineTo(wx0, y1 - 14);
    } else {
      w.moveTo(wx0 + ch, wy0); w.lineTo(wx1 - ch, wy0); w.lineTo(wx1, wy0 + ch); w.lineTo(wx1, wy1 - ch);
      w.lineTo(wx1 - ch * 1.5, wy1); w.lineTo(wx0 + ch * 1.5, wy1); w.lineTo(wx0, wy1 - ch); w.lineTo(wx0, wy0 + ch);
    }
    w.closePath(); bp.holes.push(w);
    const bgp = new THREE.ExtrudeGeometry(bp, { depth: 5, bevelEnabled: false });
    bgp.applyMatrix4(new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1));
    const bpm = new THREE.Mesh(bgp, isoMat(SK[1])); bpm.position.y = z0; ISO_G.add(bpm);
    if (isRd) {
      const xb = wx0 + (wx1 - wx0) * .62;
      isoQuadTex([[wx0, cy - 24, z0 + 5.2], [wx1, cy - 24, z0 + 5.2], [wx1, y1 - 14, z0 + 5.2], [wx0, y1 - 14, z0 + 5.2]], isoFinTex());   // lá tản nhiệt lộ qua cửa sổ
      isoCyl((x0 + x1) / 2, cy - 12, z0 + 7.5, 3.4, (x1 - x0) - 76, 'x', '#c77f3d');   // ống đồng chạy ngang
      isoCyl((x0 + x1) / 2, cy + 16, z0 + 7.5, 3.4, (x1 - x0) - 76, 'x', '#c77f3d');
      isoFill([[xb, cy + 4, z0 - .4], [x1 - 8, cy + 4, z0 - .4], [x1 - 8, y0 + 14, z0 - .4], [xb + 52, y0 + 3, z0 - .4], [xb, y0 + 3, z0 - .4]], '#c4cedb');   // dải bạc bên phải
      isoText('RADEON', x0 + 26, y0 + 30, z0 - .5, 17, '#eef2f7', 'left', 2, xb - x0 - 44);
      isoText('GIGABYTE', x1 - 26, y0 + 30, z0 - .5, 16, '#22d3ee', 'center', 2, (x1 - 8) - xb - 20);
    } else {
      isoFill([[wx0, wy0, z0 + 5.4], [wx1, wy0, z0 + 5.4], [wx1, wy1, z0 + 5.4], [wx0, wy1, z0 + 5.4]], '#141a22');   // hốc tối trong cửa sổ
      for (let i = 0; i < 3; i++) { const dx = i * 8, dy = i * 5;   // vạch chéo trang trí hai đầu tấm lưng
        isoFill([[x0 + 15 + dx, wy0 - 14 - dy, z0 - .4], [x0 + 19 + dx, wy0 - 14 - dy, z0 - .4], [x0 + 5 + dx, y0 + 10 - dy, z0 - .4], [x0 + 1 + dx, y0 + 10 - dy, z0 - .4]], '#7d8aa0');
        isoFill([[x1 - 19 - dx, wy0 - 14 - dy, z0 - .4], [x1 - 15 - dx, wy0 - 14 - dy, z0 - .4], [x1 - 5 + dx, y0 + 10 - dy, z0 - .4], [x1 - 1 + dx, y0 + 10 - dy, z0 - .4]], '#7d8aa0');
      }
      const bnd = (/\b(GIGABYTE|ASUS|MSI|ZOTAC|PALIT|GALAX|PNY|EVGA|ASROCK|INNO3D|GAINWARD)\b/i.exec(nm) || [, ''])[1].toUpperCase();
      const srs = /RTX/i.test(nm) ? 'GEFORCE RTX' : '';
      isoText(P.back || ([bnd, srs].filter(Boolean).join('  /  ') || 'GRAPHICS CARD'), (x0 + x1) / 2, y0 + (wy0 - y0) * .52, z0 - .4, 22, '#eef2f7', 'center', 2, x1 - x0 - 90);
    }
  }
  const fN = P.fN || m.fans, SP = m.len - 44, pitch = SP / fN;
  let pos = P.pos || Array.from({ length: fN }, (_, q) => (q + .5) / fN);
  if (fN === 2) pos = [.24, .76];                                                       // 2 quạt lùi vừa phải, né góc bạc hai đầu
  const cxm = (x0 + x1) / 2;
  const fL = x0 + 22 + pos[0] * SP, fR = x0 + 22 + pos[fN - 1] * SP;                     // tâm 2 quạt ngoài cùng
  const CORN = [[x0 + 12, y1 - 12], [x0 + 60, y1 - 12], [x0 + 12, y1 - 36], [x1 - 12, y0 + 12], [x1 - 60, y0 + 12], [x1 - 12, y0 + 34]];
  let lim = 1e9;
  for (let i = 0; i < fN; i++) { const fx = x0 + 22 + pos[i] * SP; for (const q of CORN) lim = Math.min(lim, Math.hypot(fx - q[0], cy - q[1])); }
  const fr = Math.max(20, Math.min(pitch * .40, (y1 - y0) * .44, fL - x0 - 10, x1 - fR - 10, lim - 4));
  const FXS = []; for (let i = 0; i < fN; i++) FXS.push(x0 + 22 + pos[i] * (m.len - 44));
  const PL = { x0: x0 + 10, x1: x1 - 10, y0: y0 + 10, y1: y1 - 10 };
  const HRS = FXS.map(fx => Math.max(Math.min(fr + 5, (PL.y1 - PL.y0) / 2 - 2, fx - PL.x0 - 2, PL.x1 - fx - 2), fr * .8));
  FXS.forEach((fx, i) => { PL.x0 = Math.min(PL.x0, fx - HRS[i] - 2); PL.x1 = Math.max(PL.x1, fx + HRS[i] + 2); PL.y0 = Math.min(PL.y0, cy - HRS[i] - 2); PL.y1 = Math.max(PL.y1, cy + HRS[i] + 2); });
  { const lay1 = new THREE.Shape();   // thân vỏ khoét hốc sâu xuyên suốt cho quạt
    lay1.moveTo(x0 + 2, y0 + 2); lay1.lineTo(x1 - 2, y0 + 2); lay1.lineTo(x1 - 2, y1 - 2); lay1.lineTo(x0 + 2, y1 - 2); lay1.closePath();
    FXS.forEach((fx, i) => { const hole = new THREE.Path(); hole.absarc(fx, cy, HRS[i], 0, Math.PI * 2, true); lay1.holes.push(hole); });
    const lg = new THREE.ExtrudeGeometry(lay1, { depth: z1 - z0 - 5, bevelEnabled: false });
    lg.applyMatrix4(new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1));
    const lm = new THREE.Mesh(lg, isoMat(SK[0])); lm.position.y = z0 + 5; ISO_G.add(lm); }
  { const plate = new THREE.Shape();   // mặt trên khoét hốc tròn cho quạt chìm vào trong
    plate.moveTo(PL.x0, PL.y0); plate.lineTo(PL.x1, PL.y0); plate.lineTo(PL.x1, PL.y1); plate.lineTo(PL.x0, PL.y1); plate.closePath();
    FXS.forEach((fx, i) => { const hole = new THREE.Path(); hole.absarc(fx, cy, HRS[i], 0, Math.PI * 2, true); plate.holes.push(hole); });
    const pg = new THREE.ExtrudeGeometry(plate, { depth: 3, bevelEnabled: false });
    pg.applyMatrix4(new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1));
    const pm = new THREE.Mesh(pg, isoMat(SK[1])); pm.position.y = z1; ISO_G.add(pm); }
  for (let i = 0; i < fN; i++) {
    const fx = FXS[i], hr = HRS[i];
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(hr - .3, hr - .3, 8.6, 40, 1, true), new THREE.MeshStandardMaterial({ color: new THREE.Color('#0b0e13'), roughness: .85, metalness: .15, side: THREE.DoubleSide }));
    wall.position.set(fx, z1 - 1.35, cy); ISO_G.add(wall);   // thành hốc sâu tối màu
    const bot = new THREE.Mesh(new THREE.CircleGeometry(hr - .3, 40), new THREE.MeshBasicMaterial({ color: 0x07090d }));
    bot.rotation.x = -Math.PI / 2; bot.position.set(fx, z1 - 5.6, cy); ISO_G.add(bot);   // đáy hốc tối
    isoFan(fx, cy, z1 - 4.0, 'z', fr, SK[3], P.led === 'ring', true);   // quạt chìm sâu trong hốc
    if (P.hub) isoText(P.hub, fx, cy, z1 - 2.2, 7, '#222a3b', 'center', true, fr * .7);   // logo ở tâm quạt (chìm theo quạt)
    if (i < fN - 1 && !P.pos) { const gx = fx + pitch / 2, ey = i % 2 ? y0 + 14 : y1 - 14; for (let k = 0; k < 3; k++) isoLed(gx - 8 + k * 6, ey - 5, z1 + 3, gx - 5 + k * 6, ey + 5, z1 + 4.4, lc); }
  }
  if (P.vee) { isoFill([[cxm - 34, y0 + 10, z1 + 3.2], [cxm + 34, y0 + 10, z1 + 3.2], [cxm, cy - 8, z1 + 3.2]], SK[2]); isoFill([[cxm - 34, y1 - 10, z1 + 3.2], [cxm + 34, y1 - 10, z1 + 3.2], [cxm, cy + 8, z1 + 3.2]], SK[2]); }   // chữ V giữa card
  if (P.slash) for (let k = 0; k < 3; k++) isoLed(cxm - 18 + k * 14, y0 + 22, z1 + 3, cxm - 12 + k * 14, y0 + 54, z1 + 4.2);    // 3 vạch LED giữa card
  if (P.strip) s += isoBox(x0 + 44, y0 + 10, z1 + 3, x1 - 44, y0 + 17, z1 + 4.2, P.strip);                                      // dải màu mép trên
  if (P.ptext) isoText(P.ptext, x0 + 40, cy, z1 + 3.5, 14, '#6c737e', 'left', true);                                         // chữ trên tấm giữa
  isoFill([[x0 + 12, y1 - 12, z1 + 3.3], [x0 + 60, y1 - 12, z1 + 3.3], [x0 + 12, y1 - 36, z1 + 3.3]], SK[2]);   // góc bạc
  isoFill([[x1 - 12, y0 + 12, z1 + 3.3], [x1 - 60, y0 + 12, z1 + 3.3], [x1 - 12, y0 + 34, z1 + 3.3]], SK[2]);
  s += isoBox(x1 - 3, y0 + 18, z0 + 6, x1 - 1, y1 - 18, z1 - 2, '#0e1218');                   // đầu lá tản nhiệt
  for (let i = 0; i < 14; i++) isoLine3([x1 - .9, y0 + 20 + i * 6.4, z0 + 8], [x1 - .9, y0 + 20 + i * 6.4, z1 - 4], '#7d8aa0', 1, .8);
  for (let k = 0; k < 4; k++) s += isoCyl(x1 - 3, cy, z0 + 10 + k * 8, 2.4, y1 - y0 - 40, 'y', '#c77f3d');   // ống đồng
  s += isoBox(x0 - 8, y0, z0 - 10, x0 + 2, y1, z1, '#9aa5b4') + isoBox(x0 - 8, y0 + 8, z0 - 2, x0 + 14, y0 + 34, z0 + 4, '#cbd5e1');   // bracket + cổng xuất hình
  isoLed(x0 + 40, y1, z0 + 7, x1 - 44, y1 + 1.5, z0 + 11, lc);                                 // dải LED cạnh hông
  s += isoBox(x1 - 54, y1 - 16, z0 + 8, x1 - 18, y1 + 8, z0 + 34, '#10151c');                  // 12V-2x6
  isoLed(x1 - 48, y1 + 8, z0 + 17, x1 - 24, y1 + 9.4, z0 + 25, lc);
  s += isoBox(44, 26, z0 + 4, 134, y0, z0 + 9, '#d4a83a');                                     // chân vàng PCIe
  const eh = (P.h || (P.sm ? 10 : 18)) * 1.2, ec = '#ffffff';
  if (P.edge) isoText(P.edge, (x0 + x1) / 2, y1 + .5, (z0 + 5 + z1) / 2, eh, ec, 'center');   // logo cạnh hông: trắng, căn giữa, to hơn
  return { svg: s, a: [(x0 + x1) / 2, cy, z1 + 5] };
}
function partStorage(m) {
  let s = isoBox(56, 22, 228, 146, 24, 252, '#10331f') + isoBox(56, 24, 228, 146, 30, 252, '#4a5568');   // SSD M.2 + tản
  for (let i = 0; i < 12; i++) isoLine3([60 + i * 7, 30.1, 230], [60 + i * 7, 30.1, 250], '#1a2230', 1.4, .8);
  isoLed(58, 30, 240, 144, 31, 241.5);
  if (m.two5) s += isoBox(246, 40, 100, 346, 108, 116, '#3f4a63');
  return { svg: s, a: [101, 32, 240] };
}

/* Vỏ case đổi màu theo theme: dark mode -> vỏ trắng, light mode -> vỏ đen */
const isoIsLight = () => document.body.classList.contains('light-mode');
/* Kích thước mainboard theo chuẩn: E-ATX 305x330 · ATX 305x244 · micro-ATX 244x244 · Mini-ITX 170x170 */
function isoBoardFF(nm) {
  nm = nm || '';
  if (/E-?ATX/i.test(nm)) return [305, 330];
  if (/ITX/i.test(nm)) return [170, 170];
  if (/M-?ATX|\bB\d{3}[A-Z]*M\b|\bX\d{3}[A-Z]*M\b|\bZ\d{3}[A-Z]*M\b/i.test(nm)) return [244, 244];
  return [305, 244];
}
function isoShell(dark, light) { return isoIsLight() ? light : dark; }

/* Lưới tổ ong: sợi lưới cùng màu vỏ case (tự đổi sáng/tối), ô lục giác to rõ nét */
function isoHoneyTex() {
  const lt = isoIsLight();
  return isoCanvasTex(lt ? 'honeyL' : 'honeyD', 512, 512, (k, w, h) => {
    k.clearRect(0, 0, w, h);
    const R = 30, DW = Math.sqrt(3) * R, HH = 1.5 * R;            // lưới lục giác đỉnh nhọn: cột cách √3R, hàng cách 1.5R
    k.lineJoin = 'round'; k.lineCap = 'round';
    for (let row = -2; row * HH < h + R; row++) for (let col = -2; col * DW < w + R; col++) {
      const cx = col * DW + ((row & 1) ? DW / 2 : 0), cy = row * HH;
      k.beginPath();
      for (let i = 0; i <= 6; i++) { const a = Math.PI / 3 * i + Math.PI / 6, px = cx + R * Math.cos(a), py = cy + R * Math.sin(a); if (i) k.lineTo(px, py); else k.moveTo(px, py); }
      k.strokeStyle = lt ? 'rgba(120,133,150,.55)' : 'rgba(0,0,0,.5)'; k.lineWidth = 9; k.stroke();       // gờ tối dưới
      k.strokeStyle = isoShell('#141b2b', '#d9e0ea'); k.lineWidth = 7; k.stroke();                                // sợi lưới đúng màu vỏ
    }
  });
}
function towerShell() {
  const D = ISO_D || 420, W = 200, H = 460;
  let s = isoFill([[0, 0, 0], [D, 0, 0], [D, W, 0], [0, W, 0]], isoShell('#0c1220', '#e8ecf2'));
  { const bw = new THREE.Shape();   // tường sau khoét lỗ tròn cho quạt sau thổi xuyên qua
    bw.moveTo(0, 0); bw.lineTo(W, 0); bw.lineTo(W, H); bw.lineTo(0, H); bw.closePath();
    const bh = new THREE.Path(); bh.absarc(100, 316, 54, 0, Math.PI * 2, true); bw.holes.push(bh);
    const bg = new THREE.ExtrudeGeometry(bw, { depth: 8, bevelEnabled: false });
    bg.rotateY(-Math.PI / 2); bg.translate(8, 0, 0);
    ISO_G.add(new THREE.Mesh(bg, isoMat(isoShell('#141b2b', '#d3dae4'))));
    const gr = new THREE.Mesh(new THREE.RingGeometry(54, 63, 48), isoMat(isoShell('#232c3d', '#b9c4d3')));
    gr.rotation.y = Math.PI / 2; gr.position.set(8.5, 316, 100); ISO_G.add(gr);   // vành khung quạt sau
    const hx = isoHoneyTex();
    const hm = new THREE.Mesh(new THREE.CircleGeometry(54, 48), new THREE.MeshBasicMaterial({ map: hx, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    hm.rotation.y = Math.PI / 2; hm.position.set(4, 316, 100); ISO_G.add(hm); }   // lưới tổ ong sau quạt
  s += isoFill([[0, 0, 0], [D, 0, 0], [D, 0, H], [0, 0, H]], isoShell('#161e30', '#dae1ea'));
  for (let i = 1; i < 8; i++) { const z = i * H / 8; s += isoLine3([6, 0, z], [6, W, z], isoShell('#243049', '#b9c3d0'), 1, .5); }
  s += isoFan(16, 100, 316, 'x', 56, '#2a3446', true, false, true, true, true);   // rear exhaust fan (mặt đẹp quay ra sau như quạt trước)
  return s;
}
function towerExtras() {
  const D = ISO_D || 420, W = 200, H = 460;
  [[20, 20], [D - 40, 20], [20, 170], [D - 40, 170]].forEach(q => isoBox(q[0], q[1], -14, q[0] + 30, q[1] + 20, 0, isoShell('#1a2029', '#aab4c2')));   // chân đế
  isoLed(D - 3, 6, 18, D, 12, H - 18); isoLed(D - 3, W - 12, 18, D, W - 6, H - 18);           // dải LED cạnh trước
  isoLed(3, 4, 60, 7, 8, 400);                                                              // dải LED gáy sau

  isoBox(D - 28, 90, H, D - 12, 110, H + 3, '#2a3446'); isoLed(D - 23, 97, H + 3, D - 17, 103, H + 4, '#ffffff', 'breath');   // nút nguồn thở trắng
  isoBox(D - 42, 56, H, D - 28, 70, H + 2, '#0b0f16'); isoBox(D - 42, 128, H, D - 28, 142, H + 2, '#0b0f16'); // cổng USB
}
function towerCables(gx) {
  const C = '#14171c', C2 = '#0f1216';                                    // cáp bọc đen (như ảnh tham khảo)
  const BS = ISO_BS || { x: 1, z: 1 };
  const SX = x => 26 + (x - 26) * BS.x, SZ = z => 128 + (z - 128) * BS.z;  // đầu cáp bám theo socket (bo co giãn theo chuẩn)
  return isoCable([188, 70, 96], [SX(281), 31, SZ(268)], -60, C, 9)                // 24-pin lên mainboard
    + isoCable([184, 110, 96], [SX(281), 31, SZ(278)], -70, C2, 8)                // 24-pin (cáp song song)
    + isoCable([170, 58, 96], [SX(184), 29, SZ(355)], -40, C, 7)                  // EPS 8-pin lên CPU
    + (gx ? isoCable([180, 120, 96], gx, -34, C2, 8) : '');                       // 12V-2x6 lên VGA (onboard thì không có)
}
function towerFans() {
  const D = ISO_D || 420, H = 460;
  let s = '';
  s += isoFan(D - 20, 100, 117, 'x', 56, '#2a3446', true, false, true, true);  // front intake fans (ngồi trong lỗ mặt trước)
  s += isoFan(D - 20, 100, 230, 'x', 56, '#2a3446', true, false, true, true);
  s += isoFan(D - 20, 100, 343, 'x', 56, '#2a3446', true, false, true, true);
  return s;
}
function towerFront() {
  const D = ISO_D || 420, W = 200, H = 460;
  let s = '';
  s += isoFill([[0, 0, H], [D, 0, H], [D, W, H], [0, W, H]], isoShell('#161e30', '#dae1ea'));   // mặt trên: tấm đặc
  s += isoGlass([[0, W, 0], [D, W, 0], [D, W, H], [0, W, H]], .12);               // hông: mặt kính xuyên vào nội thất
  { const fp = new THREE.Shape();   // mặt trước đặc, khoét 3 lỗ tròn cho quạt xuyên qua
    fp.moveTo(0, 0); fp.lineTo(W, 0); fp.lineTo(W, H); fp.lineTo(0, H); fp.closePath();
    [117, 230, 343].forEach(fz => { const hole = new THREE.Path(); hole.absarc(100, fz, 54, 0, Math.PI * 2, true); fp.holes.push(hole); });
    const fg = new THREE.ExtrudeGeometry(fp, { depth: 8, bevelEnabled: false });
    fg.rotateY(-Math.PI / 2); fg.translate(D - 8, 0, 0);
    ISO_G.add(new THREE.Mesh(fg, isoMat(isoShell('#0e141f', '#dbe2ec')))); }
  const E = [
    [[0, 0, 0], [D, 0, 0]], [[0, W, 0], [D, W, 0]], [[0, 0, H], [D, 0, H]], [[0, W, H], [D, W, H]],
    [[0, 0, 0], [0, 0, H]], [[D, 0, 0], [D, 0, H]], [[0, W, 0], [0, W, H]], [[D, W, 0], [D, W, H]],
    [[0, 0, 0], [0, W, 0]], [[D, 0, 0], [D, W, 0]], [[0, 0, H], [0, W, H]], [[D, 0, H], [D, W, H]]
  ];
  E.forEach(e => { s += isoLine3(e[0], e[1], isoShell('rgba(150,180,220,.4)', 'rgba(90,105,125,.5)'), .9, .9); });
  return s;
}
function buildTower(components, meta) {
  const layer = { Mainboard: 0, Barebone: 0, PSU: 1, Power: 1, CPU: 2, SoC: 2, Cooler: 3, Adapter: 3, RAM: 4, GPU: 5, Storage: 6 };
  const makers = {
    Mainboard: partMainboard, Barebone: partMainboard, PSU: partPSU, Power: partPSU,
    CPU: partCPU, SoC: partCPU,
    Cooler: m => m.aio ? partCoolerAIO(m) : partCoolerAir(m),
    Adapter: m => partCoolerAir(m),
    RAM: partRAM, GPU: partGPU, Storage: partStorage
  };
  const parts = [];
  const anyRGB = components.some(c => ISO_RGB_RE.test(c.name || ''));
  const mb = components.find(c => c.type === 'Mainboard' || c.type === 'Barebone');
  const [BW, BH] = isoBoardFF(mb ? mb.name : '');
  const bx = BW / 270, bz = BH / 244;                       // bản vẽ gốc: rộng 270, cao 244
  ISO_BS = { x: bx, z: bz };
  ISO_D = BW < 300 ? 380 : 420;                             // case compact cho bo mATX/ITX, full-tower cho ATX/E-ATX
  ISO_RGB = anyRGB; ISO_G = ISO_ROOT; towerShell();
  const boardG = new THREE.Group(); boardG.scale.set(bx, bz, 1);
  boardG.position.set(26 * (1 - bx), 128 * (1 - bz), 0);      // neo góc dưới-trái (chân bo)
  ISO_ROOT.add(boardG);
  const onBoard = t => t === 'Mainboard' || t === 'Barebone' || t === 'CPU' || t === 'SoC' || t === 'Cooler' || t === 'Adapter' || t === 'RAM' || t === 'Storage';
  components.forEach((c, i) => {
    const mk = makers[c.type]; if (!mk) return;
    ISO_RGB = ISO_RGB_RE.test(c.name || '');
    ISO_G = new THREE.Group(); ISO_G.userData.i = i; (onBoard(c.type) ? boardG : ISO_ROOT).add(ISO_G);
    const r = mk(meta[i], c); if (r) parts.push({ i, a: r.a });
  });
  const gi = components.findIndex(c => c.type === 'GPU');
  const gm = gi >= 0 ? meta[gi] : null;
  const gx = (gm && !gm.onboard) ? [12 + (gm.len || 300) - 36, 172, 167] : null;   // đầu 12V theo đúng cỡ card
  ISO_RGB = true; ISO_G = ISO_ROOT; towerCables(gx); towerFans(); towerExtras(); towerFront(); ISO_RGB = anyRGB;   // đèn case luôn sáng RGB
  return { parts };
}

/* ── laptop ── */
function buildLaptop(components, meta) {
  let back = `<ellipse cx="300" cy="700" rx="240" ry="26" fill="#000" opacity=".22"/>`;
  const chassisTop = isoBox(90, 46, 0, 420, 210, 16, '#aeb9c9')
    + isoBox(62, 50, 18, 86, 206, 250, '#9aa6b8')
    + isoFill([[86, 50, 24], [86, 206, 24], [86, 206, 238], [86, 50, 238]], 'url(#scr2)', 'opacity=".92"')
    + isoFill([[86, 50, 24], [86, 206, 24], [86, 130, 238]], '#fff', 'opacity=".10"')
    + isoFill([[258, 62, 16.4], [412, 62, 16.4], [412, 196, 16.4], [258, 196, 16.4]], '#0f1724', 'opacity=".9"');
  back += chassisTop;
  for (let k = 1; k < 11; k++) { const x = 258 + k * 14; back += isoLine3([x, 64, 16.6], [x, 194, 16.6], '#33415a', 1, .6); }
  for (let r = 1; r < 4; r++) { const y = 62 + r * 33; back += isoLine3([260, y, 16.6], [410, y, 16.6], '#33415a', 1, .6); }
  back += isoFill([[318, 120, 16.6], [398, 120, 16.6], [398, 166, 16.6], [318, 166, 16.6]], '#cbd5e1', 'opacity=".5"');
  back += isoFan(126, 92, 20, 'z', 24, '#2b3648', false);
  const parts = [];
  const put = (i, svg, a) => parts.push({ i, svg, a, L: 0 });
  components.forEach((c, i) => {
    if (c.type === 'Laptop') return put(i, '', [335, 128, 18]);
    if (c.type === 'SoC' || c.type === 'CPU') return put(i, isoBox(150, 104, 18.5, 212, 160, 27, '#c9d2de') + isoBox(158, 112, 27, 204, 152, 29, '#8b98a8'), [181, 132, 30]);
    if (c.type === 'RAM') {
      const n = meta[i].sticks >= 2 ? 2 : 1;
      let s = '';
      for (let k = 0; k < n; k++) s += isoBox(108, 140 + k * 36, 18.5, 252, 168 + k * 36, 24, '#2f6b4f');
      return put(i, s, [180, 158, 26]);
    }
    if (c.type === 'Storage') return put(i, isoBox(150, 60, 18.5, 252, 92, 23, '#3f4a63'), [200, 76, 26]);
    if (c.type === 'Power') return put(i, isoBox(108, 186, 16, 252, 202, 22, '#2b3444'), [180, 194, 24]);
    put(i, '', [340, 168, 20]);
  });
  return { back, parts, front: '' };
}

/* ── Mac (mini / studio) ── */
function buildMac(components, meta) {
  let back = `<ellipse cx="300" cy="690" rx="230" ry="26" fill="#000" opacity=".22"/>`;
  back += isoBox(90, 50, 30, 370, 240, 140, '#c3ccda');
  back += isoBox(96, 56, 140, 364, 234, 142, '#aeb9c9');
  back += isoBox(300, 56, 40, 364, 234, 134, '#2b3444');
  const parts = [];
  components.forEach((c, i) => {
    if (c.type === 'SoC' || c.type === 'CPU') return parts.push({ i, svg: isoBox(150, 100, 140, 214, 158, 152, '#c9d2de') + isoBox(158, 108, 152, 206, 150, 155, '#8b98a8'), a: [182, 129, 154], L: 0 });
    if (c.type === 'RAM') {
      const n = meta[i].sticks >= 2 ? 2 : 1; let s = '';
      for (let k = 0; k < n; k++) s += isoBox(120, 176 + k * 30, 140, 282, 200 + k * 30, 148, '#2f6b4f');
      return parts.push({ i, svg: s, a: [200, 190, 150], L: 1 });
    }
    if (c.type === 'Storage') return parts.push({ i, svg: isoBox(120, 60, 140, 210, 100, 148, '#3f4a63'), a: [165, 80, 150], L: 1 });
    if (c.type === 'Power') return parts.push({ i, svg: isoFan(332, 145, 138, 'z', 30, '#3a4763', false), a: [332, 145, 150], L: 1 });
    parts.push({ i, svg: '', a: [230, 145, 150], L: 1 });
  });
  back += isoFan(230, 145, 142, 'z', 54, '#3a4763', false);
  for (let k = 0; k < 6; k++) { const x = 300 + k * 11; back += isoLine3([x, 60, 138], [x, 230, 138], '#1b2333', 2, .6); }
  return { back, parts, front: '' };
}

/* ── Barebone / Mini PC ── */
function buildBarebone(components, meta) {
  let back = `<ellipse cx="300" cy="660" rx="220" ry="24" fill="#000" opacity=".22"/>`;
  back += isoBox(120, 70, 60, 360, 230, 120, '#c3ccda');
  back += isoBox(126, 76, 120, 354, 224, 122, '#aeb9c9');
  back += isoBox(130, 80, 122, 350, 220, 124, '#1c4a38');
  back += isoFan(160, 150, 126, 'z', 26, '#2b3648', false);
  const parts = [];
  components.forEach((c, i) => {
    if (c.type === 'Barebone' || c.type === 'Mainboard') return parts.push({ i, svg: '', a: [300, 210, 122], L: 0 });
    if (c.type === 'CPU' || c.type === 'SoC') return parts.push({ i, svg: isoBox(200, 118, 122, 252, 166, 132, '#c9d2de'), a: [226, 142, 134], L: 1 });
    if (c.type === 'RAM') return parts.push({ i, svg: isoBox(150, 176, 122, 330, 198, 128, '#2f6b4f') + isoBox(150, 202, 122, 330, 224, 128, '#2f6b4f'), a: [240, 190, 130], L: 1 });
    if (c.type === 'Storage') return parts.push({ i, svg: isoBox(150, 86, 122, 300, 112, 127, '#3f4a63'), a: [225, 99, 129], L: 1 });
    if (c.type === 'Adapter' || c.type === 'Power') {
      let s = isoBox(392, 120, 0, 486, 182, 34, '#2b3444');
      s += isoCable([392, 151, 20], [360, 151, 80], 24, '#0b1120', 5);
      return parts.push({ i, svg: s, a: [439, 151, 36], L: 2 });
    }
    parts.push({ i, svg: '', a: [300, 200, 126], L: 2 });
  });
  return { back, parts, front: '' };
}

/* ── 7 linh kiện bắt buộc hiển thị trong sơ đồ lắp ráp (thứ tự panel bên phải) ── */
const ISO_SLOTS = [
  { key: 'Mainboard', accept: ['Mainboard', 'Barebone'] },
  { key: 'CPU',       accept: ['CPU', 'SoC'] },
  { key: 'RAM',       accept: ['RAM'] },
  { key: 'GPU',       accept: ['GPU'] },
  { key: 'Storage',   accept: ['Storage'] },
  { key: 'Cooler',    accept: ['Cooler'] },
  { key: 'PSU',       accept: ['PSU', 'Power', 'Adapter'] }
];
/* Model mới (2025–2026) dùng làm mẫu khi build thiếu linh kiện */
const ISO_NEW_PART = {
  CPU:       { name: 'AMD Ryzen 7 9800X3D', desc: '8 nhân 16 luồng, 3D V-Cache, gaming mạnh nhất', icon: '⚡', color: 'border-l-purple-500' },
  GPU:       { name: 'ASUS TUF Gaming GeForce RTX 5070 Ti 16GB', desc: 'GPU thế hệ RTX 50, 16GB GDDR7, DLSS 4', icon: '🎮', color: 'border-l-indigo-500' },
  RAM:       { name: 'Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000', desc: 'DDR5 bus 6000MHz, tản nhiệt RGB', icon: '💾', color: 'border-l-purple-500' },
  Storage:   { name: 'Samsung 9100 PRO 2TB NVMe PCIe 5.0', desc: 'SSD PCIe Gen5, tốc độ đọc 14.800MB/s', icon: '💿', color: 'border-l-amber-500' },
  Mainboard: { name: 'ASUS TUF GAMING B850-PLUS WIFI', desc: 'Bo mạch chủ AM5 B850, PCIe 5.0 & WiFi 6E', icon: '🔧', color: 'border-l-pink-500' },
  PSU:       { name: 'Corsair RM850e 850W 80+ Gold ATX 3.1', desc: 'Nguồn 850W chuẩn ATX 3.1, đầu cấp 12V-2x6', icon: '🔌', color: 'border-l-emerald-500' },
  Cooler:    { name: 'Arctic Liquid Freezer III 360 AIO', desc: 'Tản nước AIO 360mm, hiệu năng làm mát đỉnh', icon: '🥶', color: 'border-l-cyan-500' }
};
/* Chuẩn hoá build về đủ 7 linh kiện thùng máy: giữ tên thật, thêm model mới nếu thiếu */
function isoFullBuild(components) {
  const used = new Set();
  return ISO_SLOTS.map(slot => {
    const i = components.findIndex((c, idx) => !used.has(idx) && slot.accept.includes(c.type));
    if (i !== -1) {
      used.add(i);
      return { ...components[i], type: slot.key };
    }
    return { type: slot.key, ...ISO_NEW_PART[slot.key] };
  });
}

function isoDiagramHTML(components) {
  const full = isoFullBuild(components);
  const rows = full.map((c, i) => `<div class="iso-row" data-iso="p${i}" onmouseenter="isoHot(${i},1)" onmouseleave="isoHot(${i},0)">
      <span class="iso-row-ic">${c.icon || '🔩'}</span>
      <div class="iso-row-tx"><b>${TYPE_LABEL[c.type] || c.type}</b><u title="${c.name}">${c.name}</u></div>
    </div>`).join('');
  setTimeout(() => isoMount(full), 0);
  return `<div class="iso-wrap">
    <div class="iso-stage" id="isoStage">
      <div class="iso-ctl"><button id="isoAutoBtn" onclick="isoCtl('auto')">⟳ Tự xoay</button><button onclick="isoCtl('reset')">↺ Đặt lại</button></div>
      <div class="iso-hint">🖱️ Kéo để xoay 360° · cuộn chuột / chụm tay để phóng to</div>
    </div>
    <div class="iso-panel">${rows}</div>
  </div>
  <div class="iso-cap" id="isoCap">Bản vẽ minh họa</div>`;
}
function isoCtl(k) {
  if (!ISO_CUR) return; const S = ISO_CUR.S;
  if (k === 'auto') S.auto = !S.auto; else Object.assign(S, { az: Math.PI / 4, el: .5, d: S.d0 || 1250, auto: false });
  const b = document.getElementById('isoAutoBtn'); if (b) b.classList.toggle('on', S.auto);
}
function isoHot(id, on) {
  document.querySelectorAll('[data-iso="p' + id + '"]').forEach(n => n.classList.toggle('iso-hot', !!on));
  const g = ISO_ROOT && ISO_ROOT.children.find(o => o.userData.i === id); if (!g) return;
  const col = new THREE.Color(isoAccent()).multiplyScalar(.6);
  g.traverse(o => { if (o.material && o.material.emissive) o.material.emissive.set(on ? col : 0x000000); });
}
function isoMount(full) {
  const st = document.getElementById('isoStage'); if (!st) return;
  if (ISO_CUR) { cancelAnimationFrame(ISO_CUR.raf); if (ISO_CUR.el) ISO_CUR.el.remove(); ISO_CUR.r.dispose(); if (ISO_CUR.env) ISO_CUR.env.dispose(); ISO_CUR = null; }   // xoá canvas cũ khỏi DOM, tránh 2 scene chồng nhau
  if (typeof THREE === 'undefined') { st.insertAdjacentHTML('beforeend', '<div style="position:absolute;inset:0;display:grid;place-items:center;padding:1rem;text-align:center;font-size:.8rem;color:#94a3b8">Không tải được thư viện 3D (three.js). Hãy kiểm tra mạng rồi tải lại trang.</div>'); return; }
  ISO_ROOT = new THREE.Group(); ISO_FANS = []; ISO_RINGS = []; ISO_GLOWS = []; ISO_CABLES = []; ISO_BREATH = [];
  const { parts } = buildTower(full, full.map(parseIsoMeta));

  const scene = new THREE.Scene(); scene.add(ISO_ROOT);
  const cam = new THREE.PerspectiveCamera(32, 1, 20, 6000); scene.add(cam);
  scene.add(new THREE.HemisphereLight(0xdfeaff, 0x14171e, .5));
  const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(500, 700, 620); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.camera.left = -500; key.shadow.camera.right = 500;
  key.shadow.camera.top = 600; key.shadow.camera.bottom = -200; key.shadow.camera.near = 100; key.shadow.camera.far = 2600;
  key.shadow.bias = -0.0004; key.shadow.camera.updateProjectionMatrix(); key.target.position.set(ISO_D / 2, 100, 230); scene.add(key); scene.add(key.target);
  const rim = new THREE.DirectionalLight(0x7dd3fc, .5); rim.position.set(-420, 60, 480); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffe2c4, .3); fill.position.set(80, 640, 160); scene.add(fill);
  const acc = new THREE.PointLight(new THREE.Color(isoAccent()), .55, 1700); acc.position.set(210, 330, 270); scene.add(acc);
  const pl = new THREE.PointLight(0xffffff, .22, 0, 0); pl.position.set(250, 350, 150); cam.add(pl);
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true }); r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.12;
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  const pm = new THREE.PMREMGenerator(r), es = new THREE.Scene();
  const eb = (w, h, c, x, y, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); es.add(m); };
  eb(1200, 700, 0xffffff, 0, 500, 700); eb(900, 500, 0x9fc8ff, -650, 80, 220);
  eb(900, 500, 0xffd9b0, 650, -80, 170); eb(1400, 800, 0x232833, 0, -350, 80);
  scene.environment = pm.fromScene(es, .05, .1, 3000).texture; pm.dispose();
  ISO_ROOT.traverse(o => { if (o.isMesh) { const mt = o.material; o.castShadow = !(mt && (mt.isMeshBasicMaterial || mt.transparent)); o.receiveShadow = true; } });
  r.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block'; st.prepend(r.domElement);
  const badges = [];  // đã bỏ số thứ tự
  const S = { az: Math.PI / 4, el: .5, d: Math.round(1250 * ISO_D / 420), d0: Math.round(1250 * ISO_D / 420), auto: !ISO_REDUCE }, T = new THREE.Vector3(ISO_D / 2, 230, 100);
  ISO_CUR = { r, S, raf: 0, env: scene.environment, el: r.domElement }; document.getElementById('isoAutoBtn').classList.toggle('on', S.auto);
  let drag = null, hov = -1, pw = 0, ph = 0, last = performance.now(); const ray = new THREE.Raycaster(), mv = new THREE.Vector2();
  st.addEventListener('pointerdown', e => { if (e.target.closest('.iso-ctl,.iso-b')) return; drag = { x: e.clientX, y: e.clientY }; S.auto = false; document.getElementById('isoAutoBtn').classList.remove('on'); st.setPointerCapture(e.pointerId); });
  st.addEventListener('pointerup', () => { drag = null; });
  st.addEventListener('pointermove', e => {
    if (drag) { S.az += (e.clientX - drag.x) * .008; S.el = Math.max(-1.3, Math.min(1.45, S.el + (e.clientY - drag.y) * .006)); drag = { x: e.clientX, y: e.clientY }; return; }
    const b = st.getBoundingClientRect(); mv.set((e.clientX - b.left) / b.width * 2 - 1, -(e.clientY - b.top) / b.height * 2 + 1); ray.setFromCamera(mv, cam);
    const h = ray.intersectObjects(ISO_ROOT.children, true).find(x => { let o = x.object; while (o && o.userData.i === undefined) o = o.parent; return o; });
    let id = -1; if (h) { let o = h.object; while (o.userData.i === undefined) o = o.parent; id = o.userData.i; }
    if (id !== hov) { if (hov >= 0) isoHot(hov, 0); if (id >= 0) isoHot(id, 1); hov = id; }
  });
  st.addEventListener('wheel', e => { e.preventDefault(); S.d = Math.max(600, Math.min(2200, S.d * (1 + e.deltaY * .001))); }, { passive: false });
  const pts = new Map(); let pd = 0;
  st.addEventListener('pointerdown', e => pts.set(e.pointerId, e)); st.addEventListener('pointerup', e => { pts.delete(e.pointerId); pd = 0; });
  st.addEventListener('pointermove', e => { if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, e); if (pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); if (pd) S.d = Math.max(600, Math.min(2200, S.d * pd / d)); pd = d; drag = null; } });
  const tick = t => {
    if (!st.isConnected) { if (r.domElement) r.domElement.remove(); r.dispose(); if (scene.environment) scene.environment.dispose(); ISO_CUR = null; return; }
    const dt = Math.min((t - last) / 1000, .1); last = t;
    const w = st.clientWidth, h = st.clientHeight; if (w !== pw || h !== ph) { pw = w; ph = h; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
    if (S.auto) S.az += dt * .35;
    ISO_FANS.forEach(f => { f.b.rotation.z -= dt * f.s; });
    ISO_RINGS.forEach(g => { const dv = g.userData.cf ? 6000 : 12000; g.material.color.setHSL((t / dv + (g.userData.ph || 0)) % 1, 1, .66); });   // case fan 2 màu/s, còn lại giữ nhịp chậm
    
    ISO_GLOWS.forEach(p => p.h.material.color.copy(p.s.material.color));
    for (const b of ISO_BREATH) { const k = .35 + .65 * (.5 + .5 * Math.sin(t / 1500 + (b.ph || 0))); b.m.material.color.copy(b.col).multiplyScalar(k); if (b.h) { b.h.material.color.copy(b.m.material.color); b.h.material.opacity = .3 * k; } }   // LED thở
    if (!ISO_REDUCE) for (const c of ISO_CABLES) {   // dây đung đưa nhẹ, 2 đầu cắm giữ cố định
      const s1 = Math.sin(t / 1100 + c.phase), s2 = Math.sin(t / 1700 + c.phase * 1.7);
      const P = [c.pts[0], c.pts[1].clone().addScaledVector(c.lat, s1 * c.amp), c.pts[2].clone().addScaledVector(c.lat, s2 * c.amp * 1.4), c.pts[3].clone().addScaledVector(c.lat, s1 * c.amp), c.pts[4]];
      const cu = new THREE.CatmullRomCurve3(P);
      c.mesh.geometry.dispose(); c.mesh.geometry = new THREE.TubeGeometry(cu, 22, c.r, 7);
      if (c.combs) for (const cb of c.combs) { const p = cu.getPointAt(cb.t), tn = cu.getTangentAt(cb.t); cb.m.position.copy(p); cb.m.lookAt(p.clone().add(tn)); }
    }
    
    cam.position.set(T.x + S.d * Math.cos(S.el) * Math.cos(S.az), T.y + S.d * Math.sin(S.el), T.z + S.d * Math.cos(S.el) * Math.sin(S.az)); cam.lookAt(T);
    r.render(scene, cam);
    badges.forEach(b => { const v = b.v.clone().project(cam); b.el.style.display = v.z > 1 ? 'none' : ''; b.el.style.transform = `translate(${((v.x * .5 + .5) * w).toFixed(1)}px,${((-v.y * .5 + .5) * h).toFixed(1)}px)`; });
    ISO_CUR.raf = requestAnimationFrame(tick);
  };
  ISO_CUR.raf = requestAnimationFrame(tick);
}

const HOME_CARDS = [
  ['ai','AI Engineer / Deep Learning','Train model AI, xử lý dữ liệu lớn, cần GPU VRAM lớn.'],
  ['3d','3D Design','Render 3D, dựng hình, cần GPU mạnh và RAM dung lượng cao.'],
  ['editor','Video Editing','Dựng phim 4K/8K, chỉnh màu, cần CPU đa nhân và NVMe siêu nhanh.'],
  ['streamer','Streamer','Stream game, chơi game online, cần GPU tầm trung và RAM đủ lớn.'],
  ['coder','Coder','Lập trình web/app, chạy container, cần RAM lớn và CPU đa nhân.'],
  ['office','Office Worker','Soạn thảo, học online, cấu hình cơ bản với chi phí thấp nhất.'],
  ['mac','Mac/Apple','Ưu tiên hệ sinh thái Apple: MacBook, Mac Studio, Mac Pro.'],
  ['data','Data Analyst','Phân tích dữ liệu với Python, SQL, Power BI và Jupyter.'],
  ['architecture','Architect','AutoCAD, Revit, SketchUp, Lumion và Enscape.'],
  ['security','Cybersecurity','Kali Linux, máy ảo, Docker, Kubernetes và SIEM lab.'],
  ['music','Music Producer','FL Studio, Ableton, Cubase, Kontakt và Pro Tools.'],
  ['product','Product/ Interior Design','Rhino, 3ds Max, KeyShot, V-Ray và Substance 3D.'],
  ['mobile','Mobile Developer','Android Studio, Xcode, Flutter và React Native.'],
  ['web3','Blockchain / Web3 Developer','Solidity, Foundry, Hardhat, node local và Docker.'],
  ['science','Nghiên cứu khoa học / Kỹ thuật','MATLAB, Simulink, Mathematica, R và Python SciPy.'],
];
/* ── Logo ứng dụng theo ngành (simple-icons CC0, Iconify logos/devicon/skill-icons/mdi) ── */
const CARD_ICON_MODE = 'apps'; // 'apps' = logo phần mềm | 'art' = icon 3D tự vẽ
/* BRAND: dữ liệu icon logo – xem js/icons-data.js (nạp trước main.js) */
/* RICH: dữ liệu icon logo – xem js/icons-data.js (nạp trước main.js) */
const HOME_APPS = {"coder":["*vscode","docker","git","github"],"ai":["pytorch","tensorflow","nvidia","huggingface"],"data":["python","*powerbi","postgresql","jupyter"],"mobile":["androidstudio","flutter","swift","xcode"],"web3":["ethereum","solidity","bitcoin","chainlink"],"security":["kalilinux","wireshark","metasploit","burpsuite"],"3d":["blender","unrealengine","unity","autodeskmaya"],"editor":["davinciresolve","*pr","*ae","youtube"],"streamer":["obsstudio","twitch","steam","discord"],"music":["*ableton","steinberg","protools","audacity"],"product":["rhinoceros","*max3ds","sketchup","blender"],"architecture":["autocad","archicad","sketchup","unrealengine"],"office":["*word","*excel","*ppt","zoom"],"mac":["apple","xcode","safari","appstore"],"science":["*matlab","python","r","wolframmathematica"]};
const _lum = h => { const n = parseInt(h, 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
const _mix = h => { const n = parseInt(h, 16), m = v => Math.round(v + (255 - v) * 0.4).toString(16).padStart(2, '0'); return m(n >> 16) + m((n >> 8) & 255) + m(n & 255); };
function appTile(id) {
  if (id[0] === '*') { const [title, vb, body, mono] = RICH[id.slice(1)];
    return `<span class="app-tile rich" title="${title}"><svg viewBox="${vb}" aria-hidden="true" ${mono ? `style="color:${mono};fill:${mono}"` : ''}>${body}</svg></span>`; }
  const [hex, path, title] = BRAND[id]; const L = _lum(hex); const c = L < 0.42 ? 'e2e8f0' : L < 0.5 ? _mix(hex) : hex;
  return `<span class="app-tile" title="${title}" style="--c:#${c};--c2:#${hex}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg></span>`;
}
const appsHTML = key => `<div class="app-grid">${(HOME_APPS[key] || []).map(appTile).join('')}</div>`;

const HOME_GROUPS = [
  { id:'dev',      icon:'💻', name:'Lập trình & Dữ liệu',      keys:['coder','ai','data','mobile','web3','security'] },
  { id:'creative', icon:'🎬', name:'Sáng tạo & Truyền thông',  keys:['3d','editor','streamer','music'] },
  { id:'design',   icon:'📐', name:'Thiết kế & Kỹ thuật',      keys:['product','architecture','science'] },
  { id:'office',   icon:'🏢', name:'Văn phòng & Apple',        keys:['office','mac'] },
];
let homeGroup = 'all';
function homeCardHTML([key, title, desc]) {
  return `<div class="cc" role="button" tabindex="0" onclick="selectCareer('${key}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();selectCareer('${key}')}">
      <div class="cc-art">${CARD_ICON_MODE === 'apps' ? appsHTML(key) : artSVG(key)}</div>
      <div class="cc-body"><h3>${title}</h3><p>${desc}</p></div>
      <span class="cc-dot"></span>
    </div>`;
}
function homeSectionsHTML() {
  const by = Object.fromEntries(HOME_CARDS.map(c => [c[0], c]));
  /* Chọn số cột chia hết cho số thẻ (không còn hàng lẻ) — desktop tối đa 3, tablet tối đa 2 */
  const evenCols = (n, max) => { for (let c = Math.min(max, n); c > 1; c--) if (n % c === 0) return c; return 1; };
  return HOME_GROUPS.filter(g => homeGroup === 'all' || g.id === homeGroup).map(g => {
    const n = g.keys.length;
    return `
    <section class="gsec">
      <div class="ghead"><span class="gi">${g.icon}</span><h2>${g.name}</h2><i class="line"></i><span class="count">${g.keys.length} ngành</span></div>
      <div class="cc-grid" style="--cols:${evenCols(n, 3)};--cols-md:${evenCols(n, 2)}">${g.keys.map(k => homeCardHTML(by[k])).join('')}</div>
    </section>`;
  }).join('');
}
function setHomeGroup(id) {
  homeGroup = id;
  document.getElementById('home-cards').innerHTML = homeSectionsHTML();
  document.querySelectorAll('.gchip').forEach(c => c.classList.toggle('on', c.dataset.g === id));
}
function renderHomeCards() {
  const chip = (id, label) => `<button class="gchip ${homeGroup === id ? 'on' : ''}" data-g="${id}" onclick="setHomeGroup('${id}')">${label}</button>`;
  return ART_DEFS + `<div class="gchips">${chip('all', 'Tất cả · ' + HOME_CARDS.length)}${HOME_GROUPS.map(g => chip(g.id, `${g.icon} ${g.name}`)).join('')}</div><div id="home-cards">${homeSectionsHTML()}</div>`;
}

function renderHome() {
  currentStep = 'home';
  activeCareerKey = null;
  document.body.className = document.body.className
    .replace(/\btheme-\S+/g, '').trim();
  updateFloatingIcons('home');
  const existingBg = document.getElementById('career-page-bg');
  if (existingBg) existingBg.remove();

  document.getElementById('back-btn').classList.add('hidden');
  document.getElementById('selected-badge').classList.add('hidden');

  document.getElementById('main-view').innerHTML = `
    <!-- HERO SECTION -->
    <div class="text-center space-y-2 mb-5">
      <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl btn-primary text-xl mb-1">
        💭
      </div>
      <h1 class="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight" style="letter-spacing:-0.045em">Ước mơ <span class="gradient-text">nghề nghiệp</span><br class="hidden sm:block"> của bạn là gì?</h1>
      <p class="text-slate-400 text-xs md:text-sm">Chọn nghề hoặc nhập ước mơ — tôi sẽ build PC hoàn hảo cho bạn!</p>

    </div>

    ${renderHomeCards()}

    <!-- BOTTOM CUSTOM INPUT BOX -->
    <div class="card-purple rounded-2xl p-3.5 border border-purple-500/30 w-full space-y-3">
      <div class="text-xs font-bold text-purple-300 flex items-center gap-1.5"><span>✨</span><span>Mô tả nhu cầu của bạn:</span></div>
      <div class="flex items-center gap-2.5">
        <input id="custom-dream-input" type="text" onkeyup="if(event.key === 'Enter') handleCustomDream()" placeholder="VD: Em làm dựng video 4K và chơi game, cần Intel i7, RAM 32GB..." class="w-full bg-[#0d0a1a] border border-purple-900/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/60 transition-colors">
        <button onclick="handleCustomDream()" class="btn-glass text-xs px-4 py-2.5 rounded-xl shrink-0 flex items-center justify-center">Phân tích →</button>
      </div>
      ${budgetSliderHTML()}
    </div>
  `;
}

function updateFloatingIcons(key) {
  const careerLogos = {
    home: [
      { slug:'nvidia',           color:'76B900', pos:'top:8%;left:2%',    size:56, anim:'floatA', dur:7,  delay:0,  extra:'has-ring' },
      { slug:'python',           color:'3776AB', pos:'top:35%;left:1.5%', size:44, anim:'floatB', dur:8,  delay:-2  },
      { slug:'blender',          color:'E87D0D', pos:'top:65%;left:2%',   size:50, anim:'floatC', dur:6,  delay:-4, extra:'has-orbit' },
      { slug:'adobepremierepro', color:'9999FF', pos:'top:10%;right:2%',  size:48, anim:'floatB', dur:9,  delay:-1  },
      { slug:'steam',            color:'FFFFFF', pos:'top:42%;right:1.5%',size:52, anim:'floatA', dur:7,  delay:-3, extra:'has-ring' },
      { slug:'apple',            color:'999999', pos:'top:72%;right:2%',  size:46, anim:'driftX', dur:8,  delay:-5  },
      { slug:'intel',            color:'0071C5', pos:'top:22%;left:4%',   size:34, anim:'floatC', dur:10, delay:-1  },
      { slug:'amd',              color:'ED1C24', pos:'top:55%;right:4%',  size:34, anim:'floatB', dur:11, delay:-6  },
    ],
    ai: [
      { slug:'python',        color:'3776AB', pos:'top:6%;left:2%',    size:60, anim:'floatA', dur:7,  delay:0,  extra:'has-ring' },
      { slug:'pytorch',       color:'EE4C2C', pos:'top:32%;left:1.5%', size:50, anim:'floatB', dur:9,  delay:-2, extra:'has-orbit' },
      { slug:'tensorflow',    color:'FF6F00', pos:'top:62%;left:2%',   size:52, anim:'floatC', dur:8,  delay:-4  },
      { slug:'nvidia',        color:'76B900', pos:'top:8%;right:2%',   size:58, anim:'floatB', dur:7,  delay:-1, extra:'has-ring' },
      { slug:'jupyter',       color:'F37626', pos:'top:38%;right:1.5%',size:46, anim:'floatA', dur:10, delay:-3  },
      { slug:'huggingface',   color:'FFD21E', pos:'top:68%;right:2%',  size:48, anim:'driftX', dur:8,  delay:-5, extra:'has-orbit' },
      { slug:'opencv',        color:'5C3EE8', pos:'top:20%;left:4.5%', size:34, anim:'floatC', dur:11, delay:-3  },
      { slug:'scikitlearn',   color:'F7931E', pos:'top:50%;right:5%',  size:34, anim:'floatB', dur:9,  delay:-7  },
    ],
    '3d': [
      { slug:'blender',      color:'E87D0D', pos:'top:6%;left:2%',    size:62, anim:'floatA', dur:7,  delay:0,  extra:'has-ring' },
      { slug:'unrealengine', color:'FFFFFF', pos:'top:33%;left:1.5%', size:52, anim:'floatB', dur:9,  delay:-2  },
      { slug:'autodesk',     color:'0696D7', pos:'top:63%;left:2%',   size:50, anim:'floatC', dur:8,  delay:-4, extra:'has-orbit' },
      { slug:'unity',        color:'FFFFFF', pos:'top:9%;right:2%',   size:56, anim:'floatB', dur:8,  delay:-1, extra:'has-ring' },
      { slug:'epicgames',    color:'FFFFFF', pos:'top:40%;right:1.5%',size:46, anim:'floatA', dur:10, delay:-3  },
      { slug:'adobesubstance3d',color:'FF6F00',pos:'top:69%;right:2%',size:48, anim:'driftX', dur:8,  delay:-5  },
      { slug:'houdini',      color:'FF6600', pos:'top:20%;left:5%',   size:34, anim:'floatC', dur:12, delay:-2  },
      { slug:'nvidia',       color:'76B900', pos:'top:52%;right:5%',  size:34, anim:'floatB', dur:9,  delay:-6, extra:'has-orbit' },
    ],
    editor: [
      { slug:'adobepremierepro', color:'9999FF', pos:'top:6%;left:2%',    size:62, anim:'floatA', dur:7,  delay:0,  extra:'has-ring' },
      { slug:'davinciresolve',   color:'FF7B25', pos:'top:33%;left:1.5%', size:52, anim:'floatB', dur:9,  delay:-2, extra:'has-orbit' },
      { slug:'adobeaftereffects',color:'9999FF', pos:'top:63%;left:2%',   size:50, anim:'floatC', dur:8,  delay:-4  },
      { slug:'youtube',          color:'FF0000', pos:'top:9%;right:2%',   size:56, anim:'floatB', dur:8,  delay:-1, extra:'has-ring' },
      { slug:'adobeaudition',    color:'9999FF', pos:'top:40%;right:1.5%',size:46, anim:'floatA', dur:10, delay:-3  },
      { slug:'handbrake',        color:'FF6A00', pos:'top:69%;right:2%',  size:48, anim:'driftX', dur:8,  delay:-5, extra:'has-orbit' },
      { slug:'nvidia',           color:'76B900', pos:'top:22%;left:5%',   size:34, anim:'floatC', dur:11, delay:-1  },
      { slug:'applemusic',       color:'FC3C44', pos:'top:54%;right:5%',  size:34, anim:'floatB', dur:9,  delay:-6  },
    ],
    streamer: [
      { slug:'obsstudio', color:'302E31', pos:'top:6%;left:2%',    size:62, anim:'floatA', dur:7,  delay:0,  extra:'has-ring' },
      { slug:'twitch',    color:'9146FF', pos:'top:33%;left:1.5%', size:54, anim:'floatB', dur:9,  delay:-2, extra:'has-orbit' },
      { slug:'steam',     color:'FFFFFF', pos:'top:63%;left:2%',   size:52, anim:'floatC', dur:8,  delay:-4  },
      { slug:'discord',   color:'5865F2', pos:'top:9%;right:2%',   size:58, anim:'floatB', dur:8,  delay:-1, extra:'has-ring' },
      { slug:'youtube',   color:'FF0000', pos:'top:40%;right:1.5%',size:50, anim:'floatA', dur:10, delay:-3  },
      { slug:'nvidia',    color:'76B900', pos:'top:69%;right:2%',  size:48, anim:'driftX', dur:8,  delay:-5, extra:'has-orbit' },
      { slug:'valorant',  color:'FF4655', pos:'top:22%;left:5%',   size:36, anim:'floatC', dur:11, delay:-3  },
      { slug:'epicgames', color:'FFFFFF', pos:'top:54%;right:5%',  size:34, anim:'floatB', dur:10, delay:-7  },
    ],
    coder: [
      { slug:'visualstudiocode', color:'007ACC', pos:'top:6%;left:2%',    size:62, anim:'floatA', dur:7,  delay:0,  extra:'has-ring' },
      { slug:'docker',           color:'2496ED', pos:'top:33%;left:1.5%', size:54, anim:'floatB', dur:9,  delay:-2, extra:'has-orbit' },
      { slug:'git',              color:'F05032', pos:'top:63%;left:2%',   size:52, anim:'floatC', dur:8,  delay:-4  },
      { slug:'github',           color:'FFFFFF', pos:'top:9%;right:2%',   size:58, anim:'floatB', dur:8,  delay:-1, extra:'has-ring' },
      { slug:'linux',            color:'FCC624', pos:'top:40%;right:1.5%',size:50, anim:'floatA', dur:10, delay:-3  },
      { slug:'kubernetes',       color:'326CE5', pos:'top:69%;right:2%',  size:48, anim:'driftX', dur:8,  delay:-5, extra:'has-orbit' },
      { slug:'typescript',       color:'3178C6', pos:'top:22%;left:5%',   size:36, anim:'floatC', dur:11, delay:-2  },
      { slug:'rust',             color:'000000', pos:'top:54%;right:5%',  size:34, anim:'floatB', dur:9,  delay:-6  },
    ],
    office: [
      { slug:'microsoftword',       color:'2B579A', pos:'top:6%;left:2%',    size:62, anim:'floatA', dur:7,  delay:0,  extra:'has-ring' },
      { slug:'microsoftexcel',      color:'217346', pos:'top:33%;left:1.5%', size:54, anim:'floatB', dur:9,  delay:-2  },
      { slug:'microsoftpowerpoint', color:'D24726', pos:'top:63%;left:2%',   size:52, anim:'floatC', dur:8,  delay:-4, extra:'has-orbit' },
      { slug:'microsoftteams',      color:'6264A7', pos:'top:9%;right:2%',   size:58, anim:'floatB', dur:8,  delay:-1, extra:'has-ring' },
      { slug:'zoom',                color:'2D8CFF', pos:'top:40%;right:1.5%',size:50, anim:'floatA', dur:10, delay:-3  },
      { slug:'microsoftonedrive',   color:'0078D4', pos:'top:69%;right:2%',  size:48, anim:'driftX', dur:8,  delay:-5  },
      { slug:'notion',              color:'FFFFFF', pos:'top:22%;left:5%',   size:36, anim:'floatC', dur:11, delay:-1, extra:'has-orbit' },
      { slug:'slack',               color:'4A154B', pos:'top:54%;right:5%',  size:34, anim:'floatB', dur:9,  delay:-6  },
    ],
    mac: [
      { slug:'apple',      color:'AAAAAA', pos:'top:6%;left:2%',    size:62, anim:'floatA', dur:7,  delay:0,  extra:'has-ring' },
      { slug:'macos',      color:'AAAAAA', pos:'top:33%;left:1.5%', size:52, anim:'floatB', dur:9,  delay:-2  },
      { slug:'xcode',      color:'147EFB', pos:'top:63%;left:2%',   size:50, anim:'floatC', dur:8,  delay:-4, extra:'has-orbit' },
      { slug:'swift',      color:'F05138', pos:'top:9%;right:2%',   size:58, anim:'floatB', dur:8,  delay:-1, extra:'has-ring' },
      { slug:'figma',      color:'F24E1E', pos:'top:40%;right:1.5%',size:50, anim:'floatA', dur:10, delay:-3  },
      { slug:'icloud',     color:'3693F3', pos:'top:69%;right:2%',  size:48, anim:'driftX', dur:8,  delay:-5, extra:'has-orbit' },
      { slug:'applemusic', color:'FC3C44', pos:'top:22%;left:5%',   size:34, anim:'floatC', dur:11, delay:-2  },
      { slug:'homebrew',   color:'FBB040', pos:'top:54%;right:5%',  size:34, anim:'floatB', dur:9,  delay:-6  },
    ],
  };

  const logos = careerLogos[key] || careerLogos.home;
  const container = document.getElementById('floating-bg-decorations');

  container.innerHTML = logos.map((logo, i) => {
    const glowColor = '#' + logo.color;
    const cardSize = logo.size + 24;
    return `
    <div class="floating-logo-wrap ${logo.extra || ''}"
      style="${logo.pos};animation:${logo.anim} ${logo.dur}s ease-in-out infinite;animation-delay:${logo.delay}s;--logo-glow:${glowColor}40"
    >
      <div class="logo-card" style="width:${cardSize}px;height:${cardSize}px;animation-delay:${i * 0.12}s;box-shadow:0 4px 24px ${glowColor}22, inset 0 1px 0 rgba(255,255,255,0.1)">
        <img
          src="https://cdn.simpleicons.org/${logo.slug}/${logo.color}"
          alt="${logo.slug}" width="${logo.size}" height="${logo.size}"
          style="filter:drop-shadow(0 0 8px ${glowColor}88)"
          onerror="this.parentElement.parentElement.style.display='none'"
        />
      </div>
    </div>`;
  }).join('');
}

function renderCard(key, title, icon, desc) {
  return `
    <div onclick="selectCareer('${key}')" class="career-card relative overflow-hidden card-purple rounded-2xl p-3.5 flex flex-col justify-between cursor-pointer group">
      <div class="relative z-10">
        <div class="career-icon w-8 h-8 rounded-xl flex items-center justify-center text-base mb-2 group-hover:scale-110 transition-transform">
          ${icon}
        </div>
        <h3 class="font-bold text-xs md:text-sm text-white mb-1 leading-snug">${title}</h3>
        <p class="text-[11px] text-slate-400 leading-relaxed">${desc}</p>
      </div>
      <div class="relative z-10 flex justify-end mt-2.5">
        <span class="w-5 h-5 rounded-full bg-white/5 border border-white/15 text-purple-300 flex items-center justify-center text-[9px] group-hover:bg-purple-600 group-hover:text-white transition-all">→</span>
      </div>
    </div>
  `;
}

const careerPageBg = {
  ai: `<svg class="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-[0.04]" viewBox="0 0 1400 900" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    <!-- Large neural network -->
    <circle cx="700" cy="300" r="60" stroke="currentColor" stroke-width="3"/>
    <circle cx="350" cy="500" r="45" stroke="currentColor" stroke-width="2.5"/>
    <circle cx="1050" cy="500" r="45" stroke="currentColor" stroke-width="2.5"/>
    <circle cx="150" cy="700" r="35" stroke="currentColor" stroke-width="2"/>
    <circle cx="500" cy="720" r="35" stroke="currentColor" stroke-width="2"/>
    <circle cx="900" cy="720" r="35" stroke="currentColor" stroke-width="2"/>
    <circle cx="1250" cy="700" r="35" stroke="currentColor" stroke-width="2"/>
    <circle cx="700" cy="100" r="30" stroke="currentColor" stroke-width="2"/>
    <line x1="700" y1="360" x2="350" y2="455" stroke="currentColor" stroke-width="2"/>
    <line x1="700" y1="360" x2="1050" y2="455" stroke="currentColor" stroke-width="2"/>
    <line x1="350" y1="545" x2="150" y2="665" stroke="currentColor" stroke-width="1.5"/>
    <line x1="350" y1="545" x2="500" y2="685" stroke="currentColor" stroke-width="1.5"/>
    <line x1="1050" y1="545" x2="900" y2="685" stroke="currentColor" stroke-width="1.5"/>
    <line x1="1050" y1="545" x2="1250" y2="665" stroke="currentColor" stroke-width="1.5"/>
    <line x1="700" y1="240" x2="700" y2="130" stroke="currentColor" stroke-width="2"/>
    <!-- Labels -->
    <text x="100" y="60" fill="currentColor" font-size="52" font-family="monospace" font-weight="bold" opacity="0.6">Python</text>
    <text x="900" y="150" fill="currentColor" font-size="40" font-family="monospace" opacity="0.5">TensorFlow</text>
    <text x="80" y="860" fill="currentColor" font-size="36" font-family="monospace" opacity="0.4">PyTorch</text>
    <text x="950" y="860" fill="currentColor" font-size="32" font-family="monospace" opacity="0.4">CUDA · GPU</text>
    <text x="1100" y="200" fill="currentColor" font-size="28" font-family="monospace" opacity="0.35">Llama · GPT</text>
  </svg>`,
  '3d': `<svg class="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-[0.045]" viewBox="0 0 1400 900" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    <!-- Large 3D wireframe cube -->
    <polygon points="700,80 1000,240 1000,560 700,720 400,560 400,240" stroke="currentColor" stroke-width="3" fill="none"/>
    <polygon points="700,80 700,400 1000,240" stroke="currentColor" stroke-width="2" fill="none"/>
    <polygon points="700,80 700,400 400,240" stroke="currentColor" stroke-width="2" fill="none"/>
    <polygon points="700,720 700,400 1000,560" stroke="currentColor" stroke-width="2" fill="none"/>
    <polygon points="700,720 700,400 400,560" stroke="currentColor" stroke-width="2" fill="none"/>
    <line x1="700" y1="80" x2="700" y2="400" stroke="currentColor" stroke-width="2.5"/>
    <!-- Second smaller cube -->
    <polygon points="200,150 330,220 330,380 200,450 70,380 70,220" stroke="currentColor" stroke-width="1.5" fill="none" opacity="0.6"/>
    <line x1="200" y1="150" x2="200" y2="300" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
    <!-- Labels -->
    <text x="60" y="60" fill="currentColor" font-size="56" font-family="sans-serif" font-weight="bold" opacity="0.55">Blender</text>
    <text x="900" y="820" fill="currentColor" font-size="38" font-family="sans-serif" opacity="0.45">Unreal Engine 5</text>
    <text x="60" y="830" fill="currentColor" font-size="30" font-family="sans-serif" opacity="0.4">3ds Max · Cinema 4D</text>
    <text x="1050" y="100" fill="currentColor" font-size="28" font-family="sans-serif" opacity="0.35">V-Ray · Octane</text>
  </svg>`,
  editor: `<svg class="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-[0.045]" viewBox="0 0 1400 900" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    <!-- Large film strip -->
    <rect x="100" y="320" width="1200" height="260" rx="16" stroke="currentColor" stroke-width="3"/>
    <rect x="100" y="320" width="70" height="260" fill="currentColor" opacity="0.15"/>
    <rect x="1230" y="320" width="70" height="260" fill="currentColor" opacity="0.15"/>
    <!-- Sprocket holes left -->
    <rect x="118" y="338" width="36" height="48" rx="4" fill="currentColor" opacity="0.5"/>
    <rect x="118" y="398" width="36" height="48" rx="4" fill="currentColor" opacity="0.5"/>
    <rect x="118" y="458" width="36" height="48" rx="4" fill="currentColor" opacity="0.5"/>
    <!-- Sprocket holes right -->
    <rect x="1246" y="338" width="36" height="48" rx="4" fill="currentColor" opacity="0.5"/>
    <rect x="1246" y="398" width="36" height="48" rx="4" fill="currentColor" opacity="0.5"/>
    <rect x="1246" y="458" width="36" height="48" rx="4" fill="currentColor" opacity="0.5"/>
    <!-- Play button center -->
    <polygon points="620,380 620,520 740,450" stroke="currentColor" stroke-width="3" fill="none"/>
    <!-- Timeline bar bottom -->
    <rect x="200" y="720" width="1000" height="8" rx="4" fill="currentColor" opacity="0.3"/>
    <rect x="200" y="720" width="380" height="8" rx="4" fill="currentColor" opacity="0.7"/>
    <circle cx="580" cy="724" r="12" fill="currentColor" opacity="0.8"/>
    <!-- Labels -->
    <text x="80" y="100" fill="currentColor" font-size="60" font-family="sans-serif" font-weight="bold" opacity="0.5">Premiere Pro</text>
    <text x="80" y="820" fill="currentColor" font-size="42" font-family="sans-serif" opacity="0.45">DaVinci Resolve</text>
    <text x="950" y="100" fill="currentColor" font-size="32" font-family="sans-serif" opacity="0.35">After Effects · 4K RAW</text>
  </svg>`,
  streamer: `<svg class="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-[0.045]" viewBox="0 0 1400 900" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    <!-- Large game controller -->
    <rect x="380" y="280" width="640" height="380" rx="160" stroke="currentColor" stroke-width="3" fill="none"/>
    <!-- Left joystick / D-pad -->
    <circle cx="580" cy="440" r="70" stroke="currentColor" stroke-width="2.5" fill="none"/>
    <line x1="545" y1="440" x2="615" y2="440" stroke="currentColor" stroke-width="3"/>
    <line x1="580" y1="405" x2="580" y2="475" stroke="currentColor" stroke-width="3"/>
    <!-- Right buttons -->
    <circle cx="840" cy="390" r="28" stroke="currentColor" stroke-width="2.5"/>
    <circle cx="790" cy="450" r="28" stroke="currentColor" stroke-width="2.5"/>
    <circle cx="890" cy="450" r="28" stroke="currentColor" stroke-width="2.5"/>
    <circle cx="840" cy="510" r="28" stroke="currentColor" stroke-width="2.5"/>
    <!-- Button labels -->
    <text x="833" y="396" fill="currentColor" font-size="22" font-family="sans-serif" font-weight="bold">▲</text>
    <text x="783" y="458" fill="currentColor" font-size="22" font-family="sans-serif" font-weight="bold">◀</text>
    <text x="883" y="458" fill="currentColor" font-size="22" font-family="sans-serif" font-weight="bold">▶</text>
    <text x="833" y="518" fill="currentColor" font-size="22" font-family="sans-serif" font-weight="bold">▼</text>
    <!-- OBS circle logo hint -->
    <circle cx="1200" cy="200" r="90" stroke="currentColor" stroke-width="2.5" fill="none"/>
    <circle cx="1200" cy="200" r="55" stroke="currentColor" stroke-width="2" fill="none"/>
    <!-- Labels -->
    <text x="80" y="80" fill="currentColor" font-size="72" font-family="sans-serif" font-weight="bold" opacity="0.55">OBS</text>
    <text x="80" y="155" fill="currentColor" font-size="36" font-family="sans-serif" opacity="0.45">CS2 · Valorant · LoL</text>
    <text x="80" y="840" fill="currentColor" font-size="30" font-family="sans-serif" opacity="0.4">Twitch · YouTube · TikTok Live</text>
    <text x="950" y="840" fill="currentColor" font-size="28" font-family="sans-serif" opacity="0.35">NVENC · Stream 4K</text>
  </svg>`,
  coder: `<svg class="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-[0.045]" viewBox="0 0 1400 900" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    <!-- Big code brackets -->
    <text x="60" y="560" fill="currentColor" font-size="420" font-family="monospace" font-weight="bold" opacity="0.18">&lt;</text>
    <text x="1100" y="560" fill="currentColor" font-size="420" font-family="monospace" font-weight="bold" opacity="0.18">&gt;</text>
    <!-- Terminal lines -->
    <rect x="200" y="300" width="1000" height="300" rx="12" stroke="currentColor" stroke-width="2" fill="none" opacity="0.4"/>
    <rect x="200" y="300" width="1000" height="36" rx="12" fill="currentColor" opacity="0.1"/>
    <circle cx="228" cy="318" r="8" fill="currentColor" opacity="0.6"/>
    <circle cx="256" cy="318" r="8" fill="currentColor" opacity="0.6"/>
    <circle cx="284" cy="318" r="8" fill="currentColor" opacity="0.6"/>
    <text x="220" y="372" fill="currentColor" font-size="20" font-family="monospace" opacity="0.7">$ docker run --rm -it ubuntu bash</text>
    <text x="220" y="404" fill="currentColor" font-size="20" font-family="monospace" opacity="0.5">$ git commit -m "feat: add new feature"</text>
    <text x="220" y="436" fill="currentColor" font-size="20" font-family="monospace" opacity="0.45">$ npm run build && npm start</text>
    <text x="220" y="468" fill="currentColor" font-size="20" font-family="monospace" opacity="0.4">$ kubectl apply -f deployment.yaml</text>
    <!-- Labels -->
    <text x="80" y="80" fill="currentColor" font-size="56" font-family="monospace" font-weight="bold" opacity="0.5">VS Code</text>
    <text x="80" y="840" fill="currentColor" font-size="34" font-family="monospace" opacity="0.4">Docker · Git · Linux · Kubernetes</text>
    <text x="1000" y="100" fill="currentColor" font-size="30" font-family="monospace" opacity="0.35">Node · Python · Go · Rust</text>
  </svg>`,
  office: `<svg class="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-[0.045]" viewBox="0 0 1400 900" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    <!-- Large document -->
    <rect x="350" y="100" width="420" height="560" rx="12" stroke="currentColor" stroke-width="2.5" fill="none"/>
    <rect x="390" y="160" width="340" height="20" rx="4" fill="currentColor" opacity="0.4"/>
    <rect x="390" y="200" width="280" height="12" rx="3" fill="currentColor" opacity="0.25"/>
    <rect x="390" y="225" width="320" height="12" rx="3" fill="currentColor" opacity="0.25"/>
    <rect x="390" y="250" width="260" height="12" rx="3" fill="currentColor" opacity="0.25"/>
    <!-- Excel grid -->
    <rect x="830" y="200" width="440" height="380" rx="8" stroke="currentColor" stroke-width="2" fill="none"/>
    <line x1="830" y1="245" x2="1270" y2="245" stroke="currentColor" stroke-width="1.5"/>
    <line x1="830" y1="290" x2="1270" y2="290" stroke="currentColor" stroke-width="1"/>
    <line x1="830" y1="335" x2="1270" y2="335" stroke="currentColor" stroke-width="1"/>
    <line x1="830" y1="380" x2="1270" y2="380" stroke="currentColor" stroke-width="1"/>
    <line x1="830" y1="425" x2="1270" y2="425" stroke="currentColor" stroke-width="1"/>
    <line x1="940" y1="200" x2="940" y2="580" stroke="currentColor" stroke-width="1"/>
    <line x1="1050" y1="200" x2="1050" y2="580" stroke="currentColor" stroke-width="1"/>
    <line x1="1160" y1="200" x2="1160" y2="580" stroke="currentColor" stroke-width="1"/>
    <!-- Labels -->
    <text x="80" y="80" fill="currentColor" font-size="62" font-family="sans-serif" font-weight="bold" opacity="0.5">Microsoft 365</text>
    <text x="80" y="840" fill="currentColor" font-size="34" font-family="sans-serif" opacity="0.4">Word · Excel · PowerPoint · Teams</text>
    <text x="950" y="840" fill="currentColor" font-size="28" font-family="sans-serif" opacity="0.35">Zoom · Google Workspace</text>
  </svg>`,
  mac: `<svg class="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-[0.045]" viewBox="0 0 1400 900" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    <!-- Large Apple logo shape -->
    <path d="M700 150 C700 150 580 200 580 340 C580 480 660 510 660 510 C660 510 600 530 560 610 C520 690 520 800 580 860 C640 920 700 870 700 870 C700 870 760 920 820 860 C880 800 880 690 840 610 C800 530 740 510 740 510 C740 510 820 480 820 340 C820 200 700 150 700 150Z" stroke="currentColor" stroke-width="3" fill="none"/>
    <path d="M700 150 C700 150 760 80 820 110" stroke="currentColor" stroke-width="3" fill="none"/>
    <!-- Labels -->
    <text x="80" y="80" fill="currentColor" font-size="62" font-family="sans-serif" font-weight="bold" opacity="0.5">Apple</text>
    <text x="80" y="840" fill="currentColor" font-size="34" font-family="sans-serif" opacity="0.4">MacBook Pro · Mac Studio · Mac Pro</text>
    <text x="950" y="100" fill="currentColor" font-size="30" font-family="sans-serif" opacity="0.35">macOS · Final Cut · Logic Pro</text>
  </svg>`
};

function selectCareer(key) {
  currentStep = 'options';
  activeCareerKey = key;
  const data = careersData[key];
  if(!data) return;

  // Set theme
  document.body.className = document.body.className
    .replace(/\btheme-\S+/g, '').trim();
  updateFloatingIcons(key);
  const existingBg = document.getElementById('career-page-bg');
  if (existingBg) existingBg.remove();
  if (careerPageBg[key]) {
    const bgWrapper = document.createElement('div');
    bgWrapper.id = 'career-page-bg';
    bgWrapper.style.color = 'var(--accent-light-hex)';
    bgWrapper.innerHTML = careerPageBg[key];
    document.body.appendChild(bgWrapper);
  }

  document.getElementById('back-btn').classList.remove('hidden');
  const badge = document.getElementById('selected-badge');
  badge.classList.remove('hidden');
  badge.innerHTML = `${data.icon} ${data.badge}`;

  let optionsHTML = data.options.map((opt, idx) => `
    <div onclick="${opt.variants ? `showVariants('${key}', ${idx})` : `showBuildDetails('${key}', ${idx})`}" class="card-purple rounded-2xl p-4 flex flex-col justify-between cursor-pointer group">
      <div class="flex flex-col">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-[11px] font-bold tracking-wider text-purple-400 uppercase">${opt.tag}</span>
          <div class="flex items-center gap-1 bg-purple-950/90 border border-purple-500/40 px-2 py-0.5 rounded-lg">
            <span class="text-[11px] text-amber-400 font-black">★</span>
            <span class="text-[11px] font-extrabold text-white">${opt.score}/10</span>
          </div>
        </div>
        
        <div class="text-[10px] text-purple-300/80 font-medium mb-1">${opt.scoreLabel}</div>

        <h3 class="text-sm md:text-base font-bold text-white mb-1.5 leading-snug">${opt.name}</h3>
        
        <p class="text-[11px] text-slate-400 leading-relaxed mb-3">${opt.desc}</p>
        
        <ul class="text-[10px] text-slate-300 space-y-1 font-mono bg-[#0d0a1a] p-2.5 rounded-xl border border-purple-900/30 mb-4">
          ${opt.specs.map(s => `<li>• ${s}</li>`).join('')}
        </ul>
      </div>
      <button class="btn-glass w-full font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 mt-auto">
        Xem báo giá chi tiết <span>→</span>
      </button>
    </div>
  `).join('');

  let benchmarksHTML = data.benchmarks ? data.benchmarks.map(b => `
    <tr class="border-b border-purple-900/20 text-xs">
      <td class="py-2 px-3 font-semibold text-white">${b.app}</td>
      <td class="py-2 px-3 text-slate-300 text-center">${b.opt1}</td>
      <td class="py-2 px-3 text-slate-300 text-center">${b.opt2}</td>
      <td class="py-2 px-3 text-slate-300 text-center">${b.opt3}</td>
    </tr>
  `).join('') : '';

  document.getElementById('main-view').innerHTML = `
    <div class="text-center space-y-1 mb-4 w-full">
      <h1 class="text-xl md:text-2xl font-extrabold text-white tracking-tight">${data.question}</h1>
      <p class="text-slate-400 text-xs">${data.subtitle}</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto mb-4 w-full">
      ${optionsHTML}
    </div>

    <!-- BẢNG ĐÁNH GIÁ MỨC ĐỘ ĐÁP ỨNG PHẦN MỀM / TÁC VỤ -->
    <div class="card-purple rounded-2xl p-4 border border-purple-500/30 max-w-6xl mx-auto w-full">
      <div class="flex items-center justify-between mb-3 border-b border-purple-900/30 pb-2">
        <div class="flex items-center gap-2">
          <span class="text-base">📊</span>
          <h3 class="font-extrabold text-xs md:text-sm text-white">Đánh giá hiệu năng theo ứng dụng nghề nghiệp · ${data.badge}</h3>
        </div>
        <span class="text-[10px] text-purple-300 bg-purple-950/80 px-2.5 py-0.5 rounded-full border border-purple-500/30 font-medium">Career Benchmarks 2026</span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-purple-800/40 text-[11px] text-purple-300 uppercase tracking-wider bg-purple-950/30">
              <th class="py-2 px-3 font-extrabold">Ứng dụng / Tác vụ</th>
              <th class="py-2 px-3 font-extrabold text-center">${data.options[0].tag}</th>
              <th class="py-2 px-3 font-extrabold text-center">${data.options[1].tag}</th>
              <th class="py-2 px-3 font-extrabold text-center">${data.options[2].tag}</th>
            </tr>
          </thead>
          <tbody>
            ${benchmarksHTML}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* Icon linh kiện: emoji phổ thông không có biểu tượng chính xác cho CPU/GPU/RAM/NVMe,
   nên dùng icon SVG nhỏ, sắc nét và nhất quán thay vì gán emoji sai nghĩa. */
function componentIcon(type) {
  const icons = {
    CPU: `<svg viewBox="0 0 24 24" aria-hidden="true" class="w-4 h-4"><rect x="6" y="6" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" opacity=".72"/><path d="M9 2v3M12 2v3M15 2v3M9 19v3M12 19v3M15 19v3M2 9h3M2 12h3M2 15h3M19 9h3M19 12h3M19 15h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    GPU: `<svg viewBox="0 0 24 24" aria-hidden="true" class="w-4 h-4"><rect x="3" y="6" width="16" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="10" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="12" r="1" fill="currentColor"/><path d="M19 9h2.5v6H19M5 19v2M8 19v2M11 19v2M14 19v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    RAM: `<svg viewBox="0 0 24 24" aria-hidden="true" class="w-4 h-4"><rect x="3" y="7" width="18" height="9" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M6 10h2M10 10h2M14 10h2M18 10h1M6 16v3M9 16v3M12 16v3M15 16v3M18 16v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    Storage: `<svg viewBox="0 0 24 24" aria-hidden="true" class="w-4 h-4"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M6 9h12M6 15h7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="17.5" cy="15" r="1" fill="currentColor"/><circle cx="19" cy="15" r="1" fill="currentColor"/></svg>`
  };
  return icons[type] || '';
}

function showVariants(key, optIdx) {
  currentStep = 'variants';
  activeOptIdx = optIdx;
  const career = careersData[key];
  const option = career.options[optIdx];

  const variantBadges = ['🏆 Phổ biến nhất', '⚡ Hiệu năng cao', '💰 Tiết kiệm nhất', '🔥 Đánh giá tốt', '🛡️ Bền bỉ nhất'];
  const variantBadgeColors = [
    'bg-amber-500/20 text-amber-300 border-amber-500/40',
    'bg-blue-500/20 text-blue-300 border-blue-500/40',
    'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    'bg-red-500/20 text-red-300 border-red-500/40',
    'bg-purple-500/20 text-purple-300 border-purple-500/40'
  ];
  const highlightIdx = 0;

  document.getElementById('main-view').innerHTML = `
    <div class="max-w-6xl mx-auto w-full">
      <!-- Header -->
      <div class="mb-6">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-[11px] font-bold tracking-wider text-purple-400 uppercase">${option.tag}</span>
          <span class="text-[11px] text-amber-400 font-black">★ ${option.score}/10</span>
        </div>
        <h2 class="text-xl md:text-2xl font-extrabold text-white mb-1">${option.name}</h2>
        <p class="text-sm text-slate-400 max-w-2xl">${option.desc}</p>
      </div>

      <!-- Divider info bar -->
      <div class="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mb-5 pb-4 border-b border-purple-900/30">
        <span class="flex items-center gap-1.5">🖥️ <b class="text-white">5 build</b> cùng hiệu năng</span>
        <span class="text-purple-800">|</span>
        <span class="flex items-center gap-1.5">🏭 Manufacturer khác nhau</span>
        <span class="text-purple-800">|</span>
        <span class="flex items-center gap-1.5">📅 Giá cập nhật 2026</span>
        <span class="text-purple-800">|</span>
        <span class="flex items-center gap-1.5 text-emerald-400 font-medium">✓ Giá tra cứu thị trường VN</span>
      </div>

      <!-- Product cards grid -->
      <div class="flex flex-wrap justify-center gap-5 mb-4" style="--card-w: calc(33.333% - 14px)">
        ${option.variants.map((v, vIdx) => {
          const total = v.components.reduce((s, c) => s + c.price, 0);
          const cpu = v.components.find(c => c.type === 'CPU');
          const gpu = v.components.find(c => c.type === 'GPU');
          const ram = v.components.find(c => c.type === 'RAM');
          const storage = v.components.find(c => c.type === 'Storage');
          const isHighlight = vIdx === highlightIdx;
          return `
          <div onclick="showBuildDetails('${key}', ${optIdx}, ${vIdx})" style="width:min(100%,340px);flex:0 0 min(100%,340px)" class="relative flex flex-col cursor-pointer group rounded-2xl transition-all duration-200
            ${isHighlight
              ? 'ring-2 ring-amber-400/60 bg-gradient-to-b from-amber-950/20 to-purple-950/80 border border-amber-500/30 shadow-[0_0_30px_rgba(251,191,36,0.12)]'
              : 'card-purple hover:ring-1 hover:ring-purple-400/50'
            }">

            <!-- Badge -->
            <div class="absolute -top-3 left-4">
              <span class="text-[10px] font-extrabold px-3 py-1 rounded-full border ${variantBadgeColors[vIdx]} shadow-lg">${variantBadges[vIdx]}</span>
            </div>

            <div class="p-5 pt-6 flex flex-col flex-1">
              <!-- Brand tags -->
              <div class="flex flex-wrap gap-1.5 mb-3">
                ${v.tags.map((t, ti) => `
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-md border
                    ${ti === 0 ? 'bg-blue-950/60 text-blue-300 border-blue-700/50' :
                      ti === 1 ? 'bg-green-950/60 text-green-300 border-green-700/50' :
                      'bg-purple-950/60 text-purple-300 border-purple-700/50'}">
                    ${t}
                  </span>`).join('')}
              </div>

              <!-- Build name -->
              <h3 class="text-sm font-extrabold text-white mb-4 leading-snug">${v.label}</h3>

              <!-- Key specs -->
              <div class="space-y-2.5 mb-5 flex-1">
                ${cpu ? `
                <div class="flex items-start gap-2.5">
                  <div class="w-7 h-7 rounded-lg bg-purple-950/60 border border-purple-800/40 flex items-center justify-center text-accent shrink-0 mt-0.5">${componentIcon('CPU')}</div>
                  <div>
                    <div class="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">CPU</div>
                    <div class="text-xs text-white font-semibold leading-snug">${cpu.name}</div>
                  </div>
                </div>` : ''}
                ${gpu ? `
                <div class="flex items-start gap-2.5">
                  <div class="w-7 h-7 rounded-lg bg-indigo-950/60 border border-indigo-800/40 flex items-center justify-center text-accent shrink-0 mt-0.5">${componentIcon('GPU')}</div>
                  <div>
                    <div class="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">GPU</div>
                    <div class="text-xs text-white font-semibold leading-snug">${gpu.name}</div>
                  </div>
                </div>` : ''}
                ${ram ? `
                <div class="flex items-start gap-2.5">
                  <div class="w-7 h-7 rounded-lg bg-purple-950/60 border border-purple-800/40 flex items-center justify-center text-accent shrink-0 mt-0.5">${componentIcon('RAM')}</div>
                  <div>
                    <div class="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">RAM</div>
                    <div class="text-xs text-white font-semibold leading-snug">${ram.name}</div>
                  </div>
                </div>` : ''}
                ${storage ? `
                <div class="flex items-start gap-2.5">
                  <div class="w-7 h-7 rounded-lg bg-purple-950/60 border border-purple-800/40 flex items-center justify-center text-accent shrink-0 mt-0.5">${componentIcon('Storage')}</div>
                  <div>
                    <div class="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">Storage</div>
                    <div class="text-xs text-white font-semibold leading-snug">${storage.name}</div>
                  </div>
                </div>` : ''}
              </div>

              <!-- Divider -->
              <div class="border-t border-purple-900/30 pt-4 mt-auto">
                <!-- Price -->
                <div class="flex items-end justify-between mb-3">
                  <div>
                    <div class="text-[10px] text-slate-500 mb-0.5">Tổng chi phí ước tính</div>
                    <div class="text-xl font-black ${isHighlight ? 'text-amber-400' : 'text-purple-400'} tracking-tight">${formatVND(total)}</div>
                  </div>
                  <div class="text-[10px] text-slate-500 text-right">
                    <div class="text-emerald-400 font-medium">TB 4 cửa hàng</div>
                    <div>GearVN · Phong Vũ</div>
                    <div>An Phát · Hoàng Hà</div>
                  </div>
                </div>

                <!-- CTA button -->
                <button class="${isHighlight ? '' : 'btn-glass'} w-full font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
                  style="${isHighlight ? 'background:linear-gradient(to right,#f59e0b,#f97316);color:#fff;box-shadow:0 0 20px rgba(245,158,11,0.3)' : ''}">
                  <span>Xem báo giá đầy đủ</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>

      <!-- Bottom note -->
      <div class="text-center text-[11px] text-slate-500">
        💡 Tất cả build cùng tầm giá & hiệu năng tương đương — khác nhau ở hãng sản xuất và phong cách tản nhiệt
      </div>
    </div>
  `;
}

/* ── FPS ESTIMATOR (1080p, số liệu tham khảo) ── */
let activeFpsGpu = null;
const FPS_GAMES = [
  { name: 'Valorant',          logo: 'https://cdn.simpleicons.org/valorant/FF4655', fps100: 300, cap: 600, setting: '1080p · Max' },
  { name: 'CS2',               logo: 'https://cdn.simpleicons.org/counterstrike/DEDEDE', fps100: 240, cap: 600, setting: '1080p · Max' },
  { name: 'League of Legends', logo: 'https://cdn.simpleicons.org/leagueoflegends/C89B3C', fps100: 320, cap: 600, setting: '1080p · Max' },
  { name: 'Fortnite',          logo: 'https://cdn.simpleicons.org/fortnite/FFFFFF', fps100: 130, cap: 400, setting: '1080p · High' },
  { name: 'Apex Legends',      logo: 'https://api.iconify.design/arcticons:apex-legends.svg', fps100: 150, cap: 400, setting: '1080p · High' },
  { name: 'Warzone',           logo: 'https://api.iconify.design/arcticons:call-of-duty.svg', fps100: 85,  cap: 300, setting: '1080p · High' },
  { name: 'GTA V',             logo: 'https://cdn.cloudflare.steamstatic.com/steam/apps/271590/logo.png', fps100: 160, cap: 300, setting: '1080p · Very High' },
  { name: 'Cyberpunk 2077',    logo: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/logo.png', fps100: 38,  cap: 300, setting: '1080p · Ultra (no RT)' },
  { name: 'Elden Ring',        logo: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/logo.png', fps100: 60,  cap: 60,  setting: '1080p · Max (lock 60)' },
  { name: 'Black Myth Wukong', logo: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2358720/logo.png', fps100: 32,  cap: 300, setting: '1080p · High' },
  { name: 'Baldur\u2019s Gate 3', logo: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/logo.png', fps100: 85, cap: 300, setting: '1080p · High' },
];
function gameLogo(game) {
  return game.logo
    ? `<img class="game-logo" src="${game.logo}" alt="" aria-hidden="true" loading="lazy" onerror="this.remove()">`
    : '';
}
function gpuScore(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('uhd')) return 8;
  if (n.includes('7900 xtx')) return 350;
  if (n.includes('7900 gre')) return 200;
  if (n.includes('7900 xt')) return 280;
  if (n.includes('7800 xt')) return 225;
  if (n.includes('7700 xt')) return 180;
  if (n.includes('7600 xt')) return 130;
  if (n.includes('6750 xt')) return 130;
  if (n.includes('6600')) return 85;
  if (n.includes('b580')) return 150;
  if (n.includes('b570')) return 120;
  if (n.includes('a770')) return 130;
  if (n.includes('a750')) return 115;
  if (n.includes('a580')) return 90;
  if (n.includes('760m')) return 18;
  if (n.includes('vega 7')) return 12;
  if (n.includes('740m')) return 10;
  if (n.includes('4090')) return 380;
  if (n.includes('4080')) return 265;
  if (n.includes('4070 ti')) return 240;
  if (n.includes('4070 super')) return 215;
  if (n.includes('4070')) return 190;
  if (n.includes('4060 ti 8gb')) return 130;
  if (n.includes('4060 ti')) return 140;
  if (n.includes('4060')) return 115;
  if (n.includes('3060')) return 95;
  if (n.includes('3050')) return 55;
  return null;
}
function fpsVerdict(f) {
  if (f >= 240) return { label: '⚡ Cực mượt — cân màn 240Hz+', cls: 'text-emerald-300' };
  if (f >= 144) return { label: '🟢 Rất mượt — khai thác màn 144Hz', cls: 'text-emerald-400' };
  if (f >= 100) return { label: '🟢 Mượt — trên 100 FPS', cls: 'text-lime-400' };
  if (f >= 60)  return { label: '🟡 Tốt — 60 FPS ổn định', cls: 'text-amber-400' };
  if (f >= 30)  return { label: '🟠 Tạm — nên giảm cài đặt', cls: 'text-orange-400' };
  return { label: '🔴 Kém — chỉ chơi game nhẹ', cls: 'text-red-400' };
}
function renderFpsSection(gpuName) {
  activeFpsGpu = gpuName;
  return `
    <div class="card-purple rounded-2xl p-4 max-w-4xl mx-auto w-full mb-3">
      <div class="flex items-center justify-between gap-2 mb-3">
        <div class="flex items-center gap-2">
          <span class="text-base">🎮</span>
          <h3 class="font-extrabold text-xs md:text-sm text-white">Ước tính FPS trong game</h3>
        </div>
        <span class="text-[10px] text-purple-300 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10 font-medium shrink-0">1080p · Tham khảo</span>
      </div>
      <div class="flex flex-wrap gap-1.5 mb-3">
        ${FPS_GAMES.map((g, i) => `
          <button onclick="selectFpsGame(${i})" data-fps-idx="${i}"
            class="tag-pill px-2.5 py-1 rounded-full text-[11px] font-semibold ${i === 0 ? 'fps-chip-active' : ''}">
            ${gameLogo(g)}${g.name}
          </button>
        `).join('')}
      </div>
      <div id="fps-result"></div>
    </div>
  `;
}
function selectFpsGame(idx) {
  const resultEl = document.getElementById('fps-result');
  if (!resultEl || !activeFpsGpu) return;
  document.querySelectorAll('[data-fps-idx]').forEach(b => {
    b.classList.toggle('fps-chip-active', Number(b.dataset.fpsIdx) === idx);
  });
  const g = FPS_GAMES[idx];
  const score = gpuScore(activeFpsGpu);
  if (score === null) {
    resultEl.innerHTML = `<p class="text-[11px] text-slate-400">Chưa có dữ liệu hiệu năng cho GPU này — số liệu đang được cập nhật.</p>`;
    return;
  }
  let fps = Math.round(score / 100 * g.fps100);
  if (g.cap) fps = Math.min(fps, g.cap);
  const v = fpsVerdict(fps);
  const pct = Math.max(4, Math.min(100, Math.round(fps / 300 * 100)));
  const igpuNote = score <= 10
    ? `<p class="mt-2.5 text-[10px] text-amber-400/90 bg-amber-500/10 border border-amber-500/25 rounded-lg px-2.5 py-1.5">⚠️ GPU build này khá yếu — chỉ phù hợp văn phòng, game nhẹ (League of Legends, Minecraft ở setting thấp).</p>`
    : '';
  resultEl.innerHTML = `
    <div class="flex items-center gap-4 flex-wrap">
      <div class="font-grotesk font-bold tracking-tight shrink-0" style="color:var(--accent-light-hex)">
        <span class="text-3xl md:text-4xl">~${fps}</span> <span class="text-xs md:text-sm text-slate-400 font-semibold">FPS</span>
      </div>
      <div class="flex-1 min-w-[200px]">
        <div class="flex justify-between text-[10px] mb-1.5">
          <span class="text-slate-500 font-semibold inline-flex items-center gap-1.5">${gameLogo(g)}${g.name} · ${g.setting}</span>
          <span class="${v.cls} font-bold">${v.label}</span>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
      </div>
    </div>
    ${igpuNote}
  `;
}

function renderCareerPerformance(key, optIdx) {
  const data = careersData[key];
  if (!data || !data.benchmarks?.length) return '';
  const option = data.options[optIdx];
  const optionLabel = option?.tag || 'Cấu hình đã chọn';
  const resultRows = data.benchmarks.map(b => `
    <tr class="border-b border-purple-900/20 last:border-0">
      <td class="py-2.5 px-3 font-semibold text-white">${b.app}</td>
      <td class="py-2.5 px-3 text-center text-slate-200">${b['opt' + (optIdx + 1)] || 'Đang cập nhật'}</td>
    </tr>
  `).join('');
  return `
    <div class="card-purple rounded-2xl p-4 max-w-4xl mx-auto w-full mb-3">
      <div class="flex items-center justify-between gap-2 mb-3 border-b border-purple-900/30 pb-2">
        <div class="flex items-center gap-2">
          <span class="text-base">📊</span>
          <h3 class="font-extrabold text-xs md:text-sm text-white">Đánh giá theo ứng dụng nghề nghiệp</h3>
        </div>
        <span class="text-[10px] text-purple-300 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10 font-medium">${data.badge}</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-purple-800/40 text-[10px] text-purple-300 uppercase tracking-wider bg-purple-950/30">
              <th class="py-2 px-3 font-extrabold">Ứng dụng / Tác vụ</th>
              <th class="py-2 px-3 font-extrabold text-center">${optionLabel}</th>
            </tr>
          </thead>
          <tbody>${resultRows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function setDetailsView(v) {
  detailsView = v;
  showBuildDetails(activeCareerKey, activeOptIdx, activeVariantIdx);
}
function showBuildDetails(key, optIdx, variantIdx = null) {
  currentStep = 'details';
  const isSameBuild = key === activeCareerKey && optIdx === activeOptIdx && variantIdx === activeVariantIdx;
  activeCareerKey = key;
  activeOptIdx = optIdx;
  activeVariantIdx = variantIdx;
  if (!isSameBuild) ownedParts = new Set();
  const career = careersData[key];
  const option = career.options[optIdx];
  const components = (variantIdx !== null && option.variants) ? option.variants[variantIdx].components : option.components;
  const variantLabel = (variantIdx !== null && option.variants) ? option.variants[variantIdx].label : null;

  const typeOrder = { 'CPU': 0, 'GPU': 1, 'RAM': 2, 'Storage': 3, 'Mainboard': 4, 'PSU': 5, 'Cooler': 6 };
  const sortedComponents = [...components].sort((a, b) => (typeOrder[a.type] ?? 99) - (typeOrder[b.type] ?? 99));
  activeComponents = sortedComponents;
  const gpuComp = sortedComponents.find(c => c.type === 'GPU');

  const totalPrice = sortedComponents.reduce((sum, item) => sum + item.price, 0);

  const componentsHTML = sortedComponents.map((comp, idx) => { const isOwned = ownedParts.has(idx); return `
    <div id="comp-card-${idx}" class="component-card rounded-xl p-3 flex flex-col justify-between border-l-4 ${comp.color} ${isOwned ? 'owned' : ''}">
      <div>
        <div class="flex items-center justify-between gap-2 mb-1">
          <div class="flex items-center gap-2 font-bold text-xs md:text-sm text-white">
            <span>${comp.icon}</span>
            <span>${comp.name}</span>
          </div>
          <span class="text-[9px] font-extrabold bg-purple-950/80 text-purple-300 border border-purple-800/60 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">${comp.type}</span>
        </div>
        <p class="text-[11px] text-slate-400 leading-snug mb-2">${comp.desc}</p>
      </div>
      
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span id="comp-price-${idx}" class="text-sm md:text-base font-extrabold text-purple-300 tracking-tight ${isOwned ? 'price-owned' : ''}">${comp.price > 0 ? formatVND(comp.price) : 'Đi kèm'}</span>
          ${comp.price > 0 ? '<span class="text-[9px] bg-purple-950/80 text-purple-300 border border-purple-800/60 px-1.5 py-0.5 rounded font-medium">TB 4 cửa hàng</span>' : ''}
        </div>
        ${comp.price > 0 ? `
          <div class="flex items-center gap-1 flex-wrap mb-2">
            ${retailShops.map(shop => `<span class="text-[9px] text-purple-300 bg-purple-950/40 border border-purple-900/40 px-1.5 py-0.5 rounded font-medium">${shop}</span>`).join('')}
          </div>
          <label for="owned-${idx}" class="owned-label flex items-center gap-1.5 text-[10px] text-slate-400 pt-1.5 border-t border-purple-900/30">
            <input type="checkbox" id="owned-${idx}" class="owned-checkbox" ${isOwned ? 'checked' : ''} onchange="toggleOwned(${idx}, ${comp.price})">
            Tôi đã có sẵn linh kiện này
          </label>
        ` : ''}
      </div>
    </div>
  `; }).join('');

  document.getElementById('main-view').innerHTML = `
    <div class="max-w-4xl mx-auto w-full">
      <div class="text-center mb-4">
        <div class="inline-flex items-center gap-2 bg-purple-950/80 border border-purple-500/40 text-purple-300 font-extrabold text-xs md:text-sm px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(139,92,246,0.3)] mb-1.5">
          <span>${option.name}</span>
          <span class="bg-purple-900/60 border border-purple-400/40 px-2 py-0.5 rounded-md text-amber-400 text-xs">★ ${option.score}/10</span>
        </div>
        ${variantLabel ? `<div class="inline-flex items-center gap-1.5 text-[11px] text-emerald-300 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1 rounded-full mb-1.5 ml-2">🔧 ${variantLabel}</div>` : ''}
        <p class="text-xs text-slate-400 max-w-xl mx-auto">${option.desc}</p>
      </div>

      <div class="dview-toggle">
        <button class="dview-btn ${detailsView === 'diagram' ? 'on' : ''}" onclick="setDetailsView('diagram')">📐 Sơ đồ lắp ráp</button>
        <button class="dview-btn ${detailsView === 'list' ? 'on' : ''}" onclick="setDetailsView('list')">🗂️ Danh sách &amp; mua linh kiện</button>
      </div>

      ${detailsView === 'diagram' ? isoDiagramHTML(sortedComponents) : `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        ${componentsHTML}
      </div>`}

      <div class="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 mb-2.5 px-1">
        <div class="flex items-center gap-2">
          <span class="bg-purple-950/40 border border-purple-900/40 px-3 py-1 rounded-lg">📅 Cập nhật giá • 2026</span>
        </div>
        <span class="bg-purple-950/40 border border-purple-900/40 px-3 py-1 rounded-lg text-emerald-400 font-medium">📈 Tra cứu trực tiếp thị trường</span>
      </div>

      ${renderCareerPerformance(key, optIdx)}
      ${key === 'streamer' && gpuComp ? renderFpsSection(gpuComp.name) : ''}

      <div id="upgrade-summary" class="card-purple rounded-2xl p-3.5 shadow-2xl mb-3" style="border-color:rgba(var(--accent),0.4)">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs md:text-sm font-bold text-slate-200" id="total-label">Tổng chi phí ước tính</span>
          <span class="text-xl md:text-2xl font-black tracking-tight" id="need-buy-total" data-total="${totalPrice}" style="color:var(--accent-light-hex)">${formatVND(totalPrice)}</span>
        </div>
        <div id="savings-row" class="hidden flex items-center justify-between pt-2 mt-2" style="border-top:1px solid rgba(var(--accent),0.2)">
          <div class="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span>Giá gốc: <span class="line-through" id="original-total-label">${formatVND(totalPrice)}</span></span>
          </div>
          <span class="text-xs font-bold text-emerald-400" id="savings-amount">Tiết kiệm 0đ</span>
        </div>
      </div>

      <div class="flex gap-2.5 mb-3">
        <button onclick="copyBuildSpecs('${key}', ${optIdx})" class="btn-glass w-full font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2">
          <span>📋</span> Sao chép cấu hình PC này
        </button>
        <button onclick="resetOwnedParts()" id="reset-owned-btn" class="btn-glass hidden shrink-0 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5">
          <span>↺</span> Đặt lại
        </button>
      </div>

      ${option.tip ? `
        <div class="bg-purple-950/30 border border-purple-500/30 rounded-xl p-3 text-xs text-purple-300 flex items-center gap-2">
          <span>💡</span>
          <span>${option.tip}</span>
        </div>
      ` : ''}
    </div>
  `;

  if (key === 'streamer' && gpuComp) selectFpsGame(0);
}

function toggleOwned(idx, price) {
  const card = document.getElementById(`comp-card-${idx}`);
  const priceEl = document.getElementById(`comp-price-${idx}`);

  if (ownedParts.has(idx)) {
    ownedParts.delete(idx);
    card.classList.remove('owned');
    priceEl.classList.remove('price-owned');
  } else {
    ownedParts.add(idx);
    card.classList.add('owned');
    priceEl.classList.add('price-owned');
  }

  updateUpgradeSummary();
}

function updateUpgradeSummary() {
  const comps = activeComponents;
  const originalTotal = comps.reduce((sum, item) => sum + item.price, 0);
  const savedAmount = comps.reduce((sum, item, idx) => ownedParts.has(idx) ? sum + item.price : sum, 0);
  const needBuyTotal = originalTotal - savedAmount;

  document.getElementById('need-buy-total').textContent = formatVND(needBuyTotal);

  const savingsRow = document.getElementById('savings-row');
  const totalLabel = document.getElementById('total-label');
  const resetBtn = document.getElementById('reset-owned-btn');

  if (ownedParts.size > 0) {
    totalLabel.textContent = 'Cần mua thêm';
    savingsRow.classList.remove('hidden');
    document.getElementById('original-total-label').textContent = formatVND(originalTotal);
    document.getElementById('savings-amount').textContent = `Tiết kiệm ${formatVND(savedAmount)}`;
    resetBtn.classList.remove('hidden');
  } else {
    totalLabel.textContent = 'Tổng chi phí ước tính';
    savingsRow.classList.add('hidden');
    resetBtn.classList.add('hidden');
  }
}

function resetOwnedParts() {
  ownedParts.forEach(idx => {
    const checkbox = document.getElementById(`owned-${idx}`);
    if (checkbox) checkbox.checked = false;
    const card = document.getElementById(`comp-card-${idx}`);
    if (card) card.classList.remove('owned');
    const priceEl = document.getElementById(`comp-price-${idx}`);
    if (priceEl) priceEl.classList.remove('price-owned');
  });
  ownedParts = new Set();
  updateUpgradeSummary();
}

function copyBuildSpecs(key, optIdx) {
  const career = careersData[key];
  const option = career.options[optIdx];
  const comps = activeComponents;
  const variantLabel = (activeVariantIdx !== null && option.variants) ? option.variants[activeVariantIdx].label : null;
  const totalPrice = comps.reduce((sum, item) => sum + item.price, 0);
  const hasOwned = ownedParts.size > 0 && key === activeCareerKey && optIdx === activeOptIdx;
  const savedAmount = hasOwned ? comps.reduce((sum, item, idx) => ownedParts.has(idx) ? sum + item.price : sum, 0) : 0;

  let text = `🖥️ CẤU HÌNH PC: ${option.name} (${career.title})\n`;
  if (variantLabel) text += `🔧 Build: ${variantLabel}\n`;
  text += `📊 Đánh giá: ${option.score}/10 - ${option.scoreLabel}\n`;
  text += `-----------------------------------\n`;
  comps.forEach((c, idx) => {
    const owned = hasOwned && ownedParts.has(idx);
    text += `• [${c.type}] ${c.name} - ${c.price > 0 ? formatVND(c.price) : 'Đi kèm'}${owned ? ' (Đã có sẵn)' : ''}\n`;
  });
  text += `-----------------------------------\n`;
  if (hasOwned) {
    text += `💰 GIÁ GỐC: ${formatVND(totalPrice)}\n`;
    text += `✅ TIẾT KIỆM: ${formatVND(savedAmount)}\n`;
    text += `💰 CẦN MUA THÊM: ${formatVND(totalPrice - savedAmount)}\n`;
  } else {
    text += `💰 TỔNG CHI PHÍ ƯỚC TÍNH: ${formatVND(totalPrice)}\n`;
  }

  navigator.clipboard.writeText(text).then(() => {
    alert('Đã sao chép cấu hình PC vào khay nhớ tạm!');
  }).catch(() => {
    alert('Không thể sao chép tự động. Vui lòng thử lại!');
  });
}


/* ── Ngân sách (slider) ── */
const BUDGET_MIN = 5000000, BUDGET_MAX = 200000000, BUDGET_STEP = 10000;
let budgetVND = 30000000, lastDream = '', hideOver = false, budgetTimer = null;
const sumPrice = comps => comps.reduce((t, c) => t + (c.price || 0), 0);
const budgetPct = () => ((budgetVND - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN) * 100).toFixed(2) + '%';
const fmtNum = n => new Intl.NumberFormat('vi-VN').format(n);
function budgetTyping(el) {
  const d = el.value.replace(/\D/g, '').slice(0, 10);
  el.value = d ? fmtNum(+d) : '';
  el.classList.toggle('bsl-warn', !!d && (+d < BUDGET_MIN || +d > BUDGET_MAX));
  if (d && +d >= BUDGET_MIN && +d <= BUDGET_MAX) setBudget(+d);
}
function budgetCommit(el) {
  const d = el.value.replace(/\D/g, '');
  const v = d ? +d : budgetVND;
  el.classList.remove('bsl-warn');
  setBudget(v);
  el.value = fmtNum(budgetVND);
}
function budgetSliderHTML() {
  return `<div class="bsl"><div class="flex items-center justify-between mb-2 text-xs"><span class="font-bold text-purple-300">💰 Ngân sách</span><span class="inline-flex items-center gap-1 bsl-field"><input class="bsl-num" type="text" inputmode="numeric" autocomplete="off" value="${fmtNum(budgetVND)}" onfocus="this.select()" oninput="budgetTyping(this)" onblur="budgetCommit(this)" onkeydown="if(event.key==='Enter')this.blur()" aria-label="Nhập ngân sách (VNĐ)"><b class="text-lg">đ</b></span></div>
    <input class="bsl-range" type="range" min="${BUDGET_MIN}" max="${BUDGET_MAX}" step="${BUDGET_STEP}" value="${budgetVND}" style="--p:${budgetPct()}" oninput="setBudget(this.value)" aria-label="Ngân sách">
    <div class="flex justify-between text-[10px] text-slate-500 mt-1.5"><span>5 triệu</span><span>50</span><span>100</span><span>150</span><span>200 triệu</span></div></div>`;
}
function setBudget(v, silent) {
  budgetVND = Math.min(BUDGET_MAX, Math.max(BUDGET_MIN, Math.round(+v / BUDGET_STEP) * BUDGET_STEP));
  document.querySelectorAll('.bsl-num').forEach(e => { if (e !== document.activeElement) e.value = fmtNum(budgetVND); });
  document.querySelectorAll('.bsl-range').forEach(e => { e.value = budgetVND; e.style.setProperty('--p', budgetPct()); });
  if (silent) return;
  clearTimeout(budgetTimer);
  budgetTimer = setTimeout(() => { if (currentStep === 'ai' && lastDream) runDreamAnalysis(lastDream, true); else applyBudgetDim(); }, 200);
}
function applyBudgetDim() {
  const mv = document.getElementById('main-view');
  if (!mv || !['options', 'variants'].includes(currentStep)) return;
  if (!mv.querySelector('#budget-bar')) {
    const bar = document.createElement('div');
    bar.id = 'budget-bar'; bar.className = 'card-purple rounded-2xl p-3.5 mb-4 max-w-6xl mx-auto w-full';
    bar.innerHTML = budgetSliderHTML() + `<label class="flex items-center gap-2 text-[11px] text-slate-400 mt-2.5 cursor-pointer"><input type="checkbox" ${hideOver ? 'checked' : ''} onchange="hideOver=this.checked;applyBudgetDim()"> Ẩn các cấu hình vượt ngân sách</label>`;
    mv.prepend(bar);
  }
  mv.querySelectorAll('[onclick^="showVariants("],[onclick^="showBuildDetails("]').forEach(el => {
    const m = el.getAttribute('onclick').match(/\('([^']+)',\s*(\d+)(?:,\s*(\d+))?\)/); if (!m) return;
    const opt = careersData[m[1]]?.options[+m[2]]; if (!opt) return;
    const total = m[3] !== undefined ? sumPrice(opt.variants[+m[3]].components) : Math.min(...(opt.variants || [opt]).map(v => sumPrice(v.components)));
    const over = total > budgetVND;
    el.style.opacity = over ? '.4' : ''; el.style.filter = over ? 'saturate(.4)' : ''; el.style.display = (over && hideOver) ? 'none' : '';
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    let b = el.querySelector(':scope > .over-badge');
    if (over && !b) { b = document.createElement('span'); b.className = 'over-badge'; el.appendChild(b); }
    if (b) { if (over) b.textContent = 'Vượt ngân sách'; else b.remove(); }
  });
}

/* ── Phân tích yêu cầu → cấu hình gần nhất ── */
const NEEDS = {
  data:['data analyst','phân tích dữ liệu','power bi','tableau','sql','excel','data scientist','jupyter','pandas','big data'],
  ai:['ai','trí tuệ nhân tạo','machine learning','deep learning','llm','pytorch','tensorflow','cuda','huấn luyện','train','mô hình','stable diffusion','comfyui','ollama'],
  web3:['web3','blockchain','solidity','smart contract','crypto'],
  security:['security','cyber','an ninh mạng','an toàn thông tin','kali','pentest','hacker','devsecops'],
  mobile:['mobile','android','flutter','react native','kotlin','swift','ios'],
  music:['music','producer','âm nhạc','làm nhạc','ableton','fl studio','cubase','daw','audio'],
  architecture:['kiến trúc','revit','autocad','lumion','enscape','bim','sketchup','xây dựng'],
  product:['product design','interior','nội thất','rhino','keyshot','v-ray','vray','thiết kế sản phẩm','3ds max'],
  science:['khoa học','matlab','simulink','mô phỏng','nghiên cứu','scientific','mathematica'],
  coder:['code','lập trình','web','dev','coder','developer','docker','backend','frontend','phần mềm','software'],
  '3d':['3d','đồ họa','blender','maya','animator','unreal','render','zbrush','cinema 4d','houdini'],
  editor:['video','dựng phim','dựng','edit','premiere','after effects','davinci','youtube','tiktok','capcut','quay phim'],
  streamer:['stream','game','gamer','chơi','esports','valorant','lol','liên minh','cs2','pubg','gta','fortnite','cyberpunk','obs','fps'],
  mac:['mac','macbook','apple','imac','xcode','final cut','logic pro'],
  office:['văn phòng','office','học tập','sinh viên','học online','word','kế toán','lướt web','giải trí'],
};
const hasKw = (t, kw) => kw.length <= 3
  ? new RegExp('(?<![\\p{L}\\p{N}])' + kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![\\p{L}\\p{N}])', 'iu').test(t) : t.includes(kw);
function parseBudget(t) {
  let m = t.match(/(\d{1,3}(?:[.,]\d{3}){2,})/);
  if (m) return parseInt(m[1].replace(/[.,]/g, ''), 10);
  m = t.match(/(\d+(?:[.,]\d+)?)\s*(?:triệu|tr|m|củ)(?![a-zà-ỹ0-9])/i);
  return m ? Math.round(parseFloat(m[1].replace(',', '.')) * 1e6) : null;
}
function analyzeDream(text, budget) {
  const t = text.toLowerCase();
  const hits = {};
  Object.entries(NEEDS).forEach(([k, kws]) => { const n = kws.filter(kw => hasKw(t, kw)); if (n.length) hits[k] = n; });
  const maxW = Math.max(0, ...Object.values(hits).map(a => a.length));
  const tokens = (t.match(/rtx\s?\d{4}\s?(?:ti|super)?|rx\s?\d{4}|\bi[3579]\b|ryzen\s?[3579]|ultra\s?[579]|\b\d{2,3}\s?gb\b|intel|amd|nvidia|radeon/g) || []).map(x => x.replace(/\s+/g, ''));
  const pool = [];
  Object.entries(careersData).forEach(([key, c]) => c.options.forEach((opt, optIdx) =>
    (opt.variants && opt.variants.length ? opt.variants : [opt]).forEach((v, vi) => {
      const comps = v.components, total = sumPrice(comps), ratio = total / budget;
      const blob = comps.filter(x => ['CPU', 'GPU', 'RAM'].includes(x.type)).map(x => x.name).join(' ').toLowerCase().replace(/\s+/g, '');
      const matched = tokens.filter(tk => blob.includes(tk));
      const fit = ratio <= 1 ? 100 - 150 * (1 - ratio) : 100 - 1000 * (ratio - 1);
      const career = maxW ? (hits[key] ? hits[key].length / maxW : 0) * 80 : ({ coder: 50, streamer: 50, office: 40 }[key] || 0);
      pool.push({ key, optIdx, vIdx: opt.variants ? vi : null, career: c.title || c.badge || c.name || key, name: opt.name, label: v.label || '', comps, total, matched,
        score: fit + career + (opt.score || 7) * 1.5 + Math.min(matched.length, 3) * 15 });
    })));
  pool.sort((a, b) => b.score - a.score);
  const best = pool[0], seen = new Set([best.key + best.optIdx]);
  const alts = pool.filter(x => { const id = x.key + x.optIdx; if (seen.has(id)) return false; seen.add(id); return true; }).slice(0, 2);
  return { best, alts, hits, tokens, cheapest: Math.min(...pool.filter(x => maxW ? hits[x.key] : ['coder','streamer','office'].includes(x.key)).map(x => x.total)) };
}
function buildRowsHTML(comps) {
  const order = { CPU:0, GPU:1, RAM:2, Storage:3, Mainboard:4, PSU:5, Cooler:6 };
  return [...comps].sort((a, b) => (order[a.type] ?? 99) - (order[b.type] ?? 99)).map(c =>
    `<div class="ai-row"><span class="text-[10px] font-extrabold uppercase text-purple-300 w-16">${c.icon || ''} ${c.type}</span><span class="text-white font-medium">${c.name}</span><b class="text-slate-300">${formatVND(c.price)}</b></div>`).join('');
}
function openCandidate(key, optIdx, vIdx) {
  activeCareerKey = key;
  showBuildDetails(key, optIdx, vIdx);
}
function runDreamAnalysis(text, keepBudget) {
  const typed = keepBudget ? null : parseBudget(text);
  if (typed && typed >= BUDGET_MIN && typed <= BUDGET_MAX) setBudget(typed, true);
  const r = analyzeDream(text, budgetVND), b = r.best;
  currentStep = 'ai'; lastDream = text;
  document.getElementById('back-btn').classList.remove('hidden');
  const diff = budgetVND - b.total, over = diff < 0;
  const names = Object.keys(r.hits).sort((x, y) => r.hits[y].length - r.hits[x].length).slice(0, 3).map(k => careersData[k].badge || careersData[k].title);
  const why = [
    names.length ? `Nhận diện nhu cầu: <b>${names.join(', ')}</b> (từ khóa: ${Object.values(r.hits).flat().slice(0, 6).join(', ')}).` : 'Chưa nhận diện rõ ngành nghề, nên chọn cấu hình đa dụng theo ngân sách.',
    over ? `Cấu hình rẻ nhất phù hợp nhu cầu này khoảng <b>${formatVND(r.cheapest)}</b>, cao hơn ngân sách ${formatVND(-diff)}. Bạn nên tăng ngân sách hoặc dùng bộ lọc để chọn cấu hình thấp hơn.`
         : `Tổng <b>${formatVND(b.total)}</b>, ${diff < budgetVND * 0.05 ? 'sát ngân sách' : 'còn dư ' + formatVND(diff)} so với ${formatVND(budgetVND)}.`,
    b.matched.length ? `Khớp yêu cầu linh kiện bạn nêu: <b>${b.matched.join(', ')}</b>.` : null,
  ].filter(Boolean).map(x => `<li>${x}</li>`).join('');
  const altCards = r.alts.map(a => `
    <div onclick="openCandidate('${a.key}',${a.optIdx},${a.vIdx})" class="card-purple rounded-2xl p-3.5 cursor-pointer">
      <div class="text-[10px] font-bold uppercase text-purple-400 mb-1">Phương án khác · ${a.career}</div>
      <div class="text-sm font-bold text-white">${a.name}${a.label ? ' · ' + a.label : ''}</div>
      <div class="text-xs mt-1 ${a.total > budgetVND ? 'text-red-400' : 'text-emerald-400'} font-bold">${formatVND(a.total)}${a.total > budgetVND ? ' (vượt ' + formatVND(a.total - budgetVND) + ')' : ''}</div>
    </div>`).join('');
  const full = `
    <div class="max-w-4xl mx-auto w-full space-y-4">
      <div><div class="text-[11px] font-bold uppercase tracking-wider text-purple-400">Kết quả phân tích</div>
        <h2 class="text-xl md:text-2xl font-extrabold text-white">Cấu hình gần nhất với yêu cầu của bạn</h2>
        <p class="text-xs text-slate-400 mt-1">“${text.replace(/</g, '&lt;')}”</p></div>
      <div class="card-purple rounded-2xl p-3.5">${budgetSliderHTML()}</div>
      <div id="ai-result" class="space-y-4">
      <div class="card-purple rounded-2xl p-4 space-y-3">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div><div class="text-[11px] font-bold uppercase text-purple-400">${b.career}</div>
            <div class="text-lg font-extrabold text-white">${b.name}${b.label ? ' · ' + b.label : ''}</div></div>
          <div class="text-right"><div class="text-xl font-extrabold ${over ? 'text-red-400' : 'text-emerald-400'}">${formatVND(b.total)}</div>
            <div class="text-[11px] text-slate-400">${over ? 'Vượt ' + formatVND(-diff) : 'Trong ngân sách'}</div></div>
        </div>
        <div class="grid gap-1.5">${buildRowsHTML(b.comps)}</div>
        <ul class="text-xs text-slate-300 space-y-1 list-disc pl-4">${why}</ul>
        <button onclick="openCandidate('${b.key}',${b.optIdx},${b.vIdx})" class="btn-primary text-xs px-4 py-2 rounded-xl">Xem chi tiết &amp; nâng cấp →</button>
      </div>
      ${altCards ? `<div class="grid sm:grid-cols-2 gap-3">${altCards}</div>` : ''}
      </div>
    </div>`;
  const prev = document.getElementById('ai-result');
  if (keepBudget && prev) { const tmp = document.createElement('div'); tmp.innerHTML = full; prev.innerHTML = tmp.querySelector('#ai-result').innerHTML; }
  else document.getElementById('main-view').innerHTML = full;
}

function handleCustomDream() {
  const el = document.getElementById('custom-dream-input');
  if (el && el.value.trim()) { runDreamAnalysis(el.value.trim()); return; }
  if (el) el.focus();
  return;
}
function handleCustomDreamLegacy() {
  const input = document.getElementById('custom-dream-input');
  if (!input) return;
  const val = input.value.trim().toLowerCase();
  if (!val) return;
  
  if (val.includes('data analyst') || val.includes('phân tích dữ liệu') || val.includes('power bi') || val.includes('tableau') || val.includes('sql')) {
    selectCareer('data');
  } else if (val.includes('ai') || val.includes('mô hình') || val.includes('trí tuệ nhân tạo') || val.includes('machine learning')) {
    selectCareer('ai');
  } else if (val.includes('web3') || val.includes('blockchain') || val.includes('solidity') || val.includes('smart contract')) {
    selectCareer('web3');
  } else if (val.includes('security') || val.includes('cyber') || val.includes('an ninh mạng') || val.includes('kali linux') || val.includes('pentest')) {
    selectCareer('security');
  } else if (val.includes('mobile') || val.includes('android studio') || val.includes('flutter') || val.includes('react native')) {
    selectCareer('mobile');
  } else if (val.includes('music') || val.includes('producer') || val.includes('âm nhạc') || val.includes('ableton') || val.includes('fl studio')) {
    selectCareer('music');
  } else if (val.includes('cad') || val.includes('revit') || val.includes('lumion') || val.includes('bim') || val.includes('kiến trúc')) {
    selectCareer('architecture');
  } else if (val.includes('product design') || val.includes('interior') || val.includes('nội thất') || val.includes('rhino') || val.includes('keyshot')) {
    selectCareer('product');
  } else if (val.includes('khoa học') || val.includes('matlab') || val.includes('simulink') || val.includes('scientific') || val.includes('mô phỏng')) {
    selectCareer('science');
  } else if (val.includes('code') || val.includes('lập trình') || val.includes('web') || val.includes('app') || val.includes('dev') || val.includes('coder')) {
    selectCareer('coder');
  } else if (val.includes('3d') || val.includes('đồ họa') || val.includes('vẽ') || val.includes('blender') || val.includes('animator')) {
    selectCareer('3d');
  } else if (val.includes('video') || val.includes('phim') || val.includes('edit') || val.includes('dựng') || val.includes('youtube') || val.includes('tiktok')) {
    selectCareer('editor');
  } else if (val.includes('stream') || val.includes('game') || val.includes('chơi') || val.includes('esports') || val.includes('gamer')) {
    selectCareer('streamer');
  } else if (val.includes('mac') || val.includes('apple') || val.includes('ios') || val.includes('xcode')) {
    selectCareer('mac');
  } else {
    selectCareer('office');
  }
}

function goBack() {
  if (currentStep === 'details') {
    const option = careersData[activeCareerKey]?.options[activeOptIdx];
    if (option && option.variants) {
      showVariants(activeCareerKey, activeOptIdx);
    } else {
      selectCareer(activeCareerKey);
    }
  } else if (currentStep === 'variants') {
    selectCareer(activeCareerKey);
  } else {
    renderHome();
  }
}

new MutationObserver(() => applyBudgetDim()).observe(document.getElementById('main-view'), { childList: true });
renderHome();
