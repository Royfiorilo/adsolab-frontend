# AdsoLab Frontend

## ¿Qué es AdsoLab?

Es una plataforma para el modelado y validación del equilibrio en los procesos de adsorción de contaminantes.

La misma está implementada en dos partes:

- Frontend: el presente repositorio
- Backend: https://github.com/federicorossini09/adsolab-back

## Descripción

AdsoLab Frontend es una aplicación web desarrollada en Angular que permite analizar y modelar datos de adsorción. La plataforma ofrece:

- Ajuste de modelos no lineales para datos de adsorción
- Comparación visual de diferentes modelos
- Análisis estadístico detallado
- Visualización de gráficos interactivos
- Interfaz de usuario intuitiva

## Requisitos

- Node.js
- Angular CLI
- NPM

## Ejecutar la aplicación localmente

**Importante**: para que la aplicación funcione correctamente, el backend también debe estar en ejecución local.

```bash
# Instalar Angular CLI
npm install -g @angular/cli

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
ng serve --configuration=local
```

Para acceder a la aplicación, abrir el navegador y dirigirse a `http://localhost:4200`.

Ante cualquier duda sobre uso de la plataforma, puede consultar el [manual de usuario](https://docs.google.com/document/d/1p7tIsKz883BVvyKr_jJKW_wlozerZ00AWT68uW1maUU/edit?usp=sharing).

## Autenticación

La aplicación utiliza autenticación basada en sesiones a través de cookies. Para habilitar este mecanismo, la configuración `withCredentials: true` debe incluirse en todas las peticiones HTTP al backend.
Las cookies de sesión se manejan automáticamente por el navegador.

## Internacionalización (i18n)

Actualmente, la plataforma está disponible solo en español. Sin embargo, se ha implementado la infraestructura necesaria para agregar otros idiomas en el futuro.

La aplicación utiliza `ngx-translate` para la gestión de traducciones. Los textos están centralizados en el archivo `src/assets/i18n/es.json`, que contiene las traducciones en español para:

- Textos de la interfaz de usuario
- Descripciones de métricas estadísticas
- Fórmulas matemáticas en formato LaTeX

Para agregar nuevos textos, simplemente se debe modificar el archivo JSON siguiendo la estructura de objetos anidados existente.


