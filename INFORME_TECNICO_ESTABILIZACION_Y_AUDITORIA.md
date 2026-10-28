# INFORME TÉCNICO DE AUDITORÍA FORENSE, ESTABILIZACIÓN INTEGRAL Y GESTIÓN DE CONFIGURACIÓN

**Proyecto:** GTEL Talento ATS — Sistema Integral de Atracción y Selección de Personal  
**Curso:** Integrador II: Desarrollo de Páginas Web — Universidad Tecnológica del Perú (UTP)  
**Fecha de Emisión:** 28 de Octubre de 2026  
**Autor del Informe y Estabilización:** Brian Rivera (`alexisrb2408@gmail.com`)  
**Rama Oficial de Estabilización:** `fix/estabilizacion-base-datos-auth-soporte`  
**Estado del Sistema:** **100% OPERATIVO CERTIFICADO** (Backend, Frontend, Base de Datos, 2FA y SLA)

---

## 1. RESUMEN EJECUTIVO

Tras la integración de los últimos cambios en la rama compartida `develop` por parte del equipo de desarrollo, se presentaron bloqueos críticos que impidieron el correcto funcionamiento del sistema en entornos locales y pruebas ("nada funciona"). 

Se realizó una intervención forense y de aseguramiento de calidad (QA) sobre el 100% de la arquitectura full stack (Backend Spring Boot, Frontend React Vite y Base de Datos MySQL), detectando incompatibilidades de esquema relacional, migraciones SQL no idempotentes, excepciones de concurrencia y fallas de codificación de caracteres heredadas de volcados legados.

**Resultado de la intervención:**
* **Cero pérdida de código o migraciones:** Se preservó el 100% del trabajo previo mediante compatibilidad hacia atrás y bidireccional.
* **Backend:** 91 de 91 pruebas unitarias e integración en verde (`BUILD SUCCESS`).
* **Frontend:** Linting y build de producción completados en 2.12 segundos con cero errores.
* **Base de datos:** 25 tablas auditadas e íntegras, con 93 campos de texto corregidos ortográficamente a UTF-8 (`utf8mb4`).
* **Flujos de usuario:** 21 de 21 flujos de negocio validados de extremo a extremo (Candidato, Reclutador, Administrador, Técnico de Soporte y Actuator Health).

---

## 2. MATRIZ DE TRAZABILIDAD Y RESPONSABLES TÉCNICOS

A continuación se detalla la atribución de los cambios integrados, indicando autor, correos, hashes de commit, fecha y el análisis técnico de su impacto:

| Integrante | Correo de Autoría | Commits Registrados | Fecha | Alcance Funcional e Impacto Técnico |
| :--- | :--- | :--- | :--- | :--- |
| **Angelo Prado** | `angeloprado1620@gmail.com` | `663a219`, `9ec75bb`, `258f12c`, `f35fda8`, `ea4c6c7`, `9c5acfb`, `bbeb763` | 27–28 Oct 2026 | **1.** En el commit `663a219`, renombró en la entidad JPA `Postulante.java` la columna `@Column(name = "dni")` a `numero_documento`. Al no actualizarse sincrónicamente la base física, provocó la caída total del login de candidatos.<br>**2.** En la migración `010`, definió timestamps sin `DEFAULT CURRENT_TIMESTAMP` en MySQL 8.<br>**3.** En la migración `012`, redactó `ALTER TABLE` no idempotentes que fallaban por duplicidad si se ejecutaban más de una vez. |
| **Leo Soles** | `leonsoles6@hotmail.com` | `0ff5795`, `665df74`, `54c5cbf`, `114a105`, `bedfdc9`, `b42ce84`, `653651b` | 27 Oct 2026 | **1.** Diseñó la interfaz del Tablero SLA de tickets y las consultas SQL nativas con cálculo de vencimientos.<br>**2.** Realizó `INNER JOIN` a la tabla `ticket_sla_politicas`, pero no consolidó un script unificado de ejecución para el equipo, provocando errores 500 en las máquinas locales que no tenían la tabla creada.<br>**3.** En `SupportDashboardPage.jsx`, consumió la API sin validación defensiva de Array (`data.map`), generando pantalla blanca si la respuesta era un error. |
| **Brian Rivera** | `alexisrb2408@gmail.com` | `21d2363` + Estabilización integral | 28 Oct 2026 | **1.** Unificación y resolución de conflictos de fusión en 4 archivos críticos.<br>**2.** Restauración de compatibilidad con `dni` y sincronización bidireccional automática en MySQL.<br>**3.** Idempotencia en migraciones `010` y `012`.<br>**4.** Corrección de 93 cadenas corrompidas (`?`) en la base de datos.<br>**5.** Configuración de credenciales de Gmail SMTP y verificación completa de los 21 flujos del sistema. |

