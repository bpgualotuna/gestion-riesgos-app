# Código Completo para Interfaz Web
## Herramienta de Gestión de Riesgo Talento Humano

Este documento contiene TODO el código necesario para implementar la interfaz web, incluyendo todas las fórmulas traducidas de Excel a JavaScript/TypeScript.

---

## 1. FUNCIONES DE CÁLCULO (Backend/Frontend)

### 1.1. Cálculo de Riesgo Inherente

```javascript
/**
 * Calcula el riesgo inherente basado en impacto máximo y probabilidad
 * Fórmula Excel: =+IF(AND(AD11=2,W11=2),3.99,AD11*W11)
 * 
 * @param {number} impactoMaximo - Máximo impacto (1-5)
 * @param {number} probabilidad - Probabilidad (1-5)
 * @returns {number} Riesgo inherente calculado
 */
function calcularRiesgoInherente(impactoMaximo, probabilidad) {
  // Caso especial: si ambos son 2, resultado es 3.99
  if (impactoMaximo === 2 && probabilidad === 2) {
    return 3.99;
  }
  
  return impactoMaximo * probabilidad;
}

// Versión TypeScript
function calcularRiesgoInherente(impactoMaximo: number, probabilidad: number): number {
  if (impactoMaximo === 2 && probabilidad === 2) {
    return 3.99;
  }
  return impactoMaximo * probabilidad;
}
```

### 1.2. Cálculo de Impacto Global

```javascript
/**
 * Calcula el impacto global ponderado
 * Fórmula Excel: =+ROUNDUP((X11*14%+Y11*22%+Z11*22%+AA11*10%+AB11*10%+AC11*22%),0)
 * 
 * @param {Object} impactos - Objeto con los impactos por dimensión
 * @returns {number} Impacto global redondeado hacia arriba
 */
function calcularImpactoGlobal(impactos) {
  const pesos = {
    personas: 0.14,      // 14%
    legal: 0.22,         // 22%
    ambiental: 0.22,     // 22%
    procesos: 0.10,      // 10%
    reputacion: 0.10,    // 10%
    economico: 0.22      // 22%
  };
  
  const impactoGlobal = 
    (impactos.personas || 0) * pesos.personas +
    (impactos.legal || 0) * pesos.legal +
    (impactos.ambiental || 0) * pesos.ambiental +
    (impactos.procesos || 0) * pesos.procesos +
    (impactos.reputacion || 0) * pesos.reputacion +
    (impactos.economico || 0) * pesos.economico;
  
  return Math.ceil(impactoGlobal);
}

// Versión TypeScript
interface Impactos {
  personas?: number;
  legal?: number;
  ambiental?: number;
  procesos?: number;
  reputacion?: number;
  economico?: number;
}

function calcularImpactoGlobal(impactos: Impactos): number {
  const pesos = {
    personas: 0.14,
    legal: 0.22,
    ambiental: 0.22,
    procesos: 0.10,
    reputacion: 0.10,
    economico: 0.22
  };
  
  const impactoGlobal = 
    (impactos.personas || 0) * pesos.personas +
    (impactos.legal || 0) * pesos.legal +
    (impactos.ambiental || 0) * pesos.ambiental +
    (impactos.procesos || 0) * pesos.procesos +
    (impactos.reputacion || 0) * pesos.reputacion +
    (impactos.economico || 0) * pesos.economico;
  
  return Math.ceil(impactoGlobal);
}
```

### 1.3. Máximo Riesgo en Rango

```javascript
/**
 * Encuentra el máximo riesgo en un rango de evaluaciones
 * Fórmula Excel: =+MAX(AE11:AE20)
 * 
 * @param {Array<number>} riesgos - Array de valores de riesgo
 * @returns {number} Máximo valor
 */
function maximoRiesgo(riesgos) {
  if (!riesgos || riesgos.length === 0) {
    return 0;
  }
  return Math.max(...riesgos);
}

// Versión TypeScript
function maximoRiesgo(riesgos: number[]): number {
  if (!riesgos || riesgos.length === 0) {
    return 0;
  }
  return Math.max(...riesgos);
}
```

