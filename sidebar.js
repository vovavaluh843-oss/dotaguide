/** Mounts responsive navigation with injected browser dependencies.
 * @param {{document: Document, runtime: import('./ports.js').RuntimePort}} dependencies
 * @returns {void}
 */
export function mountSidebar({document,runtime}) {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;
  const toggle = sidebar.querySelector('.sidebar-toggle');
  const opener = document.querySelector('.sidebar-open');
  const backdrop = document.querySelector('.sidebar-backdrop');
  const links = [...sidebar.querySelectorAll('.sidebar-link')];
  const mobile = runtime.matchMedia('(max-width:1000px)');
  const storageKey = 'dotaguide-sidebar-collapsed';
  let collapsed = false;
  try { collapsed = runtime.storage.getItem(storageKey) === 'true'; } catch {}
  function renderCollapsed() {
    document.body.classList.toggle('sidebar-collapsed', collapsed);
    toggle.setAttribute('aria-expanded', String(!collapsed));
    toggle.setAttribute('aria-label', collapsed ? 'Развернуть навигацию' : 'Свернуть навигацию');
    toggle.title = toggle.getAttribute('aria-label');
  }
  function drawer(open, restoreFocus = false) {
    open = open && mobile.matches;
    sidebar.classList.toggle('sidebar-mobile-open', open);
    document.body.classList.toggle('sidebar-drawer-open', open);
    opener.setAttribute('aria-expanded', String(open));
    backdrop.hidden = !open;
    sidebar.inert = mobile.matches && !open;
    if (open) sidebar.querySelector('.sidebar-close').focus();
    else if (restoreFocus) opener.focus();
  }
  toggle.addEventListener('click', () => {
    collapsed = !collapsed;
    renderCollapsed();
    try { runtime.storage.setItem(storageKey, String(collapsed)); } catch {}
  });
  opener.addEventListener('click', () => drawer(true));
  sidebar.querySelector('.sidebar-close').addEventListener('click', () => drawer(false, true));
  backdrop.addEventListener('click', () => drawer(false, true));
  sidebar.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    if (mobile.matches) {
      drawer(false);
      const main = document.querySelector('main');
      main.setAttribute('tabindex', '-1');
      main.focus({preventScroll: true});
    }
  }));
  document.addEventListener('keydown', event => {
    if (!sidebar.classList.contains('sidebar-mobile-open')) return;
    if (event.key === 'Escape') { event.preventDefault(); drawer(false, true); }
    if (event.key === 'Tab') {
      const focusable = [...sidebar.querySelectorAll('a,button')].filter(el => el.getClientRects().length);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !sidebar.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !sidebar.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    }
  });
  function markActive(section) {
    links.forEach(link => {
      const active = link.dataset.section === section;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  const guide = runtime.location.pathname.endsWith('/guide.html');
  function hashActive() {
    const hash = runtime.location.hash.slice(1);
    markActive(guide ? (['heroes','shop'].includes(hash) ? hash : 'roles') : (['map','tips'].includes(hash) ? hash : 'basics'));
  }
  hashActive();
  runtime.on('hashchange', hashActive);
  if (!guide) {
    const visible = new Map();
    const observer = runtime.observe(entries => {
      entries.forEach(entry => visible.set(entry.target.id, entry.isIntersecting));
      const section = ['basics','map','tips'].find(id => visible.get(id));
      if (section) markActive(section);
    }, {rootMargin: '-82px 0px -45% 0px', threshold: 0});
    ['basics','map','tips'].forEach(id => observer?.observe(document.getElementById(id)));
  }
  mobile.addEventListener('change', () => drawer(false));
  renderCollapsed();
  drawer(false);
}
