"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwitterMediaUpload = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const oauth_1_0a_1 = __importDefault(require("oauth-1.0a"));
const crypto_js_1 = __importDefault(require("crypto-js"));
const puppeteer = __importStar(require("puppeteer"));
function extractTweetPayload(rawJson) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const result = (_b = (_a = rawJson === null || rawJson === void 0 ? void 0 : rawJson.data) === null || _a === void 0 ? void 0 : _a.tweetResult) === null || _b === void 0 ? void 0 : _b.result;
    if (!result)
        return null;
    const legacy = result.legacy || {};
    const viewsObj = result.views || {};
    const noteTweet = ((_d = (_c = result.note_tweet) === null || _c === void 0 ? void 0 : _c.note_tweet_results) === null || _d === void 0 ? void 0 : _d.result) || {};
    const entitiesLegacy = legacy.entities || {};
    const entitiesNote = noteTweet.entity_set || {};
    const user = ((_f = (_e = result.core) === null || _e === void 0 ? void 0 : _e.user_results) === null || _f === void 0 ? void 0 : _f.result) || {};
    const userCore = user.core || {};
    const userLegacy = user.legacy || {};
    const userEntities = userLegacy.entities || {};
    const tweetId = legacy.id_str || result.rest_id;
    const username = userCore.screen_name || '';
    const tweetUrl = tweetId && username ? `https://x.com/${username}/status/${tweetId}` : null;
    const hashtagsNote = (entitiesNote.hashtags || []).map((h) => h.text);
    const hashtagsLegacy = (entitiesLegacy.hashtags || []).map((h) => h.text);
    const hashtags = hashtagsNote.length > 0 ? hashtagsNote : hashtagsLegacy;
    const mentionsNote = (entitiesNote.user_mentions || []).map((m) => m.screen_name);
    const mentionsLegacy = (entitiesLegacy.user_mentions || []).map((m) => m.screen_name);
    const mentions = mentionsNote.length > 0 ? mentionsNote : mentionsLegacy;
    const fullText = noteTweet.text || legacy.full_text;
    const rawSource = result.source || '';
    let sourceApp = null;
    if (rawSource) {
        try {
            const gtIdx = rawSource.indexOf('>');
            const ltIdx = rawSource.lastIndexOf('<');
            if (gtIdx !== -1 && ltIdx !== -1 && ltIdx > gtIdx) {
                sourceApp = rawSource.substring(gtIdx + 1, ltIdx);
            }
        }
        catch {
            sourceApp = rawSource;
        }
    }
    let website = null;
    const urlEntity = ((_g = userEntities.url) === null || _g === void 0 ? void 0 : _g.urls) || [];
    if (urlEntity.length > 0) {
        website = urlEntity[0].expanded_url;
    }
    const followers = userLegacy.followers_count || 0;
    const likes = parseInt(legacy.favorite_count || 0);
    const retweets = parseInt(legacy.retweet_count || 0);
    const replies = parseInt(legacy.reply_count || 0);
    const followersInt = parseInt(followers || 0);
    let engagementRate = null;
    if (followersInt > 0) {
        engagementRate = (likes + retweets + replies) / followersInt;
    }
    const viewsCount = viewsObj.count ? parseInt(viewsObj.count) : null;
    const tweet = {
        id: tweetId,
        url: tweetUrl,
        created_at: legacy.created_at,
        language: legacy.lang,
        views: viewsCount,
        likes,
        retweets,
        replies,
        quotes: legacy.quote_count || 0,
        bookmarks: legacy.bookmark_count || 0,
        hashtags,
        mentions,
        source: sourceApp || rawSource,
        full_text: fullText,
        engagement_rate: engagementRate,
    };
    const author = {
        user_id: user.rest_id || user.id,
        username,
        profile: username ? `https://x.com/${username}` : null,
        bio: ((_h = user.profile_bio) === null || _h === void 0 ? void 0 : _h.description) || userLegacy.description,
        location: (_j = user.location) === null || _j === void 0 ? void 0 : _j.location,
        website,
        followers: followersInt,
        verified: Boolean(((_k = user.verification) === null || _k === void 0 ? void 0 : _k.verified) || user.is_blue_verified),
    };
    return { tweet, author };
}
function getNoteLength(rawJson) {
    var _a, _b, _c, _d, _e, _f;
    try {
        const result = (_b = (_a = rawJson === null || rawJson === void 0 ? void 0 : rawJson.data) === null || _a === void 0 ? void 0 : _a.tweetResult) === null || _b === void 0 ? void 0 : _b.result;
        const noteText = (_e = (_d = (_c = result === null || result === void 0 ? void 0 : result.note_tweet) === null || _c === void 0 ? void 0 : _c.note_tweet_results) === null || _d === void 0 ? void 0 : _d.result) === null || _e === void 0 ? void 0 : _e.text;
        if (noteText)
            return noteText.length;
        const legacyText = ((_f = result === null || result === void 0 ? void 0 : result.legacy) === null || _f === void 0 ? void 0 : _f.full_text) || '';
        return legacyText.length;
    }
    catch {
        return 0;
    }
}
class TwitterMediaUpload {
    constructor() {
        this.description = {
            displayName: 'Twitter Media Upload',
            name: 'twitterMediaUpload',
            icon: 'file:twitter.svg',
            group: ['transform'],
            version: 1,
            subtitle: '={{$parameter["operation"]}}',
            description: 'Upload media files to Twitter/X',
            defaults: {
                name: 'Twitter Media Upload',
            },
            inputs: ['main'],
            outputs: ['main'],
            credentials: [
                {
                    name: 'twitterMediaUploadApi',
                    required: true,
                    displayOptions: {
                        show: {
                            operation: ['upload'],
                        },
                    },
                },
            ],
            properties: [
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    options: [
                        {
                            name: 'Upload Media',
                            value: 'upload',
                            description: 'Upload media file to Twitter',
                            action: 'Upload media file to Twitter',
                        },
                        {
                            name: 'Search Tweet Metrics',
                            value: 'searchMetrics',
                            description: 'Get detailed metrics for a tweet',
                            action: 'Get tweet metrics and author information',
                        },
                    ],
                    default: 'upload',
                },
                {
                    displayName: 'Tweet URL',
                    name: 'tweetUrl',
                    type: 'string',
                    default: '',
                    required: true,
                    displayOptions: {
                        show: {
                            operation: ['searchMetrics'],
                        },
                    },
                    placeholder: 'https://x.com/username/status/1234567890',
                    description: 'The full URL of the tweet to analyze',
                },
                {
                    displayName: 'Timeout (ms)',
                    name: 'timeout',
                    type: 'number',
                    default: 25000,
                    displayOptions: {
                        show: {
                            operation: ['searchMetrics'],
                        },
                    },
                    description: 'Maximum time to wait for page load (milliseconds)',
                },
                {
                    displayName: 'Binary Property',
                    name: 'binaryPropertyName',
                    type: 'string',
                    default: 'data',
                    required: true,
                    displayOptions: {
                        show: {
                            operation: ['upload'],
                        },
                    },
                    description: 'Name of the binary property which contains the file to upload',
                },
                {
                    displayName: 'Media Type',
                    name: 'mediaType',
                    type: 'options',
                    options: [
                        {
                            name: 'Image (PNG)',
                            value: 'image/png',
                        },
                        {
                            name: 'Image (JPEG)',
                            value: 'image/jpeg',
                        },
                        {
                            name: 'Image (GIF)',
                            value: 'image/gif',
                        },
                        {
                            name: 'Image (WebP)',
                            value: 'image/webp',
                        },
                        {
                            name: 'Video (MP4)',
                            value: 'video/mp4',
                        },
                        {
                            name: 'Video (MOV)',
                            value: 'video/quicktime',
                        },
                        {
                            name: 'Custom',
                            value: 'custom',
                        },
                    ],
                    default: 'image/png',
                    displayOptions: {
                        show: {
                            operation: ['upload'],
                        },
                    },
                    description: 'The MIME type of the media being uploaded',
                },
                {
                    displayName: 'Custom Media Type',
                    name: 'customMediaType',
                    type: 'string',
                    default: '',
                    displayOptions: {
                        show: {
                            operation: ['upload'],
                            mediaType: ['custom'],
                        },
                    },
                    description: 'Custom MIME type (e.g., audio/mpeg)',
                },
            ],
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        const operation = this.getNodeParameter('operation', 0);
        // Only get credentials if operation is upload
        let credentials;
        let oauth;
        let token;
        if (operation === 'upload') {
            credentials = await this.getCredentials('twitterMediaUploadApi');
            // Setup OAuth1
            oauth = new oauth_1_0a_1.default({
                consumer: {
                    key: credentials.consumerKey,
                    secret: credentials.consumerSecret,
                },
                signature_method: 'HMAC-SHA1',
                hash_function(base_string, key) {
                    return crypto_js_1.default.HmacSHA1(base_string, key).toString(crypto_js_1.default.enc.Base64);
                },
            });
            token = {
                key: credentials.accessToken,
                secret: credentials.accessTokenSecret,
            };
        }
        const TWITTER_UPLOAD_URL = 'https://upload.twitter.com/1.1/media/upload.json';
        for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
            try {
                const operation = this.getNodeParameter('operation', itemIndex);
                if (operation === 'searchMetrics') {
                    const tweetUrl = this.getNodeParameter('tweetUrl', itemIndex);
                    const timeout = this.getNodeParameter('timeout', itemIndex, 25000);
                    let bestRaw = null;
                    let bestLen = -1;
                    const browser = await puppeteer.launch({
                        headless: true,
                        args: ['--no-sandbox', '--disable-setuid-sandbox'],
                    });
                    const page = await browser.newPage();
                    page.on('response', async (response) => {
                        try {
                            const url = response.url();
                            if (!url.includes('TweetResultByRestId'))
                                return;
                            let data;
                            try {
                                data = await response.json();
                            }
                            catch {
                                const body = await response.text();
                                data = JSON.parse(body);
                            }
                            const length = getNoteLength(data);
                            if (length > bestLen) {
                                bestLen = length;
                                bestRaw = data;
                            }
                        }
                        catch (error) {
                            // Ignore response parsing errors
                        }
                    });
                    await page.goto(tweetUrl, { timeout, waitUntil: 'networkidle2' });
                    await page.waitForTimeout(5000);
                    await browser.close();
                    if (!bestRaw) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Could not extract tweet data. Please verify the URL is correct.', { itemIndex });
                    }
                    const payload = extractTweetPayload(bestRaw);
                    if (!payload) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Failed to parse tweet data', { itemIndex });
                    }
                    returnData.push({
                        json: payload,
                        pairedItem: itemIndex,
                    });
                }
                else if (operation === 'upload') {
                    const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex);
                    const mediaType = this.getNodeParameter('mediaType', itemIndex);
                    const customMediaType = this.getNodeParameter('customMediaType', itemIndex, '');
                    const finalMediaType = mediaType === 'custom' ? customMediaType : mediaType;
                    // Get binary data
                    const binaryData = this.helpers.assertBinaryData(itemIndex, binaryPropertyName);
                    const fileBuffer = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
                    const totalBytes = fileBuffer.length;
                    // INIT
                    const initData = {
                        command: 'INIT',
                        total_bytes: totalBytes.toString(),
                        media_type: finalMediaType,
                    };
                    const initRequest = {
                        url: TWITTER_UPLOAD_URL,
                        method: 'POST',
                        data: initData,
                    };
                    const initAuth = oauth.authorize(initRequest, token);
                    const initResponse = await this.helpers.request({
                        method: 'POST',
                        url: TWITTER_UPLOAD_URL,
                        headers: oauth.toHeader(initAuth),
                        form: initData,
                        json: true,
                    });
                    const mediaId = initResponse.media_id_string;
                    // APPEND
                    const appendRequest = {
                        url: TWITTER_UPLOAD_URL,
                        method: 'POST',
                    };
                    const appendAuth = oauth.authorize(appendRequest, token);
                    await this.helpers.request({
                        method: 'POST',
                        url: TWITTER_UPLOAD_URL,
                        headers: {
                            ...oauth.toHeader(appendAuth),
                        },
                        formData: {
                            command: 'APPEND',
                            media_id: mediaId,
                            segment_index: '0',
                            media: {
                                value: fileBuffer,
                                options: {
                                    filename: binaryData.fileName || 'file',
                                    contentType: finalMediaType,
                                },
                            },
                        },
                    });
                    // FINALIZE
                    const finalizeData = {
                        command: 'FINALIZE',
                        media_id: mediaId,
                    };
                    const finalizeRequest = {
                        url: TWITTER_UPLOAD_URL,
                        method: 'POST',
                        data: finalizeData,
                    };
                    const finalizeAuth = oauth.authorize(finalizeRequest, token);
                    const finalizeResponse = await this.helpers.request({
                        method: 'POST',
                        url: TWITTER_UPLOAD_URL,
                        headers: oauth.toHeader(finalizeAuth),
                        form: finalizeData,
                        json: true,
                    });
                    returnData.push({
                        json: {
                            media_id: mediaId,
                            media_id_string: finalizeResponse.media_id_string,
                            size: finalizeResponse.size,
                            expires_after_secs: finalizeResponse.expires_after_secs,
                            media_type: finalMediaType,
                        },
                        pairedItem: itemIndex,
                    });
                }
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: {
                            error: error.message,
                        },
                        pairedItem: itemIndex,
                    });
                    continue;
                }
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), error, {
                    itemIndex,
                });
            }
        }
        return [returnData];
    }
}
exports.TwitterMediaUpload = TwitterMediaUpload;