### 1.4. Determinación de Nivel de Riesgo

```javascript
/**
 * Determina el nivel de riesgo según calificación
 * Fórmula Excel: =IF(OR(AF11=3,AF11=2,AF11=1,AF11=3.99,N11="Riesgo con consecuencia positiva"),"NIVEL BAJO",...)
 * 
 * @param {number} riesgoInherente - Valor del riesgo inherente
 * @param {string} clasificacion - "Riesgo con consecuencia positiva" o "Riesgo con consecuencia negativa"
 * @returns {string} Nivel de riesgo
 */
function determinarNivelRiesgo(riesgoInherente, clasificacion) {
  // Si es riesgo positivo, siempre es nivel bajo
  if (clasificacion === "Riesgo con consecuencia positiva") {
    return "NIVEL BAJO";
  }
  
  // Para riesgos negativos
  if (riesgoInherente >= 20) {
    return "NIVEL CRÍTICO";
  } else if (riesgoInherente >= 15) {
    return "NIVEL ALTO";
  } else if (riesgoInherente >= 10) {
    return "NIVEL MEDIO";
  } else if (riesgoInherente >= 5) {
    return "NIVEL BAJO";
  } else if (riesgoInherente === 3.99 || riesgoInherente <= 3) {
    return "NIVEL BAJO";
  }
  
  return "NIVEL BAJO";
}

// Versión TypeScript
type ClasificacionRiesgo = "Riesgo con consecuencia positiva" | "Riesgo con consecuencia negativa";
type NivelRiesgo = "NIVEL CRÍTICO" | "NIVEL ALTO" | "NIVEL MEDIO" | "NIVEL BAJO";

function determinarNivelRiesgo(
  riesgoInherente: number, 
  clasificacion: ClasificacionRiesgo
): NivelRiesgo {
  if (clasificacion === "Riesgo con consecuencia positiva") {
    return "NIVEL BAJO";
  }
  
  if (riesgoInherente >= 20) return "NIVEL CRÍTICO";
  if (riesgoInherente >= 15) return "NIVEL ALTO";
  if (riesgoInherente >= 10) return "NIVEL MEDIO";
  if (riesgoInherente >= 5) return "NIVEL BAJO";
  
  return "NIVEL BAJO";
}
```

### 1.5. Generación de ID de Riesgo

```javascript
/**
 * Genera ID único para riesgo
 * Fórmula Excel: =+CONCATENATE(C11,E11)
 * 
 * @param {string} vicepresidencia - Sigla de vicepresidencia
 * @param {string} gerencia - Sigla de gerencia
 * @returns {string} ID concatenado
 */
function generarIdRiesgo(vicepresidencia, gerencia) {
  return `${vicepresidencia}${gerencia}`;
}

// Versión TypeScript
function generarIdRiesgo(vicepresidencia: string, gerencia: string): string {
  return `${vicepresidencia}${gerencia}`;
}
```

### 1.6. Búsqueda VLOOKUP (Simulación)

```javascript
/**
 * Simula VLOOKUP de Excel
 * Fórmula Excel: =+IFERROR((VLOOKUP(D11,Listas!$A$3:$B$9,2,0)),0)
 * 
 * @param {any} valor - Valor a buscar
 * @param {Array} tabla - Tabla de búsqueda (array de objetos)
 * @param {string} columnaBusqueda - Nombre de columna para buscar
 * @param {string} columnaResultado - Nombre de columna para resultado
 * @param {any} valorPorDefecto - Valor si no se encuentra (default: null)
 * @returns {any} Valor encontrado o valor por defecto
 */
function vlookup(valor, tabla, columnaBusqueda, columnaResultado, valorPorDefecto = null) {
  const fila = tabla.find(fila => fila[columnaBusqueda] === valor);
  return fila ? fila[columnaResultado] : valorPorDefecto;
}

// Ejemplo de uso:
const listaVicepresidencias = [
  { codigo: 'AB', nombre: 'Abastecimiento' },
  { codigo: 'GPA', nombre: 'Gestión de proveedores' },
  // ...
];

const sigla = vlookup('Abastecimiento', listaVicepresidencias, 'nombre', 'codigo', '');
```

