const app = Vue.createApp({
    template: /*html*/`    
            <h1 class="text-center">Estadística de solicitudes</h1>
            <div v-show="spinner" class="d-flex justify-content-center">
                <div class="spinner-border text-success" role="status"
                    style="width: 11rem; height: 11rem;"></div>
            </div>
            <form class="mx-auto">                
                <div class="mb-3 d-flex justify-content-center align-items-center gap-3">
                    <div>Número total de solicitudes: {{ totalRequests }}</div>
                    <div>
                        <input type="checkbox" id="selectAll" v-model="selectAll"
                            class="form-check-input"> <label for="selectAll"
                                class="form-check-label">Seleccionar todo</label>
                    </div>
                    <button type="submit" :disabled="pages.length === 0"
                        @click="onDelete" class="btn btn-danger">
                        Eliminar
                    </button>
                </div>                
            </form>             
            <table-quick :headers="headers" :rows="statRequests"
                :rowsPerPage="10" :rowsSelectPage="[10, 20, 50, 100]"
                :csvExport="true">            
                <template #['page']="{ row }">
                    <input type="checkbox" :value="row.page"
                    v-model="pages"> <a :href="row.page"
                        target="_blank">{{ row.page }}</a>                                
                </template>
                <template #['date_time']="{ row }">
                    {{ toISOLocaleDate(row.date_time) }}
                </template>
            </table-quick>            
        `,
    data() {
        return {
            spinner: false,
            headers: [{
                title: 'Página',
                key: 'page',
                showFilter: true
            }, {
                title: 'Visitas',
                key: 'count',
                showFilter: true
            }, {
                title: 'Última visita',
                key: 'date_time',
                showFilter: true
            }],
            selectAll: false,
            statRequests: [],
            pages: []
        };
    },
    watch: {
        selectAll() {
            if (this.selectAll) {
                this.pages = this.statRequests.map(sr => sr.page);
            } else {
                this.pages = [];
            }
        }
    },
    computed: {
        totalRequests() {
            return this.statRequests.reduce((pre, cur) => pre += cur.count, 0);
        }
    },
    methods: {
        async reloadPages() {
            this.spinner = true;
            return fetch('/api/admin/stat-requests')
                .then(response => {
                    return response.json();
                })
                .then(json => {
                    if (json.error) throw new Error(json.error);
                    this.selectAll = false;
                    this.pages = [];
                    this.statRequests = json.statRequests;
                    this.files = [];
                })
                .catch(error => {
                    this.appendAlert(error.message, 'danger');
                })
                .finally(() => {
                    this.spinner = false;
                });
        },
        onDelete(event) {
            event.preventDefault();
            this.removeAlerts();

            if (!confirm('¿Desea eliminar de la estadística las páginas seleccionadas?')) return

            this.spinner = true;
            // Envía el formulario con los cambios
            fetch('/api/admin/stat-requests', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ pages: this.pages })
            })
                .then(response => {
                    return response.json()
                })
                .then(async json => {
                    if (json.error) throw new Error(json.error);
                    await this.reloadPages();
                    this.appendAlert(json.success, 'success');
                })
                .catch(error => {
                    this.appendAlert(error.message, 'danger');
                })
                .finally(() => {
                    this.spinner = false;
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

        // Obtenos la lista de ficheros subidos
        this.reloadPages();
    }
});
app.use(pluginGlobals);
