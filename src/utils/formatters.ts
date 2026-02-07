
export const formatDate = (date: string | Date | undefined): string => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
};

export const formatRiskValue = (value: number | undefined): string => {
    if (value === undefined || value === null) return '0.0';
    return value.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
};

export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(value);
};
