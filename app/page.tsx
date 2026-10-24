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

export default function Home() {
  const { user } = useAuth();
  const isLoggedIn = Boolean(user);
  const router = useRouter();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stackContainerRef = useRef<HTMLDivElement | null>(null);

  // Officers State
  const [officers, setOfficers] = useState<OfficerRecord[]>([]);
  const [officersLoading, setOfficersLoading] = useState(true);
  const [activeOfficerIdx, setActiveOfficerIdx] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);

  // Stack Card Transform Progress [card0, card1, card2, card3]
  const [cardProgress, setCardProgress] = useState<number[]>([0, 0, 0, 0]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // Fetch Officers
  useEffect(() => {
    const controller = new AbortController();
    setOfficersLoading(true);

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

  // Auto-rotate leadership carousel
  useEffect(() => {
    if (!featuredOfficers.length || isCarouselPaused) return;
    const timer = setInterval(() => {
      if (document.hidden) return;
      setActiveOfficerIdx((prev) => (prev + 1) % featuredOfficers.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [featuredOfficers.length, isCarouselPaused]);

  const currentOfficer = featuredOfficers[activeOfficerIdx] || null;

  // --- Scroll Tracking for Sticky Stack ---
  useEffect(() => {
    const onScroll = () => {
      const container = stackContainerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const totalScrollable = rect.height - window.innerHeight;
      if (totalScrollable <= 0) return;

      // Overall progress through the 4 cards (0.0 to 3.0)
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(3, (scrolled / totalScrollable) * 3));

      // Calculate receding progress for each individual card
      // Card 0 recedes between 0 and 1
      const p0 = Math.max(0, Math.min(1, progress - 0));
      // Card 1 recedes between 1 and 2
      const p1 = Math.max(0, Math.min(1, progress - 1));
      // Card 2 recedes between 2 and 3
      const p2 = Math.max(0, Math.min(1, progress - 2));
      const p3 = 0; // Final card doesn't recede

      setCardProgress([p0, p1, p2, p3]);
      setActiveCardIndex(Math.min(3, Math.floor(progress)));
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // --- Three.js WebGL Scene (Backdrop) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId: number;
    const sizes = { width: window.innerWidth, height: window.innerHeight };
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100);
    camera.position.set(0, 0, 4.2);
    scene.add(camera);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    // Ambient & Point Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const redLight = new THREE.PointLight(0xdc2626, 4.5, 12);
    redLight.position.set(3, 2, 2);
    scene.add(redLight);

    const warmLight = new THREE.PointLight(0xf97316, 2.5, 10);
    warmLight.position.set(-3, -1, 1);
    scene.add(warmLight);

    // Procedural CITEMAS 3D Logo Blades
    const logoGroup = new THREE.Group();
    const bladeCount = 7;
    const bladeGeometry = new THREE.TorusGeometry(1.0, 0.18, 16, 32, Math.PI * 0.42);
    const bladeMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b0000,
      metalness: 0.85,
      roughness: 0.22,
      emissive: 0x3d0000,
      emissiveIntensity: 0.4,
    });

    for (let i = 0; i < bladeCount; i++) {
      const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
      const angle = (i / bladeCount) * Math.PI * 2;
      blade.rotation.z = angle;
      blade.rotation.x = 0.35;
      blade.scale.setScalar(0.7 + i * 0.05);
      logoGroup.add(blade);
    }

    const coreMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 32, 32),
      new THREE.MeshStandardMaterial({
        color: 0xdc2626,
        metalness: 0.9,
        roughness: 0.15,
        emissive: 0xff1100,
        emissiveIntensity: 0.8,
      })
    );
    logoGroup.add(coreMesh);

    const modelPivot = new THREE.Group();
    modelPivot.add(logoGroup);
    scene.add(modelPivot);

    // Background Wave Shader
    const shaderUniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(sizes.width, sizes.height) },
      uScroll: { value: 0 },
    };

    const bgMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec2 uResolution;
          uniform float uScroll;
          varying vec2 vUv;

          void main() {
            vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
            float t = uTime * 0.15 + uScroll * 1.5;
            float dist = length(uv);
            float waves = sin(dist * 6.0 - t) * 0.5 + 0.5;
            
            vec3 darkRed = vec3(0.08, 0.015, 0.02);
            vec3 brightGlow = vec3(0.45, 0.05, 0.08);
            vec3 bg = mix(darkRed, brightGlow, waves * smoothstep(1.2, 0.0, dist));
            
            gl_FragColor = vec4(bg * 0.45, 1.0);
          }
        `,
        uniforms: shaderUniforms,
        depthWrite: false,
      })
    );
    const bgCamera = new THREE.Camera();
    const bgScene = new THREE.Scene();
    bgScene.add(bgMesh);

    let scrollVal = 0;
    const clock = new THREE.Clock();

    const tick = () => {
      animId = requestAnimationFrame(tick);
      const elapsedTime = clock.getElapsedTime();

      // Read scroll from container
      const container = stackContainerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        const target = total > 0 ? Math.max(0, Math.min(1, -rect.top / total)) : 0;
        scrollVal += (target - scrollVal) * 0.05;
      }

      shaderUniforms.uTime.value = elapsedTime;
      shaderUniforms.uScroll.value = scrollVal;

      // Orbit CITEMAS Emblem
      logoGroup.rotation.z = elapsedTime * 0.15 + scrollVal * Math.PI;
      logoGroup.rotation.y = Math.sin(elapsedTime * 0.25) * 0.3 + scrollVal * Math.PI * 1.5;
      modelPivot.position.y = Math.sin(scrollVal * Math.PI) * 0.3;

      renderer.autoClear = false;
      renderer.clear();
      renderer.render(bgScene, bgCamera);
      renderer.render(scene, camera);
    };

    tick();

    const handleResize = () => {
      sizes.width = window.innerWidth;
      sizes.height = window.innerHeight;
      camera.aspect = sizes.width / sizes.height;
      camera.updateProjectionMatrix();
      renderer.setSize(sizes.width, sizes.height);
      shaderUniforms.uResolution.value.set(sizes.width, sizes.height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative bg-[#070305] text-[#FDFBF7]">
      {/* Three.js Fixed Background Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0 h-screen w-screen"
      />

      {/* Grid Reticle Accents */}
      <div className="fixed inset-0 pointer-events-none z-10 bg-grid-faint opacity-40" />

      {/* Progress Indicators (Kimi / Refero Style) */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col gap-3">
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className={`w-1 transition-all duration-300 rounded-full ${
              activeCardIndex === idx
                ? 'h-8 bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]'
                : 'h-2 bg-white/20'
            }`}
          />
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════
          STICKY STACK WRAPPER (400vh total height for 4 cards)
          ═══════════════════════════════════════════════════ */}
      <div ref={stackContainerRef} className="relative z-20 h-[400vh]">
        
        {/* ── CARD 1: CITEMAS STUDIO & VISION ── */}
        <section className="sticky top-0 h-screen w-full flex items-center justify-center p-6 md:p-12 overflow-hidden">
          <div
            className="w-full max-w-7xl h-[86vh] rounded-3xl p-8 md:p-14 relative flex flex-col justify-between overflow-hidden transition-transform duration-75 border border-white/[0.08] backdrop-blur-md bg-black/40"
            style={{
              transform: `scale(${1 - cardProgress[0] * 0.08})`,
              filter: `brightness(${1 - cardProgress[0] * 0.45})`,
            }}
          >
            {/* Top Telemetry Header */}
            <div className="flex items-center justify-between text-[11px] font-mono tracking-widest text-slate-400 uppercase">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                <span>GUILD // 01 [VISION]</span>
              </span>
              <span>10°42&apos;N 122°34&apos;E • ILOILO</span>
            </div>

            {/* Massive Editorial Headline */}
            <div className="my-auto max-w-3xl space-y-6">
              <span className="text-xs uppercase tracking-[0.3em] font-bold text-red-500">
                PHINMA University of Iloilo
              </span>
              <h1 className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase tracking-[-0.04em] leading-[0.88] text-white">
                CITEMAS<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-white">
                  STUDIO.
                </span>
              </h1>
              <p className="font-sans text-sm sm:text-base md:text-lg text-slate-300 max-w-xl leading-relaxed">
                Where vision meets execution. The premier creative and multimedia guild uniting digital visionaries, 3D sculptors, and traditional artisans.
              </p>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-white/[0.06]">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="px-8 py-3.5 rounded-full bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold text-xs uppercase tracking-widest hover:brightness-110 shadow-lg shadow-red-600/30 transition-all cursor-pointer"
                >
                  Enter Studio Dashboard &rarr;
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="px-8 py-3.5 rounded-full bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold text-xs uppercase tracking-widest hover:brightness-110 shadow-lg shadow-red-600/30 transition-all cursor-pointer"
                  >
                    Join Guild
                  </Link>
                  <Link
                    href="/login"
                    className="px-7 py-3.5 rounded-full border border-white/20 bg-white/5 text-white font-semibold text-xs uppercase tracking-widest hover:bg-white/10 transition-all cursor-pointer"
                  >
                    Member Sign In
                  </Link>
                </>
              )}
              <span className="ml-auto text-xs font-mono text-slate-500 hidden sm:inline">
                SCROLL TO EXPLORE ↓
              </span>
            </div>
          </div>
        </section>

        {/* ── CARD 2: CRAFT & DISCIPLINES ── */}
        <section className="sticky top-0 h-screen w-full flex items-center justify-center p-6 md:p-12 overflow-hidden">
          <div
            className="w-full max-w-7xl h-[86vh] rounded-3xl p-8 md:p-14 relative flex flex-col justify-between overflow-hidden transition-transform duration-75 border border-white/[0.08] backdrop-blur-2xl bg-[#090a0b]/90 shadow-2xl"
            style={{
              transform: `scale(${1 - cardProgress[1] * 0.08})`,
              filter: `brightness(${1 - cardProgress[1] * 0.45})`,
            }}
          >
            {/* Header Telemetry */}
            <div className="flex items-center justify-between text-[11px] font-mono tracking-widest text-slate-400 uppercase">
              <span>GUILD // 02 [SPECIALIZATIONS]</span>
              <span>SIX CREATIVE TRACKS</span>
            </div>

            {/* Content Body */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto items-center">
              <div className="lg:col-span-6 space-y-5">
                <span className="text-xs uppercase tracking-[0.3em] font-bold text-red-500">
                  Disciplines of Excellence
                </span>
                <h2 className="font-display text-5xl sm:text-6xl md:text-7xl font-black uppercase tracking-[-0.03em] leading-[0.9] text-white">
                  Craft &amp;<br />Discipline.
                </h2>
                <p className="font-sans text-sm md:text-base text-slate-300 leading-relaxed max-w-md">
                  From procedural 3D environments to classical studio painting, our guild spans six specialized disciplines designed to foster professional standards.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  {[
                    { num: '01', name: 'Digital Arts' },
                    { num: '02', name: '3D Animation' },
                    { num: '03', name: 'Videography' },
                    { num: '04', name: 'Photography' },
                    { num: '05', name: 'Voice Acting' },
                    { num: '06', name: 'Traditional Arts' },
                  ].map((track) => (
                    <div
                      key={track.num}
                      className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3 hover:border-red-500/40 transition-colors"
                    >
                      <span className="font-mono text-xs text-red-400 font-bold">{track.num}</span>
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">{track.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Photo Showcase Frame */}
              <div className="lg:col-span-6 relative h-64 lg:h-96 rounded-2xl overflow-hidden border border-white/15 shadow-2xl">
                <img
                  src="/orgpic.jpg"
                  alt="CITEMAS Guild Creators"
                  className="w-full h-full object-cover filter grayscale contrast-125 hover:grayscale-0 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs font-mono text-slate-300">
                  <span>STUDIO PRODUCTION COHORT</span>
                  <span>ACTIVE GUILD ROSTER</span>
                </div>
              </div>
            </div>

            <div className="text-xs font-mono text-slate-500 pt-4 border-t border-white/[0.06]">
              INTERACTION: HOVER DISCIPLINES TO INSPECT CURRICULUM
            </div>
          </div>
        </section>

        {/* ── CARD 3: MOLTEN ENERGY & INSTRUMENTS ── */}
        <section className="sticky top-0 h-screen w-full flex items-center justify-center p-6 md:p-12 overflow-hidden">
          <div
            className="w-full max-w-7xl h-[86vh] rounded-3xl p-8 md:p-14 relative flex flex-col justify-between overflow-hidden transition-transform duration-75 border border-white/[0.08] backdrop-blur-2xl bg-[#090a0b]/95 shadow-2xl"
            style={{
              transform: `scale(${1 - cardProgress[2] * 0.08})`,
              filter: `brightness(${1 - cardProgress[2] * 0.45})`,
            }}
          >
            {/* Header Telemetry */}
            <div className="flex items-center justify-between text-[11px] font-mono tracking-widest text-slate-400 uppercase">
              <span>GUILD // 03 [TELEMETRY]</span>
              <span>CAMPUS IMPACT METRICS</span>
            </div>

            {/* Grid Content */}
            <div className="my-auto space-y-8">
              <div className="max-w-2xl space-y-3">
                <span className="text-xs uppercase tracking-[0.3em] font-bold text-red-500">
                  Impact &amp; Production
                </span>
                <h2 className="font-display text-5xl sm:text-6xl md:text-7xl font-black uppercase tracking-[-0.03em] leading-[0.9] text-white">
                  Molten Energy.
                </h2>
                <p className="font-sans text-sm md:text-base text-slate-300 leading-relaxed">
                  Dynamic student exhibitions, hands-on production sprints, and cross-departmental creative summits shaping the creative identity of PHINMA University of Iloilo.
                </p>
              </div>

              {/* Instrument Panel Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { value: '50+', label: 'Active Creators', desc: 'Tech & digital visionaries' },
                  { value: '10+', label: 'Guild Exhibits', desc: 'Showcases and sprints' },
                  { value: '50+', label: 'Projects Built', desc: 'Brand and digital media' },
                  { value: '05+', label: 'Years Legacy', desc: 'Continuous student innovation' },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-red-500/30 transition-all space-y-2 relative"
                  >
                    <div className="font-display text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400">
                      {stat.value}
                    </div>
                    <div className="text-xs font-bold uppercase tracking-wider text-white">
                      {stat.label}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {stat.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-xs font-mono text-slate-500 pt-4 border-t border-white/[0.06]">
              STATUS: REALTIME GUILD REPOSITORY SYNCHRONIZED
            </div>
          </div>
        </section>

        {/* ── CARD 4: EXECUTIVE LEADERSHIP & HUB ── */}
        <section className="sticky top-0 h-screen w-full flex items-center justify-center p-6 md:p-12 overflow-hidden">
          <div
            className="w-full max-w-7xl h-[86vh] rounded-3xl p-8 md:p-14 relative flex flex-col justify-between overflow-hidden border border-white/[0.08] backdrop-blur-2xl bg-[#090a0b] shadow-2xl"
          >
            {/* Header Telemetry */}
            <div className="flex items-center justify-between text-[11px] font-mono tracking-widest text-slate-400 uppercase">
              <span>GUILD // 04 [LEADERSHIP]</span>
              <span>EXECUTIVE COUNCIL</span>
            </div>

            {/* Leadership Showcase */}
            <div className="my-auto space-y-6">
              <div className="max-w-2xl space-y-2">
                <span className="text-xs uppercase tracking-[0.3em] font-bold text-red-500">
                  Executive Roster
                </span>
                <h2 className="font-display text-5xl sm:text-6xl md:text-7xl font-black uppercase tracking-[-0.03em] leading-[0.9] text-white">
                  Leadership.
                </h2>
                <p className="font-sans text-sm md:text-base text-slate-300">
                  Meet the student directors guiding creative strategy, productions, and guild operations.
                </p>
              </div>

              {/* Dynamic Officer Spotlight Card */}
              {officersLoading ? (
                <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/10 text-center text-xs text-slate-400">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-500/30 border-t-red-500 mx-auto mb-2" />
                  Loading Council Directory...
                </div>
              ) : currentOfficer ? (
                <div
                  onMouseEnter={() => setIsCarouselPaused(true)}
                  onMouseLeave={() => setIsCarouselPaused(false)}
                  className="p-6 rounded-3xl bg-white/[0.03] border border-white/15 flex flex-col md:flex-row items-center gap-6 shadow-2xl"
                >
                  <div className="relative h-28 w-28 md:h-32 md:w-32 rounded-2xl overflow-hidden shrink-0 border border-white/20">
                    <img
                      src={currentOfficer.image}
                      alt={currentOfficer.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = currentOfficer.fallbackImage;
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 text-center md:text-left space-y-2">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                      <span className="px-3 py-1 rounded-full bg-red-600/20 border border-red-500/30 text-red-300 text-[11px] font-bold uppercase tracking-wider">
                        {currentOfficer.role}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {currentOfficer.yearLevel}
                      </span>
                    </div>
                    <h3 className="font-display text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                      {currentOfficer.name}
                    </h3>
                    <p className="text-xs md:text-sm text-slate-300 line-clamp-2 max-w-2xl leading-relaxed">
                      {currentOfficer.bio}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() =>
                        setActiveOfficerIdx((prev) =>
                          prev === 0 ? featuredOfficers.length - 1 : prev - 1
                        )
                      }
                      className="p-3 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs text-slate-200 transition cursor-pointer"
                      aria-label="Previous officer"
                    >
                      &larr;
                    </button>
                    <button
                      onClick={() =>
                        setActiveOfficerIdx((prev) => (prev + 1) % featuredOfficers.length)
                      }
                      className="p-3 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs text-slate-200 transition cursor-pointer"
                      aria-label="Next officer"
                    >
                      &rarr;
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Council Avatars Tray */}
              {featuredOfficers.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mr-2">
                    COUNCIL:
                  </span>
                  {featuredOfficers.map((person, idx) => (
                    <button
                      key={person.id}
                      onClick={() => setActiveOfficerIdx(idx)}
                      className={`relative h-10 w-10 rounded-xl overflow-hidden border transition-all cursor-pointer ${
                        activeOfficerIdx === idx
                          ? 'border-red-500 scale-105 shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                          : 'border-white/20 opacity-60 hover:opacity-100'
                      }`}
                      title={person.name}
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

            {/* Quick Navigation CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-white/[0.06]">
              <Link
                href="/portfolio"
                className="px-6 py-3 rounded-full bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold text-xs uppercase tracking-widest hover:brightness-110 shadow-lg shadow-red-600/30 transition-all cursor-pointer"
              >
                View Guild Portfolios &rarr;
              </Link>
              <Link
                href="/events"
                className="px-6 py-3 rounded-full border border-white/20 bg-white/5 text-slate-200 font-semibold text-xs uppercase tracking-widest hover:bg-white/10 transition-all cursor-pointer"
              >
                Upcoming Events
              </Link>
              <span className="ml-auto text-xs font-mono text-slate-500">
                END OF STACK // SCROLL FOR FOOTER ↓
              </span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
