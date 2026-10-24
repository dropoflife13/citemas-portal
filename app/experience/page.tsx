'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import * as THREE from 'three';

export default function ExperiencePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId: number;
    const sizes = { width: window.innerWidth, height: window.innerHeight };

    // --- Scene & Camera ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#070305');
    scene.fog = new THREE.FogExp2('#070305', 0.012);

    const camera = new THREE.PerspectiveCamera(50, sizes.width / sizes.height, 0.1, 100);
    camera.position.set(0, 0.2, 3.0);
    scene.add(camera);

    // --- Renderer ---
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

    // --- Lighting (CITEMAS Chiaroscuro) ---
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

    // --- CITEMAS Liquid Wave Background Shader ---
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

        // CITEMAS Molten Crimson (Scroll = 0) to Radiant Amber/Gold (Scroll = 1)
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

    // --- CITEMAS Creative Sparks & Forge Embers ---
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
        // CITEMAS Fiery Embers (Crimson to Molten Orange)
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.25 + Math.random() * 0.25;
        colors[i * 3 + 2] = 0.05 + Math.random() * 0.08;
      } else {
        // Warm Champagne / Golden Sparks
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

    // --- Procedural CITEMAS 3D Logo Mesh ---
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

    // Scale & center logo
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

    // --- State & Animation Tracking ---
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

    // Per-letter split
    const titles = document.querySelectorAll('.slide-title');
    titles.forEach((title) => {
      const text = title.innerHTML;
      let newHTML = '';
      let delayCounter = 0;
      const parts = text.split(/(<br\s*\/?>)/i);
      parts.forEach((part) => {
        if (part.toLowerCase().startsWith('<br')) {
          newHTML += part;
        } else {
          for (let i = 0; i < part.length; i++) {
            if (part[i] === ' ') {
              newHTML += ' ';
            } else {
              newHTML += `<span class="char" style="transition-delay: ${delayCounter * 0.035}s">${part[i]}</span>`;
              delayCounter++;
            }
          }
        }
      });
      title.innerHTML = newHTML;
    });

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

    // Setup navigation clicks
    const navLinks = document.querySelectorAll('.nav-link');
    const targetScrolls = [0.0, 0.34, 0.62, 0.94];
    navLinks.forEach((link, index) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const targetY = maxScroll * targetScrolls[index];
        window.scrollTo({ top: targetY, behavior: 'smooth' });
      });
    });

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

      if (slide1) slide1.classList.toggle('active', isActive(scroll, -0.1, 0.12));
      if (slide2) {
        const active2 = isActive(scroll, 0.28, 0.4);
        slide2.classList.toggle('active', active2);
        const slide2Img = document.getElementById('slide-2-img');
        if (slide2Img) slide2Img.classList.toggle('active', active2);
      }
      if (slide3) slide3.classList.toggle('active', isActive(scroll, 0.56, 0.68));
      if (slide4) slide4.classList.toggle('active', isActive(scroll, 0.84, 1.05));
    }

    // --- Main Render Loop ---
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

      // Sparks physics with scroll velocity boost
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

  return (
    <div className="relative w-full bg-[#070305] text-white selection:bg-red-500 selection:text-white" style={{ minHeight: '900vh' }}>
      {/* Custom Global Styles for the 3D Experience */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Italiana&family=Outfit:wght@300;400;600&display=swap');

        body {
          background-color: #070305 !important;
          overflow-x: hidden;
        }

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
          padding: 0 60px 40px 60px;
          box-sizing: border-box;
        }

        .main-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          z-index: 20;
          pointer-events: auto;
          padding: 24px 0;
        }

        .brand {
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 5px;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .header-nav {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .nav-link {
          color: #ffffff;
          text-decoration: none;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 2px;
          font-weight: 600;
          transition: color 0.3s;
        }

        .nav-link:hover {
          color: #f87171;
        }

        .nav-dot {
          width: 3px;
          height: 3px;
          background: rgba(255, 255, 255, 0.25);
          border-radius: 50%;
        }

        .contact-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 24px;
          background: #dc2626;
          color: #ffffff;
          text-decoration: none;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          font-weight: 700;
          border-radius: 9999px;
          transition: transform 0.3s, background 0.3s, box-shadow 0.3s;
          box-shadow: 0 4px 20px rgba(220, 38, 38, 0.4);
        }

        .contact-btn:hover {
          transform: scale(1.05);
          background: #ef4444;
          box-shadow: 0 6px 24px rgba(239, 68, 68, 0.6);
        }

        .slide {
          position: absolute;
          bottom: 12%;
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
          top: 90px;
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
        #slide-2-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scale(1.15);
          transition: transform 1.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        #slide-2-img.active {
          clip-path: inset(0 0 0 0);
          opacity: 1;
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
          width: calc(25vw - 60px);
          max-width: calc(25vw - 60px);
        }
        #slide-3 .slide-title {
          white-space: nowrap;
        }

        #slide-4 {
          left: calc(25% + 40px);
          max-width: 600px;
        }

        .slide-title {
          font-family: 'Italiana', serif;
          font-size: clamp(64px, 8vw, 116px);
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

        .slide-title .char {
          display: inline-block;
          opacity: 0;
          transform: translateY(50px);
          filter: blur(12px);
          transition: opacity 0.8s cubic-bezier(0.25, 1, 0.5, 1),
            transform 0.8s cubic-bezier(0.25, 1, 0.5, 1),
            filter 0.8s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .slide.active .slide-title .char {
          opacity: 1;
          transform: translateY(0);
          filter: blur(0);
        }
        .slide.active {
          pointer-events: auto;
        }

        .grid-horizontal-line {
          position: fixed;
          top: 80px;
          left: 0;
          right: 0;
          width: 100%;
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
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
          background: rgba(255, 255, 255, 0.08);
        }
        .grid-line:nth-child(3) {
          margin-top: 80px;
          height: calc(100vh - 80px);
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
            padding: 0 24px 24px 24px;
          }
          .grid-lines {
            left: 16px;
            right: 16px;
            width: calc(100% - 32px);
          }
          #slide-1 .slide-title {
            margin-left: 20px;
          }
          #slide-1 .col-1 {
            margin-left: 20px;
            width: calc(100vw - 40px);
            max-width: none;
          }
          #slide-1 .col-2 {
            display: none;
          }
          #slide-2-img {
            display: none;
          }
          #slide-2 .slide-title {
            margin-left: 20px;
          }
          #slide-2 .slide-desc {
            margin-left: 20px;
            width: calc(100vw - 40px);
            max-width: none;
          }
          #slide-3 {
            left: 20px;
            width: calc(100vw - 40px);
            max-width: none;
          }
          #slide-4 {
            left: 20px;
            width: calc(100vw - 40px);
            max-width: none;
          }
        }
      `}</style>

      {/* Two-part Interactive Cursor */}
      <div className="cursor-inner" />
      <div className="cursor-outer" />

      {/* Cinematic Editorial Overlays */}
      <div className="cinematic-container">
        {/* Main Header */}
        <header className="main-header">
          <Link href="/" className="brand">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_12px_#ef4444]" />
            <span className="font-black text-white">CITEMAS</span>
            <span className="text-[10px] font-bold tracking-widest text-red-500/90 ml-1 hidden sm:inline">
              GUILD 3D
            </span>
          </Link>

          <nav className="header-nav">
            <a href="#slide-1" className="nav-link">Studio</a>
            <span className="nav-dot" />
            <a href="#slide-2" className="nav-link">Craft</a>
            <span className="nav-dot" />
            <a href="#slide-3" className="nav-link">Energy</a>
            <span className="nav-dot" />
            <a href="#slide-4" className="nav-link">Legacy</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(user ? '/dashboard' : '/login')}
              className="contact-btn cursor-pointer"
            >
              <span>{user ? 'Dashboard' : 'Enter Portal'}</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full border border-white" />
            </button>
          </div>
        </header>

        {/* Slide 1: Studio & Vision */}
        <div className="slide active" id="slide-1">
          <h2 className="slide-title">
            CITEMAS <br />
            Studio
          </h2>
          <div className="desc-row">
            <p className="slide-desc col-1">
              Where vision meets execution. The premier creative and multimedia guild of PHINMA University of Iloilo, uniting digital visionaries and traditional artisans.
            </p>
            <p className="slide-desc col-2">
              Born of creative fire and artistic will, bridging campus innovation and professional media standards. A dynamic ecosystem built for next-generation creators.
            </p>
          </div>
        </div>

        {/* Slide 2: Image Mask + Craft */}
        <div className="slide-image-mask" id="slide-2-img">
          <img src="/orgpic.jpg" alt="CITEMAS Guild Studio" />
        </div>
        <div className="slide" id="slide-2">
          <h2 className="slide-title">
            Craft & <br />
            Discipline
          </h2>
          <p className="slide-desc">
            Six dedicated creative disciplines spanning digital arts, animation, videography, photography, traditional illustration, and voice acting. Hone your voice, perfect your technique.
          </p>
        </div>

        {/* Slide 3: Molten Energy */}
        <div className="slide" id="slide-3">
          <h2 className="slide-title">Molten Energy</h2>
          <p className="slide-desc">
            Dynamic student exhibitions, hands-on production sprints, and cross-departmental creative summits. Experience collaborative projects that define campus culture.
          </p>
        </div>

        {/* Slide 4: Eternal Legacy */}
        <div className="slide" id="slide-4">
          <h2 className="slide-title">
            Eternal <br />
            Legacy
          </h2>
          <p className="slide-desc">
            Showcase your creative portfolio to the world, connect with passionate mentors, and build a lasting body of work. Your creative journey starts here.
          </p>
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

      {/* Canvas Element */}
      <canvas id="webgl-canvas" ref={canvasRef} />
    </div>
  );
}

