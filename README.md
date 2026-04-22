# COMWARE — Frontend (gestión de riesgos)

SPA React + Vite que consume la API del backend. **Contexto técnico completo (qué hace la app, módulos, integración):** [`context.md`](context.md).

---

## Inicio rápido

```bash
npm install
# Crear .env en la raíz (variables: ver context.md)
npm run dev
```

- **Build:** `npm run build` → `dist/`
- **CI local:** `npm run build:check` (`tsc -b && vite build`)
- **Lint:** `npm run lint`

Cualquier cambio que altere comportamiento, rutas, cliente API, estado, tema o despliegue debe actualizarse también en **`context.md`** (regla `.cursor/rules/documentacion.mdc`).
