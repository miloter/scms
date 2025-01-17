import express from 'express';
import { apiToolsLogicCalculatorPost, toolsLogicCalculatorGet } from '../controllers/tools.js';
import { statRequests} from '../helpers/utils.js'

const toolsRouter = express.Router();

toolsRouter.get('/tools/logic-calculator', statRequests, toolsLogicCalculatorGet);
toolsRouter.post('/api/tools/logic-calculator', apiToolsLogicCalculatorPost);

export default toolsRouter;
