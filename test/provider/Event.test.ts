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
import { Event } from '../../src/provider';

describe('Event test', () => {
	test('test checkEventName with no error', () => {
		const error = Event.checkEventName('testEvent');
		expect(error.error_code).toEqual(Event.ErrorCode.NO_ERROR);
	});
	test('test checkEventName with invalid name', () => {
		const error = Event.checkEventName('1abc');
		expect(error.error_code).toEqual(Event.ErrorCode.EVENT_NAME_INVALID);
	});

	test('test checkEventName with name length exceed', () => {
		let longName = '';
		for (let i = 0; i < 10; i++) {
			longName += 'abcdeabcdef';
		}
		const error = Event.checkEventName(longName);
		expect(error.error_code).toEqual(Event.ErrorCode.EVENT_NAME_LENGTH_EXCEED);
	});

	test('test isValidName method', () => {
		expect(Event.isValidName('testName')).toBeTruthy();
		expect(Event.isValidName('_app_start')).toBeTruthy();
		expect(Event.isValidName('AAA')).toBeTruthy();
		expect(Event.isValidName('a_ab')).toBeTruthy();
		expect(Event.isValidName('a_ab_1A')).toBeTruthy();
		expect(Event.isValidName('add_to_cart')).toBeTruthy();
		expect(Event.isValidName('Screen_view')).toBeTruthy();
		expect(Event.isValidName('')).toBeFalsy();
		expect(Event.isValidName('*&')).toBeFalsy();
		expect(Event.isValidName('0abc')).toBeFalsy();
		expect(Event.isValidName('123')).toBeFalsy();
	});
});
