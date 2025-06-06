import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { CategoriaService } from 'src/app/services/categoria/categoria.service';
import { ProductoService } from 'src/app/services/producto/producto.service';
import { CategoriaResponse } from 'src/app/models/categorias/categoria-response';
import { CategoriaRequest } from 'src/app/models/categorias/categoria-request';
import { ProductoResponse } from 'src/app/models/productos/producto-response';

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
          this.productosDisponibles = response.productos.filter(producto => producto.categoriaId !== this.categoriaId);
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
      next: (response: { mensaje: string, categoria: CategoriaResponse }) => {
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
