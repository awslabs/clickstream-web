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

export class BrowserInfo {
	locale: string;
	system_language: string;
	country_code: string;
	make: string;
	userAgent: string;
	zoneOffset: number;
	hostName: string;

	constructor() {
		if (!BrowserInfo.isBrowser()) return;
		const { product, vendor, userAgent, language } = window.navigator;
		this.locale = language;
		this.initLocalInfo(language);
		this.make = product || vendor;
		this.userAgent = userAgent;
		this.zoneOffset = -new Date().getTimezoneOffset() * 60000;
		this.hostName = window.location.hostname;
	}

	initLocalInfo(locale: string) {
		if (locale.indexOf('-') > 0) {
			this.system_language = locale.split('-')[0];
			this.country_code = locale.split('-')[1].toUpperCase();
		} else {
			this.system_language = locale;
			this.country_code = '';
		}
	}

	static isBrowser(): boolean {
		return (
			typeof window !== 'undefined' && typeof window.document !== 'undefined'
		);
	}

	static getCurrentPageUrl(): string {
		if (!BrowserInfo.isBrowser()) return '';
		else return window.location.href;
	}

	static getCurrentPageTitle(): string {
		if (!BrowserInfo.isBrowser()) return '';
		return window.document.title ?? '';
	}
}
