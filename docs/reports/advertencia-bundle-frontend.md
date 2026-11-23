# Advertencia pendiente: tamaño del bundle frontend

## Estado

- Clasificación: deuda técnica de rendimiento.
- Prioridad sugerida: media.
- Bloqueante: no.
- Detectada durante: validación UI-R5 del panel Reclutador.
- Fecha de registro: 22 de noviembre de 2026.

## Descripción

La compilación de producción finaliza correctamente, pero Vite informa que el
archivo JavaScript principal supera el umbral recomendado de 500 kB después de
la minificación.

Resultado observado en la validación:

- JavaScript principal: aproximadamente 1.30 MB sin compresión.
- JavaScript principal: aproximadamente 346 kB con gzip.
- La advertencia no impide compilar, iniciar ni utilizar la aplicación.

## Cómo reproducir

Desde la carpeta `frontend` ejecutar:

```powershell
npm run build
```

La compilación termina correctamente y Vite muestra la advertencia sobre
fragmentos mayores de 500 kB.

## Impacto posible

- Mayor tiempo de carga inicial en redes lentas.
- Mayor trabajo de análisis y ejecución de JavaScript en equipos modestos.
- Descarga inicial de código que puede pertenecer a módulos que el usuario no
  visitará durante su sesión.

No se ha identificado una regresión funcional, de permisos, de rutas ni de
persistencia asociada a esta advertencia.

## Revisión futura recomendada

1. Analizar la composición del bundle antes de realizar cambios.
2. Dividir las rutas de Administrador, Técnico, Reclutador y Candidato mediante
   `React.lazy` e importaciones dinámicas.
3. Evaluar la carga diferida de gráficos y páginas de mayor tamaño.
4. Conservar una pantalla de carga accesible durante la descarga de cada módulo.
5. Repetir ESLint, todas las pruebas y la compilación de producción.
6. Comparar los tamaños antes y después de la optimización.
7. Verificar navegación, autenticación, permisos y retorno desde el inicio de
   sesión antes de cerrar la tarea.

## Restricciones para la corrección

- No ocultar la advertencia aumentando únicamente `chunkSizeWarningLimit`.
- No eliminar funcionalidades ni dependencias sin comprobar su uso.
- No modificar backend, base de datos ni contratos API para resolverla.
- Implementar la optimización como una fase independiente y reversible.

