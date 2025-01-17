(() => {
    const app = Vue.createApp({
        template: /*html*/`    
        <form @submit="onSubmit" class="w-50 mx-auto">
            <div class="mb-3">
                <label for="username" class="form-label">Usuario</label>
                <input type="text" id="username" v-model="username"
                    class="form-control" placeholder="Su nombre de usuario" required />
            </div>
            <div class="mb-3">
                <label for="password" class="form-label">Contraseña</label>
                <input type="password" id="password" v-model="password"
                    class="form-control" placeholder="Su contraseña" required />
            </div>
            <button type="submit" class="btn btn-primary">Iniciar sesión</button>
        </form>        
    `,
        data() {
            return {
                username: '',
                password: ''
            };
        },
        methods: {
            onSubmit(event) {
                event.preventDefault();
                this.removeAlerts();

                fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: this.username,
                        password: this.password
                    })
                })
                    .then(response => {
                        return response.json()
                    })
                    .then(json => {
                        if (json.error) throw new Error(json.error);
                        location.href = '/';
                    })
                    .catch(error => {
                        this.appendAlert(error.message, 'danger');
                    });
            }
        }
    });
    // Agregamos métodos externos a la instancia    
    Object.assign(app.config.globalProperties, globals);
    app.mount('#vueLogin');
})();

