# Curso-Integrador-II---Desarrollo-de-Pag-Web
Repositorio oficial para el desarrollo del proyecto de la página web del Curso Integrador II.

GUIA PARA SUBIR A LA RAMA DEVELOP:
Git Bash
Mantener actualizada la rama principal localmente antes de crear cambios:

Bash
git checkout main
git pull origin main
Crear y cambiarte a una nueva rama de trabajo específica para la tarea o característica que vas a desarrollar (por ejemplo, para la estructura base o el frontend):

Bash
git checkout -b feature/estructura-frontend
(Nota: Los prefijos comunes son feature/ para nuevas funciones, fix/ para corrección de errores, o docs/ para documentación).

Trabajar, guardar y subir tus cambios con normalidad a esa rama remota:

Bash
git add .
git commit -m "feat: configurar estructura inicial de carpetas y proyecto"
git push origin feature/estructura-frontend
Ir al repositorio en GitHub (o GitLab) para abrir un Pull Request (PR) o Merge Request desde tu rama (feature/estructura-frontend) hacia la rama main.
