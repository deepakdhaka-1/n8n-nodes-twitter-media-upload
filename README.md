# n8n-nodes-twitter-media-upload

This is an n8n community node that allows you to upload media files (images, videos, audio) to Twitter/X.

# Upon Entering Credentials you will get Verification Failed, Avoid it. 
````
This is issue from Twitter API,
````
## Installation

### Community Node Installation (Recommended)
1. Go to **Settings > Community Nodes** in your n8n instance
2. Click **Install**
3. Enter `n8n-nodes-twitter-media-upload`
4. Click **Install**




### Manual Installation
```bash
npm install n8n-nodes-twitter-media-upload
```

## Project Structure

```
n8n-nodes-twitter-media-upload/
├── credentials/
│   └── TwitterMediaUploadApi.credentials.ts
├── nodes/
│   └── TwitterMediaUpload/
│       └── TwitterMediaUpload.node.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Setup Instructions

### 1. Get Twitter API Credentials

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new project and app
3. Navigate to your app's **Keys and Tokens** tab
4. Generate and save:
   - API Key (Consumer Key)
   - API Key Secret (Consumer Secret)
   - Access Token
   - Access Token Secret

### 2. Configure Credentials in n8n

1. In n8n, go to **Credentials**
2. Click **Add Credential**
3. Search for **Twitter Media Upload API**
4. Fill in the four required fields:
   - Consumer Key
   - Consumer Secret
   - Access Token
   - Access Token Secret
5. Click **Save**

## Usage

### Basic Workflow Example

1. Add a node that provides binary data (e.g., HTTP Request, Read Binary File)
2. Add the **Twitter Media Upload** node
3. Select your Twitter credentials
4. Configure:
   - **Binary Property**: Name of the binary data property (default: `data`)
   - **Media Type**: Select the appropriate media type (image/png, video/mp4, etc.)
5. Execute the workflow

### Output

The node returns:
```json
{
  "media_id": "1234567890123456789",
  "media_id_string": "1234567890123456789",
  "size": 123456,
  "expires_after_secs": 86400,
  "media_type": "image/png"
}
```

You can use the `media_id_string` in subsequent Twitter API calls to attach media to tweets.

## Development

### Building the Node

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode (for development)
npm run dev
```

### Local Testing

1. Link the package locally:
```bash
npm link
```

2. In your n8n installation:
```bash
cd ~/.n8n/custom
npm link n8n-nodes-twitter-media-upload
```

3. Restart n8n

## Supported Media Types

- Images: PNG, JPEG, GIF, WebP
- Videos: MP4, MOV
- Custom: Enter any MIME type manually

## Twitter Media Upload Limits

- Images: Max 5MB (JPEG, PNG), 15MB (GIF)
- Videos: Max 512MB, 140 seconds
- Media IDs expire after 24 hours

## Troubleshooting

### "Invalid OAuth signature"
- Verify your credentials are correct
- Ensure there are no extra spaces in the credential fields

### "Media type not supported"
- Check that your media type matches the actual file format
- Try using the "Custom" option with the exact MIME type

### "File too large"
- Ensure your file is within Twitter's size limits
- Consider compressing large files before upload

## License

MIT

## Support

For issues and feature requests, please visit:
[GitHub Issues]](https://github.com/deepakdhaka-1/n8n-nodes-twitter-media-upload/issues)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
