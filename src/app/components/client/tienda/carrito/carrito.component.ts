import { Component, OnInit } from '@angular/core';
import { CarritoService } from 'src/app/services/carrito/carrito.service';
import { UsuarioService } from 'src/app/services/usuario/usuario.service';
import { CarritoResponse } from 'src/app/models/carrito/carrito-response';
import { UsuarioResponse } from 'src/app/models/usuarios/usuario-response';
import { ProductoService } from 'src/app/services/producto/producto.service';
import { ProductoResponse } from 'src/app/models/productos/producto-response';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ChangeDetectorRef, SecurityContext } from '@angular/core';

@Component({
  selector: 'app-carrito',
  templateUrl: './carrito.component.html',
  styleUrls: ['./carrito.component.css']
})
export class CarritoComponent implements OnInit {
  productosCarrito: any[] = [];
  todosLosProductos: ProductoResponse[] = [];
  carritoArray: any[] = [];
  contacto = {
    nombre: '',
    apellidos: '',
    telefono: '',
    direccion: '',
    email: ''
  };
  mensajeVacio: string = '';
  imagenesCache = new Map<string, SafeUrl>();
  mensajeError: string = '';
  mensajeExito: string = '';

  constructor(
    private carritoService: CarritoService,
    private usuarioService: UsuarioService,
    private productoService: ProductoService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarCarrito();
    this.cargarDatosUsuario();
  }

  cargarProductos() {
    this.productoService.obtenerTodos().subscribe(resp => {
      this.todosLosProductos = resp.productos;
      this.combinarCarritoConProductos();
    });
  }

  cargarCarrito() {
    this.carritoService.getCarrito().subscribe(resp => {
      this.carritoArray = [];
      if (resp && resp.carrito) {
        try {
          this.carritoArray = JSON.parse(resp.carrito);
        } catch (e) {
          this.carritoArray = [];
        }
      }
      this.combinarCarritoConProductos();
    });
  }

  combinarCarritoConProductos() {
    if (!this.todosLosProductos || !this.carritoArray) return;
    this.productosCarrito = this.carritoArray.map((item: any) => {
      const producto = this.todosLosProductos.find((p: any) => p.id === item.productoId);
      return {
        ...item,
        nombre: producto?.nombre || 'Producto',
        foto: producto?.foto,
        precio: producto?.precio || 0
      };
    });
  }

  cargarDatosUsuario() {
    const loginJson = sessionStorage.getItem('LOGIN');
    if (loginJson) {
      const loginData = JSON.parse(loginJson);
      const userId = loginData.user.id;
      if (userId) {
        this.usuarioService.obtenerPorId(userId).subscribe(resp => {
          const usuario = resp.usuario;
          this.contacto.nombre = usuario.nombre || '';
          this.contacto.apellidos = usuario.apellidos || '';
          this.contacto.telefono = usuario.telefono || '';
          this.contacto.direccion = usuario.direccion || '';
          this.contacto.email = usuario.email || '';
        });
      }
    }
  }

  get subtotal(): number {
    return this.productosCarrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
  }

  get total(): number {
    return this.subtotal; // Envío gratis
  }

  actualizarCantidad(item: any, nuevaCantidad: number) {
    const diferencia = nuevaCantidad - item.cantidad;
    // Si la nueva cantidad es 0, eliminamos el producto
    if (nuevaCantidad === 0) {
      console.log('Enviando al backend:', [{ productoId: item.productoId, cantidad: 0 }]);
      this.carritoService.updateCarrito([{ productoId: item.productoId, cantidad: 0 }]).subscribe({
        next: () => this.cargarCarrito(),
        error: (error) => {
          console.error('Error al actualizar carrito:', error);
          if (error.error && error.error.mensaje) {
            alert(error.error.mensaje);
          } else {
            alert('Error al actualizar el carrito');
          }
          this.cargarCarrito();
        }
      });
      return;
    }
    // Si la diferencia es 0, no hacemos nada
    if (diferencia === 0) return;
    // Si la diferencia es positiva o negativa, enviamos solo el producto modificado
    console.log('Enviando al backend:', [{ productoId: item.productoId, cantidad: diferencia }]);
    this.carritoService.updateCarrito([{ productoId: item.productoId, cantidad: diferencia }]).subscribe({
      next: () => this.cargarCarrito(),
      error: (error) => {
        console.error('Error al actualizar carrito:', error);
        if (error.error && error.error.mensaje) {
          alert(error.error.mensaje);
        } else {
          alert('Error al actualizar el carrito');
        }
        this.cargarCarrito();
      }
    });
  }

  sumarCantidad(item: any) {
    const nuevaCantidad = item.cantidad + 1;
    this.actualizarCantidad(item, nuevaCantidad);
  }

  restarCantidad(item: any) {
    if (item.cantidad > 1) {
      const nuevaCantidad = item.cantidad - 1;
      this.actualizarCantidad(item, nuevaCantidad);
    } else {
      this.eliminarProducto(item);
    }
  }

  finalizarCompra() {
    // Validar datos de contacto obligatorios
    if (!this.contacto.nombre || !this.contacto.apellidos || !this.contacto.telefono || !this.contacto.direccion || !this.contacto.email) {
      this.mensajeError = 'Debes completar todos los datos de contacto para finalizar el pedido.';
      this.mensajeExito = '';
      return;
    }
    // Limpiar mensajes previos
    this.mensajeError = '';
    this.mensajeExito = '';
    // Llamar al endpoint de crear pedido
    this.carritoService.finalizarPedido().subscribe({
      next: (resp) => {
        this.mensajeExito = resp.mensaje || '¡Pedido realizado con éxito!';
        this.mensajeError = '';
        this.cargarCarrito(); // Vacía el carrito en el frontend
      },
      error: (error) => {
        if (error.error && error.error.mensaje) {
          this.mensajeError = error.error.mensaje;
        } else {
          this.mensajeError = 'Error al finalizar el pedido';
        }
        this.mensajeExito = '';
      }
    });
  }

  getImageUrl(fotoPath: string | undefined): SafeUrl {
    if (!fotoPath) return 'assets/images/no-image.png';

    if (this.imagenesCache.has(fotoPath)) {
      return this.imagenesCache.get(fotoPath)!;
    }

    this.productoService.obtenerImagen(fotoPath).subscribe({
      next: (blob: Blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const safeUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
        this.imagenesCache.set(fotoPath, safeUrl);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.imagenesCache.set(fotoPath, 'assets/images/no-image.png');
      }
    });

    return 'assets/images/no-image.png';
  }

  eliminarProducto(item: any) {
    console.log('Enviando al backend para eliminar:', [{ productoId: item.productoId, cantidad: 0 }]);
    this.carritoService.updateCarrito([{ productoId: item.productoId, cantidad: 0 }]).subscribe({
      next: () => this.cargarCarrito(),
      error: (error) => {
        console.error('Error al eliminar producto:', error);
        if (error.error && error.error.mensaje) {
          alert(error.error.mensaje);
        } else {
          alert('Error al eliminar el producto');
        }
        this.cargarCarrito();
      }
    });
  }
}
