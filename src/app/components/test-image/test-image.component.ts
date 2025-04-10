import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-test-image',
  template: `
    <div class="container mt-4">
      <h2>Prueba de Imagen de Usuario</h2>

      <!-- Subir nueva imagen -->
      <div class="mb-4">
        <h3>Subir nueva imagen</h3>
        <input type="file" (change)="onFileSelected($event)" class="form-control mb-2">
        <button (click)="onUpload()" class="btn btn-primary">Subir Imagen</button>
      </div>

      <!-- Mostrar imagen actual -->
      <div class="mb-4">
        <h3>Imagen actual del usuario</h3>
        <div *ngIf="currentImageUrl" class="mb-2">
          <p>URL de la imagen: {{currentImageUrl}}</p>
          <p>URL completa: {{fullImageUrl}}</p>
          <img [src]="safeImageUrl" style="max-width: 300px;" class="img-thumbnail">
        </div>
        <div *ngIf="!currentImageUrl">
          No hay imagen disponible
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container { max-width: 800px; }
  `]
})
export class TestImageComponent implements OnInit {
  selectedFile: File | null = null;
  currentImageUrl: string | null = null;
  fullImageUrl: string | null = null;
  safeImageUrl: SafeUrl | null = null;
  userId: number = 0;

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {
    // Obtener el ID del usuario del token JWT
    const loginStr = sessionStorage.getItem('LOGIN');
    if (loginStr) {
      const loginData = JSON.parse(loginStr);
      const token = loginData.token;
      if (token) {
        // Decodificar el token JWT para obtener el ID
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        this.userId = parseInt(tokenPayload.sub); // El ID está en el campo 'sub' del token
        console.log('ID de usuario obtenido:', this.userId);
      } else {
        console.error('No se encontró el token');
        alert('Error al obtener los datos del usuario');
      }
    } else {
      console.error('No hay usuario logueado');
      alert('Por favor, inicia sesión primero');
    }
  }

  ngOnInit() {
    if (this.userId) {
      this.loadCurrentImage();
    }
  }

  private getHeaders(): HttpHeaders {
    const loginData = JSON.parse(sessionStorage.getItem('LOGIN') || '{}');
    const token = loginData.token;
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private getUploadHeaders(): HttpHeaders {
    const loginData = JSON.parse(sessionStorage.getItem('LOGIN') || '{}');
    const token = loginData.token;
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  loadCurrentImage() {
    const headers = this.getHeaders();
    console.log('Cargando imagen para usuario:', this.userId);

    this.http.get<any>(`http://localhost:9000/api/usuarios/${this.userId}`, { headers })
      .subscribe({
        next: (response) => {
          console.log('Respuesta del servidor:', response);
          this.currentImageUrl = response.foto;
          if (this.currentImageUrl) {
            // Extraer el nombre del archivo de la URL
            const filename = this.currentImageUrl.split('/').pop();
            this.fullImageUrl = `http://localhost:9000/api/usuarios/imagen/${filename}`;
            this.safeImageUrl = this.sanitizer.bypassSecurityTrustUrl(this.fullImageUrl);
          }
          console.log('URL de la imagen:', this.currentImageUrl);
        },
        error: (error) => {
          console.error('Error al cargar la imagen:', error);
          if (error.status === 403) {
            alert('Por favor, inicia sesión primero');
          }
        }
      });
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    console.log('Archivo seleccionado:', this.selectedFile?.name);
  }

  onUpload() {
    if (!this.userId) {
      alert('Por favor, inicia sesión primero');
      return;
    }

    if (!this.selectedFile) {
      alert('Por favor selecciona un archivo');
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    const headers = this.getUploadHeaders();
    console.log('Subiendo imagen para usuario:', this.userId);

    this.http.post(`http://localhost:9000/api/usuarios/${this.userId}/foto`, formData, {
      headers,
      responseType: 'text'
    })
      .subscribe({
        next: (response: string) => {
          console.log('Respuesta de subida:', response);
          this.currentImageUrl = response;
          if (this.currentImageUrl) {
            // Extraer el nombre del archivo de la URL
            const filename = this.currentImageUrl.split('/').pop();
            this.fullImageUrl = `http://localhost:9000/api/usuarios/imagen/${filename}`;
            this.safeImageUrl = this.sanitizer.bypassSecurityTrustUrl(this.fullImageUrl);
          }
          console.log('Nueva URL de la imagen:', this.currentImageUrl);
          alert('Imagen subida correctamente');
          // Recargar la imagen actual
          this.loadCurrentImage();
        },
        error: (error) => {
          console.error('Error al subir la imagen:', error);
          if (error.status === 403) {
            alert('Por favor, inicia sesión primero');
          } else {
            alert('Error al subir la imagen');
          }
        }
      });
  }
}
