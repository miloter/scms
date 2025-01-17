import {
    setJwtCookie,
    jwtCookieName,    
    generateToken
} from '../helpers/utils.js';
import bcrypt from 'bcrypt';

// Devuelve información del usuario que hace la petición a parti del JWT válido
const apiAuthUserGet = async (req, res, next) => {
    try {        
        const statusOk = 200;        

        res.status(statusOk).json({ status: statusOk, user: req.user });
    } catch (error) {
        next(error);
    }
};

// Despliega la vista del inicio de sesión en la aplicación
const authLoginGet = async (req, res) => {
    try {
        res.render('auth/login', {
            title: 'Iniciar Sesión',
            page_desc: 'Inicio de sesión para administradores del sitio',
            page_keys: 'sesión, autorización'            
        });
    } catch (error) {
        next(error);
    }
};

// Permite el inicio de sesión en la aplicación, si el inicio es
// correcto, se devuelve un JSON Web Token
const apiAuthLoginPost = async (req, res, next) => {
    try {
        const statusUnauthorized = 401;
        const msgUnathorized = 'Usuario o contraseña incorrectos';
        const { username, password } = req.body;        
        const match = username === process.env.ADMIN_USERNAME &&
            await bcrypt.compare(password, process.env.ADMIN_PASSWORD);

        if (match) {
            const user = { id: 1, username };
            const accessToken = await generateToken(user);  
            setJwtCookie(res, accessToken, req.secure);                
            res.json({ accessToken, user });
        } else {
            return res.status(statusUnauthorized).json(
                { statusUnauthorized, error: msgUnathorized });
        }        
    } catch (error) {
        next(error);
    }
};

// Cierra la sesión
const authLogoutGet = (req, res, next) => {
    res
        .cookie(jwtCookieName, '', { maxAge: -1 })
        .redirect('/');
};

export {
    apiAuthUserGet,
    authLoginGet,
    apiAuthLoginPost,
    authLogoutGet
};
