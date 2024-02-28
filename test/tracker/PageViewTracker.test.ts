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
	ClickstreamContext,
	ClickstreamProvider,
	Event,
	EventRecorder,
} from '../../src/provider';
import { PageViewTracker, Session, SessionTracker } from '../../src/tracker';
import { MethodEmbed } from '../../src/util/MethodEmbed';
import { StorageUtil } from '../../src/util/StorageUtil';
import { setPerformanceEntries } from '../browser/BrowserUtil';
import { MockObserver } from '../browser/MockObserver';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

describe('PageViewTracker test', () => {
	let provider: ClickstreamProvider;
	let pageViewTracker: PageViewTracker;
	let sessionTracker: SessionTracker;
	let context: ClickstreamContext;
	let eventRecorder: EventRecorder;
	let recordMethodMock: any;
	let recordEventMethodMock: any;
	let originalLocation: Location;
	let dom: any;

	beforeEach(() => {
		StorageUtil.clearAll();
		provider = new ClickstreamProvider();

		Object.assign(provider.configuration, {
			appId: 'testAppId',
			endpoint: 'https://example.com/collect',
			sendMode: SendMode.Batch,
			searchKeyWords: ['country'],
		});
		context = new ClickstreamContext(new BrowserInfo(), provider.configuration);

		eventRecorder = new EventRecorder(context);
		pageViewTracker = new PageViewTracker(provider, context);
		sessionTracker = new SessionTracker(provider, context);
		sessionTracker.session = Session.getCurrentSession(context);
		provider.context = context;
		provider.pageViewTracker = pageViewTracker;
		provider.eventRecorder = eventRecorder;
		provider.sessionTracker = sessionTracker;
		recordMethodMock = jest.spyOn(provider, 'record');
		recordEventMethodMock = jest.spyOn(provider, 'recordEvent');
		const mockSendRequest = jest.fn().mockResolvedValue(true);
		jest.spyOn(NetRequest, 'sendRequest').mockImplementation(mockSendRequest);
		originalLocation = window.location;
		setDomUrl('https://example.com/index');
		Object.defineProperty(window.document, 'title', {
			writable: true,
			value: 'index',
		});
		(global as any).PerformanceObserver = MockObserver;
		setPerformanceEntries();
	});

	afterEach(() => {
		jest.restoreAllMocks();
		jest.clearAllMocks();
		provider = undefined;
		Object.defineProperty(window, 'location', {
			value: originalLocation,
			writable: true,
		});
	});

	test('test multiPageApp page view', () => {
		const pageAppearMock = jest.spyOn(pageViewTracker, 'onPageChange');
		pageViewTracker.setUp();
		expect(pageAppearMock).toBeCalled();
	});

	test('test multiPageApp do not record page view when browser reload', () => {
		const pageAppearMock = jest.spyOn(pageViewTracker, 'onPageChange');
		pageViewTracker.setUp();
		expect(pageAppearMock).toBeCalled();
		(global as any).PerformanceObserver = MockObserver;
		setPerformanceEntries(true, true);
		pageViewTracker.setUp();
		expect(pageAppearMock).toBeCalledTimes(1);
	});

	test('test isFirstTime to be false when browser reload in SPA mode', () => {
		(global as any).PerformanceObserver = MockObserver;
		StorageUtil.savePreviousPageUrl('https://example.com/pageA');
		setPerformanceEntries(true, true);
		pageViewTracker.setUp();
		expect(pageViewTracker.isFirstTime).toBeFalsy();
	});

	test('test isFirstTime to be false when browser reload in multiPageApp mode', () => {
		(context.configuration as any).pageType = PageType.multiPageApp;
		StorageUtil.savePreviousPageUrl('https://example.com/pageA');
		(global as any).PerformanceObserver = MockObserver;
		setPerformanceEntries(true, true);
		pageViewTracker.setUp();
		expect(pageViewTracker.isFirstTime).toBeFalsy();
	});

	test('test environment is not supported', () => {
		const addEventListener = (global as any).window.addEventListener;
		(global as any).window.addEventListener = undefined;
		jest.spyOn(BrowserInfo, 'isBrowser').mockImplementationOnce(() => {
			return false;
		});
		pageViewTracker.setUp();
		(context.configuration as any).pageType = PageType.SPA;
		pageViewTracker.setUp();
		expect(recordEventMethodMock).not.toBeCalled();
		(global as any).window.addEventListener = addEventListener;
	});

	test('test page view in SPA mode', async () => {
		const pageAppearMock = jest.spyOn(pageViewTracker, 'onPageChange');
		(context.configuration as any).pageType = PageType.SPA;
		pageViewTracker.setUp();
		expect(recordEventMethodMock).toBeCalledWith(
			expect.objectContaining({
				event_type: Event.PresetEvent.PAGE_VIEW,
			})
		);
		expect(pageAppearMock).toBeCalledTimes(1);
	});

	test('reload browser will not record page view in SPA mode', async () => {
		(context.configuration as any).pageType = PageType.SPA;
		const pageAppearMock = jest.spyOn(pageViewTracker, 'onPageChange');
		pageViewTracker.setUp();
		expect(recordEventMethodMock).toBeCalledWith(
			expect.objectContaining({
				event_type: Event.PresetEvent.PAGE_VIEW,
			})
		);
		expect(pageAppearMock).toBeCalledTimes(1);
		(global as any).PerformanceObserver = MockObserver;
		setPerformanceEntries(true, true);
		pageViewTracker.setUp();
		expect(pageAppearMock).toBeCalledTimes(1);
	});

	test('test two different page view with userEngagement', async () => {
		pageViewTracker.setUp();
		jest.spyOn(pageViewTracker, 'getLastEngageTime').mockReturnValue(1100);
		openPageA();
		await sleep(100);
		const allEvents = JSON.parse(StorageUtil.getAllEvents() + ']');
		expect(allEvents.length).toBe(3);
		expect(allEvents[0].event_type).toBe(Event.PresetEvent.PAGE_VIEW);
		expect(allEvents[1].event_type).toBe(Event.PresetEvent.USER_ENGAGEMENT);
		const engageTime =
			allEvents[1].attributes[Event.ReservedAttribute.ENGAGEMENT_TIMESTAMP];
		expect(allEvents[2].event_type).toBe(Event.PresetEvent.PAGE_VIEW);
		const pageViewLastEngageTime =
			allEvents[2].attributes[Event.ReservedAttribute.ENGAGEMENT_TIMESTAMP];
		expect(engageTime).toBe(pageViewLastEngageTime);
	});

	test('test spa page view', () => {
		const trackPageViewForSPAMock = jest.spyOn(
			pageViewTracker,
			'trackPageViewForSPA'
		);
		const userEngagementMock = jest.spyOn(
			pageViewTracker,
			'recordUserEngagement'
		);
		(context.configuration as any).pageType = PageType.SPA;
		pageViewTracker.setUp();
		expect(trackPageViewForSPAMock).toBeCalled();
		expect(userEngagementMock).not.toBeCalled();
	});

	test('test two page view in SPA mode', async () => {
		(context.configuration as any).pageType = PageType.SPA;
		pageViewTracker.setUp();
		await sleep(10);
		openPageA();
		await sleep(100);
		const allEvents = JSON.parse(StorageUtil.getAllEvents() + ']');
		expect(allEvents.length).toBe(2);
		expect(allEvents[0].event_type).toBe(Event.PresetEvent.PAGE_VIEW);
		expect(allEvents[1].event_type).toBe(Event.PresetEvent.PAGE_VIEW);
		const attributes = allEvents[1].attributes;
		expect(attributes[Event.ReservedAttribute.PAGE_URL]).toBe(
			'https://example.com/pageA'
		);
		expect(attributes[Event.ReservedAttribute.PAGE_TITLE]).toBe('pageA');
		expect(attributes[Event.ReservedAttribute.PAGE_REFERRER]).toBe(
			'https://example.com/index'
		);
		expect(attributes[Event.ReservedAttribute.PAGE_REFERRER_TITLE]).toBe(
			'index'
		);
		expect(
			attributes[Event.ReservedAttribute.ENGAGEMENT_TIMESTAMP]
		).toBeGreaterThan(0);
		expect(attributes[Event.ReservedAttribute.ENTRANCES]).toBe(0);
		const firstPageViewTimestamp = allEvents[0].timestamp;
		const previousTimestamp =
			allEvents[1].attributes[Event.ReservedAttribute.PREVIOUS_TIMESTAMP];
		expect(firstPageViewTimestamp).toBe(previousTimestamp);
	});

	test('test two same page view', async () => {
		pageViewTracker.setUp();
		openPageA();
		openPageA();
		await sleep(100);
		const allEvents = JSON.parse(StorageUtil.getAllEvents() + ']');
		expect(allEvents.length).toBe(2);
		const pageUrl0 = allEvents[0].attributes[Event.ReservedAttribute.PAGE_URL];
		const pageUrl1 = allEvents[1].attributes[Event.ReservedAttribute.PAGE_URL];
		expect(pageUrl0).toBe('https://example.com/index');
		expect(pageUrl1).toBe('https://example.com/pageA');
	});

	test('test two different page view with userEngagement disable', async () => {
		pageViewTracker.setUp();
		jest.spyOn(pageViewTracker, 'getLastEngageTime').mockReturnValue(1100);
		provider.configuration.isTrackUserEngagementEvents = false;
		openPageA();
		await sleep(100);
		const allEvents = JSON.parse(StorageUtil.getAllEvents() + ']');
		expect(allEvents.length).toBe(2);
		expect(allEvents[0].event_type).not.toBe(Event.PresetEvent.USER_ENGAGEMENT);
		expect(allEvents[1].event_type).not.toBe(Event.PresetEvent.USER_ENGAGEMENT);
	});

	test('test page view in SPA mode for history state change', async () => {
		(context.configuration as any).pageType = PageType.SPA;
		pageViewTracker.setUp();
		await sleep(10);
		openPageB();
		await sleep(100);
		const allEvents = JSON.parse(StorageUtil.getAllEvents() + ']');
		expect(allEvents.length).toBe(2);
	});

	test('test close record search event', async () => {
		provider.configuration.isTrackSearchEvents = false;
		pageViewTracker.trackSearchEvents();
		expect(recordMethodMock).not.toBeCalled();
	});

	test('test open search result page', async () => {
		(context.configuration as any).pageType = PageType.SPA;
		pageViewTracker.setUp();
		openSearchResultPage();
		await sleep(100);
		const allEvents = JSON.parse(StorageUtil.getAllEvents() + ']');
		expect(allEvents.length).toBe(3);
		expect(allEvents[0].event_type).toBe(Event.PresetEvent.PAGE_VIEW);
		expect(allEvents[1].event_type).toBe(Event.PresetEvent.PAGE_VIEW);
		expect(allEvents[2].event_type).toBe(Event.PresetEvent.SEARCH);
		expect(allEvents[2].attributes['_search_key']).toBe('keyword');
		expect(allEvents[2].attributes['_search_term']).toBe('shose');
	});

	test('test open custom search result page', async () => {
		(context.configuration as any).pageType = PageType.SPA;
		pageViewTracker.setUp();
		openCustomSearchResultPage();
		await sleep(100);
		const allEvents = JSON.parse(StorageUtil.getAllEvents() + ']');
		expect(allEvents.length).toBe(3);
		expect(allEvents[2].event_type).toBe(Event.PresetEvent.SEARCH);
		expect(allEvents[2].attributes['_search_key']).toBe('country');
		expect(allEvents[2].attributes['_search_term']).toBe('zh');
	});

	test('test method embed should override method correctly', () => {
		const context = {
			methodName: (value: number) => value + 1,
		};
		const methodName = 'methodName';
		const methodEmbed = new MethodEmbed(context, methodName);
		const methodOverrideMock = jest.fn(
			(originalMethod: any) =>
				(...args: any) =>
					originalMethod(...args)(2)
		);
		methodEmbed.set(methodOverrideMock);
		context[methodName](3);

		expect(methodOverrideMock).toHaveBeenCalledWith(4);
	});

	test('test record user engagement event', () => {
		pageViewTracker.lastScreenStartTimestamp = new Date().getTime();
		jest.spyOn(pageViewTracker, 'getLastEngageTime').mockReturnValue(1100);
		pageViewTracker.recordUserEngagement();
		expect(recordMethodMock).toBeCalled();
	});

	function openPageA() {
		Object.defineProperty(window.document, 'title', {
			writable: true,
			value: 'pageA',
		});
		setDomUrl('https://example.com/pageA');
		window.dispatchEvent(new window.Event('popstate'));
	}

	function openPageB() {
		Object.defineProperty(window.document, 'title', {
			writable: true,
			value: 'pageB',
		});
		setDomUrl('https://example.com/pageB');
		const popStateEvent = new PopStateEvent('popstate', {
			state: null,
		});
		Object.defineProperty(popStateEvent, 'target', {
			value: window,
		});
		window.dispatchEvent(popStateEvent);
	}

	function openSearchResultPage() {
		Object.defineProperty(window.document, 'title', {
			writable: true,
			value: 'searchResult',
		});
		setDomUrl('https://example.com/searchResult?keyword=shose&isNew=true');
		const popStateEvent = new PopStateEvent('popstate', {
			state: null,
		});
		Object.defineProperty(popStateEvent, 'target', {
			value: window,
		});
		window.dispatchEvent(popStateEvent);
	}

	function openCustomSearchResultPage() {
		Object.defineProperty(window.document, 'title', {
			writable: true,
			value: 'customSearchResult',
		});
		setDomUrl('https://example.com/customSearchResult?country=zh');
		const popStateEvent = new PopStateEvent('popstate', {
			state: null,
		});
		Object.defineProperty(popStateEvent, 'target', {
			value: window,
		});
		window.dispatchEvent(popStateEvent);
	}

	function setDomUrl(url: string) {
		dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
			url: url,
		});
		Object.defineProperty(window, 'location', {
			value: dom.window.location,
			writable: true,
		});
	}

	function sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
});
