// Small interactive behaviors: typing effect, nav toggle, tilt cards, animated canvas

document.addEventListener('DOMContentLoaded',()=>{
  // year
  document.getElementById('year').textContent = new Date().getFullYear();

  // Nav toggle
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');
  const links = document.querySelector('.nav-links');
  toggle.addEventListener('click', ()=>{
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    links.style.display = expanded ? '' : 'flex';
  });

  // Enhanced typing effect with smoother timing and pause control
  const typedEl = document.querySelector('.typed');
  const words = ['accelerate.', 'automate.', 'augment.'];
  let wordIndex = 0, charIndex = 0, direction = 1; // 1 = forward, -1 = back
  let typingDelay = 80, pauseDelay = 900;
  let typingTimer = null;
  function startTyping(){
    const current = words[wordIndex];
    charIndex += direction;
    typedEl.textContent = current.slice(0, Math.max(0, charIndex));
    if(direction === 1 && charIndex >= current.length){
      // pause at full
      direction = -1;
      typingTimer = setTimeout(startTyping, pauseDelay);
      return;
    }
    if(direction === -1 && charIndex <= 0){
      direction = 1;
      wordIndex = (wordIndex + 1) % words.length;
      typingTimer = setTimeout(startTyping, 240);
      return;
    }
    typingTimer = setTimeout(startTyping, direction === 1 ? typingDelay : typingDelay * 0.6);
  }
  // start after small intro
  setTimeout(startTyping, 300);

  // Smooth tilt using rAF and smoothing for better performance
  document.querySelectorAll('[data-tilt]').forEach(card=>{
    let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0, rafId = null;
    const rect = ()=>card.getBoundingClientRect();
    function update(){
      targetX += (mouseX - targetX) * 0.12;
      targetY += (mouseY - targetY) * 0.12;
      const rx = (-targetY) * 8; // rotateX
      const ry = (targetX) * 12; // rotateY
      const tz = 8 + Math.abs(targetX+targetY)*4;
      card.style.transform = `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(${tz}px)`;
      rafId = requestAnimationFrame(update);
    }
    card.addEventListener('mousemove', e =>{
      const r = rect();
      mouseX = ((e.clientX - r.left)/r.width - 0.5);
      mouseY = ((e.clientY - r.top)/r.height - 0.5);
      if(!rafId) update();
    });
    card.addEventListener('mouseleave', ()=>{
      mouseX = 0; mouseY = 0;
      // gracefully stop after easing back
      setTimeout(()=>{ if(rafId){ cancelAnimationFrame(rafId); rafId = null; } card.style.transform=''; }, 350);
    });
  });

  // Reveal on scroll using 'reveal' class for better control
  const revealItems = document.querySelectorAll('.feature, .member, .card');
  const obs = new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){ entry.target.classList.add('visible'); obs.unobserve(entry.target); }
    });
  },{threshold:0.15});
  revealItems.forEach(i=>{ i.classList.add('reveal'); obs.observe(i); });

  // Animated canvas background (floating blobs) with pointer interaction
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;
  function resizeCanvas(){
    // use client dimensions for high-DPI friendly drawing
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  // debounce resize
  let resizeTimer = null;
  function scheduleResize(){ clearTimeout(resizeTimer); resizeTimer = setTimeout(resizeCanvas, 80); }
  resizeCanvas(); window.addEventListener('resize', scheduleResize);

  const blobs = [];
  const palette = [ [124,92,255], [0,224,184], [28,145,255] ];
  for(let i=0;i<8;i++){
    blobs.push({x:Math.random()*W||100,y:Math.random()*H||100,r:60+Math.random()*180,ax:(Math.random()*0.6-0.3),ay:(Math.random()*0.6-0.3),phase:Math.random()*Math.PI*2, color: palette[i%palette.length], vx:0, vy:0});
  }
  // pointer state
  const pointer = {x:-9999,y:-9999,active:false};
  canvas.addEventListener('mousemove', e =>{
    const r = canvas.getBoundingClientRect();
    pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; pointer.active = true;
  });
  canvas.addEventListener('mouseleave', ()=>{ pointer.active = false; pointer.x = -9999; pointer.y = -9999; });

  function drawBlobs(){
    ctx.clearRect(0,0,W,H);
    const sc = window.scrollY / Math.max(1,document.body.scrollHeight - window.innerHeight);
    blobs.forEach((b,i)=>{
      // gentle velocity integration
      b.vx += Math.sin(b.phase*0.7 + i)*0.02 + b.ax*0.02;
      b.vy += Math.cos(b.phase*0.9 + i)*0.01 + b.ay*0.02;
      // pointer interaction: repel when close, attract mildly when active and medium distance
      if(pointer.active){
        const dx = b.x - pointer.x; const dy = b.y - pointer.y; const d2 = dx*dx + dy*dy; const d = Math.sqrt(d2)||1;
        if(d < 220){
          const strength = (220 - d)/220;
          b.vx += (dx/d) * 1.8 * strength;
          b.vy += (dy/d) * 1.8 * strength;
        } else if(d < 420){
          const strength = (d - 220)/200;
          b.vx -= (dx/d) * 0.06 * strength;
          b.vy -= (dy/d) * 0.06 * strength;
        }
      }
      // apply velocity
      b.x += b.vx; b.y += b.vy;
      // damping
      b.vx *= 0.96; b.vy *= 0.96;
      b.phase += 0.006 + (i%4)*0.0008;

      const [r,g,bb] = b.color;
      const grd = ctx.createRadialGradient(b.x,b.y,b.r*0.08,b.x,b.y,b.r);
      const o = 0.14 - Math.abs(0.5 - sc)*0.06;
      grd.addColorStop(0, `rgba(${r},${g},${bb},${Math.max(0, o)})`);
      grd.addColorStop(0.5, `rgba(${Math.floor(r*0.6)},${Math.floor(g*0.6)},${Math.floor(bb*0.6)},${Math.max(0, o*0.5)})`);
      grd.addColorStop(1, `rgba(4,8,20,0)`);
      ctx.fillStyle = grd;
      ctx.beginPath();
      const wob = 1 + Math.sin(b.phase*0.6)*0.12;
      ctx.ellipse(b.x + Math.sin(b.phase)*30*sc, b.y + Math.cos(b.phase)*24*(1-sc), b.r*wob, b.r*0.6*wob, Math.sin(b.phase)*0.6,0,Math.PI*2);
      ctx.fill();

      // wrap softly
      if(b.x < -360) b.x = W + 360;
      if(b.x > W + 360) b.x = -360;
      if(b.y < -360) b.y = H + 360;
      if(b.y > H + 360) b.y = -360;
    });
    requestAnimationFrame(drawBlobs);
  }
  drawBlobs();

  // hero parallax on scroll and mouse for depth
  const hero = document.querySelector('.hero');
  const heroInner = document.querySelector('.hero-inner');
  function onScroll(){
    const rect = hero.getBoundingClientRect();
    const pct = 1 - Math.max(0, Math.min(1, rect.top / window.innerHeight));
    hero.style.transform = `translateY(${pct*10}px)`;
  }
  window.addEventListener('scroll', onScroll);
  // mouse parallax on hero for larger screens
  if(window.matchMedia('(hover:hover) and (pointer:fine)').matches){
    hero.addEventListener('mousemove', e=>{
      const r = hero.getBoundingClientRect();
      const mx = (e.clientX - r.left)/r.width - 0.5;
      const my = (e.clientY - r.top)/r.height - 0.5;
      heroInner.style.transform = `translateX(${mx*10}px) translateY(${my*6}px) rotateX(${ -my*2 }deg) rotateY(${ mx*2 }deg)`;
    });
    hero.addEventListener('mouseleave', ()=>{ heroInner.style.transform = ''; });
  }

  // staggered entrance for elements that already have 'reveal' class
  const staggered = [...document.querySelectorAll('.reveal')];
  staggered.forEach((el,i)=>{ el.style.transition = `opacity .8s ease ${i*60}ms, transform .6s cubic-bezier(.2,.9,.2,1) ${i*60}ms`; });

  // animated brand logo subtle rotation (hook if logo has class)
  const logo = document.querySelector('.logo');
  if(logo){
    setInterval(()=>{logo.style.transform = `rotate(${Math.sin(Date.now()/2000)*6}deg) scale(${1+Math.sin(Date.now()/3000)*0.008})`},80);
  }

  // button ripple effect
  document.querySelectorAll('.btn').forEach(btn=>{
    btn.addEventListener('pointerdown', e=>{
      // ignore right-clicks
      if(e.button && e.button !== 0) return;
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const size = Math.max(rect.width, rect.height) * 1.6;
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size/2) + 'px';
      btn.appendChild(ripple);
      // animate
      requestAnimationFrame(()=>{ ripple.style.transform = 'scale(1)'; ripple.style.opacity = '0.0'; ripple.style.transition = 'transform .6s cubic-bezier(.2,.9,.2,1), opacity .7s'; });
      setTimeout(()=>{ ripple.remove(); }, 800);
    });
  });

  // occasional headline glow to draw attention (subtle)
  const headline = document.querySelector('.headline');
  if(headline){
    setInterval(()=>{ headline.classList.add('glow'); setTimeout(()=>headline.classList.remove('glow'), 900); }, 4200 + Math.floor(Math.random()*2200));
  }

});
