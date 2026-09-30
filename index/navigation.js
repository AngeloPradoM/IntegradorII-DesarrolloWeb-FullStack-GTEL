const navigationToggle = document.querySelector('.nav-toggle');
const proposalLinks = document.querySelector('#proposal-links');
const proposalHeader = document.querySelector('.proposal-nav');
function closeNavigation() {
  navigationToggle.setAttribute('aria-expanded', 'false');
  proposalLinks.classList.remove('is-open');
  proposalHeader.classList.remove('is-menu-open');
  navigationToggle.textContent = 'Menú ☰';
}
navigationToggle.addEventListener('click', () => {
  const expanded = navigationToggle.getAttribute('aria-expanded') !== 'true';
  navigationToggle.setAttribute('aria-expanded', String(expanded));
  proposalLinks.classList.toggle('is-open', expanded);
  proposalHeader.classList.toggle('is-menu-open', expanded);
  navigationToggle.textContent = expanded ? 'Cerrar ×' : 'Menú ☰';
});
proposalHeader.addEventListener('click', event => {
  if (event.target.closest('a, [data-open]')) closeNavigation();
});
window.matchMedia('(max-width: 1359px)').addEventListener('change', closeNavigation);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navigationToggle.getAttribute('aria-expanded') === 'true') {
    closeNavigation();
    navigationToggle.focus();
  }
});
