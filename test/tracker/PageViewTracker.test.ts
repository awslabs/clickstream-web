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
import { StorageUtil } from '../../src/util/StorageUtil';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

describe('PageViewTracker test', () => {
	let provider: ClickstreamProvider;
	let pageViewTracker: PageViewTracker;
	let sessionTracker: SessionTracker;
	let context: ClickstreamContext;
	let eventRecorder: EventRecorder;

	const mockSendRequest = jest.fn().mockResolvedValue(true);
	let recordMethodMock: any;
	let originalLocation: Location;
	let dom: any;

	beforeEach(() => {
		localStorage.clear();
		sessionStorage.clear();
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
		jest.spyOn(NetRequest, 'sendRequest').mockImplementation(mockSendRequest);
		originalLocation = window.location;
		setDomUrl('https://example.com/index');
		Object.defineProperty(window.document, 'title', {
			writable: true,
			value: 'index',
		});
	});

	afterEach(() => {
		recordMethodMock.mockClear();
		jest.restoreAllMocks();
		provider = undefined;
		Object.defineProperty(window, 'location', {
			value: originalLocation,
			writable: true,
		});
	});

	test('test multiPageApp page view', () => {
		const pageAppearMock = jest.spyOn(pageViewTracker, 'trackPageView');
		pageViewTracker.setUp();
		expect(pageAppearMock).toBeCalled();
	});

	test('test spa page view', () => {
		const trackPageViewForSPAMock = jest.spyOn(
			pageViewTracker,
			'trackPageViewForSPA'
		);
		(context.configuration as any).pageType = PageType.SPA;
		pageViewTracker.setUp();
		expect(trackPageViewForSPAMock).toBeCalled();
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
		expect(recordMethodMock).not.toBeCalled();
		(global as any).window.addEventListener = addEventListener;
	});

	test('test environment is not supported for sessionStorage', () => {
		const sessionStorage = window.sessionStorage;
		Object.defineProperty(window, 'sessionStorage', {
			writable: true,
			value: undefined,
		});
		pageViewTracker.setUp();
		expect(recordMethodMock).not.toBeCalled();
		Object.defineProperty(window, 'sessionStorage', {
			writable: true,
			value: sessionStorage,
		});
	});

	test('test page view in SPA mode', async () => {
		const pageAppearMock = jest.spyOn(pageViewTracker, 'trackPageView');
		(context.configuration as any).pageType = PageType.SPA;
		pageViewTracker.setUp();
		expect(recordMethodMock).toBeCalledWith({
			name: Event.PresetEvent.PAGE_VIEW,
			attributes: {
				[Event.ReservedAttribute.PAGE_REFERRER]: '',
				[Event.ReservedAttribute.PAGE_REFERRER_TITLE]: '',
				[Event.ReservedAttribute.ENTRANCES]: 1,
			},
		});
		expect(pageAppearMock).toBeCalledTimes(1);
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
		expect(allEvents[2].attributes._search_key).toBe('keyword');
		expect(allEvents[2].attributes._search_term).toBe('shose');
	});

	test('test open custom search result page', async () => {
		(context.configuration as any).pageType = PageType.SPA;
		pageViewTracker.setUp();
		openCustomSearchResultPage();
		await sleep(100);
		const allEvents = JSON.parse(StorageUtil.getAllEvents() + ']');
		expect(allEvents.length).toBe(3);
		expect(allEvents[2].event_type).toBe(Event.PresetEvent.SEARCH);
		expect(allEvents[2].attributes._search_key).toBe('country');
		expect(allEvents[2].attributes._search_term).toBe('zh');
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
