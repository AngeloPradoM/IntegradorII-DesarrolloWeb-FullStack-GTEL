# Referencia aislada del paso 2

Código anterior de OTP/WhatsApp, sus pruebas y propiedades. Esta carpeta NO forma parte de las raíces Maven y NO arranca un backend separado.

- src/main/java: servicios, modelos y copia histórica de AuthController.
- src/test/java: pruebas del flujo OTP anterior.
- application-step2.properties y .env.example: configuración separada, sin carga automática.
- OTP_SETUP.md: documentación histórica de WhatsApp. Sus instrucciones no corresponden al paso 1 activo.

Al retomar el paso 2, revisar dependencias y contratos, adaptar a correo y reintegrar de forma controlada. No copiar todo src sobre el backend activo. Las pruebas archivadas no se ejecutan con mvn test en el paso 1.
