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

import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

import { JSDOM } from 'jsdom';
import { BrowserInfo } from '../../src/browser';
import { NetRequest } from '../../src/network/NetRequest';
import {
	ClickstreamContext,
	ClickstreamProvider,
	Event,
	EventRecorder,
} from '../../src/provider';
import { SessionTracker } from '../../src/tracker';
import { SendMode } from '../../src/types';
import { StorageUtil } from '../../src/util/StorageUtil';

describe('SessionTracker test', () => {
	let provider: ClickstreamProvider;
	let sessionTracker: SessionTracker;
	let context: ClickstreamContext;
	let eventRecorder: EventRecorder;

	const mockSendRequest = jest.fn().mockResolvedValue(true);
	let recordMethodMock: any;

	beforeEach(() => {
		localStorage.clear();
		provider = new ClickstreamProvider();
		recordMethodMock = jest.spyOn(provider, 'record');
		Object.assign(provider.configuration, {
			appId: 'testAppId',
			endpoint: 'https://example.com/collect',
			sendMode: SendMode.Batch,
		});
		context = new ClickstreamContext(
			new BrowserInfo(),
			provider.configuration
		);

		eventRecorder = new EventRecorder(context);
		sessionTracker = new SessionTracker(provider, context);
		provider.context = context;
		provider.sessionTracker = sessionTracker;
		provider.eventRecorder = eventRecorder;
		jest.spyOn(NetRequest, 'sendRequest').mockImplementation(mockSendRequest);
	});

	afterEach(() => {
		provider = undefined;
		recordMethodMock.mockClear();
		jest.restoreAllMocks();
	});

	test('test initial state for setUp', () => {
		const pageAppearMock = jest.spyOn(sessionTracker, 'onPageAppear');
		sessionTracker.setUp();
		expect(StorageUtil.getIsFirstOpen()).toBe(false);

		expect(recordMethodMock).toBeCalledWith({
			name: Event.PresetEvent.FIRST_OPEN,
		});
		expect(pageAppearMock).toBeCalledWith(true);
		expect(recordMethodMock).toBeCalledWith({
			name: Event.PresetEvent.SESSION_START,
		});
		expect(recordMethodMock).toBeCalledWith({
			name: Event.PresetEvent.APP_START,
			attributes: {
				[Event.ReservedAttribute.IS_FIRST_TIME]: true,
			},
		});
		expect(sessionTracker.startEngageTimestamp > 0).toBeTruthy();

		const session = sessionTracker.session;
		expect(session.sessionIndex).toBe(1);
		expect(session.sessionId).not.toBeUndefined();
		expect(session.isNewSession()).toBeTruthy();
	});

	test('test setUp for unsupported env', () => {
		const addEventListenerMock = jest.spyOn(window, 'addEventListener');
		const addEventListener = (global as any).document.addEventListener;
		(global as any).document.addEventListener = undefined;
		sessionTracker.setUp();
		expect(addEventListenerMock).not.toBeCalled();
		(global as any).document.addEventListener = addEventListener;
	});

	test('test hide page', () => {
		const onPageHideMock = jest.spyOn(sessionTracker, 'onPageHide');
		sessionTracker.setUp();
		hidePage();
		expect(onPageHideMock).toBeCalled();
		expect(sessionTracker.session.isNewSession()).toBeFalsy();
	});

	test('test hide page and reopen page', () => {
		const onPageAppearMock = jest.spyOn(sessionTracker, 'onPageAppear');
		const onPageHideMock = jest.spyOn(sessionTracker, 'onPageHide');
		sessionTracker.setUp();
		hidePage();
		showPage();
		expect(onPageHideMock).toBeCalledTimes(1);
		expect(onPageAppearMock).toBeCalledTimes(2);
		expect(sessionTracker.session.sessionIndex).toBe(1);
	});

	test('test session timeout', async () => {
		(provider.configuration as any).sessionTimeoutDuration = 0;
		sessionTracker.setUp();
		hidePage();
		await sleep(100);
		showPage();
		expect(sessionTracker.session.sessionIndex).toBe(2);
	});

	test('test close page', async () => {
		const onBeforeUnloadMock = jest.spyOn(sessionTracker, 'onBeforeUnload');
		const onPageHideMock = jest.spyOn(sessionTracker, 'onPageHide');
		sessionTracker.setUp();
		closePage();
		expect(onBeforeUnloadMock).toBeCalled();
		expect(onPageHideMock).toBeCalled();
	});

	test('test record user engagement event', () => {
		sessionTracker.startEngageTimestamp = new Date().getTime() - 1900000;
		sessionTracker.recordUserEngagement();
		expect(recordMethodMock).toBeCalled();
	});

	function hidePage() {
		Object.defineProperty(window.document, 'hidden', {
			writable: true,
			value: true,
		});
		Object.defineProperty(window.document, 'visibilityState', {
			writable: true,
			value: 'hidden',
		});
		window.document.dispatchEvent(new window.Event('visibilitychange'));
	}

	function showPage() {
		Object.defineProperty(window.document, 'hidden', {
			writable: true,
			value: false,
		});
		Object.defineProperty(window.document, 'visibilityState', {
			writable: true,
			value: 'appear',
		});
		window.document.dispatchEvent(new window.Event('visibilitychange'));
	}

	function closePage() {
		window.dispatchEvent(new window.Event('beforeunload'));
	}

	function sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	describe('Browser environment test', () => {
		beforeEach(() => {
			const { document } = new JSDOM(
				'<!doctype html><html><body></body></html>'
			).window;
			(global as any).document = document;
		});

		afterEach(() => {
			delete (global as any).document;
		});

		test('test for not in the supported web environment', () => {
			const addEventListener = (global as any).document.addEventListener;
			(global as any).document.addEventListener = undefined;
			const result = sessionTracker.checkEnv();
			expect(result).toBe(false);
			(global as any).document.addEventListener = addEventListener;
		});

		test('test env for hidden', () => {
			const result = sessionTracker.checkEnv();
			expect(result).toBe(true);
			expect(sessionTracker.hiddenStr).toBe('hidden');
			expect(sessionTracker.visibilityChange).toBe('visibilitychange');
		});
		test('test env for msHidden', () => {
			jest.spyOn(document, 'hidden', 'get').mockReturnValue(undefined);
			(document as any).msHidden = true;

			const result = sessionTracker.checkEnv();
			expect(result).toBe(true);
			expect(sessionTracker.hiddenStr).toBe('msHidden');
			expect(sessionTracker.visibilityChange).toBe('msvisibilitychange');
		});
		test('test env for webkitHidden', () => {
			jest.spyOn(document, 'hidden', 'get').mockReturnValue(undefined);
			(document as any).webkitHidden = true;
			const result = sessionTracker.checkEnv();
			expect(result).toBe(true);
			expect(sessionTracker.hiddenStr).toBe('webkitHidden');
			expect(sessionTracker.visibilityChange).toBe('webkitvisibilitychange');
		});

		test('test for no supported hidden', () => {
			jest.spyOn(document, 'hidden', 'get').mockReturnValue(undefined);
			const result = sessionTracker.checkEnv();
			expect(result).toBe(false);
		});
	});
});
