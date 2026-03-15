export default () => ({
  auth: {
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? "dev-access-secret",
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret",
    jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  },
});

