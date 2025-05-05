import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { CategoriaService } from 'src/app/services/categoria/categoria.service';
import { ProductoService } from 'src/app/services/producto/producto.service';
import { CategoriaResponse } from 'src/app/models/categorias/categoria-response';
import { CategoriaRequest } from 'src/app/models/categorias/categoria-request';
import { ProductoResponse } from 'src/app/models/productos/producto-response';
import { ProductoRequest } from 'src/app/models/productos/producto-request';

interface ApiResponse {
  mensaje: string;
  categoria?: CategoriaResponse;
}

@Component({
  selector: 'app-form-categoria',
  templateUrl: './form-categoria.component.html',
  styleUrls: ['./form-categoria.component.css']
})
export class FormCategoriaComponent implements OnInit {
  @Input() categoriaId: number | null | undefined = null;
  @Output() formularioCerrado = new EventEmitter<void>();
  @Output() categoriaGuardada = new EventEmitter<string>();

  categoriaForm: FormGroup;
  isEditing: boolean = false;
  mensajeError: string = '';
  mensajeExito: string = '';
  productosDisponibles: ProductoResponse[] = [];
  productosSeleccionados: number[] = [];
  mostrarNuevosProductos: boolean = false;
  mostrarProductosExistentes: boolean = false;
  camposDeshabilitados: boolean = false;
  readonly NOMBRE_PROTEGIDO = 'Otros productos';
  readonly MAX_IMAGE_SIZE = 500 * 1024; // 500KB en bytes
  readonly MAX_DIMENSION = 800; // máximo 800px de ancho o alto

