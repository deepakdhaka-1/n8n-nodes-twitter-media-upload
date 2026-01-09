import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class TwitterMediaUploadApi implements ICredentialType {
	name = 'twitterMediaUploadApi';
	displayName = 'Twitter Media Upload API';
	documentationUrl = 'https://developer.twitter.com/en/docs/twitter-api';
	properties: INodeProperties[] = [
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

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			qs: {},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.twitter.com/1.1',
			url: '/account/verify_credentials.json',
		},
	};
}
