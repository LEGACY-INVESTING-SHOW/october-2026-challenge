/* Click-to-play for autoplay=0 Vimeo embeds. Same UX, no player.js on first paint. */
(function () {
  function mount(btn) {
    var src = btn.getAttribute('data-vimeo-src');
    if (!src) return;
    var title = (btn.getAttribute('aria-label') || 'Video').replace(/^Play\s+/i, '');
    var iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.title = title;
    iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
    iframe.setAttribute('allowfullscreen', '');
    iframe.width = btn.getAttribute('data-vimeo-width') || '1280';
    iframe.height = btn.getAttribute('data-vimeo-height') || '720';
    btn.replaceWith(iframe);
  }

  document.addEventListener('click', function (event) {
    var btn = event.target.closest('.vimeo-facade');
    if (!btn) return;
    event.preventDefault();
    mount(btn);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    var btn = event.target.closest('.vimeo-facade');
    if (!btn) return;
    event.preventDefault();
    mount(btn);
  });
})();