  constructor(
    private fb: FormBuilder,
    private categoriaService: CategoriaService,
    private productoService: ProductoService
  ) {
    this.categoriaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      productosNuevos: this.fb.array([]),
      forzarMovimiento: [false]
    });
  }

  ngOnInit(): void {
    if (this.categoriaId) {
      this.isEditing = true;
      this.cargarCategoria(this.categoriaId);
    }
    this.cargarProductosDisponibles();
  }

  cargarProductosDisponibles(): void {
    this.productoService.obtenerTodos().subscribe({
      next: (response) => {
        if (this.isEditing) {
          this.productosDisponibles = response.productos.filter(p => p.categoriaId !== this.categoriaId);
        } else {
          this.productosDisponibles = response.productos;
        }
      },
      error: (error) => {
        this.mostrarError('Error al cargar los productos disponibles');
        console.error('Error:', error);
      }
    });
  }

  get productosNuevosArray(): FormArray {
    return this.categoriaForm.get('productosNuevos') as FormArray;
  }

  agregarNuevoProducto(): void {
    const nuevoProducto = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      precio: ['', [Validators.required, Validators.min(0.01)]],
      stock: ['', [Validators.required, Validators.min(0)]],
      foto: [null]
    });

    this.productosNuevosArray.push(nuevoProducto);
  }

  eliminarNuevoProducto(index: number): void {
    this.productosNuevosArray.removeAt(index);
  }

  toggleSeleccionProducto(productoId: number): void {
    const index = this.productosSeleccionados.indexOf(productoId);
    if (index === -1) {
      this.productosSeleccionados.push(productoId);
    } else {
      this.productosSeleccionados.splice(index, 1);
    }
  }

  private async comprimirImagen(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Redimensionar si excede el tamaño máximo
          if (width > this.MAX_DIMENSION || height > this.MAX_DIMENSION) {
            if (width > height) {
              height = Math.round((height * this.MAX_DIMENSION) / width);
              width = this.MAX_DIMENSION;
            } else {
              width = Math.round((width * this.MAX_DIMENSION) / height);
              height = this.MAX_DIMENSION;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Comprimir con calidad reducida si es necesario
          let quality = 0.7; // Empezar con 70% de calidad
          let base64 = canvas.toDataURL('image/jpeg', quality);

          // Reducir calidad hasta que el tamaño sea aceptable
          while (base64.length > this.MAX_IMAGE_SIZE && quality > 0.1) {
            quality -= 0.1;
            base64 = canvas.toDataURL('image/jpeg', quality);
          }

          if (base64.length > this.MAX_IMAGE_SIZE) {
            reject('La imagen es demasiado grande incluso después de la compresión');
            return;
          }

          resolve(base64.split(',')[1]); // Solo devolver la parte base64
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  onFileSelected(event: Event, index: number): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      this.mostrarError('Por favor, seleccione un archivo de imagen válido');
      return;
    }

    // Validar tamaño
    if (file.size > 5 * 1024 * 1024) { // 5MB
      this.mostrarError('La imagen es demasiado grande. El tamaño máximo es 5MB');
      return;
    }

    this.productosNuevosArray.at(index).patchValue({ foto: file });
  }

  cargarCategoria(id: number): void {
    this.categoriaService.obtenerPorId(id).subscribe({
      next: (response: ApiResponse) => {
        if (response.categoria) {
          this.categoriaForm.patchValue({
            nombre: response.categoria.nombre,
            descripcion: response.categoria.descripcion
          });

          // Deshabilitar campos si es la categoría protegida
          if (response.categoria.nombre === this.NOMBRE_PROTEGIDO) {
            this.camposDeshabilitados = true;
            this.categoriaForm.get('nombre')?.disable();
            this.categoriaForm.get('descripcion')?.disable();
          }
        }
      },
      error: (error: any) => {
        this.mostrarError(error.error?.mensaje || 'Error al cargar la categoría');
        console.error('Error:', error);
      }
    });
  }

  private tieneProductosConCategoria(): boolean {
    return this.productosSeleccionados.some(id => {
      const producto = this.productosDisponibles.find(p => p.id === id);
      return producto && producto.categoriaId !== null;
    });
  }

  private validarProductosExistentes(): boolean {
    if (this.productosSeleccionados.length === 0) return true;

    const tieneProductosConCategoria = this.tieneProductosConCategoria();
    const forzarMovimiento = this.categoriaForm.get('forzarMovimiento')?.value;

    if (tieneProductosConCategoria && !forzarMovimiento) {
      this.mostrarError('Hay productos seleccionados que ya pertenecen a otras categorías. Debe marcar "Forzar movimiento" para continuar.');
      return false;
    }

    return true;
  }

  private validarProductosNuevos(): boolean {
    if (this.productosNuevosArray.length === 0) return true;

    return this.productosNuevosArray.controls.every(control => {
      const producto = control.value;
      return (
        producto.nombre?.trim() &&
        producto.descripcion?.trim() &&
        producto.precio > 0 &&
        producto.stock >= 0
      );
    });
  }

  onSubmit(): void {
    if (this.categoriaForm.invalid) {
      this.mostrarError('Por favor, complete todos los campos requeridos correctamente');
      return;
    }

    // Validar productos existentes si hay seleccionados
    if (this.productosSeleccionados.length > 0 && !this.validarProductosExistentes()) {
      return;
    }

    // Validar productos nuevos si hay agregados
    if (this.productosNuevosArray.length > 0 && !this.validarProductosNuevos()) {
      return;
    }

    const categoriaRequest: CategoriaRequest = {
      nombre: this.categoriaForm.get('nombre')?.value,
      descripcion: this.categoriaForm.get('descripcion')?.value
    };

    // Preparar productos nuevos y sus fotos
    const productosNuevos = this.productosNuevosArray.controls.map(control => ({
      nombre: control.get('nombre')?.value,
      descripcion: control.get('descripcion')?.value,
      precio: control.get('precio')?.value,
      stock: control.get('stock')?.value
    }));

    const fotos = this.productosNuevosArray.controls
      .map(control => control.get('foto')?.value)
      .filter(foto => foto !== null && foto !== undefined);

    // Obtener el valor de forzarMovimiento
    const forzarMovimiento = this.categoriaForm.get('forzarMovimiento')?.value;

    if (this.isEditing) {
      // Actualizar categoría existente
      this.categoriaService.actualizar(
        this.categoriaId!,
        categoriaRequest,
        productosNuevos.length > 0 ? productosNuevos : undefined,
        this.productosSeleccionados.length > 0 ? this.productosSeleccionados : undefined,
        forzarMovimiento,
        fotos.length > 0 ? fotos : undefined
      ).subscribe({
        next: (response) => {
          this.mostrarExito(response.mensaje);
          this.categoriaGuardada.emit(response.mensaje);
          this.formularioCerrado.emit();
        },
        error: (error) => {
          this.mostrarError(error.error?.mensaje || 'Error al actualizar la categoría');
          console.error('Error:', error);
        }
      });
    } else {
      // Crear nueva categoría
      this.categoriaService.crear(
        categoriaRequest,
        productosNuevos.length > 0 ? productosNuevos : undefined,
        this.productosSeleccionados.length > 0 ? this.productosSeleccionados : undefined,
        forzarMovimiento,
        fotos.length > 0 ? fotos : undefined
      ).subscribe({
        next: (response) => {
          this.mostrarExito(response.mensaje);
          this.categoriaGuardada.emit(response.mensaje);
          this.formularioCerrado.emit();
        },
        error: (error) => {
          this.mostrarError(error.error?.mensaje || 'Error al crear la categoría');
          console.error('Error:', error);
        }
      });
    }
  }

  cancelar(): void {
    this.formularioCerrado.emit();
  }

  // Métodos para manejar mensajes
  private mostrarExito(mensaje: string): void {
    this.limpiarMensajes();
    this.mensajeExito = mensaje;
    setTimeout(() => this.mensajeExito = '', 3000);
  }

  private mostrarError(mensaje: string): void {
    this.limpiarMensajes();
    this.mensajeError = mensaje;
    setTimeout(() => this.mensajeError = '', 3000);
  }

  private limpiarMensajes(): void {
    this.mensajeError = '';
    this.mensajeExito = '';
  }
}
