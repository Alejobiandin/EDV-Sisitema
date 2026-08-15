# Validación visual de notificaciones y exportaciones

La vista `/configuracion-fiscal` fue revisada en escritorio y móvil. En escritorio, el layout muestra el ícono de campana en la cabecera lateral, el reporte gerencial y los botones de exportación PDF/Excel. En móvil se detectó inicialmente que el encabezado del reporte podía desbordar horizontalmente; se corrigió cambiando el encabezado a disposición vertical en pantallas pequeñas y permitiendo que los botones se envuelvan. La suite final de TypeScript, pruebas y build se ejecutó después de esa corrección.
