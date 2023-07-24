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
import { BrowserInfo } from '../../src/browser';
import {
	ClickstreamContext,
	ClickstreamProvider,
	EventRecorder,
} from '../../src/provider';
import { Session, SessionTracker } from '../../src/tracker';
import { ScrollTracker } from '../../src/tracker/ScrollTracker';

describe('ScrollTracker test', () => {
	let provider: ClickstreamProvider;
	let scrollTracker: ScrollTracker;
	let context: ClickstreamContext;
	let recordMethodMock: any;

	beforeEach(() => {
		localStorage.clear();
		sessionStorage.clear();
		provider = new ClickstreamProvider();

		Object.assign(provider.configuration, {
			appId: 'testAppId',
			endpoint: 'https://example.com/collect',
			sendMode: SendMode.Batch,
		});
		context = new ClickstreamContext(new BrowserInfo(), provider.configuration);
		const sessionTracker = new SessionTracker(provider, context);
		sessionTracker.session = Session.getCurrentSession(context);
		provider.context = context;
		provider.eventRecorder = new EventRecorder(context);
		provider.sessionTracker = sessionTracker;
		scrollTracker = new ScrollTracker(provider, context);
		provider.sessionTracker = sessionTracker;
		recordMethodMock = jest.spyOn(provider, 'record');
	});

	afterEach(() => {
		recordMethodMock.mockClear();
		jest.restoreAllMocks();
		provider = undefined;
	});

	test('test setup not in the browser env', () => {
		jest.spyOn(BrowserInfo, 'isBrowser').mockReturnValue(false);
		scrollTracker.setUp();
		expect(scrollTracker.currentPageUrl).toBeUndefined();
	});

	test('test setup', () => {
		scrollTracker.setUp();
		expect(scrollTracker.currentPageUrl).not.toBeUndefined();
		expect(scrollTracker.isFirstTime).toBeTruthy();
	});

	test('test scroll for not reach ninety percent', () => {
		const trackScrollMock = jest.spyOn(scrollTracker, 'trackScroll');
		scrollTracker.setUp();
		document.body.style.height = '2000px';
		(window as any).innerHeight = 1000;
		window.scrollTo(0, 100);
		window.document.dispatchEvent(new window.Event('scroll'));
		expect(recordMethodMock).not.toBeCalled();
		expect(trackScrollMock).toBeCalled();
	});

	test('test scroll for reached ninety percent', () => {
		const trackScrollMock = jest.spyOn(scrollTracker, 'trackScroll');
		scrollTracker.setUp();

		Object.defineProperty(window.document.body, 'scrollHeight', {
			writable: true,
			value: 1000,
		});
		Object.defineProperty(window, 'scrollY', {
			writable: true,
			value: 950,
		});
		window.document.dispatchEvent(new window.Event('scroll'));
		expect(recordMethodMock).toBeCalled();
		expect(trackScrollMock).toBeCalled();
		expect(scrollTracker.isFirstTime).toBeFalsy();
	});

	test('test scroll for reached ninety percent twice', () => {
		const trackScrollMock = jest.spyOn(scrollTracker, 'trackScroll');
		scrollTracker.setUp();

		Object.defineProperty(window.document.body, 'scrollHeight', {
			writable: true,
			value: 1000,
		});
		Object.defineProperty(window, 'scrollY', {
			writable: true,
			value: 950,
		});
		window.document.dispatchEvent(new window.Event('scroll'));
		window.document.dispatchEvent(new window.Event('scroll'));
		expect(recordMethodMock).toBeCalledTimes(1);
		expect(trackScrollMock).toBeCalledTimes(2);
		expect(scrollTracker.isFirstTime).toBeFalsy();
	});
});
