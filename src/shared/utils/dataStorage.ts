/**
 * Utilidades para gestión de persistencia de datos en JSON
 * Lee y escribe datos desde/hacia un archivo JSON
 */

// Tipos de datos que se almacenan
export interface DataStore {
  procesos: any[];
  riesgos: any[];
  evaluaciones: any[];
  priorizaciones: any[];
  areas: any[];
  observaciones: any[];
  historial: any[];
  tareas: any[];
  notificaciones: any[];
  usuarios: any[];
}

// Ruta del archivo JSON (en public para que sea accesible)
const DATA_FILE_PATH = '/data.json';

// Cache en memoria para evitar múltiples lecturas
let dataCache: DataStore | null = null;

/**
 * Carga los datos desde el archivo JSON
 */
export async function cargarDatos(): Promise<DataStore> {
  // Si hay cache, retornarlo
  if (dataCache) {
    return dataCache;
  }

  try {
    const response = await fetch(DATA_FILE_PATH);
    if (!response.ok) {
      throw new Error('No se pudo cargar el archivo de datos');
    }
    const data: DataStore = await response.json();
    dataCache = data;
    return data;
  } catch (error) {
    console.error('Error al cargar datos:', error);
    // Retornar estructura vacía si falla
    const estructuraVacia: DataStore = {
      procesos: [],
      riesgos: [],
      evaluaciones: [],
      priorizaciones: [],
      areas: [],
      observaciones: [],
      historial: [],
      tareas: [],
      notificaciones: [],
      usuarios: [],
    };
    dataCache = estructuraVacia;
    return estructuraVacia;
  }
}

/**
 * Guarda los datos en localStorage (como respaldo)
 * Nota: No podemos escribir directamente al archivo JSON desde el navegador
 * Por lo que usamos localStorage como persistencia
 */
export function guardarDatosEnLocalStorage(datos: DataStore): void {
  try {
    localStorage.setItem('dataStore', JSON.stringify(datos));
    dataCache = datos;
  } catch (error) {
    console.error('Error al guardar datos en localStorage:', error);
  }
}

/**
 * Carga los datos desde localStorage
 */
export function cargarDatosDesdeLocalStorage(): DataStore | null {
  try {
    const stored = localStorage.getItem('dataStore');
    if (!stored) return null;
    const data: DataStore = JSON.parse(stored);
    dataCache = data;
    return data;
  } catch (error) {
    console.error('Error al cargar datos desde localStorage:', error);
    return null;
  }
}

/**
 * Obtiene los datos (primero desde localStorage, luego desde JSON)
 */
export async function obtenerDatos(): Promise<DataStore> {
  // Intentar primero desde localStorage
  const datosLocalStorage = cargarDatosDesdeLocalStorage();
  if (datosLocalStorage) {
    return datosLocalStorage;
  }

  // Si no hay en localStorage, cargar desde JSON
  return await cargarDatos();
}

/**
 * Guarda un item específico en los datos
 */
export async function guardarItem<T>(
  coleccion: keyof DataStore,
  item: T
): Promise<void> {
  const datos = await obtenerDatos();
  const coleccionArray = datos[coleccion] as T[];
  
  // Buscar si existe (asumiendo que tiene id)
  const index = coleccionArray.findIndex(
    (i: any) => i.id === (item as any).id
  );

  if (index >= 0) {
    // Actualizar
    coleccionArray[index] = item;
  } else {
    // Agregar nuevo
    coleccionArray.push(item);
  }

  guardarDatosEnLocalStorage(datos);
}

/**
 * Elimina un item de una colección
 */
export async function eliminarItem(
  coleccion: keyof DataStore,
  id: string
): Promise<void> {
  const datos = await obtenerDatos();
  const coleccionArray = datos[coleccion] as any[];
  
  const index = coleccionArray.findIndex((item) => item.id === id);
  if (index >= 0) {
    coleccionArray.splice(index, 1);
    guardarDatosEnLocalStorage(datos);
  }
}

/**
 * Obtiene todos los items de una colección
 */
export async function obtenerItems<T>(
  coleccion: keyof DataStore
): Promise<T[]> {
  const datos = await obtenerDatos();
  return (datos[coleccion] || []) as T[];
}

/**
 * Obtiene un item por ID
 */
export async function obtenerItemPorId<T>(
  coleccion: keyof DataStore,
  id: string
): Promise<T | null> {
  const datos = await obtenerDatos();
  const coleccionArray = datos[coleccion] as any[];
  const item = coleccionArray.find((i) => i.id === id);
  return (item as T) || null;
}

/**
 * Limpia el cache (útil para forzar recarga)
 */
export function limpiarCache(): void {
  dataCache = null;
}

/**
 * Inicializa los datos desde el JSON si localStorage está vacío
 */
export async function inicializarDatos(): Promise<void> {
  const datosLocalStorage = cargarDatosDesdeLocalStorage();
  if (!datosLocalStorage || Object.keys(datosLocalStorage).length === 0) {
    const datosJSON = await cargarDatos();
    guardarDatosEnLocalStorage(datosJSON);
  }
}

