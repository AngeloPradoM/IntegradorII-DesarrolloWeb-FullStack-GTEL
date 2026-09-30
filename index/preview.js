const dialog = document.querySelector('#auth');
const form = document.querySelector('#form');
const password = document.querySelector('#password');
const feedback = document.querySelector('#feedback');
let mode = 'login';
let role = 'candidate';
const departments = ['Amazonas', 'Ancash', 'Apurímac', 'Arequipa', 'Ayacucho', 'Cajamarca', 'Callao', 'Cusco', 'Huancavelica', 'Huánuco', 'Ica', 'Junín', 'La Libertad', 'Lambayeque', 'Lima', 'Loreto', 'Madre de Dios', 'Moquegua', 'Pasco', 'Piura', 'Puno', 'San Martín', 'Tacna', 'Tumbes', 'Ucayali'];
departments.forEach(name => document.querySelector('#ubicacion').add(new Option(name, name)));

function clearErrors() {
  document.querySelectorAll('.field-error').forEach(error => error.remove());
  form.querySelectorAll('[aria-invalid]').forEach(input => {
    input.removeAttribute('aria-invalid');
    input.removeAttribute('aria-describedby');
  });
}

function updateStrength() {
  const value = password.value;
  const score = [value.length >= 8, /[A-Z]/.test(value), /[a-z]/.test(value), /\d/.test(value), /[^A-Za-z0-9]/.test(value)].filter(Boolean).length;
  const label = !value ? 'Sin contraseña' : score <= 1 ? 'Débil' : score <= 2 ? 'Medio' : score <= 3 ? 'Fuerte' : 'Muy fuerte';
  const color = !value ? '#64748b' : score <= 1 ? '#dc2626' : score <= 2 ? '#d97706' : score <= 3 ? '#2563eb' : '#059669';
  document.querySelector('#strength-text').textContent = label;
  document.querySelector('#strength-text').style.color = color;
  document.querySelectorAll('.strength-bars span').forEach((bar, index) => { bar.style.background = index < score ? color : '#e2e8f0'; });
}

function validateRegistration() {
  clearErrors();
  const values = Object.fromEntries(new FormData(form));
  const errors = {};
  const namePattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]{2,}$/;
  if (!namePattern.test(values.nombres.trim())) errors.nombres = 'Ingrese un nombre válido (mínimo 2 caracteres).';
  if (!namePattern.test(values.apellidos.trim())) errors.apellidos = 'Ingrese un apellido válido (mínimo 2 caracteres).';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(values.email)) errors.email = 'El correo electrónico no es válido.';
  if (!/^\d{9}$/.test(values.telefono)) errors.telefono = 'El teléfono debe tener 9 dígitos.';
  if (!departments.includes(values.ubicacion)) errors.ubicacion = 'Seleccione su departamento.';
  if (values.password.length < 8) errors.password = 'La contraseña debe tener al menos 8 caracteres.';
  else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(values.password)) errors.password = 'La contraseña debe incluir mayúsculas, minúsculas, números y símbolos.';
  if (!values.confirmarPassword || values.confirmarPassword !== values.password) errors.confirmarPassword = 'Las contraseñas no coinciden.';
  Object.entries(errors).forEach(([name, message]) => {
    const input = form.elements.namedItem(name);
    const error = document.createElement('span');
    error.className = 'field-error';
    error.id = `${name}-error`;
    error.textContent = message;
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', error.id);
    (input.closest('.input-icon, .phone-row') || input).after(error);
  });
  if (Object.keys(errors).length) form.elements.namedItem(Object.keys(errors)[0]).focus();
  return !Object.keys(errors).length;
}

