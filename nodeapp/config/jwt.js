const PLACEHOLDER_SECRETS = new Set([
    'your_super_secret_key_change_in_prod',
    'change_this_in_production',
    'changeme',
])

export function getJwtSecret() {
    const secret = process.env.JWT_SECRET?.trim()
    if (!secret) {
        throw new Error('JWT_SECRET is not set. Add a long random value to .env before starting the server.')
    }
    if (PLACEHOLDER_SECRETS.has(secret) || secret.length < 32) {
        throw new Error('JWT_SECRET is too weak or uses a placeholder. Set a random string of at least 32 characters.')
    }
    return secret
}
