/**
 * Interfaz que representa los datos necesarios para registrar un nuevo usuario
 * Utilizada en el formulario de registro de usuarios
 */
export interface RegisterRequest {
    nombre: string;       // Nombre del usuario
    apellidos: string;    // Apellidos del usuario
    email: string;        // Email del usuario
    password: string;     // Contraseña del usuario
    telefono: string;     // Teléfono del usuario
    direccion?: string;   // Dirección del usuario (opcional)
    role?: string;        // Role del usuario (opcional, por defecto 'cliente')
}
