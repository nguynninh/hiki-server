interface UserAgentInfo {
    operatingSystem: string;
    browserName: string;
}

export function parseUserAgent(userAgent: string): UserAgentInfo {
    const ua = userAgent || '';

    const operatingSystem = ua.includes('Windows') ? 'Windows' : 
                           ua.includes('Mac') ? 'macOS' : 
                           ua.includes('Linux') ? 'Linux' : 
                           ua.includes('Android') ? 'Android' :
                           ua.includes('iOS') ? 'iOS' : 'Unknown';
    
    const browserName = ua.includes('Edg') ? 'Edge' :
                       ua.includes('Chrome') ? 'Chrome' : 
                       ua.includes('Firefox') ? 'Firefox' : 
                       ua.includes('Safari') ? 'Safari' : 'Unknown';

    return {
        operatingSystem,
        browserName,
    };
}
