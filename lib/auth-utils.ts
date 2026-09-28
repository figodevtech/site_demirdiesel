export function cleanCpfCnpj(value: string) {
    return value.replace(/\D/g, '');
}

export function formatCpfCnpj(value: string) {
    const cleanValue = cleanCpfCnpj(value);

    if (cleanValue.length <= 11) {
        // CPF: 000.000.000-00
        return cleanValue
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    } else {
        // CNPJ: 00.000.000/0000-00
        return cleanValue
            .replace(/(\d{2})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    }
}

export function formatPhone(value: string) {
    const cleanValue = value.replace(/\D/g, '');
    
    // (00) 00000-0000
    return cleanValue
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
}

export function isValidCpf(cpf: string): boolean {
    const clean = cleanCpfCnpj(cpf);
    if (clean.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(clean)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(clean.charAt(i), 10) * (10 - i);
    }
    let rest = 11 - (sum % 11);
    const digit1 = rest >= 10 ? 0 : rest;
    if (digit1 !== parseInt(clean.charAt(9), 10)) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(clean.charAt(i), 10) * (11 - i);
    }
    rest = 11 - (sum % 11);
    const digit2 = rest >= 10 ? 0 : rest;
    return digit2 === parseInt(clean.charAt(10), 10);
}

export function isValidCnpj(cnpj: string): boolean {
    const clean = cleanCpfCnpj(cnpj);
    if (clean.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(clean)) return false;

    let size = clean.length - 2;
    let numbers = clean.substring(0, size);
    const digits = clean.substring(size);
    let sum = 0;
    let pos = size - 7;

    for (let i = size; i >= 1; i--) {
        sum += parseInt(numbers.charAt(size - i), 10) * pos--;
        if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0), 10)) return false;

    size = size + 1;
    numbers = clean.substring(0, size);
    sum = 0;
    pos = size - 7;

    for (let i = size; i >= 1; i--) {
        sum += parseInt(numbers.charAt(size - i), 10) * pos--;
        if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return result === parseInt(digits.charAt(1), 10);
}

export function isValidCpfCnpj(value: string, type?: "FISICA" | "JURIDICA"): boolean {
    const clean = cleanCpfCnpj(value);
    if (type === "FISICA") return isValidCpf(clean);
    if (type === "JURIDICA") return isValidCnpj(clean);
    return clean.length <= 11 ? isValidCpf(clean) : isValidCnpj(clean);
}
