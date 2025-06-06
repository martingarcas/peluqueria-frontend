import { Component, OnInit } from '@angular/core';
import { UsuarioService } from 'src/app/services/usuario/usuario.service';
import { UsuarioResponse } from 'src/app/models/usuarios/usuario-response';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class PerfilComponent implements OnInit {
  usuario: UsuarioResponse | null = null;
  editMode: boolean = false;
  mensajeExito: string = '';
  mensajeError: string = '';
  imagenPerfil: SafeUrl = 'assets/images/no-image.png';
  nuevaFoto: File | null = null;

  // Campos editables
  editUsuario: Partial<UsuarioResponse> = {};

  constructor(
    private usuarioService: UsuarioService,
    private sanitizer: DomSanitizer,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarUsuario();
  }

  cargarUsuario(): void {
    const storedLogin = sessionStorage.getItem('LOGIN');
    let userId = null;
    if (storedLogin) {
      const loginData = JSON.parse(storedLogin);
      userId = loginData.user?.id;
    }
    if (!userId) {
      this.mensajeError = 'No se pudo obtener el usuario autenticado';
      return;
    }
    this.usuarioService.obtenerPorId(userId).subscribe({
      next: (resp) => {
        this.usuario = resp.usuario;
        this.editUsuario = { ...resp.usuario };
        this.cargarImagenPerfil(this.usuario.foto);
      },
      error: () => {
        this.mensajeError = 'Error al cargar el perfil';
      }
    });
  }

  cargarImagenPerfil(fotoPath?: string): void {
    if (!fotoPath) {
      this.imagenPerfil = 'assets/images/no-image.png';
      return;
    }
    this.usuarioService.obtenerImagen(fotoPath).subscribe({
      next: (blob: Blob) => {
        const objectUrl = URL.createObjectURL(blob);
        this.imagenPerfil = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
      },
      error: () => {
        this.imagenPerfil = 'assets/images/no-image.png';
      }
    });
  }

  activarEdicion(): void {
    this.editMode = true;
    this.editUsuario = { ...this.usuario! };
  }

  cancelarEdicion(): void {
    this.editMode = false;
    this.nuevaFoto = null;
    this.editUsuario = { ...this.usuario! };
    this.cargarImagenPerfil(this.usuario?.foto);
  }

  onFotoSeleccionada(event: any): void {
    if (event.target.files && event.target.files[0]) {
      this.nuevaFoto = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagenPerfil = e.target.result;
      };
      if (this.nuevaFoto) {
        reader.readAsDataURL(this.nuevaFoto);
      }
    }
  }

  guardarCambios(): void {
    if (!this.usuario) return;
    const formData = new FormData();
    const usuarioEdit = {
      nombre: this.editUsuario.nombre,
      apellidos: this.editUsuario.apellidos,
      email: this.editUsuario.email,
      telefono: this.editUsuario.telefono,
      direccion: this.editUsuario.direccion
    };
    formData.append('usuario', new Blob([JSON.stringify(usuarioEdit)], { type: 'application/json' }));
    if (this.nuevaFoto) {
      formData.append('foto', this.nuevaFoto);
    }
    this.usuarioService.actualizar(this.usuario.id, formData).subscribe({
      next: (resp) => {
        this.mensajeExito = 'Perfil actualizado correctamente';
        this.editMode = false;
        this.cargarUsuario();
        setTimeout(() => this.mensajeExito = '', 2500);
      },
      error: (err) => {
        this.mensajeError = err.error?.mensaje || 'Error al actualizar el perfil';
        setTimeout(() => this.mensajeError = '', 2500);
      }
    });
  }
}
