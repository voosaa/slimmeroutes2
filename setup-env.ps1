$envContent = @"
NEXT_PUBLIC_SUPABASE_URL=https://frvgobihuyhvjowjxduw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZydmdvYmlodXlodmpvd2p4ZHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzOTc2MjMsImV4cCI6MjA1Nzk3MzYyM30.be8V_xpURRaC17UcrGW3476tmuRjisPwFwW6wZWeOg8
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBCNiM4uU_fEfvaWiFDqWsvCBH8sltgm60
"@

Set-Content -Path ".env.local" -Value $envContent

Write-Host "Environment variables have been set up successfully!"
Write-Host "Now restart your development server with 'npm run dev'"
