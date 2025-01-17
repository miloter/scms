(() => {
    const app = Vue.createApp({
        template: /*html*/`    
            <div v-if="article" class="card w-75 mx-auto p-1">
                <div class="p-1 d-flex justify-content-center align-items-center gap-1">
                    <div class="small">
                        <b>Publicado: </b><span>[{{ toLocaleDate(article.date_time) }}]</span>
                    </div>
                    <a v-if="user?.id" :href="'/admin/article-update/' + article.id" class="btn btn-secondary me-1">Editar</a>                    
                </div>
                <img :src="'/uploads/' + (article.img_filename ?? 'diamante.png')" class="card-img-top w-75 mx-auto" alt="Imagen del artículo">
                <div class="card-body">                    
                    <h5 class="card-title text-center">{{ article.title }}</h5>
                    <p class="card-text" v-html="article.htmlDescription"></p>                            
                </div>
            </div>                        
        `,
        data() {
            return {
                article: null,
                user: null
            };
        },
        created() {
            // Recuperaramos el artículo al final de la URL:
            // /articles/title-id/:id (:id es de tipo string)
            fetch(`/api/articles-title-id/${location.href.split('/').pop()}`)
                .then(response => {
                    return response.json();
                })
                .then(json => {
                    if (json.error) throw new Error(json.error);
                    this.article = json.article;                    
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
                    this.user = (json.status === 200) ? json.user : null;                    
                })
                .catch(error => {
                    this.appendAlert(error.message, 'danger');
                });
        }
    });
    app.use(pluginGlobals).mount('#vueArticlesTitleId');
})();
