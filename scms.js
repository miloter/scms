import 'dotenv/config';
import { app } from './server.js';

// Inicia la escucha en el servidor
const port = process.env.PORT;
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
