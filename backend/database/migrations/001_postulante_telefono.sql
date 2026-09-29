-- HISTÓRICA: solo para bases que NO tengan postulantes.telefono.
-- El esquema compartido el 27/09/2026 ya tiene esa columna: NO ejecutar allí.
-- Este script no se ejecuta automáticamente.
-- Los perfiles existentes requieren un teléfono real; no rellenar con un número de prueba.
ALTER TABLE postulantes ADD COLUMN telefono VARCHAR(16) NULL;
