"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = recordsChanged;

/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 * @format
 */

/**
 * Check to see if the records have changed. This is optimized to take advantage of the knowledge
 * knowledge that record lists are only ever appended.
 */
function recordsChanged(a, b) {
  return a.length !== b.length || last(a) !== last(b);
}

const last = arr => arr[arr.length - 1];

module.exports = exports.default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJlY29yZHNDaGFuZ2VkLmpzIl0sIm5hbWVzIjpbInJlY29yZHNDaGFuZ2VkIiwiYSIsImIiLCJsZW5ndGgiLCJsYXN0IiwiYXJyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7Ozs7Ozs7Ozs7OztBQWNBOzs7O0FBS2UsU0FBU0EsY0FBVCxDQUNiQyxDQURhLEVBRWJDLENBRmEsRUFHSjtBQUNULFNBQU9ELENBQUMsQ0FBQ0UsTUFBRixLQUFhRCxDQUFDLENBQUNDLE1BQWYsSUFBeUJDLElBQUksQ0FBQ0gsQ0FBRCxDQUFKLEtBQVlHLElBQUksQ0FBQ0YsQ0FBRCxDQUFoRDtBQUNEOztBQUVELE1BQU1FLElBQUksR0FBR0MsR0FBRyxJQUFJQSxHQUFHLENBQUNBLEdBQUcsQ0FBQ0YsTUFBSixHQUFhLENBQWQsQ0FBdkIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxNy1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxuICogb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXG4gKlxuICogQGZsb3cgc3RyaWN0LWxvY2FsXG4gKiBAZm9ybWF0XG4gKi9cblxuaW1wb3J0IHR5cGUge1JlY29yZH0gZnJvbSAnLi90eXBlcyc7XG5cbi8qKlxuICogQ2hlY2sgdG8gc2VlIGlmIHRoZSByZWNvcmRzIGhhdmUgY2hhbmdlZC4gVGhpcyBpcyBvcHRpbWl6ZWQgdG8gdGFrZSBhZHZhbnRhZ2Ugb2YgdGhlIGtub3dsZWRnZVxuICoga25vd2xlZGdlIHRoYXQgcmVjb3JkIGxpc3RzIGFyZSBvbmx5IGV2ZXIgYXBwZW5kZWQuXG4gKi9cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gcmVjb3Jkc0NoYW5nZWQoXG4gIGE6IEFycmF5PFJlY29yZD4sXG4gIGI6IEFycmF5PFJlY29yZD4sXG4pOiBib29sZWFuIHtcbiAgcmV0dXJuIGEubGVuZ3RoICE9PSBiLmxlbmd0aCB8fCBsYXN0KGEpICE9PSBsYXN0KGIpO1xufVxuXG5jb25zdCBsYXN0ID0gYXJyID0+IGFyclthcnIubGVuZ3RoIC0gMV07XG4iXX0=