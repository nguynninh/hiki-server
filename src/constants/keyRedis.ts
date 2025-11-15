const redisKey = {
    RESET_PASSWORD: (userId: string | number) => `reset_password:${userId}`,
    OTP_ATTEMPTS: (userId: string | number) => `otp_attempts:${userId}`,
}

export default redisKey;