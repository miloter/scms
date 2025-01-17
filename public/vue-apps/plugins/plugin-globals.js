const pluginGlobals = (app, options) => {
    // Agregamos métodos externos a la instancia    
    Object.assign(app.config.globalProperties, globals);
};
