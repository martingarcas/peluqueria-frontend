import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { UsuarioResponse } from 'src/app/models/usuarios/usuario-response';
import { UsuarioService } from 'src/app/services/usuario/usuario.service';
import { ContratoService } from 'src/app/services/contrato/contrato.service';
import { trigger, style, transition, animate } from '@angular/animations';
import { ContratoResponse } from 'src/app/models/usuarios/contrato-response';

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
export class ListaUsuariosComponent implements OnInit {
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

  constructor(
    private usuarioService: UsuarioService,
    private contratoService: ContratoService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.usuarioService.obtenerTodos().subscribe({
      next: (response) => {
        this.usuarios = response.usuarios;
        this.cargarImagenesUsuarios();
        this.aplicarFiltros();
        this.mostrarExito(response.mensaje);
      },
      error: (error: { error?: { mensaje?: string } }) => {
        this.mostrarError(error.error?.mensaje || 'Error al cargar los usuarios');
      }
    });
  }

  private cargarImagenesUsuarios(): void {
    this.usuarios.forEach(usuario => {
      if (usuario.foto) {
        this.usuarioService.obtenerImagen(usuario.foto).subscribe({
          next: (blob: Blob) => {
            const objectUrl = URL.createObjectURL(blob);
            usuario.imagenUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
          },
          error: () => {
            usuario.imagenUrl = 'assets/images/no-image.png';
          }
        });
      } else {
        usuario.imagenUrl = 'assets/images/no-image.png';
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

    } catch (error: unknown) {
      const errorObj = error as { error?: { mensaje?: string } };
      this.mostrarError(errorObj.error?.mensaje || 'Error al eliminar el usuario');
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
        error: (error: { error?: { mensaje?: string } }) => {
          this.mostrarError(error.error?.mensaje || 'Error al descargar el contrato');
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
            // Filtrar para obtener solo el contrato activo o pendiente
            const contratoActivo = response.contratos.find(
              (contrato: ContratoResponse) => contrato.estadoNombre === 'ACTIVO' || contrato.estadoNombre === 'PENDIENTE'
            );

            if (contratoActivo) {
              usuario.contrato = contratoActivo;
            } else {
              // Si no hay contrato activo o pendiente, buscar el más reciente
              const contratoMasReciente = response.contratos
                .sort((a: ContratoResponse, b: ContratoResponse) =>
                  new Date(b.fechaInicioContrato).getTime() - new Date(a.fechaInicioContrato).getTime()
                )[0];
              usuario.contrato = contratoMasReciente;
            }
          }
        },
        error: (error: { error?: { mensaje?: string } }) => {
          this.mostrarError(error.error?.mensaje || 'Error al cargar los datos del contrato');
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
