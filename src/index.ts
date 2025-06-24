import express, {Express} from 'express';
import dotenv from 'dotenv';
import cookieParser = require('cookie-parser');
import registerRoute from './routes/authRoute';
import userRoute from "./routes/userRoute"
import assetRoute from "./routes/assetRoute"
import licenseRoute from "./routes/licenseRoute"
import { notFound, errorHandler } from './middlewares/errorMiddleware';

dotenv.config();
import cors from 'cors';
const app: Express = express();





app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/api/auth", registerRoute)
app.use("/api/user", userRoute)
app.use("/api/asset", assetRoute)
app.use("/api/license", licenseRoute)
const PORT = process.env.PORT || 5000;

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
