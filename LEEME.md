# Evoluciones HD: cómo publicarla en GitHub Pages e instalarla en el iPad

## 1. Subir a GitHub (desde el navegador, 5 minutos)
1. Entra a github.com → **New repository** → nombre: `evol-hd` → **Public** → Create.
   (Pages gratis requiere repo público. Solo contiene el código: los datos de pacientes NUNCA se suben, viven en el iPad.)
2. En el repo: **Add file → Upload files** → arrastra los 6 archivos:
   `index.html`, `sw.js`, `manifest.webmanifest`, `icon-180.png`, `icon-192.png`, `icon-512.png` → **Commit changes**.
3. **Settings → Pages** → Source: *Deploy from a branch* → Branch: `main` / `(root)` → Save.
4. Espera 1–2 min. Tu app queda en: `https://TU-USUARIO.github.io/evol-hd/`

## 2. Instalar en el iPad Mini
1. Abre ese enlace en **Safari** (no Chrome).
2. Botón Compartir → **Agregar a pantalla de inicio**.
3. Ábrela SIEMPRE desde ese ícono. Así funciona sin internet y Safari no borra los datos.

## 3. Uso diario
- **Guardia** → elige fecha → **+ Agregar paciente** → busca por DNI o nombre.
  Si ya lo evolucionaste antes, te avisa y precarga acceso, peso seco, Qb y Qd.
- Llena selectores → A y P se generan solos (editables; ↻ Regenerar para volver al automático).
- **Guardar y copiar** → pega en ESSI.
- **Exportar Word/TXT** → un documento con todas las evoluciones de la guardia.
- **Pacientes** → ficha, historial, editar/eliminar, Word del historial por paciente.
- **Ajustes** → plan base, respaldo (.json a Archivos/iCloud) e importación.

## 4. Respaldo (importante)
Los datos solo existen en ese iPad. Exporta un respaldo cada semana (la app te lo recuerda).
Si borras Safari/datos de sitios o cambias de iPad, restauras con **Importar respaldo**.

## 5. Actualizar la app
Sube el nuevo `index.html` al repo y cambia en `sw.js` la línea `evol-hd-v1` → `evol-hd-v2`.
Abre la app con internet dos veces para que tome la nueva versión. Tus datos no se pierden.

> Las sugerencias de Apreciación y Plan son plantillas: valídalas con los protocolos del servicio.
