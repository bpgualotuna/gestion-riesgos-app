
type DateLike = string | Date | number | null | undefined;

const datePartsFromValue = (value: DateLike): { year: number; month: number; day: number } | null => {
    if (value == null) return null;
    if (value instanceof Date) {
        if (isNaN(value.getTime())) return null;
        return { year: value.getFullYear(), month: value.getMonth() + 1, day: value.getDate() };
    }
    if (typeof value === 'number') {
        const d = new Date(value);
        if (isNaN(d.getTime())) return null;
        return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
    }
    const raw = String(value).trim();
    if (!raw) return null;
    const isoLike = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoLike) {
        return { year: Number(isoLike[1]), month: Number(isoLike[2]), day: Number(isoLike[3]) };
    }
    const slashLike = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (slashLike) {
        return { year: Number(slashLike[3]), month: Number(slashLike[2]), day: Number(slashLike[1]) };
    }
    const d = new Date(raw);
    if (isNaN(d.getTime())) return null;
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
};

export const formatDate = (date: DateLike): string => {
    const parts = datePartsFromValue(date);
    if (!parts) return '';
    const d = new Date(parts.year, parts.month - 1, parts.day);
    return new Intl.DateTimeFormat('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
};

export const formatDateISO = (date: DateLike): string => {
    const parts = datePartsFromValue(date);
    if (!parts) return '';
    return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
};

export const todayISO = (): string => formatDateISO(new Date());

export const addDaysISO = (days: number, base: DateLike = new Date()): string => {
    const source = base instanceof Date ? new Date(base.getTime()) : new Date(base ?? Date.now());
    if (isNaN(source.getTime())) return '';
    source.setDate(source.getDate() + days);
    return formatDateISO(source);
};

export const formatRiskValue = (value: number | undefined): string => {
    if (value === undefined || value === null) return '0.0';
    return value.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
};

export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(value);
};
