const editor = document.querySelector('#editor');
const status = document.querySelector('#save-status');
const photoError = document.querySelector('#photo-error');
const fileInput = document.querySelector('#photo-file');
const regions = ['Amazonas','Ancash','Apurímac','Arequipa','Ayacucho','Cajamarca','Callao','Cusco','Huancavelica','Huánuco','Ica','Junín','La Libertad','Lambayeque','Lima','Loreto','Madre de Dios','Moquegua','Pasco','Piura','Puno','San Martín','Tacna','Tumbes','Ucayali'];
regions.forEach(region => editor.elements.ubicacion.add(new Option(region, region)));
let saved = window.previewProfile.read() || { nombres:'', apellidos:'', email:'', telefono:'', ubicacion:'', correoContacto:'', localidad:'', foto:'' };
let photo = saved.foto || '';
let dirty = false;
let photoVersion = 0;
function paint() {
  const name = `${editor.elements.nombres.value} ${editor.elements.apellidos.value}`.trim();
  const initials = [editor.elements.nombres.value, editor.elements.apellidos.value].map(value => value.trim().charAt(0)).join('').toUpperCase() || 'GT';
  document.querySelector('#summary-name').textContent = name || 'Tu perfil';
  document.querySelector('#summary-email').textContent = editor.elements.email.value || 'Completa tus datos';
  for (const id of ['photo', 'summary-photo']) {
    const image = document.getElementById(id);
    image.hidden = !photo;
    if (photo) image.src = photo;
    else image.removeAttribute('src');
  }
  for (const id of ['initials', 'photo-initials']) {
    document.getElementById(id).textContent = initials;
    document.getElementById(id).hidden = Boolean(photo);
  }
  document.querySelector('#remove-photo').hidden = !photo;
}
function restore() {
  for (const name of ['nombres','apellidos','email','telefono','ubicacion','correoContacto','localidad']) {
    editor.elements[name].value = saved[name] || '';
    editor.elements[name].setCustomValidity('');
  }
  photoVersion++;
  photo = saved.foto || '';
  dirty = false;
  fileInput.value = '';
  photoError.textContent = '';
  paint();
}
function markChanged() { dirty = true; status.textContent = 'Tienes cambios sin guardar.'; paint(); }
editor.addEventListener('input', event => {
  event.target.setCustomValidity?.('');
  editor.elements.correoContacto.setCustomValidity('');
  if (event.target.name === 'telefono') event.target.value = event.target.value.replace(/\D/g,'').slice(0,9);
  markChanged();
});
document.querySelector('#choose-photo').addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  const version = ++photoVersion;
  photoError.textContent = '';
  if (!file) return;
  if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
    photoError.textContent = 'Selecciona una imagen JPG, PNG o WebP de hasta 2 MB.';
    fileInput.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onerror = () => { photoError.textContent = 'No se pudo leer la imagen. Intenta con otra.'; };
  reader.onload = () => {
    const image = new Image();
    image.onerror = () => { if (version === photoVersion) photoError.textContent = 'El archivo no contiene una imagen válida.'; };
    image.onload = () => {
      if (version !== photoVersion) return;
      photo = reader.result;
      markChanged();
    };
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
});
document.querySelector('#remove-photo').addEventListener('click', () => { photoVersion++; photo = ''; fileInput.value = ''; photoError.textContent = ''; markChanged(); });
document.querySelector('#discard').addEventListener('click', () => { restore(); status.textContent = 'Se restauraron los últimos datos guardados.'; });
editor.addEventListener('submit', event => {
  event.preventDefault();
  for (const name of ['nombres','apellidos']) {
    const input = editor.elements[name];
    input.value = input.value.trim();
    input.setCustomValidity(/^[\p{L}\p{M} '-]{2,}$/u.test(input.value) ? '' : 'Ingresa un nombre válido de al menos dos caracteres.');
  }
  const email = editor.elements.email.value.trim().toLowerCase();
  const contact = editor.elements.correoContacto.value.trim().toLowerCase();
  editor.elements.correoContacto.setCustomValidity(contact && contact === email ? 'Ingresa un correo distinto al principal.' : '');
  if (!editor.reportValidity()) return;
  const next = { ...saved, ...Object.fromEntries(new FormData(editor)), email, correoContacto:contact, foto:photo };
  if (!window.previewProfile.save(next)) {
    status.textContent = 'No se pudo guardar. Prueba una foto más pequeña o habilita el almacenamiento del navegador.';
    return;
  }
  saved = next;
  dirty = false;
  paint();
  status.textContent = 'Cambios guardados solo en esta vista previa. Tu cuenta de MySQL no fue modificada.';
});
window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
restore();
