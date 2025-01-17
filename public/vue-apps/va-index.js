(() => {
    const app = Vue.createApp({
        template: /*html*/`    
            <main>            
                <h1 class="text-center">Últimos artículos</h1>
                <div class="d-flex flex-column justify-content-center align-items-center gap-1">
                    <div v-for="article of articles" :key="article.id" class="card w-75 p-1">
                        <div class="p-1 d-flex justify-content-center align-items-center gap-1">
                            <div class="small">
                                <b>Publicado: </b><span>[{{ toLocaleDate(article.date_time) }}]</span>
                            </div>
                            <div v-if="user?.id">
                                <a :href="'/admin/article-update/' + article.id" class="btn btn-secondary me-1">Editar</a>
                                <a @click.prevent="onDelete(article.id)" class="btn btn-danger">Eliminar</a>
                            </div>
                        </div>
                        <img :src="'/uploads/' + (article.img_filename ?? 'diamante.png')" class="card-img-top w-75 mx-auto" alt="Imagen del artículo">
                        <div class="card-body">                    
                            <h5 class="card-title text-center">{{ article.title }}</h5>
                            <p class="card-text">                                
                                {{ article.summary }}
                                <a :href="'/articles-title-id/' + article.title_id">Ver todo</a>
                            </p>                            
                        </div>
                    </div>            
                </div>
            </main>        
            <form class="my-1 d-flex justify-content-center align-items-center gap-1">
                <input type="hidden" name="category" :value="category">
                <input type="hidden" name="search" :value="search">            
                <button type="submit" @click="onPrevPage" class="btn btn-success"><<</button>
                Página <input type="text" @keydown.enter.prevent="onKeyEnter" name="page" v-model="page" size="3"> de {{ pages }}
                <button type="submit" class="btn btn-primary">Ir</button>
                <button type="submit" @click="onNextPage" class="btn btn-success">>></button>
            </form>                
        `,  
        data() {
            return {
                category: null,
                search: '',
                articles: [],
                config: null,
                page: 1,
                pages: 0,
                user: null
            };
        },    
        methods: {    
            /**
             * Después de pulsar ENTER en la caja de texto de página actual
             * se envía manualmente el formulario para evitar efectos secundarios.
             * @param {*} e 
             */
            onKeyEnter(e) {
                e.target.closest('form').submit();            
            },
            onPrevPage(event) {            
                if (this.page > 1) {
                    this.page--;
                } else {
                    event.preventDefault();
                }
            },
            onNextPage(event) {
                if (this.page < this.pages) {
                    this.page++;
                } else {
                    event.preventDefault();
                }
            },
            onDelete(id) {
                if (!confirm(`¿Eliminar el artículo con ID ${id}?`)) return;            
                this.removeAlerts();            
                fetch(`/api/admin/articles/${id}`, { method: 'DELETE' })
                    .then(response => {
                        return response.json()
                    })
                    .then(json => {
                        if (json.error) throw new Error(json.error);                        
                        this.reloadArticles();
                        this.appendAlert(json.success, 'success');
                    })
                    .catch(error => {
                        this.appendAlert(error.message, 'danger');
                    });
            },
            /**
             * Carga inicialmente o recarga la lista de artículos
             */
            reloadArticles() {
                // Recuperamos datos de la cadena de búsqueda
                const urlSearch = new URLSearchParams(location.search);
                this.category = urlSearch.get('category');
                this.search = urlSearch.get('search');

                // Recuperamos el listado de artículos según la cadena de búsqueda        
                fetch(`/api/articles${location.search}`)
                    .then(response => {                
                        return response.json();
                    })
                    .then(json => {
                        if (json.error) throw new Error(json.error);
                        this.articles = json.articles;
                        this.config = json.config;
                        this.page = json.page;
                        this.pages = json.pages;
                    })
                    .catch(error => {
                        this.appendAlert(error.message, 'danger');
                    });
            }
        },
        created() {                        
            this.reloadArticles();        

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
    app.use(pluginGlobals).mount('#vueIndex');
})();
