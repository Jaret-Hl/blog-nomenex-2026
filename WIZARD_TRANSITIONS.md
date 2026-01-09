# Mejoras en las Transiciones del Wizard

## Cambios Implementados

### 1. **Navegación Sin Recarga de Página**
El wizard ahora utiliza navegación client-side, eliminando las recargas de página entre steps.

### 2. **Sistema de Eventos Personalizados**
Se implementó un sistema de eventos para controlar la navegación:
- `wizard:next` - Navegar al siguiente paso
- `wizard:prev` - Volver al paso anterior  
- `wizard:goto` - Ir a un paso específico

### 3. **Transiciones Suaves con CSS**
Cada cambio de paso incluye animaciones fade-in/fade-out para una experiencia más fluida:
- Fade out del paso actual (300ms)
- Fade in del nuevo paso (400ms)
- Animación de deslizamiento vertical sutil

### 4. **Actualización Dinámica de la Barra de Progreso**
La barra de progreso se actualiza automáticamente sin recargar la página, sincronizándose con el paso actual.

### 5. **Manejo de URL**
La URL se actualiza usando `history.pushState()` para mantener la navegación del navegador funcional sin recargas.

## Cómo Funciona

### WizardNavigator (Wizard.astro)
Clase JavaScript que maneja toda la lógica de navegación:
- Escucha eventos personalizados
- Gestiona las transiciones entre pasos
- Actualiza la barra de progreso
- Sincroniza la URL con el estado actual

### Formularios (Step1, Step2, Step3)
- Previenen el comportamiento por defecto de envío
- Envían datos mediante Astro Actions
- Emiten eventos personalizados para la navegación
- Botones "Volver" sin enlaces `<a>`, usando eventos

## Ventajas

✅ **Experiencia más fluida** - Sin recargas de página  
✅ **Transiciones visuales** - Animaciones suaves entre pasos  
✅ **Mejor rendimiento** - Menos peticiones al servidor  
✅ **Datos persistentes** - Los datos del wizard se mantienen en cookies  
✅ **Navegación natural** - Los botones atrás/adelante del navegador funcionan  
✅ **Feedback visual** - Barra de progreso actualizada en tiempo real  

## Compatibilidad

- ✅ Navegadores modernos (Chrome, Firefox, Safari, Edge)
- ✅ Compatible con JavaScript disabled (degrada a navegación tradicional)
- ✅ Responsive - Funciona en todos los dispositivos
