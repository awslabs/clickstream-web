/**
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
 *  with the License. A copy of the License is located at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions
 *  and limitations under the License.
 */

import { ClickstreamProvider } from '../src/provider/ClickstreamProvider';
import { ClickstreamConfiguration } from '../src/types';

describe('ClickstreamProvider test', () => {
	let provider: ClickstreamProvider;
	beforeEach(() => {
		provider = new ClickstreamProvider();
	});

	afterEach(() => {
		provider = undefined;
	});

	test('test default value', () => {
		expect(provider.configuration.appId).toBe('');
		expect(provider.configuration.endpoint).toBe('');
		expect(provider.configuration.sendMode).toBe('Immediate');
		expect(provider.configuration.sendEventsInterval).toBe(5000);
		expect(provider.configuration.isTrackPageViewEvents).toBe(true);
		expect(provider.configuration.isLogEvents).toBe(false);
		expect(provider.configuration.sessionTimeoutDuration).toBe(1800000);
	});

	test('test config with empty appId or endpoint', () => {
		const configuration = provider.configure({
			appId: '',
			endpoint: '',
		}) as ClickstreamConfiguration;

		expect(configuration.appId).toBe('');
		expect(configuration.endpoint).toBe('');
	});

	test('test modify configuration', () => {
		const configuration = provider.configure({
			appId: 'testAppId',
			endpoint: 'https://example.com/collect',
			isLogEvents: true,
			sendMode: 'Batch',
			sendEventsInterval: 2000,
			isTrackPageViewEvents: false,
			pageType: 'multiPageApp',
			sessionTimeoutDuration: 300000,
			authCookie: 'your auth cookie',
		}) as ClickstreamConfiguration;
		expect(configuration.appId).toBe('testAppId');
		expect(configuration.endpoint).toBe('https://example.com/collect');
		expect(configuration.isLogEvents).toBe(true);
		expect(configuration.sendEventsInterval).toBe(2000);
		expect(configuration.isTrackPageViewEvents).toBe(false);
		expect(configuration.pageType).toBe('multiPageApp');
		expect(configuration.sessionTimeoutDuration).toBe(300000);
		expect(configuration.authCookie).toBe('your auth cookie');
	});

	test('get category and provider name test', () => {
		expect(provider.getCategory()).toBe('Analytics');
		expect(provider.getProviderName()).toBe('ClickstreamProvider');
	});
});
