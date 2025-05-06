import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UsuarioResponse } from 'src/app/models/usuarios/usuario-response';
import { UsuarioService } from 'src/app/services/usuario/usuario.service';

@Component({
  selector: 'app-lista-usuarios',
  templateUrl: './lista-usuarios.component.html',
  styleUrls: ['./lista-usuarios.component.css']
})
export class ListaUsuariosComponent implements OnInit {
  usuarios: UsuarioResponse[] = [];
  usuariosFiltrados: UsuarioResponse[] = [];
  mensajeError: string = '';
  mensajeExito: string = '';
  searchTerm: string = '';

  // Propiedades para el modal de eliminación
  mostrarModalConfirmacion = false;
  usuarioAEliminar: UsuarioResponse | null = null;

  // Propiedades para el formulario
  mostrarFormulario = false;
  modoFormulario: 'crear' | 'editar' = 'crear';
  usuarioEnEdicion: UsuarioResponse | null = null;

  constructor(
    private usuarioService: UsuarioService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.usuarioService.obtenerTodos().subscribe({
      next: (response) => {
        this.usuarios = response.usuarios;
        this.usuariosFiltrados = this.usuarios;
      },
      error: (error) => {
        this.mostrarError(error.error?.mensaje || 'Error al cargar los usuarios');
        console.error('Error:', error);
      }
    });
  }

  filtrarUsuarios(): void {
    if (!this.searchTerm) {
      this.usuariosFiltrados = this.usuarios;
      return;
    }

    this.usuariosFiltrados = this.usuarios.filter(usuario =>
      usuario.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      usuario.apellidos.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
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

  onSearchChange(): void {
    this.filtrarUsuarios();
  }

  // Método para descargar el PDF del contrato
  descargarContratoPDF(usuario: UsuarioResponse): void {
    if (usuario.contrato) {
      this.usuarioService.generarPDFContrato(usuario.id).subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `contrato_${usuario.nombre}_${usuario.apellidos}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
        },
        error: (error) => {
          this.mostrarError('Error al descargar el contrato');
          console.error('Error:', error);
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
}
