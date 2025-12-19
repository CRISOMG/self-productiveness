
# Troubleshooting 431 Request Header Fields Too Large

## Issue Description
You are seeing the following error in your Supabase API Gateway logs:
```
"GET /realtime/v1/websocket?apikey=... HTTP/1.1" 431 0 "-" ...
```
And a WebSocket connection failure in the frontend:
```
WebSocket connection to 'ws://localhost:54321/realtime/v1/websocket...' failed
```

## Cause
The **431 Request Header Fields Too Large** error occurs when the total size of the HTTP headers sent by the client (browser) exceeds the server's limit. 

In Supabase Realtime (and web development in general), the most common cause is **Cookie accumulation**. 
- When working on `localhost`, cookies from other projects running on different ports (e.g., `localhost:3000`, `localhost:8080`) are often sent to all `localhost` requests.
- Over time, or with multiple logins/sessions, these cookies can grow large enough to exceed the default 4KB limit of the Realtime server.

## Solutions

### 1. Clear Browser Cookies (Recommended)
The quickest and most effective fix is to clear your cookies for `localhost`.
1. Open your browser's DevTools (F12).
2. Go to the **Application** (Chrome) or **Storage** (Firefox) tab.
3. Expand **Cookies**.
4. Right-click on `http://localhost:3000` (and `http://localhost:54323` if present) and select **Clear**.
5. Refresh the page.

### 2. Increase Header Size Limit in Config
If clearing cookies is not desirable or the issue persists due to legitimately large headers (e.g., large auth tokens), you can increase the limit in your Supabase configuration.

File: `supabase/config.toml`

Find the `[realtime]` section:
```toml
[realtime]
enabled = true
# Bind realtime via either IPv4 or IPv6. (default: IPv4)
# ip_version = "IPv6"
# The maximum length in bytes of HTTP request headers. (default: 4096)
# max_header_length = 4096
```

Uncomment and increase `max_header_length`:
```toml
[realtime]
enabled = true
# ...
max_header_length = 8192 # Increased from 4096 to 8192 bytes
```

**Note:** You will need to restart Supabase (`supabase stop && supabase start`) for this change to take effect.
