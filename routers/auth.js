import express from 'express';
import { inyectConfig, requireAuthorization, statRequests } from '../helpers/utils.js';
import {
    apiAuthLoginPost,
    apiAuthUserGet,
    authLoginGet, authLogoutGet
} from '../controllers/auth.js';

const authRouter = express.Router();

authRouter.get('/api/auth/user', requireAuthorization, apiAuthUserGet);
authRouter.get('/auth/login', inyectConfig, authLoginGet);
authRouter.post('/api/auth/login', statRequests, apiAuthLoginPost);
authRouter.get('/auth/logout', authLogoutGet);


export default authRouter;
