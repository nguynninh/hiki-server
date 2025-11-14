import express, { Request, Response } from 'express';
import cors from 'cors';
import appConfig from './configuration/appConfig';

const app = express();

app.use(express.json());
app.use(cors());

const base = appConfig.apiBasePath || '';

app.get(`${base}/healthy`, (req: Request, res: Response) => {
	res.status(200).json({
		code: 200,
        message: 'OK',
	});
});

app.use((req: Request, res: Response) => {
	res.status(404).json({
		code: 404,
        message: 'Not Found',
	});
});

export default app;
