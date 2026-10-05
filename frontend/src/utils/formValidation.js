export const MAX_CV_SIZE = 5 * 1024 * 1024;
export function validateCv(cv) {
  if (!cv) return 'Adjunta tu CV.';
  if (!/\.pdf$/i.test(cv.name) || !['', 'application/pdf'].includes(cv.type)) return 'Selecciona un CV en PDF.';
  if (!cv.size || cv.size > MAX_CV_SIZE) return 'El CV debe tener contenido y pesar como máximo 5 MB.';
  return '';
}

export function validateApplication(data, cv, termsAccepted, step) {
  const errors = {};
  if (!step || step === 1) {
    if (!String(data.distrito || '').trim()) errors.distrito = 'Selecciona tu distrito.';
    for (const field of ['nombres', 'apellidos']) {
      if (!/^[\p{L}\p{M} '-]{2,}$/u.test((data[field] || '').trim())) errors[field] = 'Ingresa al menos dos caracteres válidos.';
    }
    if (!/^\d{8}$/.test(data.dni || '')) errors.dni = 'Ingresa un DNI de 8 dígitos.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((data.email || '').trim())) errors.email = 'Ingresa un correo válido.';
    if (!/^(?:\+51)?\d{9}$/.test(data.telefono || '')) errors.telefono = 'Ingresa 9 dígitos, con +51 opcional.';
    if ((data.motivacion||'').length>3000) errors.motivacion='La motivación admite hasta 3000 caracteres.';
    if (data.fechaNacimiento && (Number.isNaN(Date.parse(data.fechaNacimiento)) || Date.parse(data.fechaNacimiento) > Date.now())) errors.fechaNacimiento = 'Ingresa una fecha de nacimiento válida.';
  }
  if (!step || step === 2) {
    const error = validateCv(cv);
    if (error) errors.cv = error;
  }
  if ((!step || step === 3) && !termsAccepted) errors.terms = 'Acepta los términos para enviar tu postulación.';
  return errors;
}

export function validateJob(data) {
  const errors = {};
  for (const [field, label] of Object.entries({ title:'Título', type:'Jornada', location:'Ubicación', description:'Descripción', department:'Departamento' })) {
    if (!String(data[field] || '').trim()) errors[field] = `${label}: completa este campo.`;
  }
  for (const field of ['salaryMin', 'salaryMax']) {
    if (String(data[field] ?? '').trim() === '' || !Number.isFinite(Number(data[field])) || Number(data[field]) < 0) errors[field] = 'Ingresa un salario válido mayor o igual a cero.';
  }
  if (!errors.salaryMin && !errors.salaryMax && Number(data.salaryMin) > Number(data.salaryMax)) errors.salaryMax = 'El salario máximo no puede ser menor al mínimo.';
  if (!Number.isInteger(Number(data.vacancies)) || Number(data.vacancies) < 1) errors.vacancies = 'Ingresa al menos una vacante.';
  return errors;
}
