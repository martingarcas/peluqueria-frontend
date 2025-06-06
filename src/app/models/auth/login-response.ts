/**
 * Interfaz que representa la respuesta del servidor después de un login exitoso
 * Incluye el token JWT y la información del usuario autenticado
 */
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