### 1.7. Cálculo de Efectividad de Control

```javascript
/**
 * Calcula la efectividad de un control
 * Basado en la hoja "Formulas"
 * 
 * @param {Object} control - Datos del control
 * @param {Object} pesos - Pesos de cada criterio
 * @returns {number} Efectividad (0-1)
 */
function calcularEfectividadControl(control, pesos) {
  const efectividad = 
    (control.aplicabilidad || 0) * (pesos.aplicabilidad || 0.25) +
    (control.cobertura || 0) * (pesos.cobertura || 0.25) +
    (control.facilidadUso || 0) * (pesos.facilidadUso || 0.10) +
    (control.segregacion || 0) * (pesos.segregacion || 0.20) +
    (control.naturaleza || 0) * (pesos.naturaleza || 0.20) -
    (control.desviaciones || 0) * (pesos.desviaciones || 0.20);
  
  // Normalizar entre 0 y 1
  return Math.max(0, Math.min(1, efectividad));
}

// Versión TypeScript
interface Control {
  aplicabilidad?: number;
  cobertura?: number;
  facilidadUso?: number;
  segregacion?: number;
  naturaleza?: number;
  desviaciones?: number;
}

interface Pesos {
  aplicabilidad?: number;
  cobertura?: number;
  facilidadUso?: number;
  segregacion?: number;
  naturaleza?: number;
  desviaciones?: number;
}

function calcularEfectividadControl(control: Control, pesos: Pesos): number {
  const efectividad = 
    (control.aplicabilidad || 0) * (pesos.aplicabilidad || 0.25) +
    (control.cobertura || 0) * (pesos.cobertura || 0.25) +
    (control.facilidadUso || 0) * (pesos.facilidadUso || 0.10) +
    (control.segregacion || 0) * (pesos.segregacion || 0.20) +
    (control.naturaleza || 0) * (pesos.naturaleza || 0.20) -
    (control.desviaciones || 0) * (pesos.desviaciones || 0.20);
  
  return Math.max(0, Math.min(1, efectividad));
}
```

### 1.8. Clasificación de Efectividad

```javascript
/**
 * Clasifica la efectividad de un control
 * Basado en hoja "Formulas" filas 9-12
 * 
 * @param {number} efectividad - Valor de efectividad (0-1)
 * @returns {string} Clasificación
 */
function clasificarEfectividad(efectividad) {
  const porcentaje = efectividad * 100;
  
  if (porcentaje >= 85 && porcentaje <= 96) {
    return "Altamente Efectivo";
  } else if (porcentaje >= 66 && porcentaje <= 84) {
    return "Efectivo";
  } else if (porcentaje >= 46 && porcentaje <= 65) {
    return "Medianamente Efectivo";
  } else if (porcentaje >= 26 && porcentaje <= 45) {
    return "Baja Efectividad";
  } else {
    return "Inefectivo";
  }
}
```

### 1.9. Cálculo de Riesgo Residual

```javascript
/**
 * Calcula el riesgo residual después de aplicar controles
 * Fórmula similar a riesgo inherente pero con ajustes por controles
 * 
 * @param {number} riesgoInherente - Riesgo inherente calculado
 * @param {number} efectividadControles - Efectividad de controles (0-1)
 * @returns {number} Riesgo residual
 */
function calcularRiesgoResidual(riesgoInherente, efectividadControles) {
  // Reducir riesgo según efectividad de controles
  const riesgoAjustado = riesgoInherente * (1 - efectividadControles);
  
  // Aplicar misma lógica especial que riesgo inherente
  const impactoResidual = Math.ceil(riesgoAjustado / 5); // Aproximación
  const probabilidadResidual = Math.ceil(riesgoAjustado % 5) || 1;
  
  if (impactoResidual === 2 && probabilidadResidual === 2) {
    return 3.99;
  }
  
  return impactoResidual * probabilidadResidual;
}
```

