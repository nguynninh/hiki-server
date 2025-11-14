import app from './app';
import { initSuperAdmin } from './bootstrap/initAdmin';
import config from './configuration/appConfig';
import { connectDatabase } from './database/pgClient';
import { connectRedis } from './database/redisClient';

app.listen(config.port, async () => {
    await connectDatabase();
    await connectRedis();

    await initSuperAdmin();

    console.log(`Server running on port ${config.port}`);
});
