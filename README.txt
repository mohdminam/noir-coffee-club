NOIR COFFEE CLUB — BEGINNER SETUP

1) Open config.js and replace PASTE_YOUR_LEGACY_ANON_KEY_HERE with your Supabase legacy anon/public key.
   Find it in Supabase Project Settings → API Keys / API.
   Use only the legacy anon/public key. NEVER put a service_role or secret key in frontend code.
   Do not share your key in chat.

2) Open the extracted folder in VS Code. If needed, install the Live Server extension.
   Right-click index.html → Open with Live Server.

3) Confirm the menu loads from your Supabase menu_items table.
   Add an item, fill in test customer details, then place a test order.
   This creates a REAL order in your Supabase database.

Project URL: https://gjqshcqhmzerscyilsrl.supabase.co
Order Edge Function: https://gjqshcqhmzerscyilsrl.supabase.co/functions/v1/create-order

Before a real launch, restrict CORS to your domain, add rate limiting/anti-spam, secure admin access, decide payment and fulfilment, and thoroughly test the system. This starter is a demo, not production-ready. Do not collect payment card details in this form.