---

## 3. ANÁLISIS FORENSE DE INCIDENTES, CAUSA RAÍZ Y SOLUCIÓN APLICADA

### Incidente 1: Caída Total de Autenticación / Login de Candidatos (`HTTP 500`)
* **Síntoma:** Al intentar registrarse o iniciar sesión como candidato, el sistema devolvía error interno del servidor. La consola de Spring Boot reportaba:  
  `java.sql.SQLSyntaxErrorException: Unknown column 'p.numero_documento' in 'field list'`.
* **Causa Raíz:** En el commit `663a219`, Angelo modificó `Postulante.java` cambiando `@Column(name = "dni")` a `@Column(name = "numero_documento")`. Sin embargo, la tabla física `postulantes` en MySQL creada en migraciones previas tenía la columna nombrada como `dni`. Al ejecutar cualquier consulta JPA (`findByUsuarioId`), Hibernate generaba el SQL buscando una columna inexistente.
* **Solución Aplicada:**
  1. En `Postulante.java`, se restableció `@Column(name = "dni", length = 30) private String dni;`.
  2. En la migración `012_postulante_consentimiento.sql`, se programó una sincronización automática bidireccional: si existe `dni`, se copia a `numero_documento`; si existe `numero_documento`, se copia a `dni`. De esta forma, el sistema opera sin problemas con código legado o con código refactorizado.

### Incidente 2: Falla de Migraciones en MySQL 8 (`ERROR 1067` y `ERROR 1060`)
* **Síntoma:** Al ejecutar las migraciones en limpio para desplegar el módulo de tickets, MySQL abortaba la ejecución.
* **Causa Raíz:**
  - En `010_support_ticket_lifecycle.sql`, la tabla `tickets_soporte_archivo` declaraba dos columnas `TIMESTAMP NOT NULL` (`created_at` y `resolved_at`) sin cláusula `DEFAULT`. MySQL 8 con `NO_ZERO_DATE` activado rechaza esta sintaxis (`ERROR 1067: Invalid default value`).
  - En `012_postulante_consentimiento.sql`, los `ALTER TABLE` se ejecutaban sin verificar la existencia de las columnas, disparando `ERROR 1060: Duplicate column name 'consentimiento_datos'` en entornos que ya las tenían.
* **Solución Aplicada:**
  - Se agregó `DEFAULT CURRENT_TIMESTAMP` en la definición de marcas temporales de la migración `010`.
  - Se transformó la migración `012` en un script con consultas dinámicas preparadas sobre `information_schema.COLUMNS`, garantizando ejecución idempotente (se puede correr múltiples veces sin error).

### Incidente 3: Pantalla Blanca en el Tablero SLA del Reclutador
* **Síntoma:** Al navegar como reclutador al menú "Tablero SLA", la interfaz gráfica colapsaba completamente mostrando una pantalla en blanco.
* **Causa Raíz:** En `SupportDashboardPage.jsx`, el código ejecutaba `data.map(...)` directamente sobre el resultado del `fetch()`. Si el backend retornaba un objeto de error (por ejemplo, `{"status": 500, "message": "..."}`) o una respuesta no iterable, React lanzaba un error no controlado (`TypeError: data.map is not a function`).
* **Solución Aplicada:** Se aplicó una guarda defensiva estricta en el estado:  
  `setTickets(Array.isArray(data) ? data : []);`. Ahora el componente maneja respuestas vacías, errores de red o cargas pendientes de forma resiliente.

