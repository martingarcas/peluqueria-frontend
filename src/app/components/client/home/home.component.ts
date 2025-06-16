import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ProductoService } from 'src/app/services/producto/producto.service';
import { ServicioService } from 'src/app/services/servicio/servicio.service';
import { ProductoResponse } from 'src/app/models/productos/producto-response';
import { ServicioResponse } from 'src/app/models/servicios/servicio-response';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  serviciosDestacados: ServicioResponse[] = [];
  productosDestacados: ProductoResponse[] = [];
  galeria: string[] = [];
  imagenActiva: number = 0;

  // Diccionario de iconos de servicios
  iconosServicios: { [nombre: string]: string } = {
    'Corte clásico': 'assets/images/corteclasico.png',
    'Lavado y peinado': 'assets/images/lavadopeinado.png',
    'Coloración': 'assets/images/coloracion.png',
    'Manicura': 'assets/images/manicura.png',
    'Barbería completa': 'assets/images/barberia.png',
    'Tratamiento capilar': 'assets/images/tratamientocapilar.png'
  };

  constructor(
    private productoService: ProductoService,
    private servicioService: ServicioService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.cargarServiciosDestacados();
    this.cargarProductosDestacados();
    this.cargarGaleria();
  }

  cargarServiciosDestacados(): void {
    this.servicioService.obtenerTodos().subscribe({
      next: (resp) => {
        // Mostramos solo los primeros 3 servicios
        this.serviciosDestacados = resp.servicios.slice(0, 3);
      },
      error: () => {
        this.serviciosDestacados = [];
      }
    });
  }

  cargarProductosDestacados(): void {
    this.productoService.obtenerTodos().subscribe({
      next: (resp: { mensaje: string, productos: ProductoResponse[] }) => {
        // Mostramos solo los primeros 3 productos
        this.productosDestacados = resp.productos.slice(0, 3);

        // Cargamos las imágenes directamente
        this.productosDestacados.forEach(producto => {
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
          }
        });
      },
      error: () => {
        this.productosDestacados = [];
      }
    });
  }

  cargarGaleria(): void {
    this.galeria = [
      'assets/images/galeria/local1.jpg',
      'assets/images/galeria/local2.jpg',
      'assets/images/galeria/local3.jpg',
      'assets/images/galeria/local4.jpg',
      'assets/images/galeria/local5.jpg',
      'assets/images/galeria/local6.jpg'
    ];
    this.imagenActiva = 0;
  }

  avanzarGaleria(): void {
    this.imagenActiva = (this.imagenActiva + 1) % this.galeria.length;
  }

  retrocederGaleria(): void {
    this.imagenActiva = (this.imagenActiva - 1 + this.galeria.length) % this.galeria.length;
  }

  getIcono(servicio: ServicioResponse): string {
    return this.iconosServicios[servicio.nombre] || 'assets/images/no-image.png';
  }

  getImgClass(posicion: number): string {
    const total = this.galeria.length;
    if (posicion === this.imagenActiva) return 'first-layer';
    if ((posicion === (this.imagenActiva - 1 + total) % total)) return 'second-layer left';
    if ((posicion === (this.imagenActiva + 1) % total)) return 'second-layer right';
    if ((posicion === (this.imagenActiva - 2 + total) % total)) return 'third-layer left darken';
    if ((posicion === (this.imagenActiva + 2) % total)) return 'third-layer right darken';
    return 'oculta';
  }
}
