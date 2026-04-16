# Klee GitHub Webhook Handler (KGWH)

**Last Updated**: April 16, 2026

## Overview
The GitHub Webhook Handler allows the bot to automatically detect new commits and trigger internal updates. It listens for push events from a specified repository and verifies the authenticity of each request using a secure HMAC signature.

## Endpoint Configuration
### Webhook URL
```
POST /github-webhook
```

### Authentication
The endpoint uses a **Secret Token** to verify payloads via the `X-Hub-Signature-256` header.
* **Secret**: Defined in your environment variables as `GITHUB_WEBHOOK_SECRET`.
* **Mechanism**: HMAC-SHA256.

## GitHub Setup Instructions

To enable automatic updates, configure your repository webhook as follows:

1. Go to your GitHub Repository **Settings**.
2. Select **Webhooks** > **Add webhook**.
3. **Payload URL**: `https://your-server-url.com/github-webhook`
4. **Content type**: `application/json`
5. **Secret**: Enter the value matching your `GITHUB_WEBHOOK_SECRET`.
6. **Events**: Select **Just the push event**.

---

## Logic and Behavior

### Signature Verification
The server calculates a digest using the local secret and the request body. It compares this against the GitHub header using a timing-safe equality check to prevent side-channel attacks.

### Update Flag
When a valid `push` event is received:
* The server logs: `[com.klee.http-api]: New commit detected. Bot is updating...`
* The internal variable `updateStatus.isUpdatePending` is set to `true`.
* The bot core monitors this flag to initiate the update procedure.

---

## API Responses
### Success (200 OK)
Returned when the signature is valid and the event is processed.
```text
OK
```

### Unauthorized (401 Unauthorized)
Returned if the signature is missing or does not match the local secret.
```text
Invalid signature
```
## Integration Details

| Header | Description |
| :--- | :--- |
| **x-github-event** | Must be `push` to trigger the update flag. |
| **x-hub-signature-256** | The HMAC hex digest of the payload. |

The system uses a non-blocking approach; it acknowledges the GitHub request immediately after updating the internal state flag to ensure the webhook does not time out.
