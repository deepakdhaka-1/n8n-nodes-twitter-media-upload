"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwitterMediaUpload = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const oauth_1_0a_1 = __importDefault(require("oauth-1.0a"));
const crypto_js_1 = __importDefault(require("crypto-js"));
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
                    ],
                    default: 'upload',
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
        const credentials = await this.getCredentials('twitterMediaUploadApi');
        // Setup OAuth1
        const oauth = new oauth_1_0a_1.default({
            consumer: {
                key: credentials.consumerKey,
                secret: credentials.consumerSecret,
            },
            signature_method: 'HMAC-SHA1',
            hash_function(base_string, key) {
                return crypto_js_1.default.HmacSHA1(base_string, key).toString(crypto_js_1.default.enc.Base64);
            },
        });
        const token = {
            key: credentials.accessToken,
            secret: credentials.accessTokenSecret,
        };
        const TWITTER_UPLOAD_URL = 'https://upload.twitter.com/1.1/media/upload.json';
        for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
            try {
                const operation = this.getNodeParameter('operation', itemIndex);
                if (operation === 'upload') {
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
