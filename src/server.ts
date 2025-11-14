import app from './app';
import config from './configuration/appConfig';
import { connectDatabase } from './database/pgClient';

app.listen(config.port, async () => {
    await connectDatabase();

    console.log(`Server running on port ${config.port}`);
});
