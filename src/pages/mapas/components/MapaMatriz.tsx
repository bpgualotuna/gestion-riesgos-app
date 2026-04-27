import React, { memo } from 'react';
import { Box, Typography } from '@mui/material';
import { PuntoMapa } from '../../../types';
import { hexToRgba } from '../../../utils/colorUtils'; // I'll create this if it doesn't exist or move it

interface MapaMatrizProps {
  matriz: { [key: string]: PuntoMapa[] };
  tipo: 'inherente' | 'residual';
  clasificacion: string;
  ejes: any;
  mapaConfig: any;
  onCellClick: (e: React.MouseEvent, prob: number, imp: number, tipo: 'inherente' | 'residual') => void;
  getCellColor: (prob: number, imp: number) => string;
  getBordesLimite: (prob: number, imp: number) => { top?: boolean; right?: boolean; bottom?: boolean; left?: boolean };
  generarIdRiesgo: (punto: PuntoMapa) => string;
  colorZonaAlta: string;
}

const MapaMatriz = memo(({
  matriz,
  tipo,
  clasificacion,
  ejes,
  mapaConfig,
  onCellClick,
  getCellColor,
  getBordesLimite,
  generarIdRiesgo,
  colorZonaAlta
}: MapaMatrizProps) => {
  const probabilidades = ejes?.probabilidad.map((p: any) => p.valor) || [1, 2, 3, 4, 5];
  const impactos = ejes?.impacto.map((i: any) => i.valor).sort((a: number, b: number) => b - a) || [5, 4, 3, 2, 1];

  const esFueraApetito = (prob: number, imp: number) => {
    const valor = prob * imp;
    return valor >= 15;
  };

  return (
    <Box sx={{ minWidth: 350, position: 'relative' }}>
      <Box display="flex" alignItems="center" mb={1.5}>
        <Typography
          variant="subtitle2"
          fontWeight={600}
          sx={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            mr: 2,
            fontSize: '0.75rem',
          }}
        >
          IMPACTO
        </Typography>
        <Box flexGrow={1}>
          <Box>
            {impactos.map((impacto: number) => {
              const etiquetaImpacto = ejes?.impacto.find((i: any) => i.valor === impacto)?.nombre || '';

              return (
                <Box key={impacto} display="flex" mb={0.5}>
                  <Box
                    sx={{
                      width: 50,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                      fontSize: '0.65rem',
                      backgroundColor: '#f5f5f5',
                      border: '1px solid #e0e0e0',
                      p: 0.5,
                    }}
                  >
                    <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.65rem' }}>
                      {impacto}
                    </Typography>
                    <Typography variant="caption" sx={{ textAlign: 'center', lineHeight: 1.1, fontSize: '0.55rem' }}>
                      {etiquetaImpacto}
                    </Typography>
                  </Box>
                  {probabilidades.map((probabilidad: number) => {
                    const prob = Math.round(Number(probabilidad)) || 1;
                    const imp = Math.round(Number(impacto)) || 1;
                    const key = `${prob}-${imp}`;
                    const riesgosCelda = matriz[key] || [];
                    const cellColor = getCellColor(prob, imp);
                    const fuerApetito = esFueraApetito(prob, imp);
                    const bordesLimite = getBordesLimite(prob, imp);

                    const riesgosValidosEnCelda = riesgosCelda.filter(p => {
                      const pProb = Math.round(Number(p.probabilidad));
                      const pImp = Math.round(Number(p.impacto));
                      return pProb === prob && pImp === imp;
                    });

                    const maxVisible = 4;
                    const visibleRiesgos = riesgosValidosEnCelda.slice(0, maxVisible);
                    const remaining = riesgosValidosEnCelda.length - maxVisible;

                    return (
                      <Box
                        key={probabilidad}
                        onClick={(e) => onCellClick(e, prob, imp, tipo)}
                        sx={{
                          width: 60,
                          minHeight: 60,
                          borderTop: fuerApetito ? `3px solid ${colorZonaAlta}` : (bordesLimite.top ? `3px dashed ${colorZonaAlta}` : '1px solid #000'),
                          borderRight: fuerApetito ? `3px solid ${colorZonaAlta}` : (bordesLimite.right ? `3px dashed ${colorZonaAlta}` : '1px solid #000'),
                          borderBottom: fuerApetito ? `3px solid ${colorZonaAlta}` : (bordesLimite.bottom ? `3px dashed ${colorZonaAlta}` : '1px solid #000'),
                          borderLeft: fuerApetito ? `3px solid ${colorZonaAlta}` : (bordesLimite.left ? `3px dashed ${colorZonaAlta}` : '1px solid #000'),
                          ...(fuerApetito && { border: `3px solid ${colorZonaAlta}` }),
                          backgroundColor: hexToRgba(cellColor, 0.3),
                          borderLeftWidth: fuerApetito ? 3 : (bordesLimite.left ? 3 : 4),
                          borderLeftColor: fuerApetito ? colorZonaAlta : (bordesLimite.left ? colorZonaAlta : cellColor),
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'flex-start',
                          cursor: riesgosValidosEnCelda.length > 0 ? 'pointer' : 'default',
                          transition: 'all 0.2s',
                          p: 0.25,
                          position: 'relative',
                          '&:hover': {
                            backgroundColor: hexToRgba(cellColor, 0.5),
                            transform: riesgosValidosEnCelda.length > 0 ? 'scale(1.05)' : 'none',
                            zIndex: 10,
                          },
                          ml: 0.5,
                          overflow: 'hidden',
                        }}
                      >
                        <Box sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.15,
                          alignItems: 'center',
                          width: '100%',
                          maxHeight: '100%',
                          overflow: 'auto'
                        }}>
                          {visibleRiesgos.map((punto) => (
                            <Typography
                              key={punto.riesgoId}
                              variant="caption"
                              sx={{
                                fontSize: '0.55rem',
                                lineHeight: 1.2,
                                fontWeight: 700,
                                backgroundColor: 'rgba(255,255,255,0.8)',
                                borderRadius: '2px',
                                px: 0.25,
                                py: 0.1,
                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                color: '#000',
                                width: 'fit-content',
                                textAlign: 'center'
                              }}
                            >
                              {generarIdRiesgo(punto)}
                            </Typography>
                          ))}
                          {remaining > 0 && (
                            <Typography variant="caption" sx={{ fontSize: '0.55rem', fontWeight: 600, color: '#000' }}>
                              +{remaining}
                            </Typography>
                          )}
                        </Box>
                        {fuerApetito && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 1,
                              right: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              backgroundColor: '#d32f2f',
                              zIndex: 5,
                            }}
                          >
                            <Typography variant="caption" sx={{ fontSize: '0.5rem', color: '#fff', fontWeight: 'bold' }}>!</Typography>
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              );
            })}
            <Box display="flex" mt={0.5}>
              <Box sx={{ width: 50 }} />
              {probabilidades.map((prob: number) => {
                const etiquetaProb = ejes?.probabilidad.find((p: any) => p.valor === prob)?.nombre || '';
                return (
                  <Box
                    key={prob}
                    sx={{
                      width: 60,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                      ml: 0.5,
                      backgroundColor: '#fff',
                      border: '1px solid #000',
                      p: 0.5,
                    }}
                  >
                    <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.65rem' }}>
                      {prob}
                    </Typography>
                    <Typography variant="caption" sx={{ textAlign: 'center', fontSize: '0.55rem', lineHeight: 1.1 }}>
                      {etiquetaProb}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
            <Box display="flex" justifyContent="center" mt={1}>
              <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.75rem' }}>
                FRECUENCIA/PROBABILIDAD
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
});

export default MapaMatriz;
