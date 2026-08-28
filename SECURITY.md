# Security

## Secret Handling

Do not commit `.env`, `.env.local`, `backend/.env`, private keys, API tokens, or production credentials.
Use `.env.example`, `.env.local.example`, and `backend/.env.example` to document required variables with placeholder values only.

## Required Rotation After Exposed Env Files

The repository previously tracked environment files. Before deploying or sharing the repository, rotate any real values that were ever committed, including:

- Database credentials in `DATABASE_URL`
- JWT secrets
- Cloudinary API keys
- Email app passwords
- ePayco keys
- MiPaquete API keys
- Supabase project keys if they should not be reused

Removing files from the current commit does not remove them from Git history. Treat exposed credentials as compromised.
