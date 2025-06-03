import { Component, OnInit, ChangeDetectorRef, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
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
  animando: boolean = false;
  animacion: '' | 'slide-left' | 'slide-right' = '';
  direccion: 'izq' | 'der' = 'der';

  // Cache de imágenes de productos
  imagenesCache = new Map<string, SafeUrl>();

  // Diccionario de iconos de servicios
  iconosServicios: { [nombre: string]: string } = {
    'Corte clásico': 'assets/images/corteclasico.png',
    'Lavado y peinado': 'assets/images/lavadopeinado.png',
    'Coloración': 'assets/images/coloracion.png',
    'Manicura': 'assets/images/manicura.png',
    'Barbería completa': 'assets/images/barberia.png',
    'Tratamiento capilar': 'assets/images/tratamientocapilar.png'
    // Añade más si tienes
  };

  constructor(
    private productoService: ProductoService,
    private servicioService: ServicioService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
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
      next: (resp) => {
        // Mostramos solo los primeros 3 productos
        this.productosDestacados = resp.productos.slice(0, 3);
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
      // Añade/quita según tus imágenes
    ];
    this.imagenActiva = 0;
  }

  get anteriorIndex(): number {
    return (this.imagenActiva - 1 + this.galeria.length) % this.galeria.length;
  }
  get siguienteIndex(): number {
    return (this.imagenActiva + 1) % this.galeria.length;
  }

  get visibleImages(): string[] {
    return [
      this.galeria[this.anteriorIndex],
      this.galeria[this.imagenActiva],
      this.galeria[this.siguienteIndex]
    ];
  }

  avanzarGaleria(): void {
    this.imagenActiva = (this.imagenActiva + 1) % this.galeria.length;
  }

  retrocederGaleria(): void {
    this.imagenActiva = (this.imagenActiva - 1 + this.galeria.length) % this.galeria.length;
  }

  getTranslateX(): string {
    const ancho = 180; // px (todas las imágenes igual)
    const gap = 24; // px
    const offset = (ancho + gap) * this.imagenActiva;
    // El contenedor visible tiene 3 imágenes, así que centramos la activa
    const visibleWidth = (ancho + gap) * 3 - gap;
    const centerOffset = (visibleWidth / 2) - (ancho / 2);
    return `translateX(-${offset - centerOffset}px)`;
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
      error: () => {
        this.imagenesCache.set(fotoPath, 'assets/images/no-image.png');
      }
    });

    return 'assets/images/no-image.png';
  }

  getIcono(servicio: ServicioResponse): string {
    return this.iconosServicios[servicio.nombre] || 'assets/images/no-image.png';
  }

  getLayerClass(i: number): string {
    const total = this.galeria.length;
    if (i === this.imagenActiva) return 'first-layer';
    if ((i === (this.imagenActiva - 1 + total) % total)) return 'second-layer left';
    if ((i === (this.imagenActiva + 1) % total)) return 'second-layer right';
    if ((i === (this.imagenActiva - 2 + total) % total)) return 'third-layer left darken';
    if ((i === (this.imagenActiva + 2) % total)) return 'third-layer right darken';
    return 'oculta';
  }
}
