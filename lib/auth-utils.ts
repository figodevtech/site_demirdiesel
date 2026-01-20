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
