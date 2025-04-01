# Tesla Lift App

Tesla Lift App es una aplicación móvil desarrollada con React Native y Expo. Su propósito es simplificar la gestión de mantenimiento de ascensores, proporcionando una experiencia intuitiva para clientes, técnicos y administradores.

## Características

- **Gestión de notificaciones**: Notificaciones en tiempo real para eventos importantes.
- **Navegación fluida**: Implementación de navegación con React Navigation.
- **Soporte multiplataforma**: Compatible con dispositivos Android, iOS y web.
- **Interfaz moderna**: Uso de `react-native-paper` para componentes estilizados.
- **Mapas interactivos**: Visualización de ubicaciones y tareas en mapas.

## Estructura del Proyecto

El proyecto tiene la siguiente estructura de carpetas:

├── App.tsx ├── components/ ├── context/ ├── hooks/ ├── lib/ ├── models/ ├── navigation/ ├── screens/ ├── services/ ├── styles/ ├── android/ ├── assets/ ├── public/ ├── .expo/ ├── .vscode/


### Archivos principales

- **`App.tsx`**: Punto de entrada principal de la aplicación. Configura los proveedores de contexto y la navegación.
- **`context/`**: Proveedores de contexto para manejar el estado global de la aplicación.
- **`navigation/`**: Configuración de la navegación entre pantallas.
- **`screens/`**: Pantallas principales de la aplicación.
- **`services/`**: Lógica para interactuar con APIs y almacenamiento local.

## Instalación

1. Clona este repositorio:
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd tesla-lift-app

2. Instala las dependencias:
    ```bash
    npm install

3. Inicia el servidor de desarrollo:
   ```bash
    npm start

## Scripts Disponibles

npm start: Inicia el servidor de desarrollo.
npm run android: Compila y ejecuta la aplicación en un emulador o dispositivo Android.
npm run ios: Compila y ejecuta la aplicación en un emulador o dispositivo iOS (requiere macOS).
npm run build: Genera una versión de producción de la aplicación.

## Tecnologías Utilizadas

React Native: Framework para el desarrollo de aplicaciones móviles.
Expo: Plataforma para desarrollar, construir y desplegar aplicaciones React Native.
React Navigation: Biblioteca para la navegación en aplicaciones React Native.
React Native Paper: Componentes de interfaz de usuario con soporte para Material Design.
Hermes: Motor de JavaScript optimizado para React Native.


Licencia
Este proyecto está licenciado bajo la Licencia Apache 2.0.

## Desarrollado con ❤️ por el equipo de Tesla Lift App.