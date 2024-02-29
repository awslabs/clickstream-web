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
import { PageLoadTracker } from '../../src/tracker/PageLoadTracker';
import { setPerformanceEntries } from '../browser/BrowserUtil';
import { MockObserver } from '../browser/MockObserver';
import { StorageUtil } from "../../src/util/StorageUtil";

describe('PageLoadTracker test', () => {
	let provider: ClickstreamProvider;
	let pageLoadTracker: PageLoadTracker;
	let context: ClickstreamContext;
	let recordMethodMock: any;

	beforeEach(() => {
		StorageUtil.clearAll()
		provider = new ClickstreamProvider();
		Object.assign(provider.configuration, {
			appId: 'testAppId',
			endpoint: 'https://example.com/collect',
			sendMode: SendMode.Batch,
			isTrackPageLoadEvents: true,
		});
		context = new ClickstreamContext(new BrowserInfo(), provider.configuration);
		const sessionTracker = new SessionTracker(provider, context);
		sessionTracker.session = Session.getCurrentSession(context);
		recordMethodMock = jest.spyOn(provider, 'record');
		provider.context = context;
		provider.eventRecorder = new EventRecorder(context);
		provider.sessionTracker = sessionTracker;
		pageLoadTracker = new PageLoadTracker(provider, context);
		provider.sessionTracker = sessionTracker;
		(global as any).PerformanceObserver = MockObserver;
	});

	afterEach(() => {
		recordMethodMock.mockClear();
		jest.restoreAllMocks();
		provider = undefined;
	});

	test('test setup not in the browser env', () => {
		jest.spyOn(BrowserInfo, 'isBrowser').mockReturnValue(false);
		pageLoadTracker.setUp();
	});

	test('test in supported env ', () => {
		expect(pageLoadTracker.isSupportedEnv()).toBeTruthy();
	});

	test('test not in supported env ', () => {
		const performance = window.performance;
		setPerformanceUndefined();
		expect(pageLoadTracker.isSupportedEnv()).toBeFalsy();
		Object.defineProperty(window, 'performance', {
			writable: true,
			value: performance,
		});
	});

	test('test page not loaded when performanceEntries is undefined', () => {
		Object.defineProperty(window, 'performance', {
			writable: true,
			value: {
				getEntriesByType: jest.fn().mockImplementation(undefined),
			},
		});
		expect(pageLoadTracker.isPageLoaded()).toBeFalsy();
	});

	test('test page not loaded when performanceEntries is empty', () => {
		Object.defineProperty(window, 'performance', {
			writable: true,
			value: {
				getEntriesByType: jest.fn().mockImplementation(() => {
					return <PerformanceEntry[]>(<unknown>[]);
				}),
			},
		});
		expect(pageLoadTracker.isPageLoaded()).toBeFalsy();
	});

	test('test page loaded when initialize the SDK', () => {
		setPerformanceEntries(true);
		pageLoadTracker.setUp();
		expect(recordMethodMock).toBeCalled();
	});

	test('test record page load event by PerformanceObserver', () => {
		setPerformanceEntries(false);
		pageLoadTracker.setUp();
		setPerformanceEntries(true);
		(pageLoadTracker.observer as any).call();
		expect(recordMethodMock).toBeCalled();
	});

	test('test not record page load event when configuration is disable', () => {
		setPerformanceEntries(false);
		pageLoadTracker.setUp();
		provider.configuration.isTrackPageLoadEvents = false;
		setPerformanceEntries(true);
		(pageLoadTracker.observer as any).call();
		expect(recordMethodMock).not.toBeCalled();
	});

	function setPerformanceUndefined() {
		Object.defineProperty(window, 'performance', {
			writable: true,
			value: undefined,
		});
	}
});
