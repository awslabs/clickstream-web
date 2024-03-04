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
import { PageType, SendMode } from '../../src';
import { BrowserInfo } from '../../src/browser';
import { NetRequest } from '../../src/network/NetRequest';
import {
	AnalyticsEventBuilder,
	ClickstreamContext,
	ClickstreamProvider,
	Event,
	EventRecorder,
} from '../../src/provider';
import { PageViewTracker, SessionTracker, Session } from '../../src/tracker';
import { StorageUtil } from '../../src/util/StorageUtil';
import { setPerformanceEntries } from '../browser/BrowserUtil';
import { MockObserver } from '../browser/MockObserver';

describe('SessionTracker test', () => {
	let provider: ClickstreamProvider;
	let sessionTracker: SessionTracker;
	let pageViewTracker: PageViewTracker;
	let context: ClickstreamContext;
	let eventRecorder: EventRecorder;
	let recordMethodMock: any;

	beforeEach(() => {
		StorageUtil.clearAll();
		const mockSendRequest = jest.fn().mockResolvedValue(true);
		jest.spyOn(NetRequest, 'sendRequest').mockImplementation(mockSendRequest);
		provider = new ClickstreamProvider();
		recordMethodMock = jest.spyOn(provider, 'record');
		Object.assign(provider.configuration, {
			appId: 'testAppId',
			endpoint: 'https://example.com/collect',
			sendMode: SendMode.Batch,
		});
		context = new ClickstreamContext(new BrowserInfo(), provider.configuration);

		eventRecorder = new EventRecorder(context);
		sessionTracker = new SessionTracker(provider, context);
		pageViewTracker = new PageViewTracker(provider, context);
		provider.context = context;
		provider.sessionTracker = sessionTracker;
		provider.eventRecorder = eventRecorder;
		provider.pageViewTracker = pageViewTracker;
		(global as any).PerformanceObserver = MockObserver;
		setPerformanceEntries();
	});

	afterEach(() => {
		jest.clearAllMocks();
		jest.resetModules();
	});

	test('test initial state for setUp', () => {
		const pageAppearMock = jest.spyOn(sessionTracker, 'onPageAppear');
		sessionTracker.setUp();
		expect(provider.configuration.isTrackAppStartEvents).toBe(false);
		expect(provider.configuration.isTrackAppEndEvents).toBe(false);
		expect(StorageUtil.getIsFirstOpen()).toBe(false);

		expect(recordMethodMock).toBeCalledWith({
			name: Event.PresetEvent.FIRST_OPEN,
		});
		expect(pageAppearMock).toBeCalledWith(true);
		expect(recordMethodMock).toBeCalledWith({
			name: Event.PresetEvent.SESSION_START,
		});
		expect(recordMethodMock).not.toBeCalledWith({
			name: Event.PresetEvent.APP_START,
			attributes: {
				[Event.ReservedAttribute.IS_FIRST_TIME]: true,
			},
		});

		const session = sessionTracker.session;
		expect(session.sessionIndex).toBe(1);
		expect(session.sessionId).not.toBeUndefined();
		expect(session.isNewSession()).toBeTruthy();
	});

	test('test first open and session start event has the same sessionId', () => {
		sessionTracker.setUp();
		const allEvents = JSON.parse(StorageUtil.getAllEvents() + ']');
		const firstOpenEvent = allEvents[0];
		const sessionStartEvent = allEvents[1];
		expect(
			firstOpenEvent.sessionId === sessionStartEvent.sessionId
		).toBeTruthy();
	});

	test('test enable app start', () => {
		provider.configuration.isTrackAppStartEvents = true;
		sessionTracker.setUp();
		expect(recordMethodMock).toBeCalledWith({
			name: Event.PresetEvent.APP_START,
			attributes: {
				[Event.ReservedAttribute.IS_FIRST_TIME]: true,
			},
		});
	});

	test('test multi page mode record app start when setUp', () => {
		provider.configuration.isTrackAppStartEvents = true;
		Object.assign(provider.configuration, {
			pageType: PageType.multiPageApp,
		});
		sessionTracker.setUp();
		expect(recordMethodMock).toBeCalledWith({
			name: Event.PresetEvent.APP_START,
			attributes: {
				[Event.ReservedAttribute.IS_FIRST_TIME]: true,
			},
		});
	});

	test('test multi page mode not record app start when come from the same host name', () => {
		provider.configuration.isTrackAppStartEvents = true;
		Object.assign(provider.configuration, {
			pageType: PageType.multiPageApp,
		});
		context.browserInfo.latestReferrerHost = 'localhost';
		sessionTracker.setUp();
		expect(recordMethodMock).not.toBeCalledWith({
			name: Event.PresetEvent.APP_START,
			attributes: {
				[Event.ReservedAttribute.IS_FIRST_TIME]: true,
			},
		});
	});

	test('test spa mode not record app start when come from the same host name', () => {
		Object.assign(provider.configuration, {
			pageType: PageType.SPA,
		});
		context.browserInfo.latestReferrerHost = 'localhost';
		sessionTracker.setUp();
		expect(recordMethodMock).not.toBeCalledWith({
			name: Event.PresetEvent.APP_START,
			attributes: {
				[Event.ReservedAttribute.IS_FIRST_TIME]: true,
			},
		});
	});

	test('test not record app start when browser is from reload', () => {
		provider.configuration.isTrackAppStartEvents = true;
		jest.spyOn(BrowserInfo, 'isFromReload').mockReturnValue(true);
		setPerformanceEntries(true, true);
		sessionTracker.setUp();
		expect(recordMethodMock).not.toBeCalledWith({
			name: Event.PresetEvent.APP_START,
			attributes: {
				[Event.ReservedAttribute.IS_FIRST_TIME]: true,
			},
		});
	});

	test('test setUp for unsupported env', () => {
		const addEventListenerMock = jest.spyOn(window, 'addEventListener');
		const addEventListener = (global as any).document.addEventListener;
		(global as any).document.addEventListener = undefined;
		sessionTracker.setUp();
		expect(addEventListenerMock).not.toBeCalled();
		(global as any).document.addEventListener = addEventListener;
	});

	test('test checkEnv for hidden api is not supported', () => {
		const addEventListenerMock = jest.spyOn(window, 'addEventListener');
		const hidden = document.hidden;
		Object.defineProperty(document, 'hidden', {
			writable: true,
			value: undefined,
		});
		sessionTracker.init();
		expect(addEventListenerMock).not.toBeCalled();
		Object.defineProperty(document, 'hidden', {
			writable: true,
			value: hidden,
		});
	});

	test('test hide page', () => {
		const onPageHideMock = jest.spyOn(sessionTracker, 'onPageHide');
		const recordUserEngagementMock = jest.spyOn(
			provider.pageViewTracker,
			'recordUserEngagement'
		);
		sessionTracker.setUp();
		hidePage();
		expect(onPageHideMock).toBeCalled();
		expect(recordUserEngagementMock).toBeCalled();
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

	test('test hide page when localStorage cleared', () => {
		const onPageHideMock = jest.spyOn(sessionTracker, 'onPageHide');
		sessionTracker.setUp();
		const originDeviceId = StorageUtil.getDeviceId();
		const originUserUniqueId = StorageUtil.getCurrentUserUniqueId();
		localStorage.clear();
		hidePage();
		expect(onPageHideMock).toBeCalled();
		expect(StorageUtil.getDeviceId()).toBe(originDeviceId);
		expect(StorageUtil.getCurrentUserUniqueId()).toBe(originUserUniqueId);
		expect(StorageUtil.getIsFirstOpen()).toBe(false);
	});

	test('test session timeout and reopen the page will record page view', async () => {
		const trackPageViewMock = jest.spyOn(pageViewTracker, 'trackPageView');
		(provider.configuration as any).sessionTimeoutDuration = 0;
		sessionTracker.setUp();
		hidePage();
		await sleep(100);
		showPage();
		expect(sessionTracker.session.sessionIndex).toBe(2);
		expect(trackPageViewMock).toBeCalled();
	});

	test('test launch the app use the stored session', () => {
		const session = Session.createSession(context.userUniqueId, 2);
		session.pauseTime = new Date().getTime() - 1100;
		StorageUtil.saveSession(session);
		sessionTracker.setUp();
		expect(sessionTracker.session.startTime).toBe(session.startTime);
		expect(sessionTracker.session.sessionId).toBe(session.sessionId);
		expect(sessionTracker.session.sessionIndex).toBe(session.sessionIndex);
		expect(sessionTracker.session.pauseTime > 1000).toBeTruthy();
		expect(sessionTracker.session.isNewSession()).toBeFalsy();
	});

	test('test send event in batch mode when hide page', async () => {
		const sendEventBackgroundMock = jest.spyOn(
			eventRecorder,
			'sendEventsInBackground'
		);
		const flushEventMock = jest.spyOn(eventRecorder, 'flushEvents');
		const clearAllEventsMock = jest.spyOn(StorageUtil, 'clearAllEvents');
		sessionTracker.setUp();
		provider.record({ name: 'testEvent' });
		await sleep(100);
		hidePage();
		expect(sendEventBackgroundMock).toBeCalledWith(false);
		expect(flushEventMock).toBeCalled();
		expect(clearAllEventsMock).not.toBeCalled();
		flushEventMock.mockClear();
	});

	test('test send event in batch mode when close window', async () => {
		provider.configuration.isTrackAppEndEvents = true;
		const sendEventBackgroundMock = jest.spyOn(
			eventRecorder,
			'sendEventsInBackground'
		);
		const clearAllEventsMock = jest.spyOn(StorageUtil, 'clearAllEvents');
		const recordUserEngagementMock = jest.spyOn(
			sessionTracker,
			'recordUserEngagement'
		);
		sessionTracker.setUp();
		provider.record({ name: 'testEvent' });
		await sleep(100);
		closePage();
		hidePage();
		expect(sendEventBackgroundMock).toBeCalledWith(true);
		expect(clearAllEventsMock).toBeCalled();
		expect(recordUserEngagementMock).toBeCalledWith(true);
		expect(recordMethodMock).toBeCalledWith({
			name: Event.PresetEvent.APP_END,
			isImmediate: true,
		});
	});

	test('test send event in batch mode when hide window in firefox', async () => {
		const sendEventBackgroundMock = jest.spyOn(
			eventRecorder,
			'sendEventsInBackground'
		);
		const flushEventMock = jest.spyOn(eventRecorder, 'flushEvents');
		const clearAllEventsMock = jest.spyOn(StorageUtil, 'clearAllEvents');
		const recordUserEngagementMock = jest.spyOn(
			sessionTracker,
			'recordUserEngagement'
		);
		Object.defineProperty(navigator, 'userAgent', {
			writable: true,
			value: 'firefox',
		});
		sessionTracker.setUp();
		provider.record({ name: 'testEvent' });
		await sleep(100);
		hidePage();
		expect(sendEventBackgroundMock).toBeCalledWith(false);
		expect(flushEventMock).toBeCalled();
		expect(recordUserEngagementMock).toBeCalledWith(true);
		expect(clearAllEventsMock).not.toBeCalled();
	});

	test('test send event in batch mode when close window in firefox', async () => {
		provider.configuration.isTrackAppEndEvents = true;
		const sendEventBackgroundMock = jest.spyOn(
			eventRecorder,
			'sendEventsInBackground'
		);
		const recordUserEngagementMock = jest.spyOn(
			sessionTracker,
			'recordUserEngagement'
		);
		Object.defineProperty(navigator, 'userAgent', {
			writable: true,
			value: 'firefox',
		});
		sessionTracker.setUp();
		provider.record({ name: 'testEvent' });
		await sleep(100);
		closePage();
		hidePage();
		expect(sendEventBackgroundMock).not.toBeCalled();
		expect(recordUserEngagementMock).toBeCalledWith(false);
		expect(recordMethodMock).not.toBeCalledWith({
			name: Event.PresetEvent.APP_END,
			isImmediate: true,
		});
	});

	test('test send failed event in immediate mode when hide page', async () => {
		(provider.configuration as any).sendMode = SendMode.Immediate;
		const event = AnalyticsEventBuilder.createEvent(
			context,
			{ name: 'testEvent' },
			{},
			undefined
		);
		StorageUtil.saveFailedEvent(event);
		const sendFailedEventsMock = jest.spyOn(eventRecorder, 'sendFailedEvents');
		const clearFailedEventsMock = jest.spyOn(StorageUtil, 'clearFailedEvents');
		sessionTracker.setUp();
		await sleep(100);
		Object.defineProperty(eventRecorder, 'haveFailedEvents', {
			writable: true,
			value: true,
		});
		hidePage();
		expect(sendFailedEventsMock).toBeCalledTimes(1);
		expect(clearFailedEventsMock).not.toBeCalled();
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
			if (!(global as any).document) {
				const { document } = new JSDOM(
					'<!doctype html><html><body></body></html>'
				).window;
				(global as any).document = document;
			}
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
