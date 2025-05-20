import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ProductoService } from 'src/app/services/producto/producto.service';
import { CategoriaService } from 'src/app/services/categoria/categoria.service';
import { ProductoResponse } from 'src/app/models/productos/producto-response';
import { CategoriaResponse } from 'src/app/models/categorias/categoria-response';
import { SecurityContext } from '@angular/core';
import { CarritoService } from 'src/app/services/carrito/carrito.service';

@Component({
  selector: 'app-lista-productos',
  templateUrl: './lista-productos.component.html',
  styleUrls: ['./lista-productos.component.css']
})
export class ListaProductosComponent implements OnInit, OnDestroy {
  productos: ProductoResponse[] = [];
  productosFiltrados: ProductoResponse[] = [];
  categorias: CategoriaResponse[] = [];
  categoriaSeleccionada: number | null = null;
  textoBusqueda: string = '';
  mensajeError: string = '';
  mensajeExito: string = '';

  // Cache de imágenes
  imagenesCache = new Map<string, SafeUrl>();

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private carritoService: CarritoService
  ) { }

  ngOnInit(): void {
    this.cargarCategorias();
    this.cargarProductos();
  }

  ngOnDestroy(): void {
    // Limpiar las URLs de las imágenes cacheadas
    this.imagenesCache.forEach((safeUrl) => {
      const url = this.sanitizer.sanitize(SecurityContext.URL, safeUrl);
      if (url) URL.revokeObjectURL(url);
    });
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
        this.filtrarProductos();
      },
      error: () => {
        this.mensajeError = 'No se pudieron cargar los productos';
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
        console.error('Error al cargar la imagen:', error);
        this.imagenesCache.set(fotoPath, 'assets/images/no-image.png');
      }
    });

    return 'assets/images/no-image.png';
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

  addToCart(producto: ProductoResponse): void {
    this.carritoService.getCarrito().subscribe({
      next: (carrito) => {
        const carritoArray = Array.isArray(carrito) ? carrito : [];
        const existe = carritoArray.find((p: any) => p.productoId === producto.id);
        let productosActualizados;
        if (existe) {
          productosActualizados = carritoArray.map((p: any) =>
            p.productoId === producto.id
              ? { productoId: p.productoId, cantidad: p.cantidad + 1 }
              : { productoId: p.productoId, cantidad: p.cantidad }
          );
        } else {
          productosActualizados = [
            ...carritoArray.map((p: any) => ({ productoId: p.productoId, cantidad: p.cantidad })),
            {
              productoId: producto.id,
              cantidad: 1
            }
          ];
        }
        this.carritoService.updateCarrito(productosActualizados).subscribe({
          next: () => {
            this.mensajeExito = 'Producto añadido al carrito';
            setTimeout(() => this.mensajeExito = '', 2000);
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
