import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import router from './app/routes';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import notFound from './app/middlewares/notFound';

const app: Application = express();

// Todo: add cors
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// application routes
app.use('/api/v1', router);

const test = (req: Request, res: Response) => {
  const message = `Fishizzy Web server ${req.url}`;
  res.send(message);
};

app.get('/', test);

app.use(globalErrorHandler);
app.use(notFound);

export default app;
