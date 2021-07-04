"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

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
function _default(send, eventsFromService) {
  return {
    // TODO: Update these to be `(object: any, ...objects: Array<any>): void` to allow for logging objects.
    log(...args) {
      send(createMessageEvent('log', args));
    },

    error(...args) {
      send(createMessageEvent('error', args));
    },

    warn(...args) {
      send(createMessageEvent('warning', args));
    },

    info(...args) {
      send(createMessageEvent('info', args));
    },

    success(...args) {
      send(createMessageEvent('success', args));
    }

  };
}

function createMessageEvent(level, args) {
  return {
    type: 'message',
    data: {
      level,
      args
    }
  };
}

module.exports = exports.default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkNvbnNvbGVTZXJ2aWNlQ2xpZW50LmpzIl0sIm5hbWVzIjpbInNlbmQiLCJldmVudHNGcm9tU2VydmljZSIsImxvZyIsImFyZ3MiLCJjcmVhdGVNZXNzYWdlRXZlbnQiLCJlcnJvciIsIndhcm4iLCJpbmZvIiwic3VjY2VzcyIsImxldmVsIiwidHlwZSIsImRhdGEiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7Ozs7Ozs7Ozs7QUFrQmUsa0JBQVNBLElBQVQsRUFBcUJDLGlCQUFyQixFQUFnRDtBQUM3RCxTQUFPO0FBQ0w7QUFDQUMsSUFBQUEsR0FBRyxDQUFDLEdBQUdDLElBQUosRUFBNEI7QUFDN0JILE1BQUFBLElBQUksQ0FBQ0ksa0JBQWtCLENBQUMsS0FBRCxFQUFRRCxJQUFSLENBQW5CLENBQUo7QUFDRCxLQUpJOztBQUtMRSxJQUFBQSxLQUFLLENBQUMsR0FBR0YsSUFBSixFQUE0QjtBQUMvQkgsTUFBQUEsSUFBSSxDQUFDSSxrQkFBa0IsQ0FBQyxPQUFELEVBQVVELElBQVYsQ0FBbkIsQ0FBSjtBQUNELEtBUEk7O0FBUUxHLElBQUFBLElBQUksQ0FBQyxHQUFHSCxJQUFKLEVBQTRCO0FBQzlCSCxNQUFBQSxJQUFJLENBQUNJLGtCQUFrQixDQUFDLFNBQUQsRUFBWUQsSUFBWixDQUFuQixDQUFKO0FBQ0QsS0FWSTs7QUFXTEksSUFBQUEsSUFBSSxDQUFDLEdBQUdKLElBQUosRUFBNEI7QUFDOUJILE1BQUFBLElBQUksQ0FBQ0ksa0JBQWtCLENBQUMsTUFBRCxFQUFTRCxJQUFULENBQW5CLENBQUo7QUFDRCxLQWJJOztBQWNMSyxJQUFBQSxPQUFPLENBQUMsR0FBR0wsSUFBSixFQUE0QjtBQUNqQ0gsTUFBQUEsSUFBSSxDQUFDSSxrQkFBa0IsQ0FBQyxTQUFELEVBQVlELElBQVosQ0FBbkIsQ0FBSjtBQUNEOztBQWhCSSxHQUFQO0FBa0JEOztBQUVELFNBQVNDLGtCQUFULENBQTRCSyxLQUE1QixFQUEwQ04sSUFBMUMsRUFBNEQ7QUFDMUQsU0FBTztBQUNMTyxJQUFBQSxJQUFJLEVBQUUsU0FERDtBQUVMQyxJQUFBQSxJQUFJLEVBQUU7QUFBQ0YsTUFBQUEsS0FBRDtBQUFRTixNQUFBQTtBQUFSO0FBRkQsR0FBUDtBQUlEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTctcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxuICpcbiAqIEBmbG93XG4gKiBAZm9ybWF0XG4gKi9cblxuaW1wb3J0IHR5cGUge09ic2VydmFibGV9IGZyb20gJ3J4anMtY29tcGF0L2J1bmRsZXMvcnhqcy1jb21wYXQudW1kLm1pbi5qcyc7XG5pbXBvcnQgdHlwZSB7TGV2ZWx9IGZyb20gJy4vdHlwZXMnO1xuXG50eXBlIFNlbmQgPSAoZXZlbnQ6IE9iamVjdCkgPT4gdm9pZDtcbnR5cGUgRXZlbnRzID0gT2JzZXJ2YWJsZTxPYmplY3Q+O1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihzZW5kOiBTZW5kLCBldmVudHNGcm9tU2VydmljZTogRXZlbnRzKSB7XG4gIHJldHVybiB7XG4gICAgLy8gVE9ETzogVXBkYXRlIHRoZXNlIHRvIGJlIGAob2JqZWN0OiBhbnksIC4uLm9iamVjdHM6IEFycmF5PGFueT4pOiB2b2lkYCB0byBhbGxvdyBmb3IgbG9nZ2luZyBvYmplY3RzLlxuICAgIGxvZyguLi5hcmdzOiBBcnJheTxhbnk+KTogdm9pZCB7XG4gICAgICBzZW5kKGNyZWF0ZU1lc3NhZ2VFdmVudCgnbG9nJywgYXJncykpO1xuICAgIH0sXG4gICAgZXJyb3IoLi4uYXJnczogQXJyYXk8YW55Pik6IHZvaWQge1xuICAgICAgc2VuZChjcmVhdGVNZXNzYWdlRXZlbnQoJ2Vycm9yJywgYXJncykpO1xuICAgIH0sXG4gICAgd2FybiguLi5hcmdzOiBBcnJheTxhbnk+KTogdm9pZCB7XG4gICAgICBzZW5kKGNyZWF0ZU1lc3NhZ2VFdmVudCgnd2FybmluZycsIGFyZ3MpKTtcbiAgICB9LFxuICAgIGluZm8oLi4uYXJnczogQXJyYXk8YW55Pik6IHZvaWQge1xuICAgICAgc2VuZChjcmVhdGVNZXNzYWdlRXZlbnQoJ2luZm8nLCBhcmdzKSk7XG4gICAgfSxcbiAgICBzdWNjZXNzKC4uLmFyZ3M6IEFycmF5PGFueT4pOiB2b2lkIHtcbiAgICAgIHNlbmQoY3JlYXRlTWVzc2FnZUV2ZW50KCdzdWNjZXNzJywgYXJncykpO1xuICAgIH0sXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZU1lc3NhZ2VFdmVudChsZXZlbDogTGV2ZWwsIGFyZ3M6IEFycmF5PGFueT4pIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnbWVzc2FnZScsXG4gICAgZGF0YToge2xldmVsLCBhcmdzfSxcbiAgfTtcbn1cbiJdfQ==