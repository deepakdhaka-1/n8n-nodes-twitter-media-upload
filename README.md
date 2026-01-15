# n8n Twitter Media Upload & Tweet Metrics Node

A custom **n8n** node that enables:

- Uploading media to **Twitter/X** using the Media Upload API
- Extracting **comprehensive analytics** from any public tweet (no API credentials required)

---

## Setup Instructions

### 1. Get Twitter API Credentials

1. Go to the Twitter Developer Portal  
   https://developer.twitter.com/en/portal/dashboard

2. Create a new **Project** and **App**

3. Navigate to your app’s **Keys and Tokens** tab

4. Generate and save the following:
   - API Key (Consumer Key)
   - API Key Secret (Consumer Secret)
   - Access Token
   - Access Token Secret

---

### 2. Configure Credentials in n8n

1. In n8n, go to **Credentials**
2. Click **Add Credential**
3. Search for **Twitter Media Upload API**
4. Fill in:
   - Consumer Key
   - Consumer Secret
   - Access Token
   - Access Token Secret
5. Click **Save**

---

## Usage

### Operation 1: Upload Media

Upload media files to Twitter and retrieve a `media_id` for use in tweets.

#### Requirements

- Twitter API credentials
- Binary data input

#### Configuration

- Select **Upload Media** operation
- Choose your Twitter credentials
- Set **Binary Property Name** (default: `data`)
- Select **Media Type** (PNG, JPEG, MP4, etc.)
- Execute the node

#### Output

```json
{
  "media_id": "1234567890123456789",
  "media_id_string": "1234567890123456789",
  "size": 123456,
  "expires_after_secs": 86400,
  "media_type": "image/png"
}
```
# Operation 2: Search Tweet Metrics

Extract comprehensive analytics from any public tweet without requiring Twitter API credentials.

---

## Requirements

- Public Tweet URL  
- Internet access  
- No authentication required

---

## Configuration

1. Select **Search Tweet Metrics** operation
2. Enter the **Tweet URL**  
   Example:  
   `https://x.com/username/status/1234567890`
3. (Optional) Set **Timeout**  
   Default: `25000ms`
4. Execute the node

---

## Output

```json
{
  "tweet": {
    "id": "",
    "url": "",
    "created_at": "Tue Oct 14 17:24:08 +0000 2025",
    "language": "en",
    "views": 2049,
    "likes": 5,
    "retweets": 0,
    "replies": 0,
    "quotes": 0,
    "bookmarks": 0,
    "hashtags": [""],
    "mentions": [],
    "source": "Twitter Web App",
    "full_text": "Tweet content here...",
    "engagement_rate": 0.0092701589
  },
  "author": {
    "user_id": "",
    "username": "",
    "profile": "",
    "bio": "Everything @HyperliquidX...",
    "location": "",
    "website": "",
    "followers": 1699,
    "verified": false
  }
}
```
## Metrics Included

### Tweet Metrics

- Views
- Likes
- Retweets
- Replies
- Quotes
- Bookmarks
- Hashtags
- Mentions
- Full text content
- Engagement rate calculation
- Source application
- Language detection

---

## Author Metrics

- User ID
- Username
- Profile URL
- Bio
- Location
- Website
- Follower count
- Verification status

---

## Common Issues

### Could Not Extract Tweet Data

- Ensure the tweet URL is correct
- Confirm the tweet is public
- Verify the tweet has not been deleted
- Check if the account is private
- Increase timeout value

---

### Timeout Errors

- Increase timeout (default: `25000ms`)
- Check network connectivity
- Retry execution
