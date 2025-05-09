import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { SecurityContext } from '@angular/core';
import { UsuarioResponse } from 'src/app/models/usuarios/usuario-response';
import { UsuarioService } from 'src/app/services/usuario/usuario.service';
import { ContratoService } from 'src/app/services/contrato/contrato.service';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-lista-usuarios',
  templateUrl: './lista-usuarios.component.html',
  styleUrls: ['./lista-usuarios.component.css'],
  animations: [
    trigger('expandCollapse', [
      transition(':enter', [
        style({ height: '0', opacity: 0 }),
        animate('200ms ease-out', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ height: '0', opacity: 0 }))
      ])
    ])
  ]
})
export class ListaUsuariosComponent implements OnInit, OnDestroy {
  usuarios: UsuarioResponse[] = [];
  usuariosFiltrados: UsuarioResponse[] = [];
  mensajeError: string = '';
  mensajeExito: string = '';
  searchTerm: string = '';
  selectedRole: string = '';

  // Propiedades para el modal de eliminación
  mostrarModalConfirmacion = false;
  usuarioAEliminar: UsuarioResponse | null = null;

  // Propiedades para el formulario
  mostrarFormulario = false;
  modoFormulario: 'crear' | 'editar' = 'crear';
  usuarioEnEdicion: UsuarioResponse | null = null;

  // Cache de imágenes
  imagenesCache = new Map<string, SafeUrl>();

  constructor(
    private usuarioService: UsuarioService,
    private contratoService: ContratoService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  ngOnDestroy(): void {
    // Limpiar las URLs de las imágenes cacheadas
    this.imagenesCache.forEach((safeUrl) => {
      const url = this.sanitizer.sanitize(SecurityContext.URL, safeUrl);
      if (url) URL.revokeObjectURL(url);
    });
  }

  getImageUrl(fotoPath: string | undefined): SafeUrl {
    if (!fotoPath) return 'assets/images/no-image.png';

    if (this.imagenesCache.has(fotoPath)) {
      return this.imagenesCache.get(fotoPath)!;
    }

    this.usuarioService.obtenerImagen(fotoPath).subscribe({
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

  cargarUsuarios(): void {
    this.usuarioService.obtenerTodos().subscribe({
      next: (response) => {
        this.usuarios = response.usuarios;
        this.aplicarFiltros();
        this.mostrarExito(response.mensaje);
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        this.mostrarError('Error al cargar los usuarios');
      }
    });
  }

  onSearchChange(): void {
    this.aplicarFiltros();
  }

  onRoleChange(): void {
    this.aplicarFiltros();
  }

  private aplicarFiltros(): void {
    this.usuariosFiltrados = this.usuarios.filter(usuario => {
      const cumpleBusqueda = !this.searchTerm ||
        usuario.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        usuario.apellidos.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        usuario.email.toLowerCase().includes(this.searchTerm.toLowerCase());

      const cumpleRol = !this.selectedRole ||
        usuario.role.toLowerCase() === this.selectedRole.toLowerCase();

      return cumpleBusqueda && cumpleRol;
    });
  }

  // Métodos para el formulario
  mostrarFormularioCrear(): void {
    this.modoFormulario = 'crear';
    this.usuarioEnEdicion = null;
    this.mostrarFormulario = true;
  }

  mostrarFormularioEditar(usuario: UsuarioResponse): void {
    this.modoFormulario = 'editar';
    this.usuarioEnEdicion = usuario;
    this.mostrarFormulario = true;
  }

  volverALista(): void {
    this.mostrarFormulario = false;
    this.usuarioEnEdicion = null;
  }

  guardarUsuario(response: { mensaje: string, usuario: UsuarioResponse }): void {
    this.cargarUsuarios();
    this.volverALista();
    this.mostrarExito(response.mensaje);
  }

  // Métodos para eliminación
  confirmarEliminacion(usuario: UsuarioResponse): void {
    this.limpiarMensajes();
    this.usuarioAEliminar = usuario;
    this.mostrarModalConfirmacion = true;
  }

  cancelarEliminacion(): void {
    this.mostrarModalConfirmacion = false;
    this.usuarioAEliminar = null;
  }

  async eliminarUsuario(): Promise<void> {
    if (!this.usuarioAEliminar) return;

    try {
      const response = await this.usuarioService.eliminar(
        this.usuarioAEliminar.id
      ).toPromise();

      this.mostrarExito(response?.mensaje || 'Usuario eliminado correctamente');
      this.cargarUsuarios();

    } catch (error: any) {
      this.mostrarError(error.error?.mensaje || 'Error al eliminar el usuario');
      console.error('Error:', error);
    } finally {
      this.cancelarEliminacion();
    }
  }

  // Método para descargar el PDF del contrato
  descargarContratoPDF(usuario: UsuarioResponse): void {
    if (usuario.contrato) {
      this.contratoService.descargarPDF(usuario.id).subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `contrato_${usuario.nombre}_${usuario.apellidos}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          console.error('Error al descargar el contrato:', error);
          this.mostrarError('Error al descargar el contrato');
        }
      });
    }
  }

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

  toggleDetalles(usuario: UsuarioResponse): void {
    usuario.expanded = !usuario.expanded;

    // Si es un trabajador y se está expandiendo, cargar los datos del contrato
    if (usuario.expanded && usuario.role === 'trabajador') {
      this.contratoService.obtenerPorUsuarioId(usuario.id).subscribe({
        next: (response) => {
          if (response.contratos && response.contratos.length > 0) {
            usuario.contrato = response.contratos[0];
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          console.error('Error al cargar el contrato:', error);
          this.mostrarError('Error al cargar los datos del contrato');
        }
      });
    }
  }

  getContratoStatusClass(contrato: any): string {
    if (!contrato) return '';

    switch (contrato.estadoNombre) {
      case 'ACTIVO':
        return 'contrato-activo';
      case 'PENDIENTE':
        return 'contrato-pendiente';
      case 'INACTIVO':
        return 'contrato-inactivo';
      default:
        return '';
    }
  }
}
