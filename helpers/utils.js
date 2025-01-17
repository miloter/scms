import path from 'node:path';
import { fileURLToPath } from 'node:url';
import jwt from 'jsonwebtoken';
import { db } from './db.js';

// Calcula el directorio raiz de la aplicación
const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
// Directorio de vistas
const viewsDir = path.join(rootDir, 'views');
// Directorio público
const publicDir = path.join(rootDir, 'public');
// Tamaño máximo de una solicitud
const maxRequestSize = 64 * 1024 * 1024;
// Tamaño máximo de un fichero subido
const maxUploadFileSize = 4 * 1024 * 1024;

/**
 * Nombre de la cookie que contiene el JWT.
 */
const jwtCookieName = 'jwt';

/**
 * Tiempo hasta la expiración del JWT.
 */
const jwtExpiresIn = 5 * 24 * 60 * 60 * 1000;

/**
 * Inyexta en las cookies de respuesta el JWT.
 * @param {object} res 
 * @param {string} jwt
 * @param {boolean} secure
 */
const setJwtCookie = (res, jwt, secure) => {
    res.cookie(jwtCookieName, jwt, {
        maxAge: jwtExpiresIn,
        httpOnly: true,
        secure
    });
};

/**
 * Genera un JWT con datos pasados en un objeto.
 * @param {object} data
 * @returns {Promise<string>}
 */
const generateToken = async data => {
    return new Promise(
        (resolve, reject) =>
            jwt.sign({ data }, process.env.JWT_SECRET,
                // La expiración aquí debe ir en segundos
                { expiresIn: jwtExpiresIn / 1000 },
                (err, token) => err ? reject(err) : resolve(token)
            )
    );
};

/**
 * Middleware para interceptar una petición y comprobar que
 * exista autorización de acceso. Si el token JWT es válido
 * se renueva la autorización.
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
const requireAuthorization = async (req, res, next) => {
    const statusUnauthorized = 401;
    const token = req.cookies.jwt;
    
    if (!token) {
        const status = 401;
        return res.status(status)
            .json({ status, error: 'Se requiere un token de acceso' });
    }

    try {  
        // Extraemos el usuario codificado en el JWT          
        const decoded = await new Promise((resolve, reject) => {
            jwt.verify(token, process.env.JWT_SECRET,
                (err, payload) => err ? reject(err) : resolve(payload));
        });
        // Renovamos el JWT
        req.user = decoded.data;
        const newToken = await generateToken(req.user);
        setJwtCookie(res, newToken, req.secure);        
        next();
    } catch (error) {
        res.status(statusUnauthorized).json({
            status: statusUnauthorized,
            error: `Token inválido: ${error.message}`
        });
    }
};

/**
 * Middleware para interceptar una petición e inyectarle la
 * configuración de la aplicación.
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
const inyectConfig = async (req, res, next) => {    
    try {
        const [[{
            title = '',
            page_desc = '',
            page_keys = '',
            items_per_page = 0,
            max_size_extract = 0,
            max_file_size_upload = 0,
            max_size_desc = 0
        }]] = await db.execute('select * from configs');

        req.config = {
            title,
            page_desc,
            page_keys,
            items_per_page,
            max_size_extract,
            max_file_size_upload,
            max_size_desc
        };        
        next();
    } catch (error) {
        next(error);        
    }
};

/**
 * Middleware para interceptar una petición y generar estadísticas.
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
const statRequests = async (req, res, next) => {    
    try {
        // Obtiene la página solicitada
        const page = req.path;
        // Comprueba si existe para incrementar el contador        
        const [[ result ]] = await db.execute(
            'select count from visits where page = ?', [page]);        
        const count = result ? result.count + 1 : 1;        
        // Si es la primera visita
        if (count === 1) {
            await db.execute(
                'insert into visits (page, count) values(?, ?)',[page, count]
            );
        } else {
            await db.execute(
                'update visits set count = ?, date_time = ? where page = ?',
                [count, getISOLocalTime(), page]
            );
        }        
        next();
    } catch (error) {
        next(error);        
    }
};

/**
 * Devuelve la fecha local en formato ISO.
 * @returns {string}
 */
const getISOLocalTime = () => {
    const date = new Date();
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());

    return date.toISOString().replace('T', ' ').replace('Z', '');
};

/**
 * Devuelve la parte en base 64 de datos codificados como URL.
 * @param {string} dataUrl Datos codificados en formato URL:
 *      data:<mime-type>;base64,<base-64-data>
 * @returns 
 */
const getBase64FromDataUrl = dataUrl => {
    const index = dataUrl.indexOf(',');
    return dataUrl.substring(index + 1);
};

/**
 * Devuelve parte de un Sitemap. Las partes que devuelve son header (h),
 * body (b) y footer (f). h: Cabecera del sitemap conforme a la versión 0.9.
 * b: Sección de <url>...</url>. p: Pie del sitemap :</urlset>
 *
 * @param {string} part
 * @param {string} loc
 * @param {string} lastmod
 * @returns string
 */
const sitemapPart = (part, loc, lastmod) => {
    const content = [];

    switch (part) {
        case 'h': // Cabecera
            content.push('<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n');
            content.push('<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\" xmlns:image=\"http://www.google.com/schemas/sitemap-image/1.1\" xmlns:video=\"http://www.google.com/schemas/sitemap-video/1.1\">\n');
            break;
        case 'b': // Cuerpo
            content.push('\t<url>\n');
            content.push('\t\t<loc>');
            content.push(loc);
            content.push('</loc>\n');
            content.push('\t\t<lastmod>');
            content.push(lastmod);
            content.push('</lastmod>\n');
            content.push('\t\t<changefreq>monthly</changefreq>\n');
            content.push('\t\t<priority>0.5</priority>\n');
            content.push('\t</url>\n');
            break;
        case 'f':
            content.push('</urlset>');
    }

    return content.join('');
}


export {
    rootDir,
    viewsDir,
    publicDir,
    maxRequestSize,
    maxUploadFileSize,
    jwtCookieName,
    jwtExpiresIn,
    setJwtCookie,
    generateToken,
    requireAuthorization,
    inyectConfig,
    statRequests,
    getISOLocalTime,
    getBase64FromDataUrl,
    sitemapPart
};
