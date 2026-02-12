
// Legacy Mock Data for pages not yet fully migrated to API
export const getDescripcionesImpacto = () => {
    return {
        economico: {
            1: 'Impacto económico muy bajo, menor a $1,000',
            2: 'Impacto económico bajo, entre $1,000 y $5,000',
            3: 'Impacto económico moderado, entre $5,000 y $20,000',
            4: 'Impacto económico alto, entre $20,000 y $100,000',
            5: 'Impacto económico muy alto, mayor a $100,000'
        },
        procesos: {
            1: 'Interrupción mínima de procesos, no afecta el servicio',
            2: 'Interrupción menor, afecta procesos secundarios',
            3: 'Interrupción moderada, afecta procesos críticos temporalmente',
            4: 'Interrupción mayor, afecta la continuidad del negocio',
            5: 'Interrupción total de procesos críticos'
        },
        legal: {
            1: 'Incumplimiento menor sin sanciones',
            2: 'Sanciones administrativas leves',
            3: 'Sanciones legales moderadas o multas',
            4: 'Sanciones legales graves o demandas',
            5: 'Cierre de operaciones o sanciones penales'
        },
        confidencialidadSGSI: {
            1: 'No hay compromiso de información',
            2: 'Divulgación menor de información interna',
            3: 'Acceso no autorizado a información sensible',
            4: 'Divulgación de información confidencial de clientes',
            5: 'Pérdida masiva de secreto comercial'
        },
        reputacional: {
            1: 'Sin impacto en la imagen',
            2: 'Impacto local o interno',
            3: 'Noticias negativas en medios locales',
            4: 'Daño significativo a la marca país',
            5: 'Pérdida total de confianza del mercado'
        }
    };
};

export const getMockRiesgos = (params?: any) => ({ data: [] });

export const getEstadosIncidencia = () => [
    { value: 'abierta', label: 'Abierta' },
    { value: 'en_investigacion', label: 'En Investigación' },
    { value: 'resuelta', label: 'Resuelta' },
    { value: 'cerrada', label: 'Cerrada' }
];

// Stubs para ParametrosCalificacionPage y otros
export const getMockOrigenes = () => [];
export const getMockTiposRiesgos = () => [];
export const getMockConsecuencias = () => [];
export const getMockFuentes = () => [];
export const getMockFrecuencias = () => [];
export const getMockObjetivos = () => [];
export const getMockFormulas = () => [];
export const getMockProcesos = () => [];
export const getMockPlanesAccion = () => [];
export const getMockIncidencias = () => [];
export const getMockEstadisticas = () => ({});
export const getMockUsuarios = () => [];

export const updateMockTiposRiesgos = (data: any) => data;
export const updateMockOrigenes = (data: any) => data;
export const updateMockConsecuencias = (data: any) => data;
export const updateMockObjetivos = (data: any) => data;
export const updateMockFuentes = (data: any) => data;
export const updateMockFrecuencias = (data: any) => data;
export const updateDescripcionesImpacto = (data: any) => data;
export const updateMockFormula = (id: any, data: any) => data;
export const createMockFormula = (data: any) => data;
export const deleteMockFormula = (id: any) => true;
export const updateMockProceso = (data: any) => data;