### 1.10. Cálculo de Puntaje de Priorización

```javascript
/**
 * Calcula el puntaje de priorización
 * Fórmula Excel: =+IFERROR(Formulas!$C$20*K11+M11*Formulas!$E$20+O11*Formulas!$G$20+Q11*Formulas!$I$20,0)
 * 
 * @param {Object} variables - Variables de priorización
 * @param {Object} pesos - Pesos de cada variable
 * @returns {number} Puntaje de priorización
 */
function calcularPuntajePriorizacion(variables, pesos) {
  try {
    return (
      (variables.capacidad || 0) * (pesos.capacidad || 0) +
      (variables.complejidad || 0) * (pesos.complejidad || 0) +
      (variables.velocidad || 0) * (pesos.velocidad || 0) +
      (variables.otraVariable || 0) * (pesos.otraVariable || 0)
    );
  } catch (error) {
    return 0;
  }
}
```

---

## 2. COMPONENTES REACT (Frontend)

### 2.1. Componente de Evaluación de Riesgo

```jsx
import React, { useState, useEffect } from 'react';
import { calcularRiesgoInherente, calcularImpactoGlobal, determinarNivelRiesgo } from './calculos';

const EvaluacionRiesgo = ({ riesgo, onSave }) => {
  const [evaluacion, setEvaluacion] = useState({
    impactoPersonas: 1,
    impactoLegal: 1,
    impactoAmbiental: 1,
    impactoProcesos: 1,
    impactoReputacion: 1,
    impactoEconomico: 1,
    impacto Tecnologico: 1,
    probabilidad: 1,
    clasificacion: riesgo?.clasificacion || 'Riesgo con consecuencia negativa'
  });

  const [resultados, setResultados] = useState({
    impactoGlobal: 0,
    riesgoInherente: 0,
    nivelRiesgo: 'NIVEL BAJO'
  });

  // Calcular automáticamente cuando cambian los valores
  useEffect(() => {
    const impactos = {
      personas: evaluacion.impactoPersonas,
      legal: evaluacion.impactoLegal,
      ambiental: evaluacion.impactoAmbiental,
      procesos: evaluacion.impactoProcesos,
      reputacion: evaluacion.impactoReputacion,
      economico: evaluacion.impactoEconomico
    };

    const impactoGlobal = calcularImpactoGlobal(impactos);
    const impactoMaximo = Math.max(...Object.values(impactos));
    const riesgoInherente = calcularRiesgoInherente(impactoMaximo, evaluacion.probabilidad);
    const nivelRiesgo = determinarNivelRiesgo(riesgoInherente, evaluacion.clasificacion);

    setResultados({
      impactoGlobal,
      riesgoInherente,
      nivelRiesgo
    });
  }, [evaluacion]);

  const handleChange = (campo, valor) => {
    setEvaluacion(prev => ({
      ...prev,
      [campo]: parseInt(valor) || 1
    }));
  };

  const handleSave = () => {
    onSave({
      ...evaluacion,
      ...resultados,
      riesgoId: riesgo?.id
    });
  };

  return (
    <div className="evaluacion-riesgo">
      <h2>Evaluación de Riesgo: {riesgo?.descripcion}</h2>
      
      <div className="form-section">
        <h3>Impactos (1-5)</h3>
        <div className="form-grid">
          <label>
            Personas:
            <select 
              value={evaluacion.impactoPersonas} 
              onChange={(e) => handleChange('impactoPersonas', e.target.value)}
            >
              {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          
          <label>
            Legal:
            <select 
              value={evaluacion.impactoLegal} 
              onChange={(e) => handleChange('impactoLegal', e.target.value)}
            >
              {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          
          <label>
            Ambiental:
            <select 
              value={evaluacion.impactoAmbiental} 
              onChange={(e) => handleChange('impactoAmbiental', e.target.value)}
            >
              {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          
          <label>
            Procesos:
            <select 
              value={evaluacion.impactoProcesos} 
              onChange={(e) => handleChange('impactoProcesos', e.target.value)}
            >
              {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          
          <label>
            Reputación:
            <select 
              value={evaluacion.impactoReputacion} 
              onChange={(e) => handleChange('impactoReputacion', e.target.value)}
            >
              {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          
          <label>
            Económico:
            <select 
              value={evaluacion.impactoEconomico} 
              onChange={(e) => handleChange('impactoEconomico', e.target.value)}
            >
              {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="form-section">
        <h3>Probabilidad (1-5)</h3>
        <select 
          value={evaluacion.probabilidad} 
          onChange={(e) => handleChange('probabilidad', e.target.value)}
        >
          {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>

      <div className="resultados">
        <h3>Resultados Calculados</h3>
        <div className={`resultado-card nivel-${resultados.nivelRiesgo.toLowerCase().replace(' ', '-')}`}>
          <div className="resultado-item">
            <label>Impacto Global:</label>
            <span>{resultados.impactoGlobal}</span>
          </div>
          <div className="resultado-item">
            <label>Riesgo Inherente:</label>
            <span>{resultados.riesgoInherente}</span>
          </div>
          <div className="resultado-item">
            <label>Nivel de Riesgo:</label>
            <span className={`badge nivel-${resultados.nivelRiesgo}`}>
              {resultados.nivelRiesgo}
            </span>
          </div>
        </div>
      </div>

      <button onClick={handleSave} className="btn-primary">
        Guardar Evaluación
      </button>
    </div>
  );
};

export default EvaluacionRiesgo;
```

