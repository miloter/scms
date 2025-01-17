import { writeFile, readdir, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import TextValidator from '@miloter/text-validator';
import SimilWords from '@miloter/simil-words';
import { db } from '../helpers/db.js';
import { publicDir, getBase64FromDataUrl, sitemapPart } from '../helpers/utils.js';

// Palabras padre en minúsculas
const sw = new SimilWords(true);

// Renderiza el formulario de gestión de categorías
const adminCategoriesFormGet = (req, res, next) => {
    res.render('admin/categories-form', {
        title: 'Gestión de Categorías',
        page_desc: 'Agregar, actualizar o eliminar categorías',
        page_keys: 'categoría, agregar, actualizar, eliminar'
    });
};

// Procesa una petición para crear una nueva categoría
const apiAdminCategoriesPost = async (req, res, next) => {
    const statusOk = 200, statusBadRequest = 400;

    try {
        const description = (req.body.description ?? '').trim().toUpperCase();
        const tv = new TextValidator();

        if (!(
            tv.validate(description, TextValidator.reAnyWordChar,
                'La descripción debe contener al menos un carácter alfanumérico')
        )) {
            return res.status(statusBadRequest).json({
                status: statusBadRequest,
                error: tv.getLastMessage()
            });
        }

        // Comprueba que la descripción no exista
        let [result] = await db.execute(
            'select id from categories where description = ?', [description]);
        if (result.length) {
            return res.status(statusBadRequest).json({
                status: statusBadRequest,
                error: 'La categoría ya existe'
            });
        }

        // Obtenemos el orden más grande y lo aumentamos en 1
        [result] = await db.execute('select max(orden) as max_orden from categories');
        const orden = (result[0].max_orden ?? 0) + 1;

        // Insertamos los datos en BBDD
        await db.execute(`insert into categories(description, orden)
            values(?, ?)`, [description, orden]);

        return res.status(statusOk).json({
            status: statusOk,
            success: 'Categoría creada con éxito',
        });
    } catch (error) {
        next(error);
    }
};

// Procesa una petición para actualizar una categoría
const apiAdminCategoriesPut = async (req, res, next) => {
    const statusOk = 200, statusBadRequest = 400;

    try {
        const { id, description } = req.body;
        const tv = new TextValidator();

        if (!(
            tv.validate(description, TextValidator.reAnyWordChar,
                'La descripción debe contener al menos un carácter alfanumérico')
        )) {
            return res.status(statusBadRequest).json({
                status: statusBadRequest,
                error: tv.getLastMessage()
            });
        }

        // Comprueba que la descripción no exista
        let [result] = await db.execute(
            'select id from categories where description = ?', [description]);
        if (result.length) {
            return res.status(statusBadRequest).json({
                status: statusBadRequest,
                error: 'La categoría ya existe'
            });
        }

        // Actualizamos la descripción
        [result] = await db.execute(
            'update categories set description = ? where id = ?', [description, id]);
        if (result.changedRows === 1) {
            return res.status(statusOk).json({
                status: statusOk,
                success: 'Categoría actualizada con éxito',
            });
        } else {
            return res.status(statusBadRequest).json({
                status: statusBadRequest,
                error: `Identificador de categoría inválido: ${id}`
            });
        }
    } catch (error) {
        next(error);
    }
};

// Procesa una petición para eliminar una categoría
const apiAdminCategoriesDelete = async (req, res, next) => {
    const statusOk = 200, statusBadRequest = 400;

    try {
        const id = req.body.id;

        // Elimina la categoría
        const [result] = await db.execute(
            'delete from categories where id = ?', [id]);
        if (result.affectedRows === 1) {
            return res.status(statusOk).json({
                status: statusOk,
                success: 'Categoría eliminada con éxito',
            });
        } else {
            return res.status(statusBadRequest).json({
                status: statusBadRequest,
                error: `Identificador de categoría inválido: ${id}`
            });
        }
    } catch (error) {
        next(error);
    }
};

// Procesa una petición para intercambiar el orden de dos categorías
const apiAdminCategoriesSwapPut = async (req, res, next) => {
    const statusOk = 201, statusBadRequest = 400;

    try {
        const { id1, id2 } = req.body;

        // Obtenemos los números d orden        
        const [orden1] = await db.execute(
            'select orden from categories where id = ?', [id1]);
        const [orden2] = await db.execute(
            'select orden from categories where id = ?', [id2]);
        if (!(orden1.length && orden2.length)) {
            return res.status(statusBadRequest).json({
                status: statusBadRequest,
                error: `Algún identificador de categoría inválido: ${id1}, ${id2}`
            });
        }

        // Intercambios los órdenes        
        const [result1] = await db.execute(`
            update categories set orden = ? where id = ?`, [orden2[0].orden, id1]);
        const [result2] = await db.execute(`
            update categories set orden = ? where id = ?`, [orden1[0].orden, id2]);

        if ((result1.changedRows + result2.changedRows) === 2) {
            return res.status(statusOk).json({
                status: statusOk,
                success: 'Orden actualizado con éxito',
            });
        } else {
            return res.status(statusBadRequest).json({
                status: statusBadRequest,
                error: `Algún identificador de categoría inválido: ${id1}, ${id2}`
            });
        }
    } catch (error) {
        next(error);
    }
};

// Renderiza el formulario de configuración del sitio web
const adminConfigFormGet = (req, res, next) => {
    res.render('admin/config-form', {
        title: 'Configuración del sitio',
        page_desc: 'Establece las configuraciones de toda la aplicación y permite generar un sitemap',
        page_keys: 'configuración, sitemap'
    });
};

// Procesa una petición para establecer la configuración del sitio
const apiAdminConfigPost = async (req, res, next) => {
    const statusOk = 200, statusBadRequest = 400;

    try {
        const { title = '', description = '', keywords = '', itemsPerPage = 0,
            maxSizeExtract = 0, maxFileSizeUpload = 0, maxSizeDesc = 0
        } = req.body;
        const tv = new TextValidator();

        if (!(
            tv.validate(title, TextValidator.reAnyWordChar,
                'El título tendrá al menos una letra, dígito, o guión bajo y no medir más de 128 caracteres',
                { maxLength: 128 }) &&
            tv.validate(description, TextValidator.reStr,
                'La descripción no debe medir más de 255 caracteres',
                { maxLength: 255 }) &&
            tv.validate(keywords, TextValidator.reStr,
                'Las palabras clave no deben medir más de 255 caracteres',
                { maxLength: 255 }) &&
            tv.validateInt(itemsPerPage, 1, 100, { fieldTitle: 'Artículos por página' }) &&
            tv.validateInt(maxSizeExtract, 1, 1000, { fieldTitle: 'Caracteres en extracto' }) &&
            tv.validateInt(maxFileSizeUpload, 1, 4 * 1024 * 1024, { fieldTitle: 'Tamaño fichero en upload' }) &&
            tv.validateInt(maxSizeDesc, 1, 15000, { fieldTitle: 'Máximo de caracteres en contenido' })
        )) {
            return res.status(statusBadRequest).json({
                status: statusBadRequest,
                error: tv.getLastMessage()
            });
        }

        // Comprueba si la configuración existe en base de datos
        let [result] = await db.execute('select count(title) as total from configs');
        const exists = result[0].total > 0;

        // Inserta o actualiza
        [result] = await db.execute(exists ?
            `update configs set title = ?, page_desc = ?, page_keys = ?,
                items_per_page = ?, max_size_extract = ?,
                max_file_size_upload = ?, max_size_desc = ?` :
            `insert into configs(title, page_desc, page_keys, items_per_page,
                max_size_extract, max_file_size_upload, max_size_desc)
                values(?, ?, ?, ?, ?, ?, ?)`,
            [title, description, keywords, itemsPerPage,
                maxSizeExtract, maxFileSizeUpload, maxSizeDesc]);

        if ((exists && result.changedRows === 1) ||
            (!exists && result.affectedRows === 1)) {
            return res.status(statusOk).json({
                status: statusOk,
                success: 'Configuración actualizada con éxito',
            });
        } else {
            return res.status(statusBadRequest).json({
                status: statusBadRequest,
                error: 'La configuración suministrada es la misma que hay en base de datos'
            });
        }
    } catch (error) {
        next(error);
    }
};

// Controlador de la ruta DELETE '/api/admin/articles/:id': Elimina un artículo
// dado su ID único numérico
const apiAdminArticlesIdDelete = async (req, res, next) => {
    const statusOk = 200, statusBadRequest = 400;
    
    try {
        const id = req.params.id;
        const [result] = await db.execute(`delete from items
            where id = ?`, [id]);

        if (result.affectedRows === 1) {
            return res.status(statusOk).json({
                status: statusOk,
                success: `Artículo  con ID ${id} eliminado`
            });
        } else {
            return res.status(statusBadRequest).json({
                status: statusBadRequest,
                error: `No se encontró ningún artículo  con ID ${id}`
            });
        }
    } catch (error) {
        next(error);
    }
};

// Renderiza el formulario de edición de artículo: /admin/article-update/:id
const adminArticleUpdateGet = (req, res, next) => {
    res.render('admin/article-update', {
        title: 'Editar artículo',
        page_desc: 'Formulario de actualización de artículo',
        page_keys: 'artículo, actualizar'
    });
};

// Procesa la modificación de un artículo: PUT /api/admin/articles
const apiAdminArticlesPut = async (req, res, next) => {
    const statusOk = 201, statusBadRequest = 400;
    
    try {
        let { id, visible, category_id, title, page_desc, page_keys,
            description, img_filename, files } = req.body;
        const file = files[0];
        const tv = new TextValidator();            
        // El slug del título
        const title_id = sw.normalize(title, true, '-');
        if (!(
            tv.validate(title, TextValidator.reNoEmpty,
                'El título no puede ser vacío', { maxLength: 128 }) &&
            tv.validate(title_id, TextValidator.reNoEmpty,
                'Título no admitido: Debe aparecer alguna palabra') &&
            tv.validate(description, TextValidator.reNoEmpty,
                'La descripción no puede ser vacía', { maxLength: req.config.max_size_desc })
        )) {
            return res.status(statusBadRequest).json({
                status: statusBadRequest,
                error: tv.getLastMessage()
            });
        }

        // Si se subió un fichero se comprueba       
        if (file) {
            if (!(
                tv.validateFilename(file.name, { reExt: TextValidator.reImgExt }) &&
                tv.validateFileSize(file.size, req.config.max_file_size_upload)
            )) {
                return res.status(statusBadRequest).json({
                    status: statusBadRequest,
                    error: tv.getLastMessage()
                });
            }
            // El nombre del fichero
            img_filename = file.name;
        }

        // Actualizamos los datos en BBDD
        await db.execute(`update items set visible = ?, category_id = ?,
            title = ?, title_id = ?, page_desc = ?, page_keys = ?,
            description = ?, img_filename = ? where id = ?`,
            [visible ? 1 : 0, category_id, title, title_id, page_desc, page_keys,
                description, img_filename, id]);

        // Guardamos el fichero en disco si se ha enviado
        if (file) {
            await writeFile(path.join(publicDir, 'uploads', file.name),
                getBase64FromDataUrl(file.content), { encoding: 'base64' });
        }

        return res.status(statusOk).json({
            status: statusOk,
            success: 'Artículo actualizado con éxito',
        });
    } catch (error) {
        next(error);
    }
};

// Renderiza el formulario de creación de artículo: /admin/article-create
const adminArticleCreateGet = (req, res, next) => {
    res.render('admin/article-create', {
        title: 'Crear artículo',
        page_desc: 'Formulario de creación de artículo',
        page_keys: 'artículo, crear'
    });
};

// Procesa la creación de un artículo: POST /api/admin/articles
const apiAdminArticlesPost = async (req, res, next) => {
    const statusOk = 201, statusBadRequest = 400;
    
    try {
        let { visible, category_id, title, page_desc, page_keys,
            description, files } = req.body;
        const file = files[0];
        const tv = new TextValidator();
        // El slug del título
        const title_id = sw.normalize(title, true, '-');
        if (!(
            tv.validate(title, TextValidator.reNoEmpty,
                'El título no puede ser vacío') &&
            tv.validate(title_id, TextValidator.reNoEmpty,
                'Título no admitido: Debe aparecer alguna palabra') &&
            tv.validate(description, TextValidator.reNoEmpty,
                'La descripción no puede ser vacía')
        )) {
            return res.status(statusBadRequest).json({
                status: statusBadRequest,
                error: tv.getLastMessage()
            });
        }

        // Si se subió un fichero se comprueba       
        let img_filename;
        if (file) {
            if (!(
                tv.validateFilename(file.name, { reExt: TextValidator.reImgExt }) &&
                tv.validateFileSize(file.size, req.config.max_file_size_upload)
            )) {
                return res.status(statusBadRequest).json({
                    status: statusBadRequest,
                    error: tv.getLastMessage()
                });
            }
            // El nombre del fichero
            img_filename = file.name;
        } else {
            img_filename = null;
        }

        // Obtenemos el orden más grande y lo aumentamos en 1
        const [result] = await db.execute('select max(orden) as max_orden from items');
        const orden = (result[0].max_orden ?? 0) + 1;

        // Inserta el registro
        await db.execute(`insert into items(visible, category_id, title,
            title_id, page_desc, page_keys, description, img_filename, orden)
            values(?, ?, ?, ?, ?, ?, ?, ?, ?)`, [visible ? 1 : 0, category_id, title,
            title_id, page_desc, page_keys, description, img_filename, orden]);

        // Guardamos el fichero en disco si se ha enviado
        if (file) {
            await writeFile(path.join(publicDir, 'uploads', file.name),
                getBase64FromDataUrl(file.content), { encoding: 'base64' });
        }

        return res.status(statusOk).json({
            status: statusOk,
            title_id,
            success: 'Artículo creado con éxito',
        });
    } catch (error) {
        next(error);
    }
};

// Renderiza el formulario de administración del upload: /admin/upload-form
const adminUploadFormGet = (req, res, next) => {
    res.render('admin/upload-form', {
        title: 'Administración del Upload',
        page_desc: 'Formulario de administración del upload',
        page_keys: 'upload, imagen'
    });
};

// Controlador de la ruta '/api/admin/uploaded-files': Devuelve una lista
// con información de los ficheros presentes en el upload
const apiAdminUploadedFilesGet = async (req, res, next) => {
    const statusOk = 200;
    const uploadedFiles = [];
    
    try {
        // Obtenemos la lista de ficheros
        const uploadDir = path.join(publicDir, 'uploads');
        const paths = await readdir(uploadDir, { encoding: 'utf-8' });
        for (const name of paths) {
            // La ruta completa
            const fullPath = path.join(uploadDir, name);
            // Información estadística
            const stats = await stat(fullPath);
            // Agregamos la información            
            uploadedFiles.push({
                name: name,
                lastModified: stats.mtime,
                size: stats.size
            });
        }


        res.status(statusOk).json({
            status: statusOk,
            uploadedFiles
        });
    } catch (error) {
        next(error);
    }
};

// Eliminar uno o más ficheros: PUT /api/admin/uploaded-files
const apiAdminUploadedFilesPut = async (req, res, next) => {
    const statusOk = 200;
    
    try {
        const uploadDir = path.join(publicDir, 'uploads');
        const { filesForDelete } = req.body;

        // Se recorre la lista de ficheros y se van eliminando del disco
        let nDeletedFiles = 0, nUnDeletedFiles = 0;
        for (const name of filesForDelete) {
            // La ruta completa
            const fullPath = path.join(uploadDir, name);
            try {
                await unlink(fullPath);
                nDeletedFiles++;
            } catch (error) {
                nUnDeletedFiles++;
            }
        }
        let extra = '';
        if (nUnDeletedFiles) {
            extra = `; ${nUnDeletedFiles} no eliminados`;
        }

        return res.status(statusOk).json({
            status: statusOk,
            success: `${nDeletedFiles} ficheros eliminados${extra}`,
        });
    } catch (error) {
        next(error);
    }
};

// Subir uno o más ficheros: POST /api/admin/uploaded-files
const apiAdminUploadedFilesPost = async (req, res, next) => {
    const statusOk = 200;
    
    try {
        // Ruta absoluta del directorio de subidas
        const uploadDir = path.join(publicDir, 'uploads');
        const { files } = req.body;
        
        // Se recorre la lista de ficheros y se van eliminando del disco
        let nUploadedFiles = 0, nUnUploadedFiles = 0;
        for (const file of files) {
            // La ruta completa
            const fullPath = path.join(uploadDir, file.name);
            try {
                await writeFile(fullPath, getBase64FromDataUrl(file.content), { encoding: 'base64' });
                nUploadedFiles++;
            } catch (error) {
                nUnUploadedFiles++;
            }
        }
        let extra = '';
        if (nUnUploadedFiles) {
            extra = `; ${nUnUploadedFiles} no eliminados`;
        }

        return res.status(statusOk).json({
            status: statusOk,
            success: `${nUploadedFiles} ficheros subidos${extra}`,
        });
    } catch (error) {
        next(error);
    }
};

// Devuelve un documento XML conteniendo el Sitemap: GET /admin/api/sitempap
const apiAdminSitemapGet = async (req, res, next) => {
    const statusOk = 200;
    const content = [];

    try {
        // Calcula la URL base                
        const protocol = ['localhost', '127.0.0.1'].includes(req.hostname) ? 'http' : 'https';
        const urlBase = `${protocol}://${req.hostname}${
            protocol === 'https' ? '' : ':' + req.socket.localPort}`;
        // Cabecera del sitemap
        content.push(sitemapPart('h', '', ''));
        // Fecha ISO actual
        const isoDate = new Date().toISOString().substring(0, 10);

        // Página principal del sitio
        content.push(sitemapPart('b', urlBase, isoDate));

        // /tools/logic-calculator
        content.push(sitemapPart('b', `${urlBase}/tools/logic-calculator`, isoDate));

        // Cuerpo del sitemap
        const [titlesId] = await db.execute('select title_id from items');
        for (const { title_id } of titlesId) {
            content.push(sitemapPart(
                'b',
                `${urlBase}/articles-title-id/${title_id}`,
                isoDate
            ));
        }

        // Pie del sitemap
        content.push(sitemapPart('f', '', ''));

        // Generamos el sitemap en el directorio raiz del servidor                
        await writeFile(path.join(publicDir, 'sitemap.xml'), content.join(''), { encoding: 'utf-8' });
        // La respuesta incluye un campo con la URL del Sitemap
        res.status(statusOk).json({
            status: statusOk,
            success: 'Sitemap generado con éxito',
            url: `${urlBase}/sitemap.xml`
        });           
    } catch (error) {
        next(error);
    }
};

// Renderiza el formulario de administración del upload: /admin/upload-form
const adminStatRequestsFormGet = (req, res, next) => {
    res.render('admin/stat-requests-form', {
        title: 'Estadística de solicitudes',
        page_desc: 'Formulario de información sobre estadísticas de solicitudes',
        page_keys: 'stat, request'
    });
};

// Devuelve información estadística de las solicitudes: GET /admin/api/stat
const apiAdminStatRequestsGet = async (req, res, next) => {
    const statusOk = 200;    

    try {        
        const [statRequests] = await db.execute('select * from visits');        
        
        // La respuesta incluye un campo con la URL del Sitemap
        res.status(statusOk).json({
            status: statusOk,
            statRequests
        });           
    } catch (error) {
        next(error);
    }
};

// Eliminar una o más página de la tabla de visitas: PUT /api/admin/stat-requests
const apiAdminStatRequestsPut = async (req, res, next) => {
    const statusOk = 200;

    try {
        const { pages } = req.body;
        // Construye la cláusula IN
        const pageIn = `page in (${'?'.repeat(pages.length).split('').join(', ')})`;

        await db.execute(`delete from visits where ${pageIn}`, [...pages]);
        
        return res.status(statusOk).json({
            status: statusOk,
            success: 'Páginas eliminadas de la estadística con éxito'
        });
    } catch (error) {
        next(error);
    }
};

export {
    adminCategoriesFormGet,
    apiAdminCategoriesPost,
    apiAdminCategoriesPut,
    apiAdminCategoriesDelete,
    apiAdminCategoriesSwapPut,
    adminConfigFormGet,
    apiAdminConfigPost,
    apiAdminArticlesIdDelete,
    adminArticleUpdateGet,
    apiAdminArticlesPut,
    adminArticleCreateGet,
    apiAdminArticlesPost,
    adminUploadFormGet,
    apiAdminUploadedFilesGet,
    apiAdminUploadedFilesPut,
    apiAdminUploadedFilesPost,
    apiAdminSitemapGet,
    adminStatRequestsFormGet,
    apiAdminStatRequestsGet,
    apiAdminStatRequestsPut
};
