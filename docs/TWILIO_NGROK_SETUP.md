# 🔗 Twilio Webhook Setup with ngrok (Local Development)

This guide explains how to expose your local Django server to Twilio webhooks using ngrok.

---

## 📋 Prerequisites

1. **ngrok installed**: Download from [ngrok.com](https://ngrok.com/download)
2. **Django server running**: `python manage.py runserver` (port 8000)
3. **Twilio account configured**: Credentials added to `.env`

---

## 🚀 Quick Setup

### Step 1: Install ngrok

**Windows:**
1. Download ngrok from [ngrok.com/download](https://ngrok.com/download)
2. Extract `ngrok.exe` to a folder in your PATH (e.g., `C:\Program Files\ngrok\`)
3. Or add ngrok to your PATH environment variable

**Alternative (using Chocolatey):**
```powershell
choco install ngrok
```

**Mac/Linux:**
```bash
# Using Homebrew (Mac)
brew install ngrok

# Or download and extract
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar -xzf ngrok-v3-stable-linux-amd64.tgz
sudo mv ngrok /usr/local/bin/
```

### Step 2: Start Django Server

```powershell
cd H:\puppy_crm\backend
python manage.py runserver
```

Keep this terminal open. Server should be running on `http://localhost:8000`

### Step 3: Start ngrok

Open a **new terminal** and run:

```powershell
ngrok http 8000
```

You'll see output like:
```
ngrok                                                                              
                                                                                   
Session Status                online                                               
Account                       Your Name (Plan: Free)                              
Version                       3.x.x                                                
Region                        United States (us)                                   
Latency                       -                                                    
Web Interface                 http://127.0.0.1:4040                               
Forwarding                    https://abc123xyz.ngrok-free.app -> http://localhost:8000
                                                                                   
Connections                   ttl     opn     rt1     rt5     p50     p90         
                              0       0       0.00    0.00    0.00    0.00        
```

**Important**: Copy the HTTPS URL (e.g., `https://abc123xyz.ngrok-free.app`)

### Step 4: Update BASE_URL in .env

Update `backend/.env`:

```env
# Use the ngrok HTTPS URL
BASE_URL=https://abc123xyz.ngrok-free.app
```

**Note**: The ngrok URL changes each time you restart ngrok (unless you have a paid plan with a static domain).

### Step 5: Restart Django Server

After updating `.env`, restart your Django server to pick up the new `BASE_URL`:

1. Stop the server (Ctrl+C)
2. Start again: `python manage.py runserver`

---

## 🔧 Configure Twilio Webhooks

### Option 1: Via Twilio Console (Recommended)

1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to **Phone Numbers** → **Manage** → **Active Numbers**
3. Click on your phone number
4. Under **Voice Configuration**:
   - **A CALL COMES IN**: `https://your-ngrok-url.ngrok-free.app/api/calls/webhook/incoming/`
   - **HTTP Method**: `POST`
5. Under **Status Callback**:
   - **Status Callback URL**: `https://your-ngrok-url.ngrok-free.app/api/calls/webhook/status/`
   - **Status Callback Method**: `POST`
6. Under **Recording**:
   - **Recording Status Callback URL**: `https://your-ngrok-url.ngrok-free.app/api/calls/webhook/recording/`
   - **Recording Status Callback Method**: `POST`
7. Click **Save**

### Option 2: Via API (When Purchasing Number)

When purchasing a phone number via the API, webhooks are automatically configured using `BASE_URL` from settings.

---

## 🧪 Testing Webhooks

### Test Incoming Call Webhook

1. Call your Twilio phone number
2. Check ngrok web interface: `http://127.0.0.1:4040`
3. You should see the incoming request to `/api/calls/webhook/incoming/`
4. Check Django server logs for webhook processing

### Test Status Callback

1. Make an outbound call via API
2. Check ngrok web interface for status callback requests
3. Verify call status updates in database

---

## 🔍 ngrok Web Interface

ngrok provides a web interface at `http://127.0.0.1:4040` where you can:

- **Inspect Requests**: See all HTTP requests forwarded through ngrok
- **Replay Requests**: Test webhooks by replaying previous requests
- **View Request/Response**: See headers, body, and response data

This is very useful for debugging webhook issues!

---

## ⚠️ Important Notes

### Free ngrok Limitations

- **URL Changes**: Free ngrok URLs change on each restart
- **Session Timeout**: Free sessions may timeout after 2 hours
- **Request Limits**: Free tier has request rate limits

### Paid ngrok Benefits

- **Static Domain**: Keep the same URL (e.g., `your-app.ngrok.io`)
- **No Timeouts**: Sessions don't expire
- **Higher Limits**: More requests per minute

### Development Workflow

1. Start Django server
2. Start ngrok
3. Copy ngrok HTTPS URL
4. Update `BASE_URL` in `.env`
5. Restart Django server
6. Configure Twilio webhooks with ngrok URL
7. Test!

---

## 🐛 Troubleshooting

### ngrok Not Starting

**Error**: `command not found: ngrok`
- **Solution**: Add ngrok to your PATH or use full path

**Error**: `bind: address already in use`
- **Solution**: Another process is using port 8000. Stop it or use a different port:
  ```powershell
  ngrok http 8001
  # Then run Django on port 8001: python manage.py runserver 8001
  ```

### Webhooks Not Receiving

1. **Check ngrok is running**: Visit `http://127.0.0.1:4040`
2. **Verify BASE_URL**: Check `.env` has correct ngrok URL
3. **Check Django logs**: Look for incoming webhook requests
4. **Verify Twilio webhook URL**: Must match exactly (including trailing slash)
5. **Check signature verification**: Webhooks verify Twilio signature automatically

### URL Mismatch Errors

**Error**: `Invalid signature` in webhook logs
- **Solution**: Ensure webhook URL in Twilio console matches exactly what's in `BASE_URL`
- **Note**: URLs are case-sensitive and must include protocol (`https://`)

---

## 🔐 Security Notes

1. **Signature Verification**: All webhooks verify Twilio signatures automatically
2. **HTTPS Required**: ngrok provides HTTPS automatically (required by Twilio)
3. **Local Only**: ngrok URLs are only accessible while ngrok is running
4. **Don't Commit**: Never commit ngrok URLs or credentials to git

---

## 📚 Additional Resources

- [ngrok Documentation](https://ngrok.com/docs)
- [Twilio Webhook Security](https://www.twilio.com/docs/usage/webhooks/webhooks-security)
- [Twilio Webhook Guide](https://www.twilio.com/docs/usage/webhooks)

---

## ✅ Quick Checklist

- [ ] ngrok installed
- [ ] Django server running on port 8000
- [ ] ngrok tunnel active (`ngrok http 8000`)
- [ ] Copied ngrok HTTPS URL
- [ ] Updated `BASE_URL` in `.env`
- [ ] Restarted Django server
- [ ] Configured Twilio webhooks with ngrok URL
- [ ] Tested incoming call webhook
- [ ] Verified webhook requests in ngrok interface

---

**Last Updated**: December 2024

