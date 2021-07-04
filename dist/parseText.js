"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = parseText;

var React = _interopRequireWildcard(require("react"));

var _featureConfig = _interopRequireDefault(require("@atom-ide-community/nuclide-commons-atom/feature-config"));

var _string = require("@atom-ide-community/nuclide-commons/string");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

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
const DIFF_PATTERN = '\\b[dD][1-9][0-9]{5,}\\b';
const TASK_PATTERN = '\\b[tT]\\d+\\b';
/**
 * This does NOT contain a pattern to match file references. This is because file paths do not
 * contain sufficient information to locate a file. Consider `b/c/d.txt`. What is it relative to?
 * Only the thing that generated the message knows. Even absolute paths aren't enough. (Are they
 * local? Remote? Which host?) In addition, pattern matching filenames isn't reliable (`b.txt`,
 * `b.com`). The upshot is that "best guess" solutions add more confusion than convenience; a proper
 * solution probably requires both standardization on remote path (e.g. NuclideUris) and some
 * mechanism for message creators to mark up their messages with this information (e.g. `<a>`).
 */

const CLICKABLE_PATTERNS = `(${DIFF_PATTERN})|(${TASK_PATTERN})|(${_string.URL_REGEX.source})`;
const CLICKABLE_RE = new RegExp(CLICKABLE_PATTERNS, 'g');

function toString(value) {
  return typeof value === 'string' ? value : '';
}
/**
 * Parse special entities into links. In the future, it would be great to add a service so that we
 * could add new clickable things and to allow providers to mark specific ranges as links to things
 * that only they can know (e.g. relative paths output in BUCK messages). For now, however, we'll
 * just use some pattern settings and hardcode the patterns we care about.
 */


function parseText(text) {
  if (typeof text !== 'string') {
    return [];
  }

  const chunks = [];
  let lastIndex = 0;
  let index = 0;

  while (true) {
    const match = CLICKABLE_RE.exec(text);

    if (match == null) {
      break;
    }

    const matchedText = match[0]; // Add all the text since our last match.

    chunks.push(text.slice(lastIndex, CLICKABLE_RE.lastIndex - matchedText.length));
    lastIndex = CLICKABLE_RE.lastIndex;
    let href;
    let handleOnClick;

    if (match[1] != null) {
      // It's a diff
      const url = toString(_featureConfig.default.get('atom-ide-console.diffUrlPattern'));

      if (url !== '') {
        href = url.replace('%s', matchedText);
      }
    } else if (match[2] != null) {
      // It's a task
      const url = toString(_featureConfig.default.get('atom-ide-console.taskUrlPattern'));

      if (url !== '') {
        href = url.replace('%s', matchedText.slice(1));
      }
    } else if (match[3] != null) {
      // It's a URL
      href = matchedText;
    }

    chunks.push( // flowlint-next-line sketchy-null-string:off
    href ? /*#__PURE__*/React.createElement("a", {
      key: `r${index}`,
      href: href,
      target: "_blank",
      onClick: handleOnClick
    }, matchedText) : matchedText);
    index++;
  } // Add any remaining text.


  chunks.push(text.slice(lastIndex));
  return chunks;
}

