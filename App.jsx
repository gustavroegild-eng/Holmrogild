import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * Hero title with letter animation + glow
 */
const HeroTitle = ({ animate }) => {
  const titleRef = useRef(null);
  const glowRef = useRef(null);
  const builtRef = useRef(false);

  useEffect(() => {
    if (!animate || builtRef.current) return;
    builtRef.current = true;

    const titleEl = titleRef.current;
    const glowEl = glowRef.current;
    const text = 'HOLM & RØGILD';

    text.split('').forEach(char => {
      const span = document.createElement('span');
      span.className = 'letter';
      if (char === '&') {
        span.classList.add('amp');
        span.innerHTML = '&amp;';
      } else if (char === ' ') {
        span.style.whiteSpace = 'pre';
        span.textContent = ' ';
      } else {
        span.textContent = char;
      }
      titleEl.insertBefore(span, glowEl);
    });

    const dotSpan = document.createElement('span');
    dotSpan.className = 'letter dot';
    dotSpan.textContent = '.';
    titleEl.insertBefore(dotSpan, glowEl);

    gsap.to(titleEl.querySelectorAll('.letter'), {
      opacity: 1, y: 0, duration: 0.7, stagger: 0.035, ease: 'power3.out', delay: 0.3
    });
    gsap.to('#hero-subtitle', { opacity: 1, y: 0, duration: 0.9, delay: 0.9, ease: 'power3.out' });
    gsap.to('#founders', { opacity: 1, y: 0, duration: 0.8, delay: 1.2, ease: 'power3.out' });

    const timer = setTimeout(() => glowEl.classList.add('active'), 1800);
    return () => clearTimeout(timer);
  }, [animate]);

  // Glow animation loop
  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;
    const t0 = performance.now();
    let rafId;
    function loop() {
      const t = (performance.now() - t0) / 1000;
      glow.style.setProperty('--gx1', (50 + Math.sin(t * 0.25) * 42 + Math.sin(t * 0.13) * 12).toFixed(1) + '%');
      glow.style.setProperty('--gy1', (50 + Math.cos(t * 0.19) * 30).toFixed(1) + '%');
      glow.style.setProperty('--gx2', (50 + Math.sin(t * 0.37) * 38 + Math.cos(t * 0.21) * 8).toFixed(1) + '%');
      glow.style.setProperty('--gy2', (50 + Math.sin(t * 0.29) * Math.cos(t * 0.17) * 45).toFixed(1) + '%');
      glow.style.setProperty('--gx3', (50 + Math.cos(t * 0.15 + 1.0) * 48).toFixed(1) + '%');
      glow.style.setProperty('--gy3', (50 + Math.sin(t * 0.22 + 2.0) * 35).toFixed(1) + '%');
      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <h1 className="hero-title" id="hero-title" ref={titleRef}>
      <div className="hero-glow" id="hero-glow" ref={glowRef} aria-hidden="true" />
    </h1>
  );
};

/**
 * WebGL shader gradient background
 */
const ShaderBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false });
    if (!gl) return;

    const vertSrc = `attribute vec2 a_position; void main() { gl_Position = vec4(a_position, 0.0, 1.0); }`;
    const fragSrc = `
      precision mediump float;
      uniform vec2 u_resolution;
      uniform float u_time;

      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m; m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g;
        g.x = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        float angle = 0.87;
        vec2 center = vec2(0.5);
        vec2 ruv = uv - center;
        ruv = vec2(ruv.x * cos(angle) - ruv.y * sin(angle), ruv.x * sin(angle) + ruv.y * cos(angle));
        ruv += center;

        float t = u_time * 0.18;
        float n1 = snoise(ruv * 0.8 + vec2(t * 0.3, t * 0.15));
        float n2 = snoise(ruv * 1.6 + vec2(-t * 0.2, t * 0.25));
        float n3 = snoise(ruv * 2.8 + vec2(t * 0.1, -t * 0.3));
        float noise = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;

        float displacement = noise * 3.0;
        float wave = sin(ruv.x * 5.0 + displacement + t) * 0.5 + 0.5;

        vec3 col1 = vec3(0.07, 0.07, 0.10);
        vec3 col2 = vec3(0.15, 0.32, 0.62);
        vec3 col3 = vec3(0.08, 0.20, 0.48);

        float blend = wave * (0.5 + 0.5 * noise);
        blend = smoothstep(0.20, 0.75, blend);
        vec3 color = mix(col1, mix(col2, col3, noise * 0.5 + 0.5), blend * 0.50);
        color *= 1.0;

        float grain = (fract(sin(dot(uv * u_time, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.015;
        color += grain;

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vertSrc));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fragSrc));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    const uTime = gl.getUniformLocation(prog, 'u_time');

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    resize();
    window.addEventListener('resize', resize);

    const startTime = performance.now();
    let rafId;
    function render() {
      const t = (performance.now() - startTime) / 1000;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafId = requestAnimationFrame(render);
    }
    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="shader-bg" aria-hidden="true">
      <canvas ref={canvasRef} id="gradient-canvas" />
      <div className="noise-overlay" />
    </div>
  );
};

/**
 * Main App
 */
export default function App() {
  return (
    <>
      <ShaderBackground />

      <div className="page">
        <HeroTitle animate={true} />
        <p className="hero-subtitle" id="hero-subtitle">
          Next-gen<br />Legal Tech
        </p>
        <div className="founders" id="founders">
          <a className="founder-link" href="https://www.linkedin.com/in/frederik-holm-rasmussen/" target="_blank" rel="noopener noreferrer">Frederik Holm</a>
          <a className="founder-link" href="https://www.linkedin.com/in/gustav-røgild/" target="_blank" rel="noopener noreferrer">Gustav Røgild</a>
        </div>
      </div>

      <footer className="site-footer">
        <div className="footer-products">
          <a className="footer-product" href="https://futaki.dk" target="_blank" rel="noopener noreferrer">
            <span className="pname">Futaki</span>: Lucid corporate data overview
          </a>
          <a className="footer-product" href="https://meystro.dk" target="_blank" rel="noopener noreferrer">
            <span className="pname">Tjekdinhusleje.dk</span>: Tenancy law made accessible
          </a>
          <a className="footer-product" href="https://arbitr.dk" target="_blank" rel="noopener noreferrer">
            <span className="pname">ArbitR</span>: Predicting litigation outcomes
          </a>
        </div>
        <span className="footer-copy">&copy; 2026 Holm &amp; Røgild</span>
      </footer>
    </>
  );
}

