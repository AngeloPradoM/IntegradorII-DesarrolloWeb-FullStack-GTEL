# Esquema canónico

`gtel_talento.sql` representa una instalación completa y actual de GTEL Talento.
Se utiliza únicamente sobre un esquema nuevo y vacío.

No lo ejecutes sobre `gtel_talento` u otra base con información: no sustituye a
las migraciones incrementales. La copia `../gtel_talento.sql` debe conservar el
mismo contenido porque Docker la usa para inicializar volúmenes nuevos.
