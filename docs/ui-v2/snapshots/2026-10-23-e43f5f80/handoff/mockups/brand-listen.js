// Pro Consult — animated "listening" mark. window.PCListen (React).
// Props: size (px), color ('#0F2D52' navy | '#FFFFFF' white), ring, rings=3, dur=3.2 (s), once=false, breath=true
(function () {
  if (!document.getElementById('pc-listen-kf')) {
    const st = document.createElement('style');
    st.id = 'pc-listen-kf';
    st.textContent = '@keyframes pcRing{0%{transform:scale(1.04);opacity:.55}100%{transform:scale(1.9);opacity:0}}@keyframes pcBreath{0%,100%{transform:scale(1)}50%{transform:scale(1.035)}}@media (prefers-reduced-motion:reduce){.pc-listen *{animation:none!important}}';
    document.head.appendChild(st);
  }
  const h = React.createElement;
  // rings keep the logo's opening at the bottom
  const GAP = 'conic-gradient(#000 0 156deg, transparent 156deg 198deg, #000 198deg)';
  function PCListen({ size = 120, color = '#0F2D52', ring = '#F7B77E', rings = 3, dur = 3.2, once = false, breath = true }) {
    const rs = Array.from({ length: rings }, (_, i) => h('span', { key: i, style: {
      position: 'absolute', inset: 0, borderRadius: '50%', border: '1.5px solid ' + ring, WebkitMask: GAP, mask: GAP,
      animation: 'pcRing ' + dur + 's cubic-bezier(.2,.6,.3,1) ' + (i * dur / rings) + 's ' + (once ? '1 both' : 'infinite'),
    } }));
    return h('span', { className: 'pc-listen', role: 'img', 'aria-label': 'Pro Consult', style: { position: 'relative', width: size, height: size, display: 'inline-block', flexShrink: 0 } },
      ...rs,
      h('img', { src: 'public/brand/mark-' + (color === '#FFFFFF' || color === 'white' ? 'white' : 'navy') + '.png', alt: '', style: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', animation: breath ? 'pcBreath 3.2s ease-in-out infinite' : 'none' } }));
  }
  window.PCListen = PCListen;
})();
