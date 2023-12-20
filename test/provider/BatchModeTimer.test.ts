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
import { SendMode } from '../../src';
import { NetRequest } from '../../src/network/NetRequest';
import { ClickstreamProvider } from '../../src/provider';
import { setUpBrowserPerformance } from '../browser/BrowserUtil';

describe('ClickstreamProvider timer test', () => {
	let provider: ClickstreamProvider;
	beforeEach(() => {
		localStorage.clear();
		setUpBrowserPerformance();
		provider = new ClickstreamProvider();
		const mockSendRequest = jest.fn().mockResolvedValue(true);
		jest.spyOn(NetRequest, 'sendRequest').mockImplementation(mockSendRequest);
	});

	afterEach(() => {
		provider = undefined;
		jest.restoreAllMocks();
	});
	test('test config batch mode with timer', async () => {
		const startTimerMock = jest.spyOn(provider, 'startTimer');
		const flushEventsMock = jest.spyOn(provider, 'flushEvents');
		provider.configure({
			appId: 'testAppId',
			endpoint: 'https://example.com/collect',
			sendMode: SendMode.Batch,
			sendEventsInterval: 10,
		});
		await sleep(100);
		expect(startTimerMock).toBeCalled();
		expect(flushEventsMock).toBeCalled();
	});
});

function sleep(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}
