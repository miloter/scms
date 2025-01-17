import express from 'express';
import cookieParser from 'cookie-parser';
import { viewsDir, publicDir, maxRequestSize } from './helpers/utils.js';
import indexRouter from './routers/index.js';
import authRouter from './routers/auth.js';
import adminCategoriesRouter from './routers/admin.js';
import toolsRouter from './routers/tools.js';

const app = express();

// Confiamos en el proxy (si lo hubiere), es necesario para
// saber si estamos detrás de un proxy con HTTPS
app.enable('trust proxy');

// Habilitamos el motor EJS en Express (debe estar instalado)
app.set('view engine', 'ejs');

// El directorio de vistas será '/views':
app.set('views', viewsDir);

// Habilitamos una carpeta para recursos estáticos
app.use(express.static(publicDir));

// Para parsear las cabeceras Cookie
app.use(cookieParser());

// Para parsear datos del body de solicitudes application/json
app.use(express.json({ extended: false, limit: maxRequestSize }));

// Middlewares de enrutamiento
app.use(indexRouter);
app.use(authRouter);
app.use(adminCategoriesRouter);
app.use(toolsRouter);

// Middleware centralizado de página no encontrada (404)
app.use((req, res, next) => {
    res.status(404).render('error-pages/404', { path: req.path });
});

// Middleware centralizado de error (debe ser el último) y solo funciona
// bien si tiene 4 parámetros en este orden: (err, req, res, next) => ...
app.use((err, req, res, next) => {
    const statusCode = 500;
    
    res.status(statusCode).json({ status: statusCode, error: err.message });
});

export { app };
