export interface LoginResponse {
    token: string;       // JWT authentication token
    email: string;       // User's email
    role: string;       // User's role
    name: string;       // User's name
    surname: string;    // User's surname
}
