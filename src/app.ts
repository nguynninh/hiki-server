import express, { Request, Response } from 'express';
import cors from 'cors';
import appConfig from './configuration/appConfig';
import i18nMiddleware from './i18n/index';

const app = express();

app.use(express.json());
app.use(cors());
app.use(i18nMiddleware);

const base = appConfig.apiBasePath || '';

app.get(`${base}/healthy`, (req: Request, res: Response) => {
	res.status(200).json({
		code: 200,
        message: req.t('common:success'),
	});
});

app.use((req: Request, res: Response) => {
	res.status(404).json({
		code: 404,
        message: req.t('common:error'),
	});
});

export default app;
