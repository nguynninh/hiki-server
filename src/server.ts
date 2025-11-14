import app from './app';
import config from './configuration/appConfig';

app.listen(config.port, async () => {
    console.log(`Server running on port ${config.port}`);
});
