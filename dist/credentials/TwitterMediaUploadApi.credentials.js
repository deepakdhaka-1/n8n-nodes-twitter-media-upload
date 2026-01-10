"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwitterMediaUploadApi = void 0;
class TwitterMediaUploadApi {
    constructor() {
        this.name = 'twitterMediaUploadApi';
        this.displayName = 'Twitter Media Upload API';
        this.documentationUrl = 'https://developer.twitter.com/en/docs/twitter-api';
        this.properties = [
            {
                displayName: 'Consumer Key',
                name: 'consumerKey',
                type: 'string',
                default: '',
                required: true,
                description: 'Twitter API Consumer Key (API Key)',
            },
            {
                displayName: 'Consumer Secret',
                name: 'consumerSecret',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                default: '',
                required: true,
                description: 'Twitter API Consumer Secret (API Secret)',
            },
            {
                displayName: 'Access Token',
                name: 'accessToken',
                type: 'string',
                default: '',
                required: true,
                description: 'Twitter API Access Token',
            },
            {
                displayName: 'Access Token Secret',
                name: 'accessTokenSecret',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                default: '',
                required: true,
                description: 'Twitter API Access Token Secret',
            },
        ];
        this.authenticate = {
            type: 'generic',
            properties: {
                qs: {},
            },
        };
        this.test = {
            request: {
                baseURL: 'https://api.twitter.com/1.1',
                url: '/account/verify_credentials.json',
            },
        };
    }
}
exports.TwitterMediaUploadApi = TwitterMediaUploadApi;