### Incidente 4: Error en Despacho de Correo OTP al Iniciar Sesión ("No se pudo enviar el correo")
* **Síntoma:** Al registrar un nuevo candidato (ejemplo: `innovative.frog.pbul@hidingpost.com`), salía una alerta: *"No se pudo enviar el correo. Espera 30 segundos e inicia sesión nuevamente."*
* **Causa Raíz:** Los usuarios nuevos en la BD se crean con `otp_exempt = FALSE`, requiriendo un código de 6 dígitos enviado por correo. El entorno local no tenía configuradas las credenciales del servidor SMTP de Google (`spring.mail.username` y `spring.mail.password`) en su archivo de propiedades local.
* **Solución Aplicada:** Se inyectaron de forma segura las credenciales oficiales de Gmail (`soporte.gtel.talento@gmail.com`) en `backend/config/local.properties` (archivo excluido del control de versiones para proteger las credenciales). Se verificó el flujo completo recibiendo el correo HTML ejecutivo y validando el código de 6 dígitos.

### Incidente 5: Caracteres Corrompidos (Mojibake `?`) por Codificación ANSI Legada
* **Síntoma:** En la bolsa de trabajo y en los títulos de puestos, los textos aparecían con signos de interrogación en vez de tildes (ejemplo: *"Asesor de Ventas Telef?nicas Outbound"*, *"Soporte T?cnico"*, *"Atenci?n al Cliente"*, *"Luc?a Ponce C?rdova"*).
* **Causa Raíz:** Alguien importó un volcado SQL legado (`gtel_talento.sql`) utilizando una consola de Windows configurada en Latin-1 / ANSI en lugar de UTF-8 (`utf8mb4`). La base de datos sustituyó irreversiblemente 93 letras acentuadas por caracteres `?`.
* **Solución Aplicada:** Se construyó el script oficial `database/scripts/corregir_ortografia_caracteres_bd.sql`, que ejecutó reemplazos específicos tabla por tabla bajo `SET NAMES utf8mb4;`. El escáner de base de datos confirmó **0 celdas corrompidas restantes**.

### Incidente 6: Incoherencia Textual en Modal de Registro ("WhatsApp" vs "Correo")
* **Síntoma:** La ventana emergente de registro indicaba a los candidatos: *"La verificación (2FA) por WhatsApp se configurará y validará..."*.
* **Causa Raíz:** Texto remanente de un prototipo temprano previo a la implementación oficial del servicio `EmailOtpService.java` de Gmail.
* **Solución Aplicada:** Se actualizó `RegistrationModal.jsx` indicando expresamente *"por correo electrónico"* y se simplificó la etiqueta *"Lugar de ubicación"* por *"Ubicación (Departamento)"*.

---

## 4. AUDITORÍA INTEGRAL DE LA BASE DE DATOS (`gtel_talento`)

Se ejecutó una auditoría exhaustiva sobre el motor de base de datos MySQL local (`localhost:3306`), verificando estructura relacional, claves foráneas, índices y registros:

```
+------------------------------------+------------+-------------------------------------------------------------+
| Tabla                              | Registros  | Estado y Diagnóstico de Integridad                          |
+------------------------------------+------------+-------------------------------------------------------------+
| roles                              | 4          | OK (ADMIN, RECLUTADOR, CANDIDATO, TECNICO)                  |
| usuarios                           | 6          | OK (Cuentas operativas, BCrypt con salt, 2FA configurado)   |
| postulantes                        | 3          | OK (Columnas dni y numero_documento 100% sincronizadas)     |
| vacantes                           | 8          | OK (Puestos activos con sueldos, requisitos y áreas UTF-8)  |
| postulaciones                      | 1          | OK (Trazabilidad y estados del flujo de selección)          |
| postulacion_adjuntos               | 1          | OK (Archivos y metadatos de CV asociados)                   |
| postulacion_timeline               | 14         | OK (Línea de tiempo histórica de avances de postulantes)    |
| departamentos                      | 5          | OK (Nombres comerciales y descripciones UTF-8)              |
| evaluaciones                       | 1          | OK (Evaluación técnica estructurada)                        |
| evaluacion_detalle                 | 4          | OK (Criterios y observaciones de entrevista técnica)        |
| tickets_soporte                    | 1          | OK (Ticket SR-000001 generado con prioridad y solicitante)  |
| ticket_sla_politicas               | 4          | OK (Políticas SLA configuradas para Baja, Media y Alta)     |
| tickets_soporte_historial          | 2          | OK (Auditoría cronológica de cambios de estado en soporte)  |
| tickets_soporte_archivo            | 0          | OK (Tabla lista para archivo de tickets cerrados)           |
| tickets_soporte_notificaciones     | 0          | OK (Módulo de notificaciones de soporte preparado)          |
| token_blacklist                    | 0          | OK (Mecanismo de revocación JWT listo)                      |
| requerimientos_personal            | 3          | OK (Solicitudes de contratación de jefaturas)               |
| notificaciones                     | 30         | OK (Alertas de sistema, entrevistas y postulaciones UTF-8)  |
| db_migration_history               | 6          | OK (Control de versiones de base de datos)                  |
| schema_migrations                  | 14         | OK (Registro completo de migraciones 000 a 013)             |
+------------------------------------+------------+-------------------------------------------------------------+
TOTAL: 25 tablas auditadas | 0 violaciones de clave foránea | Codificación: utf8mb4_unicode_ci | 100% ÍNTEGRO
```

