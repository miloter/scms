import mysql from 'mysql2/promise';

/**
 * Apunta a un pool de conexiones. Este sistema tiene la virtud
 * de que si se cierran las conexiones por inactividad por parte
 * de MySQL, el ppol lo detectará y las reabrirá.
 */
const db = mysql.createPool({
    host: process.env.host,
    user: process.env.user,
    password: process.env.password,
    database: process.env.database    
});

export { db };
