(() => {
    const app = Vue.createApp({
        template: /*html*/`    
        <h1 class="text-center">Gestión de Categorías</h1>
        <form class="w-50 mx-auto">
            <div class="mb-3">
                <label for="description" class="form-label">Descripción de la categoría</label>
                <input type="text" id="description" name="description" v-model.trim="description"
                    class="form-control" required>
            </div>
            <div class="mb-3 d-flex gap-3">
                <button type="button" @click="onAddCategory" class="btn btn-primary">Agregar</button>
                <button type="button" @click="onUpdateCategory" class="btn btn-warning">Actualizar</button>
                <button type="button" @click="onDeleteCategory" class="btn btn-danger">Eliminar</button>
            </div>
            <div class="d-flex justify-content-center align-items-center gap-2">
                <div>
                    <label for="category" class="form-label">Lista de categorías</label>
                    <select id="category" name="category" v-model="category"
                        @change="description = categories.find(c => c.id === category).description"
                        :size="categories.length" class="form-select">
                        <option v-for="c of categories" :key="c.id"
                            :value="c.id">{{ c.description }}</option>
                    </select>
                </div>                        
                <div class="d-flex flex-column gap-3">
                    <button type="button" @click="upDownCategory('up')"
                        class="btn btn-success">
                        <i class="bi bi-arrow-up"></i>
                    </button>
                    <button type="button" @click="upDownCategory('down')"
                        class="btn btn-success">
                        <i class="bi bi-arrow-down"></i>
                    </button>
                </div>
            </div>
        </form>        
    `,
        data() {
            return {
                description: '',
                categories: [],
                category: 0
            };
        },
        methods: {
            checkNotEmptyDescription() {
                if (this.description) {
                    return true;
                } else {
                    this.appendAlert('Por favor, introduzca la descripción de la categoría', 'danger');
                    return false;
                }
            },
            checkNotEmptyCategory() {
                if (this.category) {
                    return true;
                } else {
                    return this.appendAlert('Por favor, seleccione la categoría que se debe actualizar', 'danger');
                }
            },
            checkNotExistsCategory() {
                if (this.categories.find(c => c.description.toLowerCase() ===
                    this.description.toLowerCase()) === undefined) {
                    return true;
                } else {
                    this.appendAlert('Esta categoría ya existe', 'danger');
                    return false;
                }
            },
            onUpdateCategory() {
                this.removeAlerts();
                if (!this.checkNotEmptyDescription()) return;
                if (!this.checkNotEmptyCategory()) return;
                if (!this.checkNotExistsCategory()) return;
                // Envía un PUT para actualizar la categoría
                fetch('/api/admin/categories', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: this.category,
                        description: this.description
                    })
                })
                    .then(response => {
                        return response.json()
                    })
                    .then(json => {
                        if (json.error) throw new Error(json.error);
                        this.appendAlert(json.success, 'success');
                        this.loadCategories();
                    })
                    .catch(error => {
                        this.appendAlert(error.message, 'danger');
                    });
            },
            onDeleteCategory() {
                this.removeAlerts();
                if (!this.checkNotEmptyCategory()) return;
                // Envía un DELETE para eliminar la categoría
                fetch('/api/admin/categories', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: this.category
                    })
                })
                    .then(response => {
                        return response.json()
                    })
                    .then(json => {
                        if (json.error) throw new Error(json.error);
                        this.appendAlert(json.success, 'success');
                        this.loadCategories();
                    })
                    .catch(error => {
                        this.appendAlert(error.message, 'danger');
                    });
            },
            upDownCategory(address) {
                if (!this.category) return;

                const index = this.categories.findIndex(c => c.id === this.category);
                let id1, id2;

                if (address === 'up' && index > 0) {
                    id2 = this.categories[index - 1].id;
                } else if (address === 'down' && (index + 1) < this.categories.length) {
                    id2 = this.categories[index + 1].id;
                } else {
                    return;
                }
                id1 = this.category;
                // Envía un PUT para actualizar el orden de las categorías            
                fetch('/api/admin/categories/swap', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id1,
                        id2
                    })
                })
                    .then(response => {
                        return response.json()
                    })
                    .then(json => {
                        if (json.error) throw new Error(json.error);
                        this.loadCategories();
                    })
                    .catch(error => {
                        this.appendAlert(error.message, 'danger');
                    });
            },
            loadCategories() {
                fetch('/api/categories')
                    .then(response => {
                        return response.json();
                    })
                    .then(json => {
                        if (json.error) throw new Error(json.error);
                        // Se ordenan por el campo 'orden'
                        json.categories.sort((c1, c2) => c1.orden - c2.orden);
                        this.categories = json.categories;
                    })
                    .catch(error => {
                        this.appendAlert(error.message, 'danger');
                    });
            },
            onAddCategory() {
                this.removeAlerts();
                if (!this.checkNotEmptyDescription()) return;
                if (!this.checkNotExistsCategory()) return;
                // Envía un POST para crear la categoría
                fetch('/api/admin/categories', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        description: this.description
                    })
                })
                    .then(response => {
                        return response.json()
                    })
                    .then(json => {
                        if (json.error) throw new Error(json.error);
                        this.appendAlert(json.success, 'success');
                        this.loadCategories();
                    })
                    .catch(error => {
                        this.appendAlert(error.message, 'danger');
                    });
            }
        },
        created() {
            // Si no hay sesión redirecciona a la página de login        
            fetch('/api/auth/user').then(response => {
                if ([401, 403].includes(response.status)) {
                    return location.href = '/auth/login';
                }
            });

            this.loadCategories(); // Obtenemos las categorías        
        }
    });
    // Agregamos métodos externos a la instancia    
    Object.assign(app.config.globalProperties, globals);
    app.mount('#vueAdminCategoriesForm');
})();

