import TableLogic from "@miloter/tablelogic";

// Renderiza el formulario de la calculadora lógica: /tools/logic-calculator
const toolsLogicCalculatorGet = (req, res, next) => {
    res.render('tools/logic-calculator', {
        title: 'Calculadora de Logica Proposicional',
        page_desc: 'Calcula tablas de verdad de proposiciones y acepta las conectivas lógicas más usadas',
        page_keys: 'negacion, conjuncion, disyuncion inclusiva y exclusiva, concicional, bicondicional, tautologia, contradiccion'
    });
};

// Evalua una tabla de verdad y devuelve el resultado:
// POST /api/tools/logic-calculator
const apiToolsLogicCalculatorPost = (req, res, next) => {
    const statusOk = 200, statusBadRequest = 400;    
    const { numericalTruthValue, orderedTruthValue, expr } = req.body;
    const tl = new TableLogic();

    tl.setNumericalTruthValue(numericalTruthValue);
    tl.orderedTruthValue = orderedTruthValue;
    const result = tl.getTable(expr);

    if (tl.getError() === null) {
        res.status(statusOk).json({
            status: statusOk,
            success: 'Tabla calculada con éxito',
            result
        });
    } else {
        res.status(statusBadRequest).json({
            status: statusBadRequest,
            error: tl.getError()            
        });
    }
};

export {
    toolsLogicCalculatorGet,
    apiToolsLogicCalculatorPost
};
