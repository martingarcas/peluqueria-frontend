import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductoResponse } from 'src/app/models/productos/producto-response';
import { CategoriaResponse } from 'src/app/models/categorias/categoria-response';
import { ProductoService } from 'src/app/services/producto/producto.service';
import { CategoriaService } from 'src/app/services/categoria/categoria.service';
import { ProductoRequest } from 'src/app/models/productos/producto-request';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-form-producto',
  templateUrl: './form-producto.component.html',
  styleUrls: ['./form-producto.component.css']
})
export class FormProductoComponent implements OnInit {
  @Input() modo: 'crear' | 'editar' = 'crear';
  @Input() productoAEditar: ProductoResponse | null = null;
  @Output() onGuardar = new EventEmitter<any>();
  @Output() onCancelar = new EventEmitter<void>();

  productoForm: FormGroup;
  categorias: CategoriaResponse[] = [];
  imagenSeleccionada: File | null = null;
  previewImagen: SafeUrl = 'assets/images/no-image.png';
  mensajeError: string = '';
  mensajeExito: string = '';

  constructor(
    private fb: FormBuilder,
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private sanitizer: DomSanitizer
  ) {
    this.productoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      precio: ['', [Validators.required, Validators.min(0)]],
      stock: ['', [Validators.required, Validators.min(0)]],
      categoriaId: ['', Validators.required],
      imagen: [null]
    });
  }

  ngOnInit(): void {
    this.cargarCategorias();
    if (this.modo === 'editar' && this.productoAEditar) {
      this.cargarDatosProducto();
    }
  }

  cargarCategorias(): void {
    this.categoriaService.obtenerTodas().subscribe({
      next: (response) => {
        this.categorias = response.categorias;
      },
      error: (error) => {
        this.mostrarError('Error al cargar las categorías');
      }
    });
  }

  cargarDatosProducto(): void {
    if (this.productoAEditar) {
      this.productoForm.patchValue({
        nombre: this.productoAEditar.nombre,
        descripcion: this.productoAEditar.descripcion,
        precio: this.productoAEditar.precio,
        stock: this.productoAEditar.stock,
        categoriaId: this.productoAEditar.categoriaId
      });

      if (this.productoAEditar.foto) {
        this.productoService.obtenerImagen(this.productoAEditar.foto).subscribe({
          next: (blob: Blob) => {
            const objectUrl = URL.createObjectURL(blob);
            this.previewImagen = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
          },
          error: () => {
            this.previewImagen = 'assets/images/no-image.png';
          }
        });
      }
    }
  }

  onImagenSeleccionada(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.imagenSeleccionada = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewImagen = this.sanitizer.bypassSecurityTrustUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.productoForm.invalid) {
      this.mostrarError('Por favor, complete todos los campos requeridos correctamente');
      return;
    }

    const productoRequest: ProductoRequest = {
      nombre: this.productoForm.get('nombre')?.value,
      descripcion: this.productoForm.get('descripcion')?.value,
      precio: this.productoForm.get('precio')?.value,
      stock: this.productoForm.get('stock')?.value,
      categoriaId: this.productoForm.get('categoriaId')?.value,
      foto: this.imagenSeleccionada || undefined
    };

    try {
      let response;
      if (this.modo === 'crear') {
        response = await this.productoService.crear(productoRequest).toPromise();
      } else {
        response = await this.productoService.actualizar(this.productoAEditar!.id, productoRequest).toPromise();
      }

      this.onGuardar.emit(response);
      this.mostrarExito('Producto guardado correctamente');
    } catch (error: any) {
      this.mostrarError(error.error?.mensaje || 'Error al guardar el producto');
    }
  }

  cancelar(): void {
    this.onCancelar.emit();
  }

  private mostrarExito(mensaje: string): void {
    this.mensajeError = '';
    this.mensajeExito = mensaje;
    setTimeout(() => this.mensajeExito = '', 3000);
  }

  private mostrarError(mensaje: string): void {
    this.mensajeExito = '';
    this.mensajeError = mensaje;
    setTimeout(() => this.mensajeError = '', 3000);
  }
}