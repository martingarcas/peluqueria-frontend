export interface RegisterRequest {
    name: string;         // User's name
    surname: string;      // User's surname
    email: string;        // User's email
    password: string;     // User's password
    phone: string;        // User's phone number
    address?: string;     // User's address (optional)
    role?: string;        // User's role (optional, default 'client')
}
