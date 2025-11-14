import app from './app';
import { initSuperAdmin } from './bootstrap/initAdmin';
import config from './configuration/appConfig';
import { connectDatabase } from './database/pgClient';

app.listen(config.port, async () => {
    await connectDatabase();

    await initSuperAdmin();

    console.log(`Server running on port ${config.port}`);
});