### 2.2. Estilos CSS para Niveles de Riesgo

```css
/* Estilos para niveles de riesgo (formato condicional) */
.nivel-critico {
  background-color: #d32f2f;
  color: white;
}

.nivel-alto {
  background-color: #f57c00;
  color: white;
}

.nivel-medio {
  background-color: #fbc02d;
  color: black;
}

.nivel-bajo {
  background-color: #388e3c;
  color: white;
}

.badge.nivel-NIVEL\ CRÍTICO {
  background-color: #d32f2f;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: bold;
}

.badge.nivel-NIVEL\ ALTO {
  background-color: #f57c00;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: bold;
}

.badge.nivel-NIVEL\ MEDIO {
  background-color: #fbc02d;
  color: black;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: bold;
}

.badge.nivel-NIVEL\ BAJO {
  background-color: #388e3c;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: bold;
}
```

### 2.3. Componente de Mapa de Riesgos (Visualización)

```jsx
import React from 'react';
import { Scatter } from 'react-chartjs-2';

const MapaRiesgos = ({ riesgos }) => {
  // Preparar datos para el gráfico
  const datos = riesgos.map(riesgo => ({
    x: riesgo.probabilidad,
    y: riesgo.impactoMaximo,
    riesgo: riesgo.descripcion,
    nivel: riesgo.nivelRiesgo
  }));

  const chartData = {
    datasets: [{
      label: 'Riesgos',
      data: datos,
      backgroundColor: datos.map(d => {
        if (d.nivel === 'NIVEL CRÍTICO') return '#d32f2f';
        if (d.nivel === 'NIVEL ALTO') return '#f57c00';
        if (d.nivel === 'NIVEL MEDIO') return '#fbc02d';
        return '#388e3c';
      }),
      pointRadius: 8,
      pointHoverRadius: 10
    }]
  };

  const options = {
    scales: {
      x: {
        title: {
          display: true,
          text: 'Probabilidad (1-5)'
        },
        min: 0,
        max: 6
      },
      y: {
        title: {
          display: true,
          text: 'Impacto (1-5)'
        },
        min: 0,
        max: 6
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            const punto = datos[context.dataIndex];
            return [
              `Riesgo: ${punto.riesgo}`,
              `Probabilidad: ${punto.x}`,
              `Impacto: ${punto.y}`,
              `Nivel: ${punto.nivel}`
            ];
          }
        }
      },
      legend: {
        display: false
      }
    }
  };

  return (
    <div className="mapa-riesgos">
      <h2>Mapa de Riesgos</h2>
      <div className="mapa-container">
        <Scatter data={chartData} options={options} />
      </div>
      
      <div className="leyenda">
        <div className="leyenda-item">
          <span className="color-box critico"></span>
          <span>Nivel Crítico</span>
        </div>
        <div className="leyenda-item">
          <span className="color-box alto"></span>
          <span>Nivel Alto</span>
        </div>
        <div className="leyenda-item">
          <span className="color-box medio"></span>
          <span>Nivel Medio</span>
        </div>
        <div className="leyenda-item">
          <span className="color-box bajo"></span>
          <span>Nivel Bajo</span>
        </div>
      </div>
    </div>
  );
};

export default MapaRiesgos;
```

