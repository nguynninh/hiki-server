const redisKey = {
    RESET_PASSWORD: (userId: string | number) => `reset_password:${userId}`,
    OTP_ATTEMPTS_RESET_PASSWORD: (userId: string | number) => `otp_attempts:${userId}`,
    
    OTP_CREATE_ACCOUNT: (userId: string | number) => `create_account:${userId}`,
    OTP_ATTEMPTS_CREATE_ACCOUNT: (userId: string | number) => `otp_attempts_create_account:${userId}`,
}

export default redisKey;