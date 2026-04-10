import { useGetCamposHabilitacionUiQuery } from '../api/services/riesgosApi';

/**
 * Indica si un campo de formulario debe estar habilitado para edición según el panel admin.
 * Mientras carga o si falta la clave, se asume editable (true) para no bloquear al usuario.
 */
export function useCampoEditable(): (campoKey: string) => boolean {
  const { data } = useGetCamposHabilitacionUiQuery();

  return (campoKey: string) => {
    if (data == null) return true;
    const v = data[campoKey];
    return v !== false;
  };
}
