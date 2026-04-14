# Guía para Generar el APK de Invent-IA

Esta guía te ayudará a generar el archivo instalable (.apk) para los celulares desde tu propia computadora.

## 1. Requisitos Previos

Necesitas instalar las siguientes herramientas en tu PC:
- **Node.js**: [Descargar aquí](https://nodejs.org/es) (Instala la versión LTS).
- **Android Studio**: [Descargar aquí](https://developer.android.com/studio) (La versión "Ladybug" o superior).

## 2. Preparación del Proyecto Local

Una vez que tengas las herramientas, abre una terminal en tu computadora y sigue estos pasos:

1. **Clona tu repositorio**:
   ```bash
   git clone https://github.com/onunez2025/Inventario.git
   cd Inventario
   ```

2. **Instala las dependencias**:
   ```bash
   npm install
   ```

3. **Genera la versión Web**:
   ```bash
   npm run build
   ```

4. **Sincroniza con Android**:
   ```bash
   npx cap sync
   ```

## 3. Generar el APK en Android Studio

1. Abre **Android Studio**.
2. Selecciona **"Open"** y busca la carpeta `android` dentro de tu proyecto `Inventario`.
3. Espera a que termine de cargar (verás una barra de progreso abajo a la derecha).
4. En el menú superior, ve a: **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
5. Cuando termine, aparecerá un aviso abajo a la derecha. Haz clic en **"locate"** y verás tu archivo `app-debug.apk`.

> [!TIP]
> **Compatibilidad**: He configurado el proyecto para que funcione desde Android 7.0 (API 24), lo que cubre casi el 95% de los celulares actuales (desde gama baja hasta alta).

## 4. Instalación

Copia el archivo `app-debug.apk` a los celulares de los operarios e instálalo. Si el celular te pide permiso para "Instalar aplicaciones de fuentes desconocidas", acéptalo.

---
**MT INDUSTRIAL S.A.C - Sistema de Inventarios Inteligente**
