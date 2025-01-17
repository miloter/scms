const app = Vue.createApp({
    template: /*html*/`    
            <h1 class="text-center">Gestión de Categorías</h1>
            <form class="w-50 mx-auto">
                <div class="mb-3">
                    <div class="mb-1 d-flex justify-content-center gap-1">                        
                        <input type="file" id="file" ref="file" multiple
                            accept=".png, .jpg, .jpeg, .gif, .bmp"
                            @change="onFileChange" class="form-control"> 
                        <button :disabled="files.length === 0" type="submit"
                            @click="onSubmit" class="btn btn-primary">
                            Subir
                        </button>
                    </div>
                    <div>
                        <div class="d-flex flex-wrap justify-content-center align-items-center gap-1">
                            <img v-for="file of files" :key="file.name"
                                :src="file.content" width="128"  alt="Imagen para subir artículo">
                        </div>            
                    </div>            
                </div>
                <hr>
                <div class="mb-3 d-flex justify-content-center align-items-center gap-3">
                    <div>
                        <input type="checkbox" id="selectAll" v-model="selectAll"
                            class="form-check-input"> <label for="selectAll"
                                class="form-check-label">Seleccionar todo</label>
                    </div>
                    <button type="submit" :disabled="filesForDelete.length === 0"
                        @click="onDelete" class="btn btn-danger">
                        Eliminar
                    </button>
                </div>                
            </form> 
            <table-quick :headers="headers" :rows="uploadedFiles"
                :rowsPerPage="10" :rowsSelectPage="[10, 20, 50, 100]"
                :csvExport="true">            
                <template #['name']="{ row }">                                    
                    <label>
                        <input type="checkbox" :value="row.name" v-model="filesForDelete">
                        {{ row.name }}
                    </label>
                </template>
                <template #['lastModified']="{ row }">
                    {{ toISOLocaleDate(row.lastModified) }}
                </template>
                <template #['size']="{ row }">
                    {{ (row.size / 1024).toFixed(2) + ' kB' }}
                </template>
                <template #['thumbnail']="{ row }">
                    <div>
                        <img :src="'/uploads/' + row.name"
                            width="120" alt="Miniatura de imagen" />
                    </div>
                    <a href="#" @click.prevent="onCopyUrl($event, row.name)"
                        title="Copiar la URL al portapapeles">Copiar url</a>
                </template>
            </table-quick>            
        `,
    data() {
        return {
            headers: [{
                title: 'Nombre del fichero',
                key: 'name',
                showFilter: true
            }, {
                title: 'Fecha de modificación',
                key: 'lastModified',
                showFilter: true
            }, {
                title: 'Tamaño',
                key: 'size',
                showFilter: true
            }, {
                title: 'Miniatura',
                key: 'thumbnail'
            }],
            selectAll: false,
            uploadedFiles: [],
            filesForDelete: [],
            files: [],
            isFilesReady: true
        };
    },
    watch: {
        selectAll() {
            if (this.selectAll) {
                this.filesForDelete = this.uploadedFiles.map(uf => uf.name);
            } else {
                this.filesForDelete = [];
            }
        }
    },
    methods: {
        reloadUploadedFiles() {
            fetch('/api/admin/uploaded-files')
                .then(response => {
                    return response.json();
                })
                .then(json => {
                    if (json.error) throw new Error(json.error);
                    this.selectAll = false;
                    this.filesForDelete = [];
                    this.uploadedFiles = json.uploadedFiles;
                    this.$refs.file.value = '';
                    this.files = [];
                })
                .catch(error => {
                    this.appendAlert(error.message, 'danger');
                });
        },
        onSubmit(event) {
            event.preventDefault();
            this.removeAlerts();

            // Si los ficheros no están listos termina
            if (!this.isFilesReady) {
                return this.appendAlert('Los ficheros no están listos, inténtelo en unos momentos', 'warning');
            }

            // Envía el formulario con los cambios
            fetch('/api/admin/uploaded-files', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ files: this.files })
            })
                .then(response => {
                    return response.json()
                })
                .then(json => {
                    if (json.error) throw new Error(json.error);
                    this.reloadUploadedFiles();
                    this.appendAlert(json.success, 'success');
                })
                .catch(error => {
                    this.appendAlert(error.message, 'danger');
                })
        },
        onDelete(event) {
            event.preventDefault();
            this.removeAlerts();

            // Envía el formulario con los cambios
            fetch('/api/admin/uploaded-files', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ filesForDelete: this.filesForDelete })
            })
                .then(response => {
                    return response.json()
                })
                .then(json => {
                    if (json.error) throw new Error(json.error);
                    this.reloadUploadedFiles();
                    this.appendAlert(json.success, 'success');
                })
                .catch(error => {
                    this.appendAlert(error.message, 'danger');
                })
        },
        async onCopyUrl(event, filename) {
            const url = `${location.protocol}//${location.host}/uploads/${filename}`;
            const textCopied = '¡Copiado!';
            const ele = event.target;
            const text = ele.textContent;

            // Si aun no ha acabado (operación previa pendiente), sale
            if (text === textCopied) return;
            await navigator.clipboard.writeText(url);
            ele.textContent = textCopied;
            setTimeout(() => {
                ele.textContent = text;
            }, 400);
        },
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
        this.reloadUploadedFiles();
    }
});
app.use(pluginGlobals);