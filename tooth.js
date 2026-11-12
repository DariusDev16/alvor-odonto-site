/* Dente 3D do hero: geometria gerada em código, sem arquivos de modelo */
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const canvas = document.getElementById('toothCanvas');
const hero = document.getElementById('hero');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function toothGeometry() {
  let g = new THREE.IcosahedronGeometry(1, 48);
  g.deleteAttribute('uv'); g.deleteAttribute('normal');
  g = mergeVertices(g, 1e-4);
  const p = g.attributes.position;
  const cusps = [[0.5, 0.42], [-0.5, 0.42], [0.5, -0.42], [-0.5, -0.42]];
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    // seção mais quadrada, como um molar
    const a = Math.atan2(z, x);
    const sq = 1 / Math.pow(Math.abs(Math.cos(a)) ** 3 + Math.abs(Math.sin(a)) ** 3, 1 / 3);
    x *= sq * 1.04; z *= sq * 0.9;
    if (y >= 0) {
      // coroa: quatro cúspides e um sulco central
      const k = smooth(0.15, 0.75, y);
      let bump = -0.26 * Math.exp(-(x * x + z * z) / 0.11);
      bump -= 0.07 * Math.exp(-(x * x) / 0.012) + 0.07 * Math.exp(-(z * z) / 0.012);
      for (const [cx, cz] of cusps) bump += 0.2 * Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / 0.075);
      y = y * 0.95 + k * bump;
    } else {
      // raízes: duas pontas que descem a partir da base
      const t = -y;
      const root = Math.exp(-((Math.abs(x) - 0.47) ** 2) / 0.05 - (z * z) / 0.2);
      y = -t * (0.5 + 1.95 * Math.pow(root, 0.8));
      x += Math.sign(x) * 0.1 * root * t;
    }
    // colo levemente estrangulado
    const neck = 1 - 0.1 * Math.exp(-((y + 0.12) ** 2) / 0.04);
    p.setXYZ(i, x * neck, y, z * neck);
  }
  g.translate(0, 0.55, 0);
  g.computeVertexNormals();
  return g;
}

function init() {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(28, 0.75, 0.1, 50);
  camera.position.set(0, 0, 9.4);

  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xf3f6ff, roughness: 0.16, metalness: 0,
    clearcoat: 1, clearcoatRoughness: 0.06,
    sheen: 1, sheenColor: new THREE.Color(0x8fb2ff), sheenRoughness: 0.35,
    iridescence: 0.4, iridescenceIOR: 1.25,
    envMapIntensity: 0.9,
  });
  const tooth = new THREE.Mesh(toothGeometry(), mat);
  const pivot = new THREE.Group();
  pivot.add(tooth);
  scene.add(pivot);

  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(-3, 4, 5); scene.add(key);
  const rim = new THREE.PointLight(0x2b6fd6, 60, 20); rim.position.set(3.5, -1, -2.5); scene.add(rim);
  const fill = new THREE.PointLight(0x9db9ff, 14, 20); fill.position.set(-4, -2.5, 2); scene.add(fill);

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  const ptr = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
  addEventListener('pointermove', (e) => {
    ptr.x = e.clientX / innerWidth - 0.5; ptr.y = e.clientY / innerHeight - 0.5;
  }, { passive: true });

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);

  const t0 = performance.now();
  const frame = (now) => {
    if (!reduced) requestAnimationFrame(frame);
    if (!visible) return;
    const t = (now - t0) / 1000;
    const intro = reduced ? 1 : 1 - Math.pow(1 - Math.min(1, t / 2.2), 4);
    const sp = Math.min(1, Math.max(0, scrollY / (hero.offsetHeight || 1)));
    cur.x += (ptr.x - cur.x) * 0.06; cur.y += (ptr.y - cur.y) * 0.06;

    pivot.rotation.z = 0.28 - sp * 0.5;
    pivot.rotation.x = 0.12 + cur.y * 0.5 + sp * 0.6;
    pivot.rotation.y = (reduced ? -0.5 : t * 0.25) + (1 - intro) * -4 + cur.x * 0.9 + sp * Math.PI * 1.5;
    pivot.position.y = (reduced ? 0 : Math.sin(t * 0.9) * 0.06) - (1 - intro) * 1.2 - sp * 0.9;
    pivot.scale.setScalar((0.55 + 0.45 * intro) * (1 - sp * 0.25));
    canvas.style.opacity = intro * (1 - smooth(0.55, 1, sp));
    renderer.render(scene, camera);
  };
  requestAnimationFrame(frame);
}

try { init(); } catch (err) { console.warn('Dente 3D indisponível:', err); canvas.parentElement.style.display = 'none'; }
