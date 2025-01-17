import SqlLikeCompiler from '@miloter/sqllikecompiler';
import { db } from "../helpers/db.js";
import { toHtml } from '../helpers/html-utils.js';
import { innerText } from '../helpers/html-utils.js';

// Para compilar cadenas de búsqeda aptas para la sentencia SQL 'LIKE'
const sqlCompTitle = new SqlLikeCompiler('title');


const indexGet = (req, res, next) => {
    const { title, page_desc, page_keys } = req.config;

    res.render('index', { title, page_desc, page_keys });
};

// Devuelve una lista con las categorías
const apiCategoriesGet = async (req, res, next) => {
    const statusOk = 200;

    try {
        const [categories] = await db.execute('select * from categories');

        res.status(statusOk).json({ status: statusOk, categories });
    } catch (error) {
        next(error);
    }
};

// Devuelve la configuración del sitio almacenada en la base de datos
const apiConfigGet = (req, res, next) => {
    const statusOk = 200;
    res.status(statusOk).json({ status: statusOk, ...req.config });
};

// Devuelve una lista con los artículos
const apiArticlesGet = async (req, res, next) => {
    const statusOk = 200;

    try {
        let { category, search = '', page = 1 } = req.query;

        // Calculamos la expresión de categoría
        const exprCategory = Number(category) ? `category_id = ${category} and` : '';
        // Evalua la cadena LIKE de búsqueda
        const likeComp = sqlCompTitle.eval(search ?? '');
        const [articles] = await db.execute(`select * from items
            where ${exprCategory} ${likeComp}
            order by date_time desc
            limit ${(page - 1) * req.config.items_per_page},
                ${req.config.items_per_page}`);
        // Hay que devolverle al cliente el número de páginas que hay con
        // los parámetros de búsqueda actuales                
        const [[{ pages }]] = await db.execute(`
            select count(id) as pages
            from items
            where ${exprCategory} ${likeComp}`);
        
        // Se agrega un resument a los artículos
        articles.forEach(a => {
            a.summary = innerText(a.description).substring(0,
                Math.min(req.config.max_size_extract,
                    a.description.length)) + '...';
        });

        res.status(statusOk).json({
            status: statusOk,
            articles,
            page,
            pages,
            config: req.config
        });
    } catch (error) {
        next(error);
    }
};

// Devuelve la vista para la ruta '/articles-title-id/:id, donde :id es
// el ID textual del artículo (no se comprueba)
const articlesTitleIdGet = async (req, res, next) => {
    // Se obtiene información del artículo para los motores de búsqueda
    try {
        const titleId = req.params.id;
        const [[article]] = await db.execute(`select * from items
            where title_id = ?`, [titleId]);

        // Si no existe devuelve una vista de error 404
        if (!article) return next();

        // Solo se necesita el título, la descripción y las palabras clave
        res.render('articles-title-id', {
            title: article.title,
            page_desc: article.page_desc ?? '',
            page_keys: article.page_keys ?? ''
        });
    } catch (error) {
        next(error);
    }
};


// Controlador de la ruta '/api/articles-title-id/:id': Devuelve información visual
// del artículo a partir de su ID textual
const apiArticlesTitleIdGet = async (req, res, next) => {
    const statusOk = 200, statusNotFound = 404;

    try {
        const titleId = req.params.id;
        const [[article]] = await db.execute(`select * from items
            where title_id = ?`, [titleId]);
        if (!article) {
            return res.status(statusNotFound).json({
                status: statusNotFound,
                error: 'Artículo no encontrado'
            });
        }
        // Agregamos una descripción HTML al artículo
        article.htmlDescription = toHtml(article.description);

        res.status(statusOk).json({
            status: statusOk,
            article
        });
    } catch (error) {
        next(error);
    }
};

// Controlador de la ruta '/api/articles/:id': Devuelve información visual
// del artículo a partir de su ID numérico
const apiArticlesIdGet = async (req, res, next) => {
    const statusOk = 200, statusNotFound = 404;

    try {
        const id = req.params.id;
        const [[article]] = await db.execute(`select * from items
            where id = ?`, [id]);
        if (!article) {
            return res.status(statusNotFound).json({
                status: statusNotFound,
                error: 'Artículo no encontrado'
            });
        }

        res.status(statusOk).json({
            status: statusOk,
            article
        });
    } catch (error) {
        next(error);
    }
};

export {
    indexGet,
    apiCategoriesGet,
    apiConfigGet,
    apiArticlesGet,
    articlesTitleIdGet,
    apiArticlesTitleIdGet,
    apiArticlesIdGet
};
