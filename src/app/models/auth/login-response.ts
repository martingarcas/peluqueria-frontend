export interface LoginResponse {
    id: number;
    username: string;
    authorities: string[];
    token: string;
    nombre: string;
    apellidos: string;
    email: string;
    role: string;
    direccion: string;
    telefono: string;
    fotoUrl: string;
    fotoThumbnail: string;
}
