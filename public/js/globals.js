const globals = (() => {
    /**
     * Agrega una alerta al contenedor de alertas.
     * @param {*} message 
     * @param {*} type 
     */
    const appendAlert = (message, type) => {
        const alert = document.getElementById('alert');
        const wrapper = document.createElement('div');
        wrapper.innerHTML = [
            `<div class="alert alert-${type} alert-dismissible" role="alert">`,
            `   <div>${message}</div>`,
            '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
            '</div>'
        ].join('');
        alert.append(wrapper);
    };

    /**
     * Elimina todos los mensajes de alerta.
     */
    const removeAlerts = () => {
        const alert = document.getElementById('alert');
        while (alert.firstElementChild) {
            alert.removeChild(alert.firstElementChild);
        }
    };

    /**
     * Convierte una fecha a formato local en horas y minutos.
     * @param {string|number|Date} date 
     * @returns {string}
     */
    const toLocaleDate = date => {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        return date.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    /**
     * Devuelve la fecha pasada como argumento en formato ISO local
     * @param {string|number|Date} date 
     * @returns 
     */
    const toISOLocaleDate = (date) => {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());

        return date.toISOString().replace('T', ' ').replace('Z', '');
    };    


    return {
        appendAlert,
        removeAlerts,
        toLocaleDate,
        toISOLocaleDate
    };
})();
