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
import fetchMock from 'fetch-mock';
import { ClickstreamAnalytics } from '../../src';
import { BrowserInfo } from '../../src/browser';
import { NetRequest } from '../../src/network/NetRequest';
import { AnalyticsEventBuilder, ClickstreamContext } from '../../src/provider';
import { Session } from '../../src/tracker';
import { HashUtil } from '../../src/util/HashUtil';

describe('ClickstreamAnalytics test', () => {
	let context: ClickstreamContext;
	let eventJson: string;
	beforeEach(async () => {
		context = new ClickstreamContext(new BrowserInfo(), {
			appId: 'testApp',
			endpoint: 'https://localhost:8080/collect',
		});
		const event = AnalyticsEventBuilder.createEvent(
			context,
			{ name: 'testEvent' },
			{},
			Session.getCurrentSession(context)
		);
		eventJson = JSON.stringify([event]);
	});

	afterEach(() => {
		fetchMock.reset();
		ClickstreamAnalytics['provider'] = undefined;
	});

	test('test request success', async () => {
		fetchMock.post('begin:https://localhost:8080/collect', {
			status: 200,
			body: [],
		});
		const result = await NetRequest.sendRequest(eventJson, context, 1);
		expect(result).toBeTruthy();
	});

	test('test request fail', async () => {
		context = new ClickstreamContext(new BrowserInfo(), {
			appId: 'testApp',
			endpoint: 'https://localhost:8080/failed',
		});
		const result = await NetRequest.sendRequest(eventJson, context, 1);
		expect(result).toBeFalsy();
	});

	test('test request fail with code 404', async () => {
		fetchMock.post('begin:https://localhost:8080/collectFail', 404);
		context = new ClickstreamContext(new BrowserInfo(), {
			appId: 'testApp',
			endpoint: 'https://localhost:8080/collectFail',
		});
		const result = await NetRequest.sendRequest(eventJson, context, 1);
		expect(result).toBeFalsy();
	});

	test('test request timeout', async () => {
		fetchMock.post(
			'begin:https://localhost:8080/collect',
			{
				status: 200,
				body: [],
			},
			{
				delay: 1000,
			}
		);
		context = new ClickstreamContext(new BrowserInfo(), {
			appId: 'testApp',
			endpoint: 'https://localhost:8080/collect',
		});
		const result = await NetRequest.sendRequest(eventJson, context, 1, 1, 200);
		expect(result).toBeFalsy();
	});

	test('test request success with hash code', async () => {
		fetchMock.post('begin:https://localhost:8080/collect', {
			status: 200,
			body: [],
		});
		const mockFetch = jest.spyOn(global, 'fetch');

		const eventJsonHashCode = await HashUtil.getHashCode(eventJson);
		const result = await NetRequest.sendRequest(eventJson, context, 1);
		expect(result).toBeTruthy();

		const [requestUrl] = mockFetch.mock.calls[0];
		const requestHashCode = new URL(requestUrl.toString()).searchParams.get(
			'hashCode'
		);
		expect(eventJsonHashCode).toBe(requestHashCode);
	});

	test('test request success with upload timestamp', async () => {
		fetchMock.post('begin:https://localhost:8080/collect', {
			status: 200,
			body: [],
		});
		const mockFetch = jest.spyOn(global, 'fetch');

		const result = await NetRequest.sendRequest(eventJson, context, 1);
		expect(result).toBeTruthy();

		const [requestUrl] = mockFetch.mock.calls[0];
		const uploadTimestamp = new URL(requestUrl.toString()).searchParams.get(
			'upload_timestamp'
		);
		expect(uploadTimestamp).not.toBeNull();
	});
});
