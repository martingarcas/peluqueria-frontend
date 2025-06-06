import { Component, OnInit } from '@angular/core';
import { CarritoService } from 'src/app/services/carrito/carrito.service';
import { UsuarioService } from 'src/app/services/usuario/usuario.service';
import { ProductoService } from 'src/app/services/producto/producto.service';
import { ProductoResponse } from 'src/app/models/productos/producto-response';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

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
  mensajeError: string = '';
  mensajeExito: string = '';

  constructor(
    private carritoService: CarritoService,
    private usuarioService: UsuarioService,
    private productoService: ProductoService,
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
      // Cargar imágenes para cada producto
      this.todosLosProductos.forEach(producto => {
        if (producto.foto) {
          this.productoService.obtenerImagen(producto.foto).subscribe({
            next: (blob: Blob) => {
              const objectUrl = URL.createObjectURL(blob);
              producto.imagenUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
              // Actualizar productos del carrito si ya existen
              this.actualizarImagenesCarrito();
            },
            error: () => {
              producto.imagenUrl = 'assets/images/no-image.png';
              this.actualizarImagenesCarrito();
            }
          });
        } else {
          producto.imagenUrl = 'assets/images/no-image.png';
          this.actualizarImagenesCarrito();
        }
      });
    });
  }

  actualizarImagenesCarrito() {
    if (this.carritoArray.length > 0) {
      this.combinarCarritoConProductos();
    }
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
      const producto = this.todosLosProductos.find((producto: any) => producto.id === item.productoId);
      return {
        ...item,
        nombre: producto?.nombre || 'Producto',
        foto: producto?.foto,
        precio: producto?.precio || 0,
        imagenUrl: producto?.imagenUrl || 'assets/images/no-image.png'
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
    return Number(this.productosCarrito.reduce((acumulador, item) => acumulador + (item.precio * item.cantidad), 0).toFixed(2));
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