module.exports = exports.default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBhcnNlVGV4dC5qcyJdLCJuYW1lcyI6WyJESUZGX1BBVFRFUk4iLCJUQVNLX1BBVFRFUk4iLCJDTElDS0FCTEVfUEFUVEVSTlMiLCJVUkxfUkVHRVgiLCJzb3VyY2UiLCJDTElDS0FCTEVfUkUiLCJSZWdFeHAiLCJ0b1N0cmluZyIsInZhbHVlIiwicGFyc2VUZXh0IiwidGV4dCIsImNodW5rcyIsImxhc3RJbmRleCIsImluZGV4IiwibWF0Y2giLCJleGVjIiwibWF0Y2hlZFRleHQiLCJwdXNoIiwic2xpY2UiLCJsZW5ndGgiLCJocmVmIiwiaGFuZGxlT25DbGljayIsInVybCIsImZlYXR1cmVDb25maWciLCJnZXQiLCJyZXBsYWNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBWUE7O0FBQ0E7O0FBRUE7Ozs7Ozs7O0FBZkE7Ozs7Ozs7Ozs7O0FBZ0JBLE1BQU1BLFlBQVksR0FBRywwQkFBckI7QUFDQSxNQUFNQyxZQUFZLEdBQUcsZ0JBQXJCO0FBRUE7Ozs7Ozs7Ozs7QUFTQSxNQUFNQyxrQkFBa0IsR0FBSSxJQUFHRixZQUFhLE1BQUtDLFlBQWEsTUFDNURFLGtCQUFVQyxNQUNYLEdBRkQ7QUFHQSxNQUFNQyxZQUFZLEdBQUcsSUFBSUMsTUFBSixDQUFXSixrQkFBWCxFQUErQixHQUEvQixDQUFyQjs7QUFFQSxTQUFTSyxRQUFULENBQWtCQyxLQUFsQixFQUF3QztBQUN0QyxTQUFPLE9BQU9BLEtBQVAsS0FBaUIsUUFBakIsR0FBNEJBLEtBQTVCLEdBQW9DLEVBQTNDO0FBQ0Q7QUFFRDs7Ozs7Ozs7QUFNZSxTQUFTQyxTQUFULENBQ2JDLElBRGEsRUFFdUI7QUFDcEMsTUFBSSxPQUFPQSxJQUFQLEtBQWdCLFFBQXBCLEVBQThCO0FBQzVCLFdBQU8sRUFBUDtBQUNEOztBQUNELFFBQU1DLE1BQU0sR0FBRyxFQUFmO0FBQ0EsTUFBSUMsU0FBUyxHQUFHLENBQWhCO0FBQ0EsTUFBSUMsS0FBSyxHQUFHLENBQVo7O0FBQ0EsU0FBTyxJQUFQLEVBQWE7QUFDWCxVQUFNQyxLQUFLLEdBQUdULFlBQVksQ0FBQ1UsSUFBYixDQUFrQkwsSUFBbEIsQ0FBZDs7QUFDQSxRQUFJSSxLQUFLLElBQUksSUFBYixFQUFtQjtBQUNqQjtBQUNEOztBQUVELFVBQU1FLFdBQVcsR0FBR0YsS0FBSyxDQUFDLENBQUQsQ0FBekIsQ0FOVyxDQVFYOztBQUNBSCxJQUFBQSxNQUFNLENBQUNNLElBQVAsQ0FDRVAsSUFBSSxDQUFDUSxLQUFMLENBQVdOLFNBQVgsRUFBc0JQLFlBQVksQ0FBQ08sU0FBYixHQUF5QkksV0FBVyxDQUFDRyxNQUEzRCxDQURGO0FBR0FQLElBQUFBLFNBQVMsR0FBR1AsWUFBWSxDQUFDTyxTQUF6QjtBQUVBLFFBQUlRLElBQUo7QUFDQSxRQUFJQyxhQUFKOztBQUNBLFFBQUlQLEtBQUssQ0FBQyxDQUFELENBQUwsSUFBWSxJQUFoQixFQUFzQjtBQUNwQjtBQUNBLFlBQU1RLEdBQUcsR0FBR2YsUUFBUSxDQUNsQmdCLHVCQUFjQyxHQUFkLENBQWtCLGlDQUFsQixDQURrQixDQUFwQjs7QUFHQSxVQUFJRixHQUFHLEtBQUssRUFBWixFQUFnQjtBQUNkRixRQUFBQSxJQUFJLEdBQUdFLEdBQUcsQ0FBQ0csT0FBSixDQUFZLElBQVosRUFBa0JULFdBQWxCLENBQVA7QUFDRDtBQUNGLEtBUkQsTUFRTyxJQUFJRixLQUFLLENBQUMsQ0FBRCxDQUFMLElBQVksSUFBaEIsRUFBc0I7QUFDM0I7QUFDQSxZQUFNUSxHQUFHLEdBQUdmLFFBQVEsQ0FDbEJnQix1QkFBY0MsR0FBZCxDQUFrQixpQ0FBbEIsQ0FEa0IsQ0FBcEI7O0FBR0EsVUFBSUYsR0FBRyxLQUFLLEVBQVosRUFBZ0I7QUFDZEYsUUFBQUEsSUFBSSxHQUFHRSxHQUFHLENBQUNHLE9BQUosQ0FBWSxJQUFaLEVBQWtCVCxXQUFXLENBQUNFLEtBQVosQ0FBa0IsQ0FBbEIsQ0FBbEIsQ0FBUDtBQUNEO0FBQ0YsS0FSTSxNQVFBLElBQUlKLEtBQUssQ0FBQyxDQUFELENBQUwsSUFBWSxJQUFoQixFQUFzQjtBQUMzQjtBQUNBTSxNQUFBQSxJQUFJLEdBQUdKLFdBQVA7QUFDRDs7QUFFREwsSUFBQUEsTUFBTSxDQUFDTSxJQUFQLEVBQ0U7QUFDQUcsSUFBQUEsSUFBSSxnQkFDRjtBQUNFLE1BQUEsR0FBRyxFQUFHLElBQUdQLEtBQU0sRUFEakI7QUFFRSxNQUFBLElBQUksRUFBRU8sSUFGUjtBQUdFLE1BQUEsTUFBTSxFQUFDLFFBSFQ7QUFJRSxNQUFBLE9BQU8sRUFBRUM7QUFKWCxPQUtHTCxXQUxILENBREUsR0FTRkEsV0FYSjtBQWVBSCxJQUFBQSxLQUFLO0FBQ04sR0E1RG1DLENBOERwQzs7O0FBQ0FGLEVBQUFBLE1BQU0sQ0FBQ00sSUFBUCxDQUFZUCxJQUFJLENBQUNRLEtBQUwsQ0FBV04sU0FBWCxDQUFaO0FBRUEsU0FBT0QsTUFBUDtBQUNEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTctcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxuICpcbiAqIEBmbG93XG4gKiBAZm9ybWF0XG4gKi9cblxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IGZlYXR1cmVDb25maWcgZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtYXRvbS9mZWF0dXJlLWNvbmZpZyc7XG5cbmltcG9ydCB7VVJMX1JFR0VYfSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy9zdHJpbmcnO1xuY29uc3QgRElGRl9QQVRURVJOID0gJ1xcXFxiW2REXVsxLTldWzAtOV17NSx9XFxcXGInO1xuY29uc3QgVEFTS19QQVRURVJOID0gJ1xcXFxiW3RUXVxcXFxkK1xcXFxiJztcblxuLyoqXG4gKiBUaGlzIGRvZXMgTk9UIGNvbnRhaW4gYSBwYXR0ZXJuIHRvIG1hdGNoIGZpbGUgcmVmZXJlbmNlcy4gVGhpcyBpcyBiZWNhdXNlIGZpbGUgcGF0aHMgZG8gbm90XG4gKiBjb250YWluIHN1ZmZpY2llbnQgaW5mb3JtYXRpb24gdG8gbG9jYXRlIGEgZmlsZS4gQ29uc2lkZXIgYGIvYy9kLnR4dGAuIFdoYXQgaXMgaXQgcmVsYXRpdmUgdG8/XG4gKiBPbmx5IHRoZSB0aGluZyB0aGF0IGdlbmVyYXRlZCB0aGUgbWVzc2FnZSBrbm93cy4gRXZlbiBhYnNvbHV0ZSBwYXRocyBhcmVuJ3QgZW5vdWdoLiAoQXJlIHRoZXlcbiAqIGxvY2FsPyBSZW1vdGU/IFdoaWNoIGhvc3Q/KSBJbiBhZGRpdGlvbiwgcGF0dGVybiBtYXRjaGluZyBmaWxlbmFtZXMgaXNuJ3QgcmVsaWFibGUgKGBiLnR4dGAsXG4gKiBgYi5jb21gKS4gVGhlIHVwc2hvdCBpcyB0aGF0IFwiYmVzdCBndWVzc1wiIHNvbHV0aW9ucyBhZGQgbW9yZSBjb25mdXNpb24gdGhhbiBjb252ZW5pZW5jZTsgYSBwcm9wZXJcbiAqIHNvbHV0aW9uIHByb2JhYmx5IHJlcXVpcmVzIGJvdGggc3RhbmRhcmRpemF0aW9uIG9uIHJlbW90ZSBwYXRoIChlLmcuIE51Y2xpZGVVcmlzKSBhbmQgc29tZVxuICogbWVjaGFuaXNtIGZvciBtZXNzYWdlIGNyZWF0b3JzIHRvIG1hcmsgdXAgdGhlaXIgbWVzc2FnZXMgd2l0aCB0aGlzIGluZm9ybWF0aW9uIChlLmcuIGA8YT5gKS5cbiAqL1xuY29uc3QgQ0xJQ0tBQkxFX1BBVFRFUk5TID0gYCgke0RJRkZfUEFUVEVSTn0pfCgke1RBU0tfUEFUVEVSTn0pfCgke1xuICBVUkxfUkVHRVguc291cmNlXG59KWA7XG5jb25zdCBDTElDS0FCTEVfUkUgPSBuZXcgUmVnRXhwKENMSUNLQUJMRV9QQVRURVJOUywgJ2cnKTtcblxuZnVuY3Rpb24gdG9TdHJpbmcodmFsdWU6IG1peGVkKTogc3RyaW5nIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgPyB2YWx1ZSA6ICcnO1xufVxuXG4vKipcbiAqIFBhcnNlIHNwZWNpYWwgZW50aXRpZXMgaW50byBsaW5rcy4gSW4gdGhlIGZ1dHVyZSwgaXQgd291bGQgYmUgZ3JlYXQgdG8gYWRkIGEgc2VydmljZSBzbyB0aGF0IHdlXG4gKiBjb3VsZCBhZGQgbmV3IGNsaWNrYWJsZSB0aGluZ3MgYW5kIHRvIGFsbG93IHByb3ZpZGVycyB0byBtYXJrIHNwZWNpZmljIHJhbmdlcyBhcyBsaW5rcyB0byB0aGluZ3NcbiAqIHRoYXQgb25seSB0aGV5IGNhbiBrbm93IChlLmcuIHJlbGF0aXZlIHBhdGhzIG91dHB1dCBpbiBCVUNLIG1lc3NhZ2VzKS4gRm9yIG5vdywgaG93ZXZlciwgd2UnbGxcbiAqIGp1c3QgdXNlIHNvbWUgcGF0dGVybiBzZXR0aW5ncyBhbmQgaGFyZGNvZGUgdGhlIHBhdHRlcm5zIHdlIGNhcmUgYWJvdXQuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHBhcnNlVGV4dChcbiAgdGV4dDogc3RyaW5nLFxuKTogQXJyYXk8c3RyaW5nIHwgUmVhY3QuRWxlbWVudDxhbnk+PiB7XG4gIGlmICh0eXBlb2YgdGV4dCAhPT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gW107XG4gIH1cbiAgY29uc3QgY2h1bmtzID0gW107XG4gIGxldCBsYXN0SW5kZXggPSAwO1xuICBsZXQgaW5kZXggPSAwO1xuICB3aGlsZSAodHJ1ZSkge1xuICAgIGNvbnN0IG1hdGNoID0gQ0xJQ0tBQkxFX1JFLmV4ZWModGV4dCk7XG4gICAgaWYgKG1hdGNoID09IG51bGwpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGNvbnN0IG1hdGNoZWRUZXh0ID0gbWF0Y2hbMF07XG5cbiAgICAvLyBBZGQgYWxsIHRoZSB0ZXh0IHNpbmNlIG91ciBsYXN0IG1hdGNoLlxuICAgIGNodW5rcy5wdXNoKFxuICAgICAgdGV4dC5zbGljZShsYXN0SW5kZXgsIENMSUNLQUJMRV9SRS5sYXN0SW5kZXggLSBtYXRjaGVkVGV4dC5sZW5ndGgpLFxuICAgICk7XG4gICAgbGFzdEluZGV4ID0gQ0xJQ0tBQkxFX1JFLmxhc3RJbmRleDtcblxuICAgIGxldCBocmVmO1xuICAgIGxldCBoYW5kbGVPbkNsaWNrO1xuICAgIGlmIChtYXRjaFsxXSAhPSBudWxsKSB7XG4gICAgICAvLyBJdCdzIGEgZGlmZlxuICAgICAgY29uc3QgdXJsID0gdG9TdHJpbmcoXG4gICAgICAgIGZlYXR1cmVDb25maWcuZ2V0KCdhdG9tLWlkZS1jb25zb2xlLmRpZmZVcmxQYXR0ZXJuJyksXG4gICAgICApO1xuICAgICAgaWYgKHVybCAhPT0gJycpIHtcbiAgICAgICAgaHJlZiA9IHVybC5yZXBsYWNlKCclcycsIG1hdGNoZWRUZXh0KTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG1hdGNoWzJdICE9IG51bGwpIHtcbiAgICAgIC8vIEl0J3MgYSB0YXNrXG4gICAgICBjb25zdCB1cmwgPSB0b1N0cmluZyhcbiAgICAgICAgZmVhdHVyZUNvbmZpZy5nZXQoJ2F0b20taWRlLWNvbnNvbGUudGFza1VybFBhdHRlcm4nKSxcbiAgICAgICk7XG4gICAgICBpZiAodXJsICE9PSAnJykge1xuICAgICAgICBocmVmID0gdXJsLnJlcGxhY2UoJyVzJywgbWF0Y2hlZFRleHQuc2xpY2UoMSkpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAobWF0Y2hbM10gIT0gbnVsbCkge1xuICAgICAgLy8gSXQncyBhIFVSTFxuICAgICAgaHJlZiA9IG1hdGNoZWRUZXh0O1xuICAgIH1cblxuICAgIGNodW5rcy5wdXNoKFxuICAgICAgLy8gZmxvd2xpbnQtbmV4dC1saW5lIHNrZXRjaHktbnVsbC1zdHJpbmc6b2ZmXG4gICAgICBocmVmID8gKFxuICAgICAgICA8YVxuICAgICAgICAgIGtleT17YHIke2luZGV4fWB9XG4gICAgICAgICAgaHJlZj17aHJlZn1cbiAgICAgICAgICB0YXJnZXQ9XCJfYmxhbmtcIlxuICAgICAgICAgIG9uQ2xpY2s9e2hhbmRsZU9uQ2xpY2t9PlxuICAgICAgICAgIHttYXRjaGVkVGV4dH1cbiAgICAgICAgPC9hPlxuICAgICAgKSA6IChcbiAgICAgICAgbWF0Y2hlZFRleHRcbiAgICAgICksXG4gICAgKTtcblxuICAgIGluZGV4Kys7XG4gIH1cblxuICAvLyBBZGQgYW55IHJlbWFpbmluZyB0ZXh0LlxuICBjaHVua3MucHVzaCh0ZXh0LnNsaWNlKGxhc3RJbmRleCkpO1xuXG4gIHJldHVybiBjaHVua3M7XG59XG4iXX0=