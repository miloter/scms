(() => {
    const app = Vue.createApp({
        template: /*html*/`    
        <h1 class="text-center">Configuración del sitio</h1>    
        <section class="d-flex justify-content-center align-items-center gap-3">
            <button type="button" @click="onGenSitemap" class="btn btn-primary">Generar el Sitemap</button>
            <a v-if="sitemapUrl" :href="sitemapUrl" target="_blank">Ver Sitemap</a>
        </section>
        <hr>
        <p class="text-center">Rellene los siguientes campos por favor</p>
        <form @submit="onSubmit" class="w-50 mx-auto">
            <div class="mb-3">
                <label for="title" class="form-label">(*) Título del sitio</label>
                <input type="text" id="title" name="title" v-model="title"
                    class="form-control w-100" required>
            </div>
            <div class="mb-3">
                <label for="description" class="form-label">Descripción</label>
                <input type="text" id="description" name="description" v-model="description"
                    class="form-control">                   
            </div>
            <div class="mb-3">
                <label for="keywords" class="form-label">Palabras clave</label>
                <input type="text" id="keywords" name="keywords" v-model="keywords"
                    class="form-control">                   
            </div>            
            <div class="mb-3">
                <label for="itemsPerPage" class="form-label">(*) Artículos por página</label>
                <input type="text" id="itemsPerPage" name="itemsPerPage" v-model="itemsPerPage"
                    class="form-control w-25" required>                   
            </div>            
            <div class="mb-3">
                <label for="maxSizeExtract" class="form-label">(*) Máximo número de caracteres en extractos</label>
                <input type="text" id="maxSizeExtract" name="maxSizeExtract" v-model="maxSizeExtract"
                    class="form-control w-25" required>                   
            </div>            
            <div class="mb-3">
                <label for="maxFileSizeUpload" class="form-label">(*) Máximo tamaño de fichero subido (en Bytes)</label>
                <input type="text" id="maxFileSizeUpload" name="maxFileSizeUpload" v-model="maxFileSizeUpload"
                    class="form-control w-25" required>                   
            </div>            
            <div class="mb-3">
                <label for="maxSizeDesc" class="form-label">(*) Máximo número de caracteres en un artículo</label>
                <input type="text" id="maxSizeDesc" name="maxSizeDesc" v-model="maxSizeDesc"
                    class="form-control w-25" required>                   
            </div>            
            <button type="submit" class="btn btn-primary w-100">Aplicar</button>
        </form>
        <div class="w-50 mx-auto my-1">            
            <p>
                (*) Campos obligatorios
            </p>
            <p>
                El campo "Descripción del sitio" describe el propósito se su sitio.
                Se recomienda ponerlo ya que ofrece una descripción a los motores de búsqueda.
            </p>
            <p>
                El campo "Palabras clave del sitio" consiste en una serie de palabras
                separadas por comas, que indican a los motores de búsqueda la
                temática de su sitio web. Le recomendamos ponerlo para que su sitio
                web sea mejor catalogado por los motores de búsqueda.
            </p>
        </div>   
    `,
        data() {
            return {
                title: '',
                description: '',
                keywords: '',
                itemsPerPage: 0,
                maxSizeExtract: 0,
                maxFileSizeUpload: 0,
                maxSizeDesc: 0,
                sitemapUrl: ''
            };
        },
        methods: {
            onGenSitemap() {
                this.removeAlerts();

                fetch('/api/admin/sitemap')        
                    .then(response => {
                        return response.json()
                    })
                    .then(json => {
                        if (json.error) throw new Error(json.error);
                        this.sitemapUrl = json.url;
                        this.appendAlert(json.success, 'success');
                    })
                    .catch(error => {
                        this.appendAlert(error.message, 'danger');
                    })
            },
            onSubmit(event) {
                event.preventDefault();
                this.removeAlerts();

                fetch('/api/admin/config', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        title: this.title,
                        description: this.description,
                        keywords: this.keywords,
                        itemsPerPage: this.itemsPerPage,
                        maxSizeExtract: this.maxSizeExtract,
                        maxFileSizeUpload: this.maxFileSizeUpload,
                        maxSizeDesc: this.maxSizeDesc
                    })
                })
                    .then(response => {
                        return response.json()
                    })
                    .then(json => {
                        if (json.error) throw new Error(json.error);
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

            // Recuperamos los datos de configuración
            fetch('/api/config')
                .then(response => {
                    return response.json()
                })
                .then(json => {
                    if (json.error) throw new Error(json.error);
                    this.title = json.title;
                    this.description = json.page_desc;
                    this.keywords = json.page_keys;
                    this.itemsPerPage = json.items_per_page;
                    this.maxSizeExtract = json.max_size_extract;
                    this.maxFileSizeUpload = json.max_file_size_upload;
                    this.maxSizeDesc = json.max_size_desc;
                })
                .catch(error => {
                    this.appendAlert(error.message, 'danger');
                })
        }
    });
    // Agregamos métodos externos a la instancia    
    Object.assign(app.config.globalProperties, globals);
    app.mount('#vueAdminConfigForm');
})();

