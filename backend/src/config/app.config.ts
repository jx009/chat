export default () => ({
  app: {
    port: Number(process.env.PORT ?? 3001),
    prefix: process.env.APP_PREFIX ?? "api",
    corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    nodeEnv: process.env.NODE_ENV ?? "development",
  },
});

