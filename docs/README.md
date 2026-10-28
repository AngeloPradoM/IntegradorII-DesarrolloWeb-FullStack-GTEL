# Documentación oficial de GTEL Talento

Este directorio concentra la documentación del proyecto. La base de datos oficial se encuentra
en [`../database/`](../database/); no se deben crear nuevas migraciones fuera de esa carpeta.

## Navegación

| Sección | Contenido |
|---|---|
| [`architecture/`](architecture/) | Arquitectura del backend y flujo de reclutamiento |
| [`deliveries/`](deliveries/) | Entregas, estados y evidencias de QA |
| [`operations/`](operations/) | Operación, respaldo, restauración y despliegue |
| [`reports/`](reports/) | Informes y correcciones históricas |
| [`../database/`](../database/) | Esquema, migraciones, seeds, scripts y snapshots |

## Orden recomendado de lectura

1. [README principal](../README.md).
2. [Arquitectura del backend](architecture/arquitectura-src.md).
3. [Guía de la base de datos](../database/README.md).
4. [Incorporar una base local desactualizada](../database/LOCAL_SETUP.md).
5. [Guía de migraciones](../database/MIGRATION_GUIDE.md).
6. [Procedimiento operativo](../database/OPERATIONS.md).
7. [Checklist de cierre](../database/POST_CUTOVER_CHECKLIST.md).

Las credenciales y secretos no deben documentarse aquí. Para configurar entornos locales se
deben utilizar los archivos `.example` y las variables privadas correspondientes.
