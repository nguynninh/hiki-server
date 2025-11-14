import express, { Request, Response } from 'express';
import cors from 'cors';
import appConfig from './configuration/appConfig';
import i18nMiddleware from './i18n/index';

const app = express();

app.use(express.json());
app.use(cors());
app.use(i18nMiddleware);

const baseUrl = appConfig.apiBasePath || '';
app.use(`${baseUrl}/auth`, require('./routers/authRouter').default);
app.use(`${baseUrl}/users`, require('./routers/userRouter').default);
app.use(`${baseUrl}/roles`, require('./routers/roleRouter').default);

app.get(`${baseUrl}/healthy`, (req: Request, res: Response) => {
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

app.use(require('./middlewares/errorHandler').errorHandler);

export default app;
