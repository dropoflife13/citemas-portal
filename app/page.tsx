'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import * as THREE from 'three';

type OfficerRecord = {
  _id: string;
  firstName?: string;
  lastName?: string;
  officerPosition?: string | null;
  displayPosition?: string;
  avatar?: string | null;
  department?: string;
  yearLevel?: string;
  bio?: string;
};

function getInitialsAvatar(name: string): string {
  const parts = name.trim().split(/\s+/);
  const initials = (parts[0]?.[0] || 'C') + (parts[parts.length - 1]?.[0] || 'M');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <rect width="512" height="512" fill="#7f1d1d"/>
    <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="#fdfbf7" font-family="sans-serif" font-size="200" font-weight="bold">${initials.toUpperCase()}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Pure React Character Splitter — avoids fragile innerHTML regex and JSX scoping leaks
function SplitHeading({ lines }: { lines: string[] }) {
  let counter = 0;
  return (
    <>
      {lines.map((line, lineIdx) => (
        <span key={lineIdx} className="block">
          {line.split('').map((char, charIdx) => {
            const delay = counter * 0.035;
            counter++;
            return (
              <span
                key={charIdx}
                className="char"
                style={{ transitionDelay: `${delay}s` }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            );
          })}
        </span>
      ))}
    </>
  );
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const isLoggedIn = Boolean(user);
  const router = useRouter();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Dynamic Officers State (pulled from MongoDB)
  const [officers, setOfficers] = useState<OfficerRecord[]>([]);
  const [officersLoading, setOfficersLoading] = useState(true);
  const [officersError, setOfficersError] = useState<string | null>(null);
  const [activeOfficerIdx, setActiveOfficerIdx] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);

  // Fetch Officers from API
  useEffect(() => {
    const controller = new AbortController();
    setOfficersLoading(true);
    setOfficersError(null);

    fetch('/api/officers', { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setOfficers(Array.isArray(data.officers) ? data.officers : []);
        setOfficersLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setOfficersError(err.message || 'Unable to connect to officer roster');
        setOfficers([]);
        setOfficersLoading(false);
      });

    return () => controller.abort();
  }, []);

  const formatPosition = (position: string | null | undefined, displayPos?: string) => {
    if (displayPos) return displayPos;
    if (!position) return 'Officer';
    if (position.toLowerCase() === 'pro') return 'PRO';
    if (position.toLowerCase() === 'pio') return 'PIO';
    return position
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  const featuredOfficers = officers
    .filter((person) => person && person.officerPosition)
    .map((person) => {
      const name = `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'CITEMAS Officer';
      return {
        id: person._id,
        name,
        role: formatPosition(person.officerPosition, person.displayPosition),
        image: person.avatar || getInitialsAvatar(name),
        fallbackImage: getInitialsAvatar(name),
        department: person.department || 'College of Information Technology Education (CITE)',
        yearLevel: person.yearLevel || 'Student Executive',
        bio: person.bio || 'Leading strategic creative development and empowering student creators across campus.',
      };
    });

  // Clamp activeIdx
  useEffect(() => {
    setActiveOfficerIdx((cur) =>
      featuredOfficers.length === 0 ? 0 : Math.min(cur, featuredOfficers.length - 1)
    );
  }, [featuredOfficers.length]);

  // Auto-rotate officer carousel when not hovered
  useEffect(() => {
    if (!featuredOfficers.length || isCarouselPaused) return;
    const timer = setInterval(() => {
      if (document.hidden) return;
      setActiveOfficerIdx((prev) => (prev + 1) % featuredOfficers.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [featuredOfficers.length, isCarouselPaused]);

  const currentOfficer = featuredOfficers[activeOfficerIdx] || null;

  // --- Three.js 3D Cinematic Scene ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId: number;
    const sizes = { width: window.innerWidth, height: window.innerHeight };

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#070305');
    scene.fog = new THREE.FogExp2('#070305', 0.012);

    const camera = new THREE.PerspectiveCamera(50, sizes.width / sizes.height, 0.1, 100);
    camera.position.set(0, 0.2, 3.0);
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 2.0;

    // Chiaroscuro Lighting
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.15);
    scene.add(ambientLight);

    const keyLight = new THREE.SpotLight('#ffffff', 18.0);
    keyLight.position.set(4, 6, 3);
    keyLight.angle = Math.PI / 4;
    keyLight.penumbra = 0.9;
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 1.0;
    keyLight.shadow.camera.far = 15;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    // Signature CITEMAS Crimson Rim Light
    const rimLight = new THREE.DirectionalLight('#ff2a40', 14.0);
    rimLight.position.set(-5, 3, -4);
    scene.add(rimLight);

    // Warm Studio Fill Light
    const fillLight = new THREE.DirectionalLight('#fff1e0', 1.0);
    fillLight.position.set(-2, -4, 2);
    scene.add(fillLight);

    // Liquid Wave Background Shader
    const shaderUniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(sizes.width, sizes.height) },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uScroll: { value: 0 },
    };

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      varying vec2 vUv;
      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uMouse;
      uniform float uScroll;

      float hash(float n) { return fract(sin(n) * 43758.5453123); }
      float noise(in vec3 x) {
        vec3 p = floor(x);
        vec3 f = fract(x);
        f = f * f * (3.0 - 2.0 * f);
        float n = p.x + p.y * 57.0 + 113.0 * p.z;
        return mix(mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
                       mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y),
                   mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
                       mix(hash(n + 170.0), hash(n + 171.0), f.x), f.y), f.z);
      }

      void main() {
        vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
        float aspect = uResolution.x / uResolution.y;

        float time = uTime * 0.08;
        float scroll = uScroll;

        float angle1 = 0.6;
        float angle2 = -0.7;
        float angle3 = 1.2;

        float freq1 = 2.4;
        float freq2 = 3.2;
        float freq3 = 4.0;

        vec2 warpedUv = uv;
        float scrollDeform = scroll * 5.0;

        warpedUv.x += sin(uv.y * 2.5 + time * 0.2 + scrollDeform) * 0.35;
        warpedUv.y += cos(uv.x * 2.5 - time * 0.15 - scrollDeform * 0.8) * 0.35;

        warpedUv.x += sin(uv.y * 1.2 - time * 0.1 - scrollDeform * 1.5) * 0.25;
        warpedUv.y += cos(uv.x * 1.2 + time * 0.18 + scrollDeform * 1.2) * 0.25;

        vec2 scrollDrift = vec2(scroll * 0.04, -scroll * 0.02);
        vec2 mouseShift = vec2(uMouse.x * aspect * 0.05, uMouse.y * 0.05);
        warpedUv += scrollDrift + mouseShift;

        vec2 dir1 = vec2(cos(angle1), sin(angle1));
        vec2 dir2 = vec2(cos(angle2), sin(angle2));
        vec2 dir3 = vec2(cos(angle3), sin(angle3));

        float w1 = sin(dot(warpedUv, dir1) * freq1 + time * 1.0);
        float w2 = cos(dot(warpedUv, dir2) * freq2 - time * 1.4 + w1 * 0.4);
        float w3 = sin(dot(warpedUv, dir3) * freq3 + time * 1.8 + w2 * 0.5);

        float waveField = w1 * 0.50 + w2 * 0.35 + w3 * 0.15;

        float wideSheen = pow(max(0.0, 1.0 - abs(waveField - 0.1)), 2.5);
        float crispSpecular = pow(max(0.0, 1.0 - abs(waveField - 0.15)), 8.0);
        float crest = wideSheen * 0.5 + crispSpecular * 0.9;

        // CITEMAS Palettes: Molten Crimson (Top) -> Radiant Amber Fire (Bottom)
        vec3 c0_shadow = vec3(0.0012, 0.0004, 0.0005);
        vec3 c0_wave1  = vec3(0.095, 0.015, 0.020);
        vec3 c0_wave2  = vec3(0.050, 0.008, 0.012);
        vec3 c0_crest  = vec3(0.55, 0.18, 0.16);

        vec3 c1_shadow = vec3(0.0010, 0.0005, 0.0003);
        vec3 c1_wave1  = vec3(0.090, 0.038, 0.012);
        vec3 c1_wave2  = vec3(0.055, 0.020, 0.006);
        vec3 c1_crest  = vec3(0.58, 0.38, 0.14);

        float t = smoothstep(0.0, 1.0, scroll);
        vec3 colShadow = mix(c0_shadow, c1_shadow, t);
        vec3 colWave1  = mix(c0_wave1, c1_wave1, t);
        vec3 colWave2  = mix(c0_wave2, c1_wave2, t);
        vec3 colCrest  = mix(c0_crest, c1_crest, t);

        vec3 color = colShadow;
        color = mix(color, colWave2, smoothstep(-0.6, 0.2, waveField));
        color = mix(color, colWave1, smoothstep(0.0, 0.8, waveField));

        color += colCrest * crest * 1.4;

        float vignette = 1.0 - dot(uv, uv) * 0.14;
        color *= vignette;

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const bgMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: shaderUniforms,
      depthWrite: false,
      depthTest: false,
    });

    const bgGeometry = new THREE.PlaneGeometry(30, 30);
    const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
    bgMesh.position.set(0.0, 0.0, -8.0);
    bgMesh.renderOrder = -10;
    camera.add(bgMesh);

    // Creative Sparks & Forge Embers
    const sparkCount = 450;
    const sparkData: {
      speedX: number;
      speedY: number;
      speedZ: number;
      swaySpeed: number;
      swayRadius: number;
      phase: number;
    }[] = [];

    function createSparkTexture() {
      const cvs = document.createElement('canvas');
      cvs.width = 16;
      cvs.height = 16;
      const ctx = cvs.getContext('2d');
      if (ctx) {
        const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.25, 'rgba(255, 180, 140, 0.85)');
        gradient.addColorStop(0.6, 'rgba(220, 38, 38, 0.35)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 16, 16);
      }
      return new THREE.CanvasTexture(cvs);
    }

    const sparkGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(sparkCount * 3);
    const colors = new Float32Array(sparkCount * 3);

    for (let i = 0; i < sparkCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 6.5;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 5.0 - 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6.5;

      if (Math.random() < 0.7) {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.25 + Math.random() * 0.25;
        colors[i * 3 + 2] = 0.05 + Math.random() * 0.08;
      } else {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.85 + Math.random() * 0.12;
        colors[i * 3 + 2] = 0.45 + Math.random() * 0.2;
      }

      sparkData.push({
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: 0.15 + Math.random() * 0.3,
        speedZ: (Math.random() - 0.5) * 0.4,
        swaySpeed: 0.5 + Math.random() * 1.5,
        swayRadius: 0.05 + Math.random() * 0.15,
        phase: Math.random() * Math.PI * 2,
      });
    }

    sparkGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    sparkGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const sparkMat = new THREE.PointsMaterial({
      size: 0.026,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: createSparkTexture(),
    });

    const sparkParticles = new THREE.Points(sparkGeo, sparkMat);
    scene.add(sparkParticles);

    // Procedural CITEMAS 3D Logo Mesh
    const D = Math.PI / 180,
      CX = 170,
      CY = 240,
      RH = 76,
      STEP = 46.5;
    const toW = (x: number, y: number) => new THREE.Vector2((x - 252) / 100, -(y - 223) / 100);
    const pol = (a: number, r: number) => toW(CX + r * Math.cos(a * D), CY + r * Math.sin(a * D));

    function edge(a0: number, aT: number, r0: number, p: number, rh: number, n: number) {
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const u = i / n;
        pts.push(pol(a0 + (aT - a0) * u, rh + (r0 - rh) * Math.pow(1 - u, p)));
      }
      return pts;
    }

    const R = [171, 173, 166, 158, 150, 142];
    function blade(k: number) {
      const s = -STEP * k,
        T = 41 + s,
        r = R[k];
      const o = edge(-55 + s, T, r, 2.2, RH + 3, 48);
      const i = edge(-75 + s, T, r * 0.866, 3, RH, 48).reverse();
      return new THREE.Shape(o.concat(i));
    }

    function ribbon() {
      const sp = (pts: number[][]) =>
        new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], 0)))
          .getPoints(90)
          .map((v) => toW(v.x, v.y));
      const top = sp([
        [92, 248],
        [97, 284],
        [126, 312],
        [175, 331],
        [225, 329],
        [275, 311],
        [325, 277],
        [370, 254],
        [415, 247],
        [455, 261],
        [490, 297],
      ]);
      const bot = sp([
        [488, 300],
        [445, 289],
        [405, 288],
        [365, 299],
        [330, 320],
        [290, 346],
        [245, 362],
        [200, 364],
        [155, 353],
        [122, 333],
        [108, 312],
        [103, 280],
        [97, 252],
      ]);
      return new THREE.Shape(top.concat(bot));
    }

    const stops: [number, THREE.Color][] = [
      [0, new THREE.Color('#030000')],
      [0.3, new THREE.Color('#4a0408')],
      [0.6, new THREE.Color('#bf1219')],
      [0.85, new THREE.Color('#dc3a40')],
      [1, new THREE.Color('#e8666a')],
    ];
    const tmp = new THREE.Color();
    function colorAt(x: number, y: number) {
      const t = Math.min(1, Math.max(0, (x * 0.45 + y * 0.55 + 1.4) / 2.1));
      let i = 1;
      while (i < stops.length - 1 && t > stops[i][0]) i++;
      const a = stops[i - 1],
        b = stops[i];
      return tmp
        .copy(a[1])
        .lerp(b[1], (t - a[0]) / (b[0] - a[0]))
        .convertSRGBToLinear();
    }

    function paint(g: THREE.BufferGeometry) {
      const p = g.attributes.position;
      const c = new Float32Array(p.count * 3);
      for (let i = 0; i < p.count; i++) {
        const col = colorAt(p.getX(i), p.getY(i));
        c[i * 3] = col.r;
        c[i * 3 + 1] = col.g;
        c[i * 3 + 2] = col.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(c, 3));
    }

    const logoGroup = new THREE.Group();
    const logoMat = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      roughness: 0.28,
      metalness: 0.35,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    const opts = {
      depth: 0.09,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.02,
      bevelSegments: 5,
      curveSegments: 16,
    };

    function addExtruded(shape: THREE.Shape, z: number) {
      const g = new THREE.ExtrudeGeometry(shape, opts);
      paint(g);
      g.computeVertexNormals();
      const m = new THREE.Mesh(g, logoMat);
      m.position.z = z;
      m.castShadow = true;
      m.receiveShadow = true;
      logoGroup.add(m);
    }

    for (let k = 0; k < 6; k++) addExtruded(blade(k), (5 - k) * 0.125);
    addExtruded(ribbon(), 6 * 0.125);
    logoGroup.position.z = -0.42;

    const boxInitial = new THREE.Box3().setFromObject(logoGroup);
    const sizeInitial = boxInitial.getSize(new THREE.Vector3());
    const maxDim = Math.max(sizeInitial.x, sizeInitial.y, sizeInitial.z);
    const targetScale = 3.6 / (maxDim > 0.0001 ? maxDim : 1);
    logoGroup.scale.setScalar(targetScale);
    logoGroup.updateMatrixWorld(true);

    const boxScaled = new THREE.Box3().setFromObject(logoGroup);
    const centerScaled = boxScaled.getCenter(new THREE.Vector3());
    logoGroup.position.sub(centerScaled);

    const modelPivot = new THREE.Group();
    modelPivot.position.y = -0.35;
    modelPivot.add(logoGroup);
    scene.add(modelPivot);

    // State & Scroll Animation
    let currentScroll = 0;
    let mouseX = 0,
      mouseY = 0,
      targetMouseX = 0,
      targetMouseY = 0;
    let cursorX = window.innerWidth / 2,
      cursorY = window.innerHeight / 2;
    let outerCursorX = window.innerWidth / 2,
      outerCursorY = window.innerHeight / 2;
    const clock = new THREE.Clock();

    const handleMouseMove = (event: MouseEvent) => {
      cursorX = event.clientX;
      cursorY = event.clientY;
      const cursorInner = document.querySelector('.cursor-inner') as HTMLElement;
      if (cursorInner) {
        cursorInner.style.left = `${cursorX}px`;
        cursorInner.style.top = `${cursorY}px`;
      }
      targetMouseX = (event.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = (event.clientY / window.innerHeight) * 2 - 1;
    };

    const handleResize = () => {
      sizes.width = window.innerWidth;
      sizes.height = window.innerHeight;
      camera.aspect = sizes.width / sizes.height;
      camera.updateProjectionMatrix();
      renderer.setSize(sizes.width, sizes.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      shaderUniforms.uResolution.value.set(sizes.width, sizes.height);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    function updateGridDots(scroll: number) {
      const dots = document.querySelectorAll('.grid-dot') as NodeListOf<HTMLElement>;
      dots.forEach((dot, i) => {
        const startY = ((i * 17) % 80) + 10;
        let speed = 90 + ((i * 55) % 180);
        if (i % 2 === 0) speed = -speed;
        let y = startY + scroll * speed;
        y = ((y % 100) + 100) % 100;
        dot.style.top = `${y}%`;
      });
    }

    function updateSlides(scroll: number) {
      const slide1 = document.getElementById('slide-1');
      const slide2 = document.getElementById('slide-2');
      const slide3 = document.getElementById('slide-3');
      const slide4 = document.getElementById('slide-4');

      for (let i = 1; i <= 4; i++) {
        const fill = document.getElementById(`dash-fill-${i}`);
        if (fill) {
          const start = (i - 1) * 0.25;
          const end = i * 0.25;
          let progress = (scroll - start) / (end - start);
          progress = Math.max(0, Math.min(1, progress));
          fill.style.height = `${progress * 100}%`;
        }
      }

      function isActive(val: number, start: number, end: number) {
        return val >= start && val <= end;
      }

      if (slide1) slide1.classList.toggle('active', isActive(scroll, -0.1, 0.16));
      if (slide2) {
        const active2 = isActive(scroll, 0.22, 0.42);
        slide2.classList.toggle('active', active2);
        const slide2Img = document.getElementById('slide-2-img');
        if (slide2Img) slide2Img.classList.toggle('active', active2);
      }
      if (slide3) slide3.classList.toggle('active', isActive(scroll, 0.48, 0.68));
      if (slide4) slide4.classList.toggle('active', isActive(scroll, 0.74, 1.05));
    }

    const tick = () => {
      animId = requestAnimationFrame(tick);
      const deltaTime = clock.getDelta();

      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const scrollTop =
        window.scrollY !== undefined
          ? window.scrollY
          : window.pageYOffset !== undefined
          ? window.pageYOffset
          : document.documentElement.scrollTop;
      const targetScroll = maxScroll > 0 ? scrollTop / maxScroll : 0;

      currentScroll += (targetScroll - currentScroll) * 0.025;
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      outerCursorX += (cursorX - outerCursorX) * 0.2;
      outerCursorY += (cursorY - outerCursorY) * 0.2;
      const cursorOuter = document.querySelector('.cursor-outer') as HTMLElement;
      if (cursorOuter) {
        cursorOuter.style.left = `${outerCursorX}px`;
        cursorOuter.style.top = `${outerCursorY}px`;
      }

      if (modelPivot) {
        modelPivot.rotation.y = mouseX * 0.25;
        modelPivot.rotation.x = mouseY * 0.15;
      }

      if (sparkParticles) {
        const posArray = sparkParticles.geometry.attributes.position.array as Float32Array;
        const time = clock.getElapsedTime();
        const scrollVelocity = Math.abs(targetScroll - currentScroll);
        const speedMultiplier = 1.0 + scrollVelocity * 9.0;
        const turbulence = scrollVelocity * 0.8;

        for (let i = 0; i < sparkCount; i++) {
          const idx = i * 3;
          const data = sparkData[i];
          posArray[idx] += data.speedX * deltaTime * speedMultiplier;
          posArray[idx + 1] += data.speedY * deltaTime * speedMultiplier;
          posArray[idx + 2] += data.speedZ * deltaTime * speedMultiplier;

          const currentSway = data.swayRadius * (1.0 + turbulence * 4.0);
          posArray[idx] += Math.sin(time * data.swaySpeed + data.phase) * currentSway * deltaTime;
          posArray[idx + 2] += Math.cos(time * data.swaySpeed + data.phase) * currentSway * deltaTime;

          if (posArray[idx + 1] > 3.0 || Math.abs(posArray[idx]) > 3.5 || Math.abs(posArray[idx + 2]) > 3.5) {
            posArray[idx + 1] = -2.5;
            posArray[idx] = (Math.random() - 0.5) * 3.0;
            posArray[idx + 2] = (Math.random() - 0.5) * 3.0;
          }
        }
        sparkParticles.geometry.attributes.position.needsUpdate = true;
      }

      // Camera Orbit around CITEMAS emblem
      const phi = currentScroll * Math.PI * 2.0;
      const y = 0.35 + Math.sin(currentScroll * Math.PI) * 0.8;
      const radius = 4.2 - Math.sin(currentScroll * Math.PI) * 0.6;
      const x = radius * Math.sin(phi);
      const z = radius * Math.cos(phi);

      const transitionProgress = Math.min(1.0, currentScroll / 0.28);
      const easeFactor = (Math.cos(transitionProgress * Math.PI) + 1.0) * 0.5;
      const lookAtXOffset = -0.9 * easeFactor;
      const targetLookAt = new THREE.Vector3(lookAtXOffset, -0.15, 0);
      const targetPos = new THREE.Vector3(x, y, z);
      camera.position.lerp(targetPos, 0.025);
      camera.lookAt(targetLookAt);

      if (shaderUniforms) {
        shaderUniforms.uTime.value = clock.getElapsedTime();
        shaderUniforms.uMouse.value.set(mouseX, -mouseY);
        shaderUniforms.uScroll.value = currentScroll;
      }

      updateSlides(currentScroll);
      updateGridDots(currentScroll);
      renderer.render(scene, camera);
    };

    tick();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070305] text-[#FDFBF7]">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-red-500" />
      </div>
    );
  }

  return (
    <div className="relative w-full bg-[#070305] text-white selection:bg-red-500 selection:text-white pb-32 md:pb-48" style={{ minHeight: '800vh' }}>
      {/* 3D Global Styles & Keyframes */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Italiana&family=Outfit:wght@300;400;600&display=swap');

        .cursor-inner {
          position: fixed;
          top: 0;
          left: 0;
          width: 6px;
          height: 6px;
          border: 2px solid rgba(255, 255, 255, 1);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 9999;
        }

        .cursor-outer {
          position: fixed;
          top: 0;
          left: 0;
          width: 40px;
          height: 40px;
          border: 1.5px solid rgba(220, 38, 38, 0.7);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 9998;
          transition: width 0.3s, height 0.3s, background 0.3s;
        }

        #webgl-canvas {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          outline: none;
        }

        .cinematic-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 10;
          pointer-events: none;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 80px 60px 40px 60px;
          box-sizing: border-box;
        }

        .slide {
          position: absolute;
          bottom: 15%;
          pointer-events: none;
        }

        #slide-1 {
          left: 0;
          width: 100%;
        }
        #slide-1 .slide-title {
          margin-left: 60px;
        }
        #slide-1 .desc-row {
          position: relative;
          display: flex;
          width: 100%;
        }
        #slide-1 .col-1 {
          margin-left: 60px;
          width: calc(25vw - 60px);
          max-width: calc(25vw - 60px);
        }
        #slide-1 .col-2 {
          position: absolute;
          left: calc(25vw + 40px);
          width: calc(25vw - 60px);
          max-width: calc(25vw - 60px);
        }

        #slide-2 {
          left: 0;
          width: 100%;
        }
        #slide-2-img {
          position: fixed;
          top: 130px;
          left: 60px;
          width: calc(25vw - 60px);
          aspect-ratio: 1 / 1;
          overflow: hidden;
          z-index: 2;
          pointer-events: none;
          clip-path: inset(0 0 100% 0);
          transition: clip-path 1.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s ease;
          opacity: 0;
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.15);
        }
        #slide-2-img.active {
          clip-path: inset(0 0 0 0);
          opacity: 1;
        }
        #slide-2-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scale(1.15);
          transition: transform 1.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        #slide-2-img.active img {
          transform: scale(1);
        }

        #slide-2 .slide-title {
          margin-left: calc(25vw + 40px);
        }
        #slide-2 .slide-desc {
          margin-left: calc(50vw + 20px);
          width: calc(25vw - 60px);
          max-width: calc(25vw - 60px);
        }

        #slide-3 {
          left: calc(50vw + 20px);
          width: calc(30vw - 40px);
          max-width: calc(30vw - 40px);
        }
        #slide-3 .slide-title {
          white-space: nowrap;
        }

        /* Milestone 4: Elevated above footer */
        #slide-4 {
          bottom: 25%;
          left: calc(25% + 40px);
          max-width: 720px;
          width: calc(100% - 35%);
        }

        .slide-title {
          font-family: 'Italiana', serif;
          font-size: clamp(56px, 7vw, 110px);
          line-height: 1;
          font-weight: 400;
          letter-spacing: 2px;
          margin-bottom: 20px;
          color: #fff6ed;
        }

        .slide-desc {
          font-family: 'Outfit', sans-serif;
          font-size: 15px;
          line-height: 1.7;
          font-weight: 300;
          color: #d1d5db;
          letter-spacing: 0.5px;
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s cubic-bezier(0.25, 1, 0.5, 1),
            transform 0.8s cubic-bezier(0.25, 1, 0.5, 1);
          transition-delay: 0.4s;
        }
        .slide.active .slide-desc {
          opacity: 1;
          transform: translateY(0);
        }

        /* Pop-up Items for Dynamic Scroll Reveals */
        .pop-up-item {
          opacity: 0;
          transform: translateY(35px) scale(0.96);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1),
            transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .slide.active .pop-up-item {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        .char {
          display: inline-block;
          opacity: 0;
          transform: translateY(50px);
          filter: blur(12px);
          transition: opacity 0.8s cubic-bezier(0.25, 1, 0.5, 1),
            transform 0.8s cubic-bezier(0.25, 1, 0.5, 1),
            filter 0.8s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .slide.active .char {
          opacity: 1;
          transform: translateY(0);
          filter: blur(0);
        }
        .slide.active {
          pointer-events: auto;
        }

        .grid-horizontal-line {
          position: fixed;
          top: 75px;
          left: 0;
          right: 0;
          width: 100%;
          height: 1px;
          background: rgba(255, 255, 255, 0.08);
          z-index: 5;
          pointer-events: none;
        }

        .grid-lines {
          position: fixed;
          top: 0;
          left: 40px;
          right: 40px;
          width: calc(100% - 80px);
          height: 100vh;
          display: flex;
          justify-content: space-between;
          z-index: 5;
          pointer-events: none;
        }

        .grid-line {
          position: relative;
          width: 1px;
          height: 100%;
          background: rgba(255, 255, 255, 0.06);
        }
        .grid-line:nth-child(3) {
          margin-top: 75px;
          height: calc(100vh - 75px);
        }

        .grid-dot {
          position: absolute;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(220, 38, 38, 0.5);
          box-shadow: 0 0 8px rgba(220, 38, 38, 0.6);
        }

        .story-dashes {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .story-dash {
          width: 2px;
          height: 40px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 2px;
        }

        .story-dash-fill {
          width: 100%;
          height: 0%;
          background: #ef4444;
          box-shadow: 0 0 10px #ef4444;
          border-radius: 2px;
        }

        @media (max-width: 1024px) {
          .cinematic-container {
            padding: 70px 24px 24px 24px;
          }
          .grid-lines {
            left: 16px;
            right: 16px;
            width: calc(100% - 32px);
          }
          #slide-1 .slide-title {
            margin-left: 16px;
          }
          #slide-1 .col-1 {
            margin-left: 16px;
            width: calc(100vw - 32px);
            max-width: none;
          }
          #slide-1 .col-2 {
            display: none;
          }
          #slide-2-img {
            display: none;
          }
          #slide-2 .slide-title {
            margin-left: 16px;
          }
          #slide-2 .slide-desc {
            margin-left: 16px;
            width: calc(100vw - 32px);
            max-width: none;
          }
          #slide-3 {
            left: 16px;
            width: calc(100vw - 32px);
            max-width: none;
          }
          #slide-4 {
            left: 16px;
            bottom: 26%;
            width: calc(100vw - 32px);
            max-width: none;
          }
        }
      `}</style>

      {/* Two-part Interactive Cursor */}
      <div className="cursor-inner" />
      <div className="cursor-outer" />

      {/* Cinematic Editorial Overlays */}
      <div className="cinematic-container">
        <div />

        {/* Milestone 1: Studio & Vision */}
        <div className="slide active" id="slide-1">
          <h2 className="slide-title">
            <SplitHeading lines={['CITEMAS', 'Studio']} />
          </h2>
          <div className="desc-row">
            <div className="col-1 space-y-4">
              <p className="slide-desc">
                Where vision meets execution. The premier creative and multimedia guild of PHINMA University of Iloilo, uniting digital visionaries and traditional artisans.
              </p>
              <div className="pt-2 flex flex-wrap gap-3 pop-up-item" style={{ transitionDelay: '0.25s' }}>
                {isLoggedIn ? (
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="px-6 py-3 rounded-full bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold text-xs uppercase tracking-wider hover:from-red-500 hover:to-orange-500 transition-all shadow-lg shadow-red-600/40 cursor-pointer"
                  >
                    Open Dashboard &rarr;
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => router.push('/register')}
                      className="px-6 py-3 rounded-full bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold text-xs uppercase tracking-wider hover:from-red-500 hover:to-orange-500 transition-all shadow-lg shadow-red-600/40 cursor-pointer"
                    >
                      Join Guild
                    </button>
                    <button
                      onClick={() => router.push('/login')}
                      className="px-6 py-3 rounded-full border border-white/20 bg-white/5 text-slate-200 font-semibold text-xs uppercase tracking-wider hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                    >
                      Sign In
                    </button>
                  </>
                )}
              </div>
            </div>
            <p className="slide-desc col-2">
              Born of creative fire and artistic will, bridging campus innovation and professional media standards. A dynamic ecosystem built for next-generation creators.
            </p>
          </div>
        </div>

        {/* Milestone 2: Craft & Discipline */}
        <div className="slide-image-mask" id="slide-2-img">
          <img src="/orgpic.jpg" alt="CITEMAS Guild Studio" />
        </div>
        <div className="slide" id="slide-2">
          <h2 className="slide-title">
            <SplitHeading lines={['Craft &', 'Discipline']} />
          </h2>
          <div className="slide-desc space-y-4">
            <p>
              Six dedicated creative disciplines spanning digital arts, animation, videography, photography, traditional illustration, and voice acting. Hone your voice, perfect your technique.
            </p>
            {/* Pop-up Discipline Badges with Staggered Delays */}
            <div className="flex flex-wrap gap-2 pt-2">
              {[
                { name: 'Digital Arts', delay: '0.2s' },
                { name: '3D Animation', delay: '0.25s' },
                { name: 'Videography', delay: '0.3s' },
                { name: 'Photography', delay: '0.35s' },
                { name: 'Voice Acting', delay: '0.4s' },
                { name: 'Traditional Arts', delay: '0.45s' },
              ].map((spec) => (
                <span
                  key={spec.name}
                  className="px-3.5 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-semibold pop-up-item shadow-sm hover:border-red-500/40 transition-colors"
                  style={{ transitionDelay: spec.delay }}
                >
                  {spec.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Milestone 3: Molten Energy */}
        <div className="slide" id="slide-3">
          <h2 className="slide-title">
            <SplitHeading lines={['Molten', 'Energy']} />
          </h2>
          <div className="slide-desc space-y-4">
            <p>
              Dynamic student exhibitions, hands-on production sprints, and cross-departmental creative summits. Experience collaborative projects that define campus culture.
            </p>
            {/* Pop-up Live Metric Cards */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div
                className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md pop-up-item hover:border-red-500/30 transition-all"
                style={{ transitionDelay: '0.15s' }}
              >
                <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent">50+</div>
                <div className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">Active Members</div>
              </div>
              <div
                className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md pop-up-item hover:border-red-500/30 transition-all"
                style={{ transitionDelay: '0.25s' }}
              >
                <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent">10+</div>
                <div className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">Events Hosted</div>
              </div>
              <div
                className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md pop-up-item hover:border-red-500/30 transition-all"
                style={{ transitionDelay: '0.35s' }}
              >
                <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent">50+</div>
                <div className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">Projects Built</div>
              </div>
              <div
                className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md pop-up-item hover:border-red-500/30 transition-all"
                style={{ transitionDelay: '0.45s' }}
              >
                <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent">5+</div>
                <div className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">Years Active</div>
              </div>
            </div>
          </div>
        </div>

        {/* Milestone 4: Executive Leadership & Hub */}
        <div className="slide" id="slide-4">
          <h2 className="slide-title">
            <SplitHeading lines={['Executive', 'Leadership']} />
          </h2>
          <div className="slide-desc space-y-4">
            <p>
              Meet the student officers leading our creative disciplines, gallery exhibitions, and campus productions.
            </p>

            {/* DYNAMIC EXECUTIVE SHOWCASE — PULLING FROM DATABASE */}
            {officersLoading ? (
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 text-center text-xs text-slate-400 pop-up-item">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-500/30 border-t-red-500 mx-auto mb-2" />
                Loading leadership roster...
              </div>
            ) : currentOfficer ? (
              <div className="space-y-3">
                {/* Featured Spotlight Card */}
                <div
                  onMouseEnter={() => setIsCarouselPaused(true)}
                  onMouseLeave={() => setIsCarouselPaused(false)}
                  className="p-4 sm:p-5 rounded-3xl bg-white/[0.03] border border-white/15 backdrop-blur-xl flex flex-col sm:flex-row items-center gap-4 shadow-2xl pop-up-item hover:border-red-500/40 transition-all"
                  style={{ transitionDelay: '0.2s' }}
                >
                  <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl overflow-hidden shrink-0 border border-white/20 shadow-md">
                    <img
                      src={currentOfficer.image}
                      alt={currentOfficer.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = currentOfficer.fallbackImage;
                      }}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  </div>
                  <div className="flex-1 text-center sm:text-left space-y-1">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-red-600 to-orange-600 text-white text-[10px] font-black uppercase tracking-wider inline-block shadow-sm">
                        {currentOfficer.role}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {currentOfficer.yearLevel}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-white tracking-tight">{currentOfficer.name}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {currentOfficer.bio}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() =>
                        setActiveOfficerIdx((prev) =>
                          prev === 0 ? featuredOfficers.length - 1 : prev - 1
                        )
                      }
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs text-slate-300 hover:text-white transition cursor-pointer"
                      aria-label="Previous officer"
                    >
                      &larr;
                    </button>
                    <button
                      onClick={() =>
                        setActiveOfficerIdx((prev) => (prev + 1) % featuredOfficers.length)
                      }
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs text-slate-300 hover:text-white transition cursor-pointer"
                      aria-label="Next officer"
                    >
                      &rarr;
                    </button>
                  </div>
                </div>

                {/* Council Avatars Tray — One-click Officer Switcher */}
                {featuredOfficers.length > 1 && (
                  <div
                    className="flex items-center justify-center sm:justify-start gap-2 overflow-x-auto py-1 pop-up-item"
                    style={{ transitionDelay: '0.35s' }}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mr-1 hidden sm:inline">
                      Council:
                    </span>
                    {featuredOfficers.map((person, idx) => (
                      <button
                        key={person.id || idx}
                        onClick={() => setActiveOfficerIdx(idx)}
                        className={`relative rounded-xl overflow-hidden transition-all cursor-pointer ${
                          activeOfficerIdx === idx
                            ? 'h-9 w-9 ring-2 ring-red-500 scale-105 shadow-md shadow-red-500/30'
                            : 'h-8 w-8 opacity-60 hover:opacity-100 hover:scale-105'
                        }`}
                        title={`${person.name} (${person.role})`}
                      >
                        <img
                          src={person.image}
                          alt={person.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = person.fallbackImage;
                          }}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {/* Quick Gateway Actions */}
            <div className="pt-2 flex flex-wrap gap-3 pop-up-item" style={{ transitionDelay: '0.45s' }}>
              <button
                onClick={() => router.push('/portfolio')}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold text-xs uppercase tracking-wider hover:from-red-500 hover:to-orange-500 transition-all shadow-lg shadow-red-600/40 cursor-pointer"
              >
                View Guild Portfolios &rarr;
              </button>
              <button
                onClick={() => router.push('/events')}
                className="px-6 py-3 rounded-full border border-white/20 bg-white/5 text-slate-200 font-semibold text-xs uppercase tracking-wider hover:bg-white/10 hover:text-white transition-all cursor-pointer"
              >
                Upcoming Events
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Lines & Stories Progress */}
      <div className="grid-horizontal-line" />
      <div className="grid-lines">
        <div className="grid-line"><div className="grid-dot top" /><div className="grid-dot bottom" /></div>
        <div className="grid-line"><div className="grid-dot top" /><div className="grid-dot bottom" /></div>
        <div className="grid-line"><div className="grid-dot top" /><div className="grid-dot bottom" /></div>
        <div className="grid-line"><div className="grid-dot top" /><div className="grid-dot bottom" /></div>
        <div className="grid-line story-progress-container">
          <div className="grid-dot top" />
          <div className="grid-dot bottom" />
          <div className="story-dashes">
            <div className="story-dash"><div className="story-dash-fill" id="dash-fill-1" /></div>
            <div className="story-dash"><div className="story-dash-fill" id="dash-fill-2" /></div>
            <div className="story-dash"><div className="story-dash-fill" id="dash-fill-3" /></div>
            <div className="story-dash"><div className="story-dash-fill" id="dash-fill-4" /></div>
          </div>
        </div>
      </div>

      {/* Fixed WebGL Canvas */}
      <canvas id="webgl-canvas" ref={canvasRef} />
    </div>
  );
}
