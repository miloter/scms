(() => {
    const app = Vue.createApp({
        template: /*html*/`    
        <nav class="navbar navbar-expand-lg bg-body-tertiary">
            <div class="container-fluid">            
                <a v-if="config" class="navbar-brand" href="/">{{ config.title }}</a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse"
                    data-bs-target="#navbarNav" aria-controls="navbarNav"
                    aria-expanded="false" aria-label="Toggle navigation">            
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav">
                        <li class="nav-item">
                            <a href="/" class="nav-link" :class="classIfPath('/')">
                                Inicio
                            </a>
                        </li>                              
                        <li class="nav-item">
                            <a href="/tools/logic-calculator" class="nav-link" :class="classIfPath('/tools/logic-calculator')">
                                Calculadora Lógica
                            </a>
                        </li>                                      
                        <template v-if="user">                                                        
                            <li class="nav-item">
                                <a href="/admin/article-create" class="nav-link" :class="classIfPath('/admin/article-create')">
                                    Nuevo artículo
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="/admin/categories-form" class="nav-link" :class="classIfPath('/admin/categories-form')">
                                    Gestiónar Categorías
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="/admin/upload-form" class="nav-link" :class="classIfPath('/admin/upload-form')">
                                    Administrar upload
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="/admin/config-form" class="nav-link" :class="classIfPath('/admin/config-form')">
                                    Configurar sitio
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="/admin/stat-requests-form" class="nav-link" :class="classIfPath('/admin/statistics-requests-form')">
                                    Estadística de solicitudes
                                </a>
                            </li>
                            <li class="nav-item">
                                <a @click="closeSession" href="#" class="nav-link">
                                    Cerrar Sesión
                                </a>
                            </li>                 
                        </template>
                        <template v-else>                            
                            <li class="nav-item">
                                <a href="/auth/login" class="nav-link" :class="classIfPath('/auth/login')">
                                    Iniciar Sesión
                                </a>
                            </li>                            
                        </template>                                                
                        <li v-if="inHome()" class="nav-item">
                            <form>
                                <select v-model="category" name="category" class="me-1">
                                    <option value="0">Todas las categorías</option>
                                    <option v-for="c of categories" :key="c.id"
                                        :value="c.id">{{ c.description }}</option>
                                </select>
                                <input type="search" name="search" v-model="search" placeholder="&#x1f50d;">
                            </form>
                        </li>
                    </ul>              
                </div>
            </div>          
        </nav>        
    `,
        data() {
            return {

                config: null,
                categories: [],
                category: 0,
                search: '',
                user: null
            };
        },
        methods: {
            closeSession() {
                location.href = '/auth/logout';
            },
            classIfPath(pathname) {
                return (location.pathname === pathname ? 'active' : '');
            },
            inHome() {
                return (location.pathname === '/');
            }
        },
        created() {
            // Recuperamos datos de la cadena de búsqueda
            const urlSearch = new URLSearchParams(location.search);
            this.category = urlSearch.get('category') ?? 0;
            this.search = urlSearch.get('search') ?? '';

            // Recuperamos los datos de configuración
            fetch('/api/config')
                .then(response => {
                    return response.json()
                })
                .then(json => {
                    if (json.error) throw new Error(json.error);
                    this.config = json;                    
                })
                .catch(error => {
                    this.appendAlert(error.message, 'danger');
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

            // Comprueba si hay un usuario que ha iniciado sesión
            fetch('/api/auth/user')
                .then(response => {
                    return response.json();
                })
                .then(json => {
                    if (json.status === 200) {
                        this.user = json.user;
                    }
                })
                .catch(error => {
                    this.appendAlert(error.message, 'danger');
                });
        }
    });    
    app.use(pluginGlobals).mount('#vueHeader');
})();

