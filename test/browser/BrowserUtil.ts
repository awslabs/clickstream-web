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
import { MockObserver } from './MockObserver';

export function setUpBrowserPerformance() {
	(global as any).PerformanceObserver = MockObserver;
	setPerformanceEntries(false);
}

export function setPerformanceEntries(isLoaded = true, isReload = false) {
	Object.defineProperty(window, 'performance', {
		writable: true,
		value: {
			getEntriesByType: jest
				.fn()
				.mockImplementation(
					isLoaded
						? isReload
							? getEntriesByTypeForReload
							: getEntriesByType
						: getEntriesByTypeUnload
				),
		},
	});
}

function getEntriesByType(): PerformanceEntryList {
	return <PerformanceEntry[]>(<unknown>[
		{
			name: 'https://aws.amazon.com/cn/',
			entryType: 'navigation',
			startTime: 0,
			duration: 3444.4000000059605,
			initiatorType: 'navigation',
			deliveryType: 'indirect',
			nextHopProtocol: 'h2',
			renderBlockingStatus: 'non-blocking',
			workerStart: 0,
			redirectStart: 2,
			redirectEnd: 2.2,
			fetchStart: 2.2000000178813934,
			domainLookupStart: 2.2000000178813934,
			domainLookupEnd: 2.2000000178813934,
			connectStart: 2.2000000178813934,
			secureConnectionStart: 2.2000000178813934,
			connectEnd: 2.2000000178813934,
			requestStart: 745.9000000059605,
			responseStart: 1006.7000000178814,
			firstInterimResponseStart: 0,
			responseEnd: 1321.300000011921,
			transferSize: 167553,
			encodedBodySize: 167253,
			decodedBodySize: 1922019,
			responseStatus: 200,
			serverTiming: [
				{
					name: 'cache',
					duration: 0,
					description: 'hit-front',
				},
				{
					name: 'host',
					duration: 0,
					description: 'cp3062',
				},
			],
			unloadEventStart: 1011.9000000059605,
			unloadEventEnd: 1011.9000000059605,
			domInteractive: 1710.9000000059605,
			domContentLoadedEventStart: 1712.7000000178814,
			domContentLoadedEventEnd: 1714.7000000178814,
			domComplete: 3440.4000000059605,
			loadEventStart: 3444.2000000178814,
			loadEventEnd: 3444.4000000059605,
			type: 'navigate',
			redirectCount: 0,
			activationStart: 0,
			criticalCHRestart: 0,
		},
	]);
}

function getEntriesByTypeForReload(): PerformanceEntryList {
	return <PerformanceEntry[]>(<unknown>[
		{
			type: 'reload',
		},
	]);
}

function getEntriesByTypeUnload(): PerformanceEntryList {
	return <PerformanceEntry[]>(<unknown>[
		{
			name: 'https://aws.amazon.com/cn/',
			entryType: 'navigation',
			startTime: 0,
			duration: 0,
		},
	]);
}
