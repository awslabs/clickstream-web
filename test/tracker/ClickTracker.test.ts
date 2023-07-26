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
	Event,
	EventRecorder,
} from '../../src/provider';
import { Session, SessionTracker } from '../../src/tracker';
import { ClickTracker } from '../../src/tracker/ClickTracker';

describe('ClickTracker test', () => {
	let provider: ClickstreamProvider;
	let clickTracker: ClickTracker;
	let context: ClickstreamContext;
	let recordMethodMock: any;

	beforeEach(() => {
		sessionStorage.clear();
		localStorage.clear();
		provider = new ClickstreamProvider();
		Object.assign(provider.configuration, {
			appId: 'testAppId',
			endpoint: 'https://example.com/click',
			sendMode: SendMode.Batch,
		});
		context = new ClickstreamContext(new BrowserInfo(), provider.configuration);
		const sessionTracker = new SessionTracker(provider, context);
		sessionTracker.session = Session.getCurrentSession(context);
		provider.sessionTracker = sessionTracker;
		provider.context = context;
		provider.eventRecorder = new EventRecorder(context);
		clickTracker = new ClickTracker(provider, context);
		recordMethodMock = jest.spyOn(provider, 'record');
	});

	afterEach(() => {
		recordMethodMock.mockClear();
		jest.restoreAllMocks();
		provider = undefined;
	});

	test('test setup not in the browser env', () => {
		const addEventListenerMock = jest.spyOn(document, 'addEventListener');
		jest.spyOn(BrowserInfo, 'isBrowser').mockReturnValue(false);
		clickTracker.setUp();
		expect(addEventListenerMock).not.toBeCalled();
	});

	test('test not for click a element', () => {
		const trackClickMock = jest.spyOn(clickTracker, 'trackClick');
		clickTracker.setUp();
		window.document.dispatchEvent(new window.Event('click'));
		expect(recordMethodMock).not.toBeCalled();
		expect(trackClickMock).toBeCalled();
	});

	test('test click a element will full attribute', () => {
		const clickEvent = getMockMouseEvent(
			'A',
			'https://example.com',
			'link-class',
			'link-id'
		);
		clickTracker.trackClick(clickEvent);
		expect(recordMethodMock).toBeCalledWith({
			name: Event.PresetEvent.CLICK,
			attributes: {
				[Event.ReservedAttribute.LINK_URL]: 'https://example.com',
				[Event.ReservedAttribute.LINK_DOMAIN]: 'example.com',
				[Event.ReservedAttribute.LINK_CLASSES]: 'link-class',
				[Event.ReservedAttribute.LINK_ID]: 'link-id',
				[Event.ReservedAttribute.OUTBOUND]: true,
			},
		});
	});

	test('test click a element without link', () => {
		const clickEvent = getMockMouseEvent(
			'A',
			'',
			'link-class',
			'link-id'
		);
		clickTracker.trackClick(clickEvent);
		expect(recordMethodMock).not.toBeCalled()
	});

	test('test click a element without host', () => {
		const clickEvent = getMockMouseEvent(
			'A',
			'/products',
			'link-class',
			'link-id'
		);
		clickTracker.trackClick(clickEvent);
		expect(recordMethodMock).toBeCalledWith({
			name: Event.PresetEvent.CLICK,
			attributes: {
				[Event.ReservedAttribute.LINK_URL]: '/products',
				[Event.ReservedAttribute.LINK_DOMAIN]: '',
				[Event.ReservedAttribute.LINK_CLASSES]: 'link-class',
				[Event.ReservedAttribute.LINK_ID]: 'link-id',
				[Event.ReservedAttribute.OUTBOUND]: true,
			},
		});
	});

	function getMockMouseEvent(
		tagName: string,
		href: string,
		className: string,
		id: string
	) {
		const event = document.createEvent('MouseEvents');
		const targetElement = document.createElement(tagName);
		targetElement.setAttribute('href', href);
		targetElement.setAttribute('class', className);
		targetElement.setAttribute('id', id);
		Object.defineProperty(event, 'target', {
			writable: true,
			value: targetElement,
		});
		return event;
	}
});