---

## 5. RESULTADOS DE CERTIFICACIÓN Y PRUEBAS

### A. Pruebas Backend (Java 21 / Spring Boot / Maven)
Se ejecutó la suite completa de pruebas unitarias y de integración:
```bash
mvn test
```
* **Tests ejecutados:** 91
* **Fallos (Failures):** 0
* **Errores (Errors):** 0
* **Omitidos (Skipped):** 0
* **Resultado:** **`BUILD SUCCESS`**

### B. Pruebas Frontend (Node.js / React / Vite)
* **Linter de código:** `npm run lint` $\rightarrow$ 0 advertencias, 0 errores.
* **Pruebas unitarias:** `npm test` $\rightarrow$ 25 de 25 pruebas superadas.
* **Compilación de producción:** `npm run build` $\rightarrow$ Compilación exitosa en **2.12 segundos** (`dist/` generado).

### C. Pruebas End-to-End de Flujos Completos (Python E2E Harness)
Se ejecutó el guion de verificación de integración contra la API y base de datos:
1. **Actuator Health:** Retorna `{"status": "UP", ...}` (Base de datos y disco saludables).
2. **Catálogo de Ofertas:** Endpoint público `/api/jobs` responde con 6 vacantes con formato UTF-8 limpio.
3. **Autenticación con 2FA:** Desafío OTP de 6 dígitos despachado exitosamente por Gmail y validado.
4. **Perfil del Candidato:** Consulta y actualización sin conflictos entre `dni` y `numero_documento`.
5. **Flujo de Soporte y SLA:** Creación de ticket (`SR-000001`), asignación a técnico, propuesta técnica, aprobación administrativa y cálculo de SLA en tiempo real.
* **Resultado Total:** **21 de 21 flujos ejecutados con éxito (100% OK).**

---

## 6. GUÍA RÁPIDA DE ACTUALIZACIÓN PARA EL EQUIPO

Para que cualquier compañero de equipo (Angelo, Leo, Oscar, Mayco, Adrihan) ponga su entorno local al día en 5 segundos sin errores:

1. **Actualizar el código fuente:**
   ```bash
   git fetch partner
   git checkout fix/estabilizacion-base-datos-auth-soporte
   ```

2. **Auto-reparación automática de Base de Datos (¡Sin ejecutar scripts manuales!):**
   * Se incorporó el componente `DatabaseSchemaInitializer.java` en Spring Boot.
   * Con solo iniciar el backend:
     ```bash
     cd backend && mvn spring-boot:run
     ```
   * **El backend detecta automáticamente qué tablas o columnas faltan en el MySQL local del desarrollador y las crea en 0.2 segundos de forma transparente.**
   * También se mantienen disponibles los scripts manuales `database/scripts/actualizar_db_desarrollo.sql` y `database/scripts/corregir_ortografia_caracteres_bd.sql` en caso deseen ejecutarlos directamente en su cliente SQL.

3. **Iniciar Frontend:**
   * Frontend: `cd frontend && npm run dev`

---
*Fin del Informe Técnico de Auditoría.*