function render() {
  const registering = mode === 'register';
  dialog.dataset.mode = mode;
  const recruiter = role === 'recruiter';
  document.querySelector('#modal-title').textContent = registering ? 'Crea tu cuenta en GTEL Talento' : 'Bienvenido a GTEL Talento';
  document.querySelector('#subtitle').textContent = registering ? 'Regístrate para comenzar a postular' : 'Inicia sesión para acceder a tu cuenta';
  document.querySelector('#registration').hidden = !registering;
  document.querySelectorAll('#registration input').forEach(input => { input.disabled = !registering; });
  document.querySelectorAll('[data-registration]').forEach(element => {
    element.hidden = !registering;
    element.querySelectorAll('input, select').forEach(input => { input.disabled = !registering; });
  });
  document.querySelector('#forgot').hidden = registering;
  document.querySelector('.remember').hidden = true;
  document.querySelector('.tabs').hidden = true;
  document.querySelector('.notice').hidden = registering;
  form.noValidate = registering;
  clearErrors();
  updateStrength();
  dialog.style.removeProperty('margin');
  dialog.style.removeProperty('left');
  dialog.style.removeProperty('top');
  document.querySelectorAll('[data-role]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.role === role)));
  document.querySelector('.notice').classList.toggle('recruiter', recruiter);
  document.querySelector('#notice-icon').setAttribute('href', recruiter ? '#briefcase' : '#user');
  document.querySelector('#notice-text').textContent = recruiter ? 'Panel ATS completo para gestión de reclutamiento.' : 'Accede a tus postulaciones y el estado de tus procesos.';
  document.querySelector('#email').placeholder = recruiter ? 'reclutador@gtel.com.pe' : 'candidato@correo.com';
  password.autocomplete = registering ? 'new-password' : 'current-password';
  if (registering) password.minLength = 8;
  else password.removeAttribute('minlength');
  document.querySelector('#submit-text').textContent = registering ? 'Crear cuenta' : 'Ingresar';
  document.querySelector('.switch').hidden = recruiter;
  document.querySelector('#switch-text').textContent = registering ? '¿Ya tienes cuenta? ' : '¿Aún no tienes cuenta? ';
  document.querySelector('#switch-mode').textContent = registering ? 'Iniciar sesión' : 'Crear mi cuenta';
  feedback.hidden = true;
}

document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => {
  mode = button.dataset.open;
  role = 'candidate';
  render();
  dialog.showModal();
}));
document.querySelector('.close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  const bounds = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
});
dialog.addEventListener('close', () => {
  form.reset();
  password.type = 'password';
  document.querySelector('#show-password').setAttribute('aria-label', 'Mostrar contraseña');
  document.querySelector('#show-password').setAttribute('aria-pressed', 'false');
  document.querySelector('#confirmarPassword').type = 'password';
  document.querySelector('#show-confirm').setAttribute('aria-label', 'Mostrar confirmación');
  document.querySelector('#show-confirm').setAttribute('aria-pressed', 'false');
  clearErrors();
  updateStrength();
});
document.querySelectorAll('[data-role]').forEach(button => button.addEventListener('click', () => {
  role = button.dataset.role;
  if (role === 'recruiter') mode = 'login';
  render();
}));
document.querySelector('#switch-mode').addEventListener('click', () => {
  mode = mode === 'login' ? 'register' : 'login';
  render();
});
document.querySelector('#show-password').addEventListener('click', event => {
  const show = password.type === 'password';
  password.type = show ? 'text' : 'password';
  event.currentTarget.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
  event.currentTarget.setAttribute('aria-pressed', String(show));
});
document.querySelector('.cancel').addEventListener('click', () => dialog.close());
document.querySelector('#show-confirm').addEventListener('click', event => {
  const input = document.querySelector('#confirmarPassword');
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  event.currentTarget.setAttribute('aria-label', show ? 'Ocultar confirmación' : 'Mostrar confirmación');
  event.currentTarget.setAttribute('aria-pressed', String(show));
});
form.addEventListener('input', event => {
  const input = event.target;
  if (mode === 'register') {
    if (['nombres', 'apellidos'].includes(input.name)) input.value = input.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]/g, '').replace(/\s{2,}/g, ' ');
    if (input.name === 'email') input.value = Array.from(input.value).filter(char => char.charCodeAt(0) > 31 && char.charCodeAt(0) !== 127).join('').replace(/[<>]/g, '').trim().toLowerCase();
    if (input.name === 'telefono') input.value = input.value.replace(/\D/g, '').slice(0, 9);
    feedback.hidden = true;
  }
  if (input === password) updateStrength();
});

const header = document.querySelector('.card-header');
let drag = null;
function positionDialog(left, top) {
  const bounds = dialog.getBoundingClientRect();
  dialog.style.margin = '0';
  dialog.style.left = `${Math.max(16, Math.min(left, window.innerWidth - bounds.width - 16))}px`;
  dialog.style.top = `${Math.max(16, Math.min(top, window.innerHeight - bounds.height - 16))}px`;
}
header.addEventListener('pointerdown', event => {
  if (event.target.closest('button') || event.button !== 0) return;
  const bounds = dialog.getBoundingClientRect();
  drag = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  header.setPointerCapture(event.pointerId);
  header.classList.add('dragging');
});
header.addEventListener('pointermove', event => {
  if (drag) positionDialog(event.clientX - drag.x, event.clientY - drag.y);
});
['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => header.addEventListener(type, () => {
  drag = null;
  header.classList.remove('dragging');
}));
window.addEventListener('resize', () => {
  if (!dialog.open || !dialog.style.left) return;
  const bounds = dialog.getBoundingClientRect();
  positionDialog(bounds.left, bounds.top);
});
document.querySelector('#forgot').addEventListener('click', () => {
  feedback.textContent = 'La recuperación de contraseña no está conectada en esta vista previa.';
  feedback.hidden = false;
});
render();
