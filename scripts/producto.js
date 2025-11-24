// scripts/producto.js
// Exports viewLoadedProducto({ API_URL })
export async function viewLoadedProducto({ API_URL } = {}) {
  const api = API_URL || 'https://backend.tpdteam3.com/backend/api';
  const token = sessionStorage.getItem('token');

  // Utilities
  const qs = (s, root = document) => root.querySelector(s);
  const qsa = (s, root = document) => Array.from(root.querySelectorAll(s));
  let productos = [];
  const imageCache = new Map();
  const imageLoadPromises = new Map();
  const imageControllers = new Map();
  let imageObserver = null;
  let currentProductId = null;

  function parseErrorMessage(error) {
    if (typeof error === 'string') {
      try { const parsed = JSON.parse(error); return parsed.message || parsed.mensaje || 'Error desconocido'; } catch { return error; }
    }
    if (error && typeof error === 'object') return error.message || error.mensaje || JSON.stringify(error);
    return 'Error desconocido';
  }

  // IntersectionObserver for lazy loading images
  function initImageObserver() {
    if (imageObserver) imageObserver.disconnect();
    imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const container = entry.target;
          const productId = parseInt(container.dataset.productId, 10);
          const product = productos.find(p => p.codiProd === productId);
          if (product && product.imagenId) loadProductImage(productId, container);
          imageObserver.unobserve(container);
        }
      });
    }, { rootMargin: '50px 0px', threshold: 0.1 });
  }

  async function fetchProductImage(productId, signal) {
    const res = await fetch(`${api}/imagenes/download/${productId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      signal
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  }

  async function loadProductImage(productId, container) {
    if (imageCache.has(productId)) {
      updateProductImageUI(productId, container, imageCache.get(productId));
      return;
    }
    if (imageLoadPromises.has(productId)) {
      try {
        const imageUrl = await imageLoadPromises.get(productId);
        updateProductImageUI(productId, container, imageUrl);
      } catch {
        showNoImagePlaceholder(container);
      }
      return;
    }

    const controller = new AbortController();
    imageControllers.set(productId, controller);
    const loadPromise = fetchProductImage(productId, controller.signal);
    imageLoadPromises.set(productId, loadPromise);

    try {
      const imageUrl = await loadPromise;
      imageCache.set(productId, imageUrl);
      updateProductImageUI(productId, container, imageUrl);
    } catch (error) {
      if (error.name !== 'AbortError') showNoImagePlaceholder(container);
    } finally {
      imageLoadPromises.delete(productId);
      imageControllers.delete(productId);
    }
  }

  function updateProductImageUI(productId, container, imageUrl) {
    const product = productos.find(p => p.codiProd === productId);
    if (!product || !container) return;
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = product.nombProd;
    img.className = 'product-image loaded';
    container.innerHTML = '';
    container.appendChild(img);
  }

  function showNoImagePlaceholder(container) {
    container.innerHTML = `
      <div class="image-placeholder">
        <span class="material-icons">inventory_2</span>
        <div>Sin imagen</div>
      </div>
    `;
  }

  function cancelImageLoad(productId) {
    if (imageControllers.has(productId)) {
      imageControllers.get(productId).abort();
      imageControllers.delete(productId);
    }
    imageLoadPromises.delete(productId);
  }

  function getImagePlaceholder(product) {
    if (product.imagenId) {
      return `
        <div class="image-placeholder image-loading">
          <div class="loading-spinner"></div>
          <div>Cargando imagen...</div>
        </div>`;
    } else {
      return `
        <div class="image-placeholder">
          <span class="material-icons">inventory_2</span>
          <div>Sin imagen</div>
        </div>`;
    }
  }

  async function loadProductos() {
    try {
      const res = await fetch(`${api}/productos`, { headers: { 'Authorization': `Bearer ${token}` }});
      if (!res.ok) { showAlert('Error al cargar los productos. Intenta nuevamente.', 'error'); return; }
      productos = await res.json();
      renderProductos(productos);
    } catch (err) {
      showAlert('Error de conexión. Verifica que el servidor esté disponible.', 'error');
    }
  }

  function renderProductos(list) {
    const container = qs('#productsContainer');
    if (!container) return;
    if (!list || list.length === 0) {
      container.innerHTML = `
        <div class="no-data"><h3>No hay productos registrados</h3><p>Agrega tu primer producto usando el botón "Nuevo Producto"</p></div>`;
      return;
    }

    container.innerHTML = list.map(p => `
      <div class="product-card" data-product-id="${p.codiProd}">
        <div class="product-image-container" data-product-id="${p.codiProd}" id="img-container-${p.codiProd}">
          ${getImagePlaceholder(p)}
        </div>
        <div class="product-body">
          <div class="product-name">${p.nombProd}</div>
          <div class="product-info">
            <div class="product-price">S/ ${p.precProd.toFixed(2)}</div>
            <span class="stock-badge">Stock: ${p.stocProd}</span>
          </div>
          <div class="product-actions">
            <button class="btn-edit" data-edit="${p.codiProd}"><span class="material-icons">edit</span>Editar</button>
            <button class="btn-image" data-image="${p.codiProd}"><span class="material-icons">image</span>Imagen</button>
            <button class="btn-delete" data-delete="${p.codiProd}"><span class="material-icons">delete</span>Eliminar</button>
          </div>
        </div>
      </div>`).join('');

    initImageObserver();
    // observe containers
    list.forEach(p => {
      const imgContainer = document.getElementById(`img-container-${p.codiProd}`);
      if (imgContainer && p.imagenId) {
        if (imageCache.has(p.codiProd)) {
          updateProductImageUI(p.codiProd, imgContainer, imageCache.get(p.codiProd));
        } else {
          imageObserver.observe(imgContainer);
        }
      }
    });

    attachProductActions();
  }

  function attachProductActions() {
    const container = qs('#productsContainer');
    container.addEventListener('click', async (e) => {
      const editBtn = e.target.closest('[data-edit]');
      const imageBtn = e.target.closest('[data-image]');
      const deleteBtn = e.target.closest('[data-delete]');

      if (editBtn) {
        const id = parseInt(editBtn.getAttribute('data-edit'), 10);
        openModal(id);
      } else if (imageBtn) {
        currentProductId = parseInt(imageBtn.getAttribute('data-image'), 10);
        openImageModal(currentProductId);
      } else if (deleteBtn) {
        const id = parseInt(deleteBtn.getAttribute('data-delete'), 10);
        await deleteProduct(id);
      }
    });
  }

  function openModal(id = null) {
    const modal = qs('#productModal');
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    qs('#productForm').reset();
    if (id) {
      const p = productos.find(x => x.codiProd === id);
      if (!p) {
        showAlert('Producto no encontrado', 'error');
        closeModal();
        return;
      }
      qs('#modalTitle').querySelector('span:not(.material-icons)').textContent = 'Editar Producto';
      qs('#modalIcon').textContent = 'edit';
      qs('#productId').value = p.codiProd;
      qs('#productVersion').value = p.version || '';
      qs('#productName').value = p.nombProd;
      qs('#productPrice').value = p.precProd;
      qs('#productStock').value = p.stocProd;
    } else {
      qs('#modalTitle').querySelector('span:not(.material-icons)').textContent = 'Nuevo Producto';
      qs('#modalIcon').textContent = 'add_box';
      qs('#productId').value = '';
      qs('#productVersion').value = '';
    }
    setTimeout(() => qs('#productName').focus(), 100);
  }

  function closeModal() {
    const modal = qs('#productModal');
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    
    // Resetear el botón de submit a su estado original
    const form = qs('#productForm');
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span class="material-icons" aria-hidden="true">save</span>Guardar';
  }

  function openImageModal(id) {
    currentProductId = id;
    const modal = qs('#imageModal');
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    qs('#imageForm').reset();
    setTimeout(() => qs('#imageFile').focus(), 100);
  }

  function closeImageModal() {
    const modal = qs('#imageModal');
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    currentProductId = null;
    
    // Resetear el botón de submit a su estado original
    const form = qs('#imageForm');
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span class="material-icons" aria-hidden="true">upload</span>Subir Imagen';
  }

  async function deleteProduct(id) {
    const product = productos.find(p => p.codiProd === id);
    if (!product) return;
    
    if (!confirm(`¿Estás seguro de eliminar el producto "${product.nombProd}"?`)) return;
    
    try {
      const res = await fetch(`${api}/productos/${id}`, { 
        method: 'DELETE', 
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        showAlert('Producto eliminado exitosamente', 'success');
        imageCache.delete(id);
        cancelImageLoad(id);
        await loadProductos();
      } else {
        showAlert('Error al eliminar el producto. Intenta nuevamente.', 'error');
      }
    } catch {
      showAlert('Error de conexión. Verifica que el servidor esté disponible.', 'error');
    }
  }

  async function updateProductImage(productId) {
    // Limpiar cache de la imagen anterior
    if (imageCache.has(productId)) {
      const oldUrl = imageCache.get(productId);
      URL.revokeObjectURL(oldUrl);
      imageCache.delete(productId);
    }
    
    cancelImageLoad(productId);
    
    // Cargar la nueva imagen
    const imgContainer = document.getElementById(`img-container-${productId}`);
    if (imgContainer) {
      imgContainer.innerHTML = `
        <div class="image-placeholder image-loading">
          <div class="loading-spinner"></div>
          <div>Cargando imagen...</div>
        </div>`;
      
      await loadProductImage(productId, imgContainer);
    }
  }

  // Form handlers
  function bindForms() {
    // product form
    const form = qs('#productForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = qs('#productId').value;
      const currentVersion = qs('#productVersion').value;
      
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="loading-spinner"></span> Guardando...';
      
      try {
        let data, url, method;
        if (id) {
          const getRes = await fetch(`${api}/productos/${id}`, { 
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (!getRes.ok) { 
            showAlert('Error: No se pudo obtener el producto para actualizar', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            return; 
          }
          
          const productoCompleto = await getRes.json();
          
          if (productoCompleto.version != currentVersion) {
            closeModal();
            showAlert('El producto fue modificado por otro usuario. Actualiza la página.', 'warning');
            await loadProductos();
            return;
          }
          
          data = { 
            ...productoCompleto, 
            nombProd: qs('#productName').value.trim(), 
            precProd: parseFloat(qs('#productPrice').value), 
            stocProd: parseInt(qs('#productStock').value, 10) 
          };
          url = `${api}/productos/${id}`; 
          method = 'PUT';
        } else {
          data = { 
            nombProd: qs('#productName').value.trim(), 
            precProd: parseFloat(qs('#productPrice').value), 
            stocProd: parseInt(qs('#productStock').value, 10) 
          };
          url = `${api}/productos`; 
          method = 'POST';
        }
        
        const res = await fetch(url, { 
          method, 
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${token}` 
          }, 
          body: JSON.stringify(data) 
        });
        
        if (res.ok) {
          showAlert(`Producto ${id ? 'actualizado' : 'creado'} exitosamente`, 'success');
          closeModal(); 
          await loadProductos();
        } else {
          const errorData = await res.json().catch(() => ({message: 'Error desconocido'}));
          if (errorData.status === 'conflict') {
            closeModal();
            showAlert('El producto fue modificado por otro usuario. Actualiza la página.', 'warning');
            await loadProductos();
          } else {
            showAlert(parseErrorMessage(errorData), 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
          }
        }
      } catch (err) {
        console.error('Error al guardar producto:', err);
        showAlert('Error de conexión. Verifica que el servidor esté disponible.', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });

    qs('#productFormCancel').addEventListener('click', closeModal);
    qs('#productModalClose').addEventListener('click', closeModal);

    // image form
    qs('#imageForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (!currentProductId) { 
        showAlert('Error: No se ha seleccionado un producto', 'error'); 
        closeImageModal(); 
        return; 
      }
      
      const file = qs('#imageFile').files[0];
      if (!file) { 
        showAlert('Por favor selecciona una imagen', 'error'); 
        return; 
      }
      
      // Validar tamaño de archivo (5MB)
      if (file.size > 5 * 1024 * 1024) {
        showAlert('La imagen es demasiado grande. Tamaño máximo: 5MB', 'error');
        return;
      }
      
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        showAlert('Por favor selecciona un archivo de imagen válido', 'error');
        return;
      }
      
      const submitBtn = e.target.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="loading-spinner"></span> Subiendo...';
      
      const formData = new FormData(); 
      formData.append('file', file);
      
      try {
        const res = await fetch(`${api}/imagenes/upload/${currentProductId}`, { 
          method: 'POST', 
          headers: { 'Authorization': `Bearer ${token}` }, 
          body: formData 
        });
        
        if (res.ok) {
          showAlert('Imagen subida exitosamente', 'success');
          
          // Actualizar el producto en el array local
          const productRes = await fetch(`${api}/productos/${currentProductId}`, { 
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (productRes.ok) {
            const updated = await productRes.json();
            const idx = productos.findIndex(p => p.codiProd === currentProductId);
            if (idx !== -1) {
              productos[idx] = updated;
            }
            
            // Actualizar la imagen en la UI sin recargar toda la lista
            await updateProductImage(currentProductId);
          }
          
          closeImageModal();
        } else {
          const err = await res.json().catch(() => ({message: 'Error al subir la imagen'}));
          showAlert(parseErrorMessage(err), 'error');
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      } catch (err) {
        console.error('Error al subir imagen:', err);
        // Verificar si realmente falló o si fue exitoso pero hubo error en la respuesta
        try {
          const verifyRes = await fetch(`${api}/productos/${currentProductId}`, { 
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (verifyRes.ok) {
            const product = await verifyRes.json();
            const oldProduct = productos.find(p => p.codiProd === currentProductId);
            
            // Si el imagenId cambió, significa que la imagen sí se subió
            if (product.imagenId && product.imagenId !== oldProduct?.imagenId) {
              showAlert('Imagen subida exitosamente', 'success');
              const idx = productos.findIndex(p => p.codiProd === currentProductId);
              if (idx !== -1) {
                productos[idx] = product;
              }
              await updateProductImage(currentProductId);
              closeImageModal();
              return;
            }
          }
        } catch (verifyErr) {
          console.error('Error verificando producto:', verifyErr);
        }
        
        showAlert('Error de conexión. Verifica que el servidor esté disponible.', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });

    qs('#imageFormCancel').addEventListener('click', closeImageModal);
    qs('#imageModalClose').addEventListener('click', closeImageModal);
  }

  function showAlert(message, type = 'info') {
    const container = qs('#alertContainer');
    if (!container) return;
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    container.appendChild(alert);
    setTimeout(() => alert.remove(), 4000);
  }

  // Public — called by router
  initImageObserver();
  bindForms();
  
  // wire new product button (if present)
  const newBtn = qs('#btnNewProduct');
  if (newBtn) newBtn.addEventListener('click', () => openModal());

  // search input
  const searchInput = qs('#searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase();
      const filtered = productos.filter(p => p.nombProd.toLowerCase().includes(q));
      renderProductos(filtered);
    });
  }

  // Load data initially
  await loadProductos();

  // cleanup when navigating away could be handled by letting module GC
}