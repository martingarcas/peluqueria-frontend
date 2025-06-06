import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ProductoService } from 'src/app/services/producto/producto.service';
import { CategoriaService } from 'src/app/services/categoria/categoria.service';
import { ProductoResponse } from 'src/app/models/productos/producto-response';
import { CategoriaResponse } from 'src/app/models/categorias/categoria-response';
import { CarritoService } from 'src/app/services/carrito/carrito.service';

@Component({
  selector: 'app-lista-productos',
  templateUrl: './lista-productos.component.html',
  styleUrls: ['./lista-productos.component.css']
})
export class ListaProductosComponent implements OnInit {
  productos: ProductoResponse[] = [];
  productosFiltrados: ProductoResponse[] = [];
  categorias: CategoriaResponse[] = [];
  categoriaSeleccionada: number | null = null;
  textoBusqueda: string = '';
  mensajeError: string = '';
  mensajeExito: string = '';
  cantidades: { [productoId: number]: number } = {};

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private sanitizer: DomSanitizer,
    private carritoService: CarritoService
  ) { }

  ngOnInit(): void {
    this.cargarCategorias();
    this.cargarProductos();
  }

  cargarCategorias(): void {
    this.categoriaService.obtenerTodas().subscribe({
      next: (resp) => {
        this.categorias = resp.categorias;
      },
      error: () => {
        this.mensajeError = 'No se pudieron cargar las categorías';
      }
    });
  }

  cargarProductos(): void {
    this.productoService.obtenerTodos().subscribe({
      next: (resp) => {
        this.productos = resp.productos;
        // Cargar imágenes para cada producto
        this.productos.forEach(producto => {
          if (producto.foto) {
            this.productoService.obtenerImagen(producto.foto).subscribe({
              next: (blob: Blob) => {
                const objectUrl = URL.createObjectURL(blob);
                producto.imagenUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
              },
              error: () => {
                producto.imagenUrl = 'assets/images/no-image.png';
              }
            });
          } else {
            producto.imagenUrl = 'assets/images/no-image.png';
          }
        });
        this.filtrarProductos();
      },
      error: () => {
        this.mensajeError = 'No se pudieron cargar los productos';
      }
    });
  }

  filtrarProductos(): void {
    this.productosFiltrados = this.productos.filter(producto => {
      const coincideCategoria = this.categoriaSeleccionada ? producto.categoriaId === this.categoriaSeleccionada : true;
      const coincideTexto = this.textoBusqueda.trim().length > 0 ?
        (producto.nombre.toLowerCase().includes(this.textoBusqueda.toLowerCase()) ||
         producto.descripcion.toLowerCase().includes(this.textoBusqueda.toLowerCase())) : true;
      return coincideCategoria && coincideTexto;
    });
  }

  onCategoriaChange(id: string): void {
    this.categoriaSeleccionada = id ? +id : null;
    this.filtrarProductos();
  }

  onBuscarChange(valor: string): void {
    this.textoBusqueda = valor;
    this.filtrarProductos();
  }

  addToCart(producto: ProductoResponse, cantidad?: number): void {
    const cantidadFinal = cantidad ?? this.cantidades[producto.id] ?? 1;
    if (cantidadFinal < 1) return;
    this.carritoService.getCarrito().subscribe({
      next: (carrito) => {
        const carritoArray = Array.isArray(carrito) ? carrito : [];
        const existe = carritoArray.find((itemCarrito: any) => itemCarrito.productoId === producto.id);
        let productosActualizados;
        if (existe) {
          productosActualizados = carritoArray.map((itemCarrito: any) =>
            itemCarrito.productoId === producto.id
              ? { productoId: itemCarrito.productoId, cantidad: itemCarrito.cantidad + cantidadFinal }
              : { productoId: itemCarrito.productoId, cantidad: itemCarrito.cantidad }
          );
        } else {
          productosActualizados = [
            ...carritoArray.map((itemCarrito: any) => ({ productoId: itemCarrito.productoId, cantidad: itemCarrito.cantidad })),
            {
              productoId: producto.id,
              cantidad: cantidadFinal
            }
          ];
        }
        this.carritoService.updateCarrito(productosActualizados).subscribe({
          next: () => {
            this.mensajeExito = `Añadido${cantidadFinal > 1 ? ' (' + cantidadFinal + ' uds.)' : ''} al carrito`;
            setTimeout(() => this.mensajeExito = '', 2000);
            this.cantidades[producto.id] = 1; // Resetear a 1 tras añadir
          },
          error: () => {
            // Manejar error
          }
        });
      },
      error: () => {
        // Manejar error
      }
    });
  }
}
