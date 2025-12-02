# Recovering Lost .env.local File

If your `.env.local` file has disappeared, here's how to recover it:

## Option 1: Check OneDrive Version History

Since your project is in OneDrive, you may be able to recover it:

1. **Via OneDrive Website:**
   - Go to https://onedrive.live.com
   - Navigate to: `Documents/Cursor Projects/drum-practice-app`
   - Right-click on the folder or file
   - Select "Version history" or "Restore previous versions"
   - Look for `.env.local` in previous versions

2. **Via File Explorer:**
   - Right-click on the project folder
   - Select "Restore previous versions"
   - Choose a date when the file existed
   - Copy `.env.local` from that version

## Option 2: Check Recycle Bin

1. Open Recycle Bin
2. Search for `.env.local`
3. If found, restore it

## Option 3: Recreate from Template

If you can't recover it, recreate it:

1. Copy `.env.example` to `.env.local`:
   ```powershell
   Copy-Item .env.example .env.local
   ```

2. Fill in your actual values:
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `AUTH_SECRET` - Generate new one: `openssl rand -base64 32`
   - `ADMIN_EMAILS` - Your admin email address
   - Other variables as needed

## Option 4: Check Other Locations

The file might have been moved:
- Check parent directories
- Check if it was renamed (`.env`, `.env.backup`, etc.)
- Check if it's in a different branch of OneDrive

## Prevention: Backup Your .env.local

To prevent this in the future:

1. **Create a backup script:**
   ```powershell
   # Save as: scripts/backup-env.ps1
   $backupPath = "$env:USERPROFILE\Documents\env-backups"
   New-Item -ItemType Directory -Force -Path $backupPath
   Copy-Item .env.local "$backupPath\env.local.backup.$(Get-Date -Format 'yyyy-MM-dd-HHmmss')"
   ```

2. **Store encrypted copy in password manager:**
   - Copy contents of `.env.local`
   - Store in 1Password, LastPass, or similar
   - Label it clearly

3. **Use environment variable manager:**
   - Consider using a tool like `direnv` or `.envrc`
   - Or use a secrets management service

## Required Variables Checklist

Make sure your new `.env.local` has at minimum:

- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `AUTH_SECRET` - NextAuth secret (32+ characters)
- [ ] `NEXTAUTH_URL` - Your app URL
- [ ] `ADMIN_EMAILS` - Admin email addresses (comma-separated)
- [ ] `SMTP_*` - Email configuration (if using email features)
- [ ] `STRIPE_*` - Stripe keys (if using payments)
- [ ] `GOOGLE_CLIENT_ID/SECRET` - Google OAuth (if using)
- [ ] `GITHUB_CLIENT_ID/SECRET` - GitHub OAuth (if using)

## Quick Recovery Command

Run this to create a new `.env.local` from template:

```powershell
.\scripts\create-env-local.ps1
```

Then edit `.env.local` and fill in your actual values.

