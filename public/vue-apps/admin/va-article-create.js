(() => {
    const app = Vue.createApp({
        template: /*html*/`                        
            <header class="d-flex justify-content-center align-items-center gap-2">
                <h1 class="text-center">Crear artículo</h1>
                <a v-if="title_id" :href="'/articles-title-id/' + title_id" target="_blank">Ver en nueva ventana</a>
            </header>
            <form @submit="onSubmit">
                <div class="mb-3 d-flex justify-content-center align-items-center gap-3">
                    <div>                
                        <input type="checkbox" id="visible" v-model="visible"
                            class="form-check-input"
                            required> <label for="visible"
                                class="form-check-label">Visible</label>
                    </div>
                    <div>
                        <label for="category">Categoría</label>
                        <select id="category" v-model="category_id" class="form-select">
                            <option :value="null">Todas las categorías</option>
                            <option v-for="c of categories" :key="c.id"
                                :value="c.id">{{ c.description }}</option>
                        </select>
                    </div>                
                </div>    
                <div class="mb-3">
                    <label for="title" class="form-label">(*) Título</label>
                    <input type="text" id="title" v-model="title"
                        class="form-control" required>
                </div>        
                <div class="mb-3">
                    <label for="page_desc" class="form-label">Descripción</label>
                    <input type="text" id="page_desc" v-model="page_desc"
                        class="form-control">                   
                </div>
                <div class="mb-3">
                    <label for="page_keys" class="form-label">Palabras clave</label>
                    <input type="text" id="page_keys" v-model="page_keys"
                        class="form-control">                   
                </div>            
                <div class="mb-3">
                    <label for="description" class="form-label">(*) Contenido</label>
                    <textarea id="description" rows="16" maxlength="15000"
                       v-model="description" class="form-control" required></textarea>                    
                </div>            
                <div class="mb-3">
                    <label for="file" class="form-label">Imagen del artículo</label>
                    <input type="file" id="file"
                        accept=".png, .jpg, .jpeg, .gif, .bmp"
                        @change="onFileChange" class="form-control"> 
                    <img v-if="files.length" :src="files[0].content" width="128"  alt="Imagen del artículo">
                </div>                
                <button type="submit" class="btn btn-primary">Crear artículo</button>
            </form>         
            <p>
                (*) Campos obligatorios
            </p>
        `,
        data() {
            return {
                // Contiene el title_id del último artículo creado
                title_id: '',
                categories: [],                
                visible: true,
                category_id: null,
                title: '',
                page_desc: '',
                page_keys: '',
                description: '',
                files: [],
                isFilesReady: true
            };
        },
        methods: {
            onFileChange(e) {
                this.isFilesReady = false;
                this.files = [];
    
                const filePromises = Object.entries(e.target.files).map(item => {
                    // Crea una promesa de conversión a base 64 para cada fichero
                    return new Promise((resolve, reject) => {
                        // El índice 1 contiene los datos del fichero
                        const file = item[1];
                        const { name, type, size, lastModified } = file;
                        const reader = new FileReader();
    
                        reader.readAsDataURL(file);
                        reader.onload = e => {
                            this.files.push({
                                content: e.target.result,
                                name,
                                type,
                                size,
                                lastModified
                            });
                            resolve();
                        };
                        reader.onerror = () => {
                            console.error(`Error convirtiendo fichero ${name}`);
                            reject();
                        }
                    });
                });
    
                // Intenta la conversión
                Promise.all(filePromises)
                    .then(() => this.isFilesReady = true)
                    .catch(error => console.error(error));
            },
            onSubmit(event) {
                event.preventDefault();
                this.removeAlerts();

                // Si los ficheros no están listos termina
                if (!this.isFilesReady) {
                    return this.appendAlert('Los ficheros no están listos, inténtelo en unos momentos', 'warning');
                }

                // Envía el formulario con los cambios
                fetch('/api/admin/articles', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        visible: this.visible,
                        category_id: this.category_id,
                        title: this.title,
                        page_desc: this.page_desc,
                        page_keys: this.page_keys,
                        description: this.description,
                        files: this.files
                    })
                })
                    .then(response => {
                        return response.json()
                    })
                    .then(json => {
                        if (json.error) throw new Error(json.error);
                        this.title_id = json.title_id;
                        this.appendAlert(json.success, 'success');
                    })
                    .catch(error => {
                        this.appendAlert(error.message, 'danger');
                    })
            }
        },
        created() {
            // Si no hay sesión redirecciona a la página de login        
            fetch('/api/auth/user').then(response => {
                if ([401, 403].includes(response.status)) {
                    return location.href = '/auth/login';
                }
            });

            // Obtenemos las categorías
            fetch('/api/categories')
                .then(response => {
                    return response.json();
                })
                .then(json => {
                    if (json.status === 200) {
                        this.categories = json.categories;
                    }
                })
                .catch(error => {
                    this.appendAlert(error.message, 'danger');
                });            
        }
    });
    // Agregamos métodos externos a la instancia    
    Object.assign(app.config.globalProperties, globals);
    app.mount('#vueAdminArticleCreate');
})();

