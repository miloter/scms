(() => {
    const app = Vue.createApp({
        template: /*html*/`    
        <h1 class="text-center">Calculadora de Lógica Proposicional</h1>            
        <form @submit="onSubmit" class="mx-auto">
            <div class="mb-3 d-flex justify-content-center align-items-center gap-3">
                <div>
                    <label for="numericalTruthValue" class="form-label">
                        Valor de verdad:
                    </label>
                    <select v-model="numericalTruthValue" id="numericalTruthValue"
                        class="form-control">
                        <option :value="true" >1 (Verdadero), 0 (Falso)</option>
                        <option :value="false">V (Verdadero), F (Falso)</option>
                    </select>
                </div>                
                <div class="align-self-end">
                    <input type="checkbox" v-model="orderedTruthValue"
                        id="orderedTruthValue"
                        class="form-check-input"> <label
                            for="orderedTruthValue" class="form-check-label">
                        Mostrar en orden</label>
                </div>
            </div>
            <div class="mb-3 d-flex justify-content-center align-items-center gap-3">
                <a href="/articles-title-id/ayuda-sobre-la-calculadora-de-logica-proposicional"
                    class="btn btn-info align-self-end" target="_blank">Ayuda</a>
                <div>            
                    <label for="expr" class="form-label">Expresión lógica:</label>
                    <input type="text" v-model="expr" id="expr"
                        class="form-control" autofocus size="48" required />
                </div>
                <button type="submit" class="btn btn-primary align-self-end">Evaluar</button>
            </div>

            <textarea v-model="result" id="result" rows="23"
                    class="form-control font-monospace"></textarea>            
        </form>        
    `,
        data() {
            return {
                numericalTruthValue: true,
                orderedTruthValue: false,
                expr: '',
                result: ''
            };
        },
        methods: {            
            onSubmit(event) {
                event.preventDefault();
                this.removeAlerts();

                fetch('/api/tools/logic-calculator', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        numericalTruthValue: this.numericalTruthValue,
                        orderedTruthValue: this.orderedTruthValue,
                        expr: this.expr
                    })
                })
                    .then(response => {
                        return response.json()
                    })
                    .then(json => {
                        if (json.error) {
                            const { message, col } = json.error;
                            throw new Error(`Error en la columna ${col}: ${message}`);
                        }
                        this.result = json.result;
                    })
                    .catch(error => {
                        this.appendAlert(error.message, 'danger');
                    })
            }
        }
    });
    app.use(pluginGlobals).mount('#vueToolsLogicCalculator');
})();