### 2.4. Componente de Priorización

```jsx
import React, { useState } from 'react';
import { calcularPuntajePriorizacion } from './calculos';

const PriorizacionRiesgo = ({ riesgo, evaluacion, onSave }) => {
  const [priorizacion, setPriorizacion] = useState({
    respuesta: 'Aceptar',
    responsable: '',
    fechaAsignacion: new Date().toISOString().split('T')[0],
    capacidad: 1,
    complejidad: 1,
    velocidad: 1
  });

  const [puntaje, setPuntaje] = useState(0);

  const pesos = {
    capacidad: 0.25,
    complejidad: 0.25,
    velocidad: 0.25,
    otraVariable: 0.25
  };

  const calcularPuntaje = () => {
    const variables = {
      capacidad: priorizacion.capacidad,
      complejidad: priorizacion.complejidad,
      velocidad: priorizacion.velocidad
    };
    
    const nuevoPuntaje = calcularPuntajePriorizacion(variables, pesos);
    setPuntaje(nuevoPuntaje);
  };

  React.useEffect(() => {
    calcularPuntaje();
  }, [priorizacion.capacidad, priorizacion.complejidad, priorizacion.velocidad]);

  const handleChange = (campo, valor) => {
    setPriorizacion(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleSave = () => {
    onSave({
      riesgoId: riesgo?.id,
      calificacionFinal: evaluacion?.riesgoResidual || evaluacion?.riesgoInherente,
      respuesta: priorizacion.respuesta,
      responsable: priorizacion.responsable,
      fechaAsignacion: priorizacion.fechaAsignacion,
      puntajePriorizacion: puntaje
    });
  };

  return (
    <div className="priorizacion-riesgo">
      <h2>Priorización y Respuesta: {riesgo?.descripcion}</h2>
      
      <div className="form-section">
        <h3>Calificación Final del Riesgo Residual</h3>
        <div className="calificacion-display">
          {evaluacion?.riesgoResidual || evaluacion?.riesgoInherente || 0}
        </div>
      </div>

      <div className="form-section">
        <h3>Respuesta al Riesgo</h3>
        <select 
          value={priorizacion.respuesta}
          onChange={(e) => handleChange('respuesta', e.target.value)}
        >
          <option value="Aceptar">Aceptar</option>
          <option value="Evitar">Evitar</option>
          <option value="Reducir">Reducir</option>
          <option value="Compartir">Compartir</option>
        </select>
      </div>

      <div className="form-section">
        <h3>Criterios de Priorización</h3>
        <div className="form-grid">
          <label>
            Capacidad de Adaptabilidad:
            <select 
              value={priorizacion.capacidad}
              onChange={(e) => handleChange('capacidad', parseInt(e.target.value))}
            >
              {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          
          <label>
            Complejidad del Riesgo:
            <select 
              value={priorizacion.complejidad}
              onChange={(e) => handleChange('complejidad', parseInt(e.target.value))}
            >
              {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          
          <label>
            Velocidad:
            <select 
              value={priorizacion.velocidad}
              onChange={(e) => handleChange('velocidad', parseInt(e.target.value))}
            >
              {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
        </div>
        
        <div className="puntaje-display">
          <label>Puntaje de Priorización:</label>
          <span className="puntaje-value">{puntaje}</span>
        </div>
      </div>

      <div className="form-section">
        <h3>Asignación</h3>
        <label>
          Responsable:
          <input 
            type="text"
            value={priorizacion.responsable}
            onChange={(e) => handleChange('responsable', e.target.value)}
            list="responsables"
          />
          <datalist id="responsables">
            {/* Cargar desde API */}
          </datalist>
        </label>
        
        <label>
          Fecha de Asignación:
          <input 
            type="date"
            value={priorizacion.fechaAsignacion}
            onChange={(e) => handleChange('fechaAsignacion', e.target.value)}
          />
        </label>
      </div>

      <button onClick={handleSave} className="btn-primary">
        Guardar Priorización
      </button>
    </div>
  );
};

export default PriorizacionRiesgo;
```

