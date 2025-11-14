import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  apiBasePath: string;
}

const nodeEnv = process.env.NODE_ENV || 'development';
const api_prefix = process.env.API_PREFIX;
const api_prefix_production = process.env.API_PREFIX_PRODUCTION;
const apiBasePath = 
    nodeEnv === 'production' 
        ? (api_prefix_production || '') 
        : (api_prefix || '');

const config: Config = {
  port: Number(process.env.PORT) || 3001,
  nodeEnv,
  apiBasePath,
};

export default config;