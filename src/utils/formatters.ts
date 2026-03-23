
export const formatDate = (date: string | Date | undefined): string => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
};

export const formatDateISO = (date: string | Date | undefined): string => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    // Formato YYYY-MM-DD
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const formatRiskValue = (value: number | undefined): string => {
    if (value === undefined || value === null) return '0.0';
    return value.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
};

export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(value);
};