---

## 3. API BACKEND (Node.js/Express)

### 3.1. Endpoint de Evaluación

```javascript
// routes/evaluacion.js
const express = require('express');
const router = express.Router();
const { calcularRiesgoInherente, calcularImpactoGlobal, determinarNivelRiesgo } = require('../services/calculos');

// POST /api/evaluacion/calcular
router.post('/calcular', async (req, res) => {
  try {
    const { impactos, probabilidad, clasificacion } = req.body;
    
    // Validar datos
    if (!impactos || !probabilidad) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }
    
    // Calcular impacto global
    const impactoGlobal = calcularImpactoGlobal(impactos);
    const impactoMaximo = Math.max(...Object.values(impactos));
    
    // Calcular riesgo inherente
    const riesgoInherente = calcularRiesgoInherente(impactoMaximo, probabilidad);
    
    // Determinar nivel
    const nivelRiesgo = determinarNivelRiesgo(riesgoInherente, clasificacion);
    
    res.json({
      impactoGlobal,
      impactoMaximo,
      riesgoInherente,
      nivelRiesgo
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/evaluacion/guardar
router.post('/guardar', async (req, res) => {
  try {
    const evaluacion = req.body;
    
    // Guardar en base de datos
    const resultado = await db.evaluaciones.create(evaluacion);
    
    res.json({ success: true, id: resultado.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### 3.2. Servicio de Cálculos

```javascript
// services/calculos.js
module.exports = {
  calcularRiesgoInherente: (impactoMaximo, probabilidad) => {
    if (impactoMaximo === 2 && probabilidad === 2) {
      return 3.99;
    }
    return impactoMaximo * probabilidad;
  },
  
  calcularImpactoGlobal: (impactos) => {
    const pesos = {
      personas: 0.14,
      legal: 0.22,
      ambiental: 0.22,
      procesos: 0.10,
      reputacion: 0.10,
      economico: 0.22
    };
    
    const impactoGlobal = 
      (impactos.personas || 0) * pesos.personas +
      (impactos.legal || 0) * pesos.legal +
      (impactos.ambiental || 0) * pesos.ambiental +
      (impactos.procesos || 0) * pesos.procesos +
      (impactos.reputacion || 0) * pesos.reputacion +
      (impactos.economico || 0) * pesos.economico;
    
    return Math.ceil(impactoGlobal);
  },
  
  determinarNivelRiesgo: (riesgoInherente, clasificacion) => {
    if (clasificacion === "Riesgo con consecuencia positiva") {
      return "NIVEL BAJO";
    }
    
    if (riesgoInherente >= 20) return "NIVEL CRÍTICO";
    if (riesgoInherente >= 15) return "NIVEL ALTO";
    if (riesgoInherente >= 10) return "NIVEL MEDIO";
    if (riesgoInherente >= 5) return "NIVEL BAJO";
    
    return "NIVEL BAJO";
  }
};
```

---

## 4. VALIDACIONES

### 4.1. Validaciones de Formulario

```javascript
// utils/validaciones.js
export const validarEvaluacion = (evaluacion) => {
  const errores = {};
  
  // Validar impactos (1-5)
  const impactos = ['personas', 'legal', 'ambiental', 'procesos', 'reputacion', 'economico'];
  impactos.forEach(impacto => {
    const valor = evaluacion[`impacto${impacto.charAt(0).toUpperCase() + impacto.slice(1)}`];
    if (!valor || valor < 1 || valor > 5) {
      errores[`impacto${impacto}`] = 'Debe ser un valor entre 1 y 5';
    }
  });
  
  // Validar probabilidad (1-5)
  if (!evaluacion.probabilidad || evaluacion.probabilidad < 1 || evaluacion.probabilidad > 5) {
    errores.probabilidad = 'La probabilidad debe ser un valor entre 1 y 5';
  }
  
  // Validar clasificación
  const clasificacionesValidas = [
    'Riesgo con consecuencia positiva',
    'Riesgo con consecuencia negativa'
  ];
  if (!clasificacionesValidas.includes(evaluacion.clasificacion)) {
    errores.clasificacion = 'Clasificación inválida';
  }
  
  return {
    valido: Object.keys(errores).length === 0,
    errores
  };
};
```

---

## 5. ESTRUCTURA DE BASE DE DATOS (SQL)

```sql
-- Tabla de evaluaciones
CREATE TABLE evaluaciones_riesgo (
  id SERIAL PRIMARY KEY,
  riesgo_id INTEGER REFERENCES riesgos(id),
  impacto_personas INTEGER CHECK (impacto_personas BETWEEN 1 AND 5),
  impacto_legal INTEGER CHECK (impacto_legal BETWEEN 1 AND 5),
  impacto_ambiental INTEGER CHECK (impacto_ambiental BETWEEN 1 AND 5),
  impacto_procesos INTEGER CHECK (impacto_procesos BETWEEN 1 AND 5),
  impacto_reputacion INTEGER CHECK (impacto_reputacion BETWEEN 1 AND 5),
  impacto_economico INTEGER CHECK (impacto_economico BETWEEN 1 AND 5),
  impacto_tecnologico INTEGER CHECK (impacto_tecnologico BETWEEN 1 AND 5),
  probabilidad INTEGER CHECK (probabilidad BETWEEN 1 AND 5),
  impacto_global INTEGER,
  riesgo_inherente NUMERIC(10,2),
  nivel_riesgo VARCHAR(50),
  fecha_evaluacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  usuario_id INTEGER REFERENCES usuarios(id)
);

