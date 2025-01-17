import express from 'express';
import {
    apiCategoriesGet,
    indexGet,
    apiConfigGet,
    articlesTitleIdGet,
    apiArticlesGet,
    apiArticlesTitleIdGet,
    apiArticlesIdGet, } from '../controllers/index.js';
import { inyectConfig, statRequests } from '../helpers/utils.js';

const indexRouter = express.Router();

indexRouter.get('/', inyectConfig, indexGet);
indexRouter.get('/api/categories', apiCategoriesGet);
indexRouter.get('/api/config', inyectConfig, apiConfigGet);
indexRouter.get('/api/articles', inyectConfig, apiArticlesGet);
indexRouter.get('/articles-title-id/:id', statRequests, articlesTitleIdGet);
indexRouter.get('/api/articles-title-id/:id', apiArticlesTitleIdGet);
indexRouter.get('/api/articles/:id', apiArticlesIdGet);

export default indexRouter;
