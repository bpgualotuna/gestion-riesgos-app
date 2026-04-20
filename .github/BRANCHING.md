# Ramas y flujo (gestion-riesgos-app)

## Por qué se rompía producción

Hoy el workflow **Deploy Frontend** corre en **cada push a `master`**. Si todo el equipo trabaja directamente en `master`, cualquier error sube a producción sin pasar por comprobaciones en PR.

## Ramas previstas

| Rama       | Uso |
|------------|-----|
| `develop`  | Integración diaria: aquí van los PR de `feature/*`, `fix/*`, etc. |
| `master`   | Línea estable / lo que se despliega. Solo entradas vía PR desde `develop` (o hotfix acordado). |

## Flujo recomendado

1. Crear rama desde `develop`: `git checkout develop && git pull && git checkout -b feature/mi-cambio`
2. Abrir PR hacia **`develop`**. Debe quedar verde el workflow **CI**.
3. Cuando haya release: PR **`develop` → `master`**. Tras el merge, el deploy actual se ejecuta solo en ese push a `master`.

## GitHub (recomendado)

En **Settings → Branches → Add rule**:

- Proteger **`master`**: Require a pull request, Require status checks (**CI**).
- Proteger **`develop`**: Require status checks (**CI**).

Así no se puede fusionar código que no pase build/lint.

## Rama local `main` antigua

Si tenés una rama local `main` desactualizada respecto de `origin/master`, no la uses; trabajá con `master` y `develop`.
