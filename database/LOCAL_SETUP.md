# Incorporación de una base local desactualizada

Esta guía simula el caso de un integrante que clona el repositorio y ya tiene una base
`gtel_talento` local con tablas o migraciones antiguas.

## Regla principal

No ejecutes `schema/gtel_talento.sql` sobre una base que ya contiene datos. Ese archivo es para
una instalación limpia. En una base existente se realiza diagnóstico, respaldo y luego se
aplican únicamente las migraciones faltantes.

## Caso A: el integrante no necesita conservar sus datos

Si la base solo contiene pruebas descartables, se puede crear una instalación limpia:

```sql
CREATE DATABASE gtel_talento_nuevo
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

En DBeaver, seleccionar `gtel_talento_nuevo` y ejecutar:

```text
database/schema/gtel_talento.sql
```

Después comprobar el resultado:

```text
database/scripts/check-schema.sql
database/scripts/migration-status.sql
```

Si la aplicación requiere que el nombre sea exactamente `gtel_talento`, cambiar el nombre solo
cuando la base anterior ya esté respaldada y no esté siendo utilizada.

## Caso B: el integrante debe conservar sus datos

### 1. Respaldar la base

Desde una terminal con MySQL instalado:

```powershell
mysqldump --single-transaction --routines --triggers `
  -u root -p gtel_talento > gtel_talento_antes_actualizacion.sql
```

El archivo debe guardarse fuera del repositorio. No continúes si el respaldo falla.

### 2. Diagnosticar la estructura

En DBeaver, seleccionar la conexión y la base `gtel_talento`. Ejecutar:

```text
database/scripts/check-schema.sql
database/scripts/migration-status.sql
```

Interpretación:

- `1`: el objeto esperado está presente.
- `0`: el objeto no está presente y requiere revisión.
- La ausencia de `db_migration_history` significa que todavía no existe una bitácora; no se
  debe inventar el historial de migraciones anteriores.

### 3. Comparar con la fuente oficial

Comparar el resultado del diagnóstico con:

```text
database/schema/gtel_talento.sql
database/COMPATIBILITY_MATRIX.md
```

No se deben comparar únicamente los nombres de tablas. Revisar también columnas, tipos, índices,
claves foráneas y restricciones `UNIQUE`.

### 4. Aplicar las migraciones faltantes

Aplicar solo las migraciones aprobadas y en orden. La secuencia consolidada es:

| Versión | Función principal |
|---|---|
| `000` | Bitácora `db_migration_history` |
| `001` | Teléfono del postulante |
| `002` | Desafíos OTP por correo |
| `003` | Documentos y CV de postulaciones |
| `004` | Acceso administrativo |
| `005` | Flujo de reclutamiento |
| `006` | Papelera de vacantes |
| `007` | Auditoría de usuarios eliminados |
| `008` | Tickets de soporte y rol técnico |
| `009` | Compatibilidad de notificaciones |
| `010` | Ciclo de vida y archivo de tickets |
| `011` | Políticas SLA configurables por prioridad |
| `012` | Consentimiento y metadatos de privacidad del postulante |

Ejemplo: si el diagnóstico muestra que faltan tickets, ejecutar en DBeaver:

```text
database/migrations/008_support_tickets.sql
database/migrations/009_notification_schema_compatibility.sql
database/migrations/010_support_ticket_lifecycle.sql
database/migrations/011_support_sla_policies.sql
database/migrations/012_postulante_consentimiento.sql
```

No ejecutes una migración si sus tablas, columnas o restricciones ya existen sin comprobar antes
su contenido. Una migración aplicada no se edita; cualquier corrección se crea como una nueva.

### 5. Validar después de migrar

Ejecutar nuevamente:

```text
database/scripts/check-schema.sql
database/scripts/migration-status.sql
```

Después ejecutar las pruebas del backend:

```powershell
cd backend
mvn.cmd "-Dmaven.repo.local=C:\Users\ASUS\.m2\repository" test
```

El resultado esperado es `BUILD SUCCESS` y cero fallos.

## Configurar el backend local

Copiar el ejemplo y completar los valores privados:

```text
backend/config/local.properties.example
backend/config/local.properties
```

La configuración debe apuntar a la base actualizada. En desarrollo local se pueden dejar la URL
y el usuario por defecto del perfil, y completar la contraseña en `backend/config/local.properties`:

```properties
spring.datasource.username=root
spring.datasource.password=TU_PASSWORD_LOCAL
```

No subir `local.properties`, contraseñas, tokens ni claves SMTP al repositorio.

## Arranque del proyecto

Terminal 1:

```powershell
cd backend
mvn.cmd spring-boot:run
```

Terminal 2:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Luego validar el recorrido mínimo: iniciar sesión, consultar ofertas, postular, revisar la
postulación desde el reclutador y comprobar que no aparecen errores de tablas o columnas en el log.

## Si aparece un error

No borres tablas ni ejecutes todos los SQL sin diagnóstico. Conserva el mensaje exacto, el
resultado de `check-schema.sql`, la migración que se intentó aplicar y el estado del respaldo.
Consulta al responsable antes de modificar una base compartida.
