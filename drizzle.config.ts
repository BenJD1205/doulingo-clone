import 'dotenv/config'
import type { Config } from 'drizzle-kit'

// eslint-disable-next-line import/no-anonymous-default-export
export default {
    schema: './db/schema.ts',
    out: './drizzle',
    driver: 'pg',
    dbCredentials: {
        connectionString: process.env.DATABASE_URl!,
    }
} satisfies Config;