import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import OAuth from 'oauth-1.0a';
import crypto from 'crypto-js';
import * as puppeteer from 'puppeteer';

function extractTweetPayload(rawJson: any): any {
	const result = rawJson?.data?.tweetResult?.result;
	if (!result) return null;

	const legacy = result.legacy || {};
	const viewsObj = result.views || {};
	const noteTweet = result.note_tweet?.note_tweet_results?.result || {};
	const entitiesLegacy = legacy.entities || {};
	const entitiesNote = noteTweet.entity_set || {};

	const user = result.core?.user_results?.result || {};
	const userCore = user.core || {};
	const userLegacy = user.legacy || {};
	const userEntities = userLegacy.entities || {};

	const tweetId = legacy.id_str || result.rest_id;
	const username = userCore.screen_name || '';
	const tweetUrl = tweetId && username ? `https://x.com/${username}/status/${tweetId}` : null;

	const hashtagsNote = (entitiesNote.hashtags || []).map((h: any) => h.text);
	const hashtagsLegacy = (entitiesLegacy.hashtags || []).map((h: any) => h.text);
	const hashtags = hashtagsNote.length > 0 ? hashtagsNote : hashtagsLegacy;

	const mentionsNote = (entitiesNote.user_mentions || []).map((m: any) => m.screen_name);
	const mentionsLegacy = (entitiesLegacy.user_mentions || []).map((m: any) => m.screen_name);
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
		} catch {
			sourceApp = rawSource;
		}
	}

	let website = null;
	const urlEntity = userEntities.url?.urls || [];
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
		bio: user.profile_bio?.description || userLegacy.description,
		location: user.location?.location,
		website,
		followers: followersInt,
		verified: Boolean(user.verification?.verified || user.is_blue_verified),
	};

	return { tweet, author };
}

function getNoteLength(rawJson: any): number {
	try {
		const result = rawJson?.data?.tweetResult?.result;
		const noteText = result?.note_tweet?.note_tweet_results?.result?.text;
		if (noteText) return noteText.length;
		const legacyText = result?.legacy?.full_text || '';
		return legacyText.length;
	} catch {
		return 0;
	}
}

export class TwitterMediaUpload implements INodeType {
	description: INodeTypeDescription = {
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

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		// Only get credentials if operation is upload
		let credentials;
		let oauth;
		let token;

		if (operation === 'upload') {
			credentials = await this.getCredentials('twitterMediaUploadApi');

			// Setup OAuth1
			oauth = new OAuth({
				consumer: {
					key: credentials.consumerKey as string,
					secret: credentials.consumerSecret as string,
				},
				signature_method: 'HMAC-SHA1',
				hash_function(base_string, key) {
					return crypto.HmacSHA1(base_string, key).toString(crypto.enc.Base64);
				},
			});

			token = {
				key: credentials.accessToken as string,
				secret: credentials.accessTokenSecret as string,
			};
		}

		const TWITTER_UPLOAD_URL = 'https://upload.twitter.com/1.1/media/upload.json';

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const operation = this.getNodeParameter('operation', itemIndex) as string;

				if (operation === 'searchMetrics') {
					const tweetUrl = this.getNodeParameter('tweetUrl', itemIndex) as string;
					const timeout = this.getNodeParameter('timeout', itemIndex, 25000) as number;

					let bestRaw: any = null;
					let bestLen = -1;

					const browser = await puppeteer.launch({
						headless: true,
						args: ['--no-sandbox', '--disable-setuid-sandbox'],
					});

					const page = await browser.newPage();

					page.on('response', async (response) => {
						try {
							const url = response.url();
							if (!url.includes('TweetResultByRestId')) return;

							let data;
							try {
								data = await response.json();
							} catch {
								const body = await response.text();
								data = JSON.parse(body);
							}

							const length = getNoteLength(data);
							if (length > bestLen) {
								bestLen = length;
								bestRaw = data;
							}
						} catch (error) {
							// Ignore response parsing errors
						}
					});

					await page.goto(tweetUrl, { timeout, waitUntil: 'networkidle2' });
					await page.waitForTimeout(5000);
					await browser.close();

					if (!bestRaw) {
						throw new NodeOperationError(
							this.getNode(),
							'Could not extract tweet data. Please verify the URL is correct.',
							{ itemIndex }
						);
					}

					const payload = extractTweetPayload(bestRaw);
					if (!payload) {
						throw new NodeOperationError(
							this.getNode(),
							'Failed to parse tweet data',
							{ itemIndex }
						);
					}

					returnData.push({
						json: payload,
						pairedItem: itemIndex,
					});
				} else if (operation === 'upload') {
					const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex) as string;
					const mediaType = this.getNodeParameter('mediaType', itemIndex) as string;
					const customMediaType = this.getNodeParameter('customMediaType', itemIndex, '') as string;

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
						headers: oauth.toHeader(initAuth) as any,
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
						} as any,
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
						headers: oauth.toHeader(finalizeAuth) as any,
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
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
						},
						pairedItem: itemIndex,
					});
					continue;
				}
				throw new NodeOperationError(this.getNode(), error, {
					itemIndex,
				});
			}
		}

		return [returnData];
	}
}