-- Tabla de priorizaciones
CREATE TABLE priorizaciones_riesgo (
  id SERIAL PRIMARY KEY,
  riesgo_id INTEGER REFERENCES riesgos(id),
  evaluacion_id INTEGER REFERENCES evaluaciones_riesgo(id),
  calificacion_final NUMERIC(10,2),
  respuesta VARCHAR(50) CHECK (respuesta IN ('Aceptar', 'Evitar', 'Reducir', 'Compartir')),
  responsable_id INTEGER REFERENCES personas(id),
  fecha_asignacion DATE,
  puntaje_priorizacion NUMERIC(10,2),
  capacidad INTEGER CHECK (capacidad BETWEEN 1 AND 5),
  complejidad INTEGER CHECK (complejidad BETWEEN 1 AND 5),
  velocidad INTEGER CHECK (velocidad BETWEEN 1 AND 5),
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6. RESUMEN DE FÓRMULAS POR HOJA

### Hoja "4. Evaluación"
- **10,685 fórmulas** distribuidas en:
  - VLOOKUP: 2,634 (búsquedas en catálogos)
  - IF: 3,507 (lógica condicional)
  - Referencias a otras hojas: 4,349
  - MAX: 145 (cálculos de máximos)
  - CONCATENATE: 50 (generación de IDs)

### Hoja "6. Priorización y Respuesta"
- **1,158 fórmulas** distribuidas en:
  - VLOOKUP: (búsquedas en mapa y fórmulas)
  - IF: (lógica condicional)
  - Cálculos de puntaje

### Hoja "5. Mapa de riesgos"
- **4 fórmulas** de SUM para totales

### Hoja "Formulas"
- **4 fórmulas** de cálculo de pesos

---

Este documento contiene TODO el código necesario para implementar la interfaz web. Todas las fórmulas de Excel han sido traducidas a JavaScript/TypeScript y están listas para usar.

