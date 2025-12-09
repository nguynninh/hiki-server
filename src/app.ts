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
app.use(`${baseUrl}/files`, require('./routers/fileRouter').default);
app.use(`${baseUrl}/categories`, require('./routers/categoryRouter').default);
app.use(`${baseUrl}/attributes`, require('./routers/attributeRouter').default);
app.use(`${baseUrl}/products`, require('./routers/productRouter').default);
app.use(`${baseUrl}/banners`, require('./routers/bannerRouter').default);
app.use(`${baseUrl}/address`, require('./routers/addressRouter').default);
app.use(`${baseUrl}/carts`, require('./routers/cartRouter').default);

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
