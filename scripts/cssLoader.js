/**
 * CSS LOADER UTILITY
 * Carga archivos CSS de forma dinámica y los gestiona eficientemente
 */

class CSSLoader {
  constructor() {
    this.loadedStyles = new Map(); // Track loaded CSS files
    this.currentView = null;
  }

  /**
   * Carga un archivo CSS de forma dinámica
   * @param {string} href - Ruta del archivo CSS
   * @param {string} id - ID único para el elemento link
   * @returns {Promise<void>}
   */
  loadCSS(href, id) {
    return new Promise((resolve, reject) => {
      // Si ya está cargado, resolver inmediatamente
      if (this.loadedStyles.has(id)) {
        console.log(`✅ CSS ya cargado: ${id}`);
        resolve();
        return;
      }

      // Verificar si el elemento ya existe en el DOM
      const existing = document.getElementById(id);
      if (existing) {
        this.loadedStyles.set(id, existing);
        console.log(`✅ CSS encontrado en DOM: ${id}`);
        resolve();
        return;
      }

      // Crear nuevo elemento link
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.id = id;

      // Manejar carga exitosa
      link.onload = () => {
        this.loadedStyles.set(id, link);
        console.log(`✅ CSS cargado exitosamente: ${id}`);
        resolve();
      };

      // Manejar error de carga
      link.onerror = () => {
        console.error(`❌ Error cargando CSS: ${href}`);
        reject(new Error(`Failed to load CSS: ${href}`));
      };

      // Agregar al head
      document.head.appendChild(link);
    });
  }

  /**
   * Carga múltiples archivos CSS
   * @param {Array<{href: string, id: string}>} cssFiles
   * @returns {Promise<void>}
   */
  async loadMultiple(cssFiles) {
    const promises = cssFiles.map(file => this.loadCSS(file.href, file.id));
    await Promise.all(promises);
  }

  /**
   * Descarga CSS de vistas previas (opcional, para optimizar memoria)
   * @param {Array<string>} exceptIds - IDs que no deben descargarse
   */
  unloadViewCSS(exceptIds = []) {
    const viewCSSIds = ['css-dashboard', 'css-producto', 'css-cliente'];
    
    viewCSSIds.forEach(id => {
      if (!exceptIds.includes(id) && this.loadedStyles.has(id)) {
        const link = this.loadedStyles.get(id);
        if (link && link.parentNode) {
          link.parentNode.removeChild(link);
          this.loadedStyles.delete(id);
          console.log(`🗑️ CSS descargado: ${id}`);
        }
      }
    });
  }

  /**
   * Carga CSS específico para una vista
   * @param {string} view - Nombre de la vista (dashboard, producto, cliente)
   * @returns {Promise<void>}
   */
  async loadViewCSS(view) {
    // No descargar CSS previo para mejor UX (mantenerlo en cache)
    // Si quieres liberar memoria, descomenta la siguiente línea:
    // this.unloadViewCSS([`css-${view}`]);

    const viewCSSMap = {
      dashboard: { href: 'styles/dashboard.css', id: 'css-dashboard' },
      producto: { href: 'styles/producto.css', id: 'css-producto' },
      cliente: { href: 'styles/cliente.css', id: 'css-cliente' }
    };

    const cssFile = viewCSSMap[view];
    if (cssFile) {
      await this.loadCSS(cssFile.href, cssFile.id);
      this.currentView = view;
    }
  }

  /**
   * Verifica si un CSS está cargado
   * @param {string} id - ID del CSS
   * @returns {boolean}
   */
  isLoaded(id) {
    return this.loadedStyles.has(id);
  }

  /**
   * Obtiene estadísticas de CSS cargados
   * @returns {Object}
   */
  getStats() {
    return {
      total: this.loadedStyles.size,
      loaded: Array.from(this.loadedStyles.keys()),
      currentView: this.currentView
    };
  }
}

// Exportar instancia singleton
export const cssLoader = new CSSLoader();

export async function loadViewStyles(view) {
  try {
    await cssLoader.loadViewCSS(view);
  } catch (error) {
    console.error(`Error cargando estilos para ${view}:`, error);
  }
}

/**
 * Inicializa los estilos base (sidebar y base)
 * Esta función se debe llamar una sola vez al cargar app.html
 * @returns {Promise<void>}
 */
export async function initBaseStyles() {
  try {
    await cssLoader.loadMultiple([
      { href: 'styles/base.css', id: 'css-base' },
      { href: 'styles/sidebar.css', id: 'css-sidebar' }
    ]);
    console.log('✅ Estilos base inicializados');
  } catch (error) {
    console.error('❌ Error inicializando estilos base:', error);
  }
}