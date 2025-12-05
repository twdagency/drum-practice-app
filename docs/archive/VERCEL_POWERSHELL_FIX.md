# Fixing PowerShell Execution Policy for Vercel

If you see this error:
```
vercel : File ... cannot be loaded because running scripts is disabled on this system
```

Here are several solutions:

## Solution 1: Use npx (Recommended - No Policy Change Needed)

Instead of installing Vercel globally, use `npx` which doesn't require execution policy changes:

```powershell
# Login
npx vercel login

# Deploy preview
npx vercel

# Deploy production
npx vercel --prod
```

## Solution 2: Use vercel.cmd Directly

Vercel installs a `.cmd` file that doesn't require PowerShell execution policy:

```powershell
# Find the path
$env:APPDATA\npm\vercel.cmd

# Use it directly
& "$env:APPDATA\npm\vercel.cmd" login
& "$env:APPDATA\npm\vercel.cmd" --prod
```

## Solution 3: Change Execution Policy (Current User Only)

If you want to use `vercel` command directly, you can change the execution policy for your current user:

```powershell
# Check current policy
Get-ExecutionPolicy

# Set policy for current user (allows local scripts)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Verify it changed
Get-ExecutionPolicy
```

**Note**: This only affects your user account and is safe. It allows:
- Local scripts to run
- Remote scripts must be signed

## Solution 4: Use the Deployment Script

We've created `scripts/deploy.ps1` that handles these issues automatically:

```powershell
# First, allow the script to run (one-time)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then run the deployment script
.\scripts\deploy.ps1
```

## Recommended Approach

For the easiest experience, use **Solution 1 (npx)**:

```powershell
# No installation or policy changes needed
npx vercel login
npx vercel --prod
```

This works immediately without any PowerShell configuration changes.

