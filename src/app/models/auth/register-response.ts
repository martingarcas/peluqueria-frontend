export interface RegisterResponse {
    id: number;           // ID del usuario creado
    nombre: string;       // Nombre del usuario
    apellidos: string;    // Apellidos del usuario
    email: string;        // Email del usuario
    role: string;        // Role asignado (por defecto será 'cliente')
    telefono: string;    // Teléfono del usuario
    direccion?: string;  // Dirección del usuario (opcional)
}
