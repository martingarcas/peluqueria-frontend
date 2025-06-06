/**
 * Interfaz que representa la información básica del usuario autenticado
 * Utilizada en el contexto de autenticación y en la barra de navegación
 */
export interface User {
    id: number;
    email: string;
    nombre: string;
    apellidos: string;
    role: string;
    direccion: string;
    telefono: string;
    fotoUrl: string;
    fotoThumbnail: string;
}
