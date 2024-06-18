export function validateName(name: string): boolean {
    const regex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
    return regex.test(name);
}