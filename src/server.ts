import app from './app';
import { initSuperAdmin } from './bootstrap/initAdmin';
import { initSeller } from './bootstrap/initSeller';
import { initUser } from './bootstrap/initUser';
import config from './configuration/appConfig';
import { connectDatabase } from './database/pgClient';
import { connectRedis } from './database/redisClient';

app.listen(config.port, async () => {
    await connectDatabase();
    await connectRedis();

    await initUser();
    await initSeller();
    await initSuperAdmin();

    console.log(`Server running on port ${config.port}`);
});
