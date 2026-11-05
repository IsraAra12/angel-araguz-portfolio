# Portfolio de Angel Araguz

Landing profesional enfocada en ingeniería de software, IA aplicada, automatización e ingeniería de calidad.

## Vista local

Para probar el formulario, arranca la API de la oficina en `127.0.0.1:8000` y ejecuta desde este repositorio:

```sh
python -m http.server 4173 --bind 127.0.0.1
```

Abre [el formulario](http://127.0.0.1:4173/#solicitud-diagnostico). La oficina debe tener `http://127.0.0.1:4173` en `CORS_ORIGINS` y el agente F.R.I.D.A.Y. inicializado. Cada envío válido crea una oportunidad en el CRM y le asigna una tarea de seguimiento.

## Publicación

Vercel sirve la landing y la función `POST /api/contact`. En la oficina, inicia el receptor desde `services/backend`, usando su entorno virtual y la misma base de datos que la API:

```sh
python -m uvicorn salescc.landing_gateway:app --host 127.0.0.1 --port 8010
```

Conecta el puerto 8010 a un dominio HTTPS estable. El receptor solo admite la ruta de contacto. En Vercel configura estas variables de entorno de servidor y vuelve a desplegar:

- `SALESCC_CONTACT_URL` con la URL HTTPS completa del receptor, terminada en `/api/v1/public/contact`.
- `LANDING_CONTACT_SECRET` con un valor aleatorio que coincida con el de `.env` de la oficina. Guárdalo fuera de Git.

El receptor debe estar activo para aceptar solicitudes. El correo de contacto sigue disponible como canal alternativo.
