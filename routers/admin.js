import express from 'express';
import {
    apiAdminSitemapGet,
    apiAdminUploadedFilesGet,
    apiAdminUploadedFilesPost,
    apiAdminUploadedFilesPut,
    adminArticleCreateGet,
    adminArticleUpdateGet,
    apiAdminArticlesIdDelete,
    apiAdminArticlesPost,
    apiAdminArticlesPut,
    apiAdminCategoriesDelete,
    adminCategoriesFormGet,    
    apiAdminCategoriesPost,
    apiAdminCategoriesPut,
    apiAdminCategoriesSwapPut,
    adminConfigFormGet,    
    apiAdminConfigPost,    
    adminUploadFormGet,
    adminStatRequestsFormGet,
    apiAdminStatRequestsGet,
    apiAdminStatRequestsPut
} from '../controllers/admin.js';
import { inyectConfig, requireAuthorization } from '../helpers/utils.js';

const adminRouter = express.Router();

adminRouter.get('/admin/categories-form', inyectConfig, adminCategoriesFormGet);
adminRouter.post('/api/admin/categories', requireAuthorization, apiAdminCategoriesPost);
adminRouter.put('/api/admin/categories', requireAuthorization, apiAdminCategoriesPut);
adminRouter.delete('/api/admin/categories', requireAuthorization, apiAdminCategoriesDelete);
adminRouter.put('/api/admin/categories/swap', requireAuthorization, apiAdminCategoriesSwapPut);
adminRouter.get('/admin/config-form', inyectConfig, adminConfigFormGet);
adminRouter.post('/api/admin/config', requireAuthorization, apiAdminConfigPost);
adminRouter.delete('/api/admin/articles/:id', requireAuthorization, apiAdminArticlesIdDelete);
adminRouter.get('/admin/article-update/:id', adminArticleUpdateGet);
adminRouter.put('/api/admin/articles', requireAuthorization, inyectConfig, apiAdminArticlesPut);
adminRouter.get('/admin/article-create', adminArticleCreateGet);
adminRouter.post('/api/admin/articles', requireAuthorization, inyectConfig, apiAdminArticlesPost);
adminRouter.get('/admin/upload-form', adminUploadFormGet);
adminRouter.get('/api/admin/uploaded-files', requireAuthorization, apiAdminUploadedFilesGet);
adminRouter.put('/api/admin/uploaded-files', requireAuthorization, apiAdminUploadedFilesPut);
adminRouter.post('/api/admin/uploaded-files', requireAuthorization, apiAdminUploadedFilesPost);
adminRouter.get('/api/admin/sitemap', requireAuthorization, apiAdminSitemapGet);
adminRouter.get('/admin/stat-requests-form', adminStatRequestsFormGet);
adminRouter.get('/api/admin/stat-requests', apiAdminStatRequestsGet);
adminRouter.put('/api/admin/stat-requests', apiAdminStatRequestsPut);

export default adminRouter;
