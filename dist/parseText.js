"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = parseText;

var React = _interopRequireWildcard(require("react"));

var _featureConfig = _interopRequireDefault(require("@atom-ide-community/nuclide-commons-atom/feature-config"));

var _string = require("@atom-ide-community/nuclide-commons/string");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBhcnNlVGV4dC5qcyJdLCJuYW1lcyI6WyJESUZGX1BBVFRFUk4iLCJUQVNLX1BBVFRFUk4iLCJDTElDS0FCTEVfUEFUVEVSTlMiLCJVUkxfUkVHRVgiLCJzb3VyY2UiLCJDTElDS0FCTEVfUkUiLCJSZWdFeHAiLCJ0b1N0cmluZyIsInZhbHVlIiwicGFyc2VUZXh0IiwidGV4dCIsImNodW5rcyIsImxhc3RJbmRleCIsImluZGV4IiwibWF0Y2giLCJleGVjIiwibWF0Y2hlZFRleHQiLCJwdXNoIiwic2xpY2UiLCJsZW5ndGgiLCJocmVmIiwiaGFuZGxlT25DbGljayIsInVybCIsImZlYXR1cmVDb25maWciLCJnZXQiLCJyZXBsYWNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBWUE7O0FBQ0E7O0FBRUE7Ozs7Ozs7O0FBZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQU1BLE1BQU1BLFlBQVksR0FBRywwQkFBckI7QUFDQSxNQUFNQyxZQUFZLEdBQUcsZ0JBQXJCO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUNBLE1BQU1DLGtCQUFrQixHQUFJLElBQUdGLFlBQWEsTUFBS0MsWUFBYSxNQUM1REUsa0JBQVVDLE1BQ1gsR0FGRDtBQUdBLE1BQU1DLFlBQVksR0FBRyxJQUFJQyxNQUFKLENBQVdKLGtCQUFYLEVBQStCLEdBQS9CLENBQXJCOztBQUVBLFNBQVNLLFFBQVQsQ0FBa0JDLEtBQWxCLEVBQXdDO0FBQ3RDLFNBQU8sT0FBT0EsS0FBUCxLQUFpQixRQUFqQixHQUE0QkEsS0FBNUIsR0FBb0MsRUFBM0M7QUFDRDtBQUVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FBQ2UsU0FBU0MsU0FBVCxDQUNiQyxJQURhLEVBRXVCO0FBQ3BDLE1BQUksT0FBT0EsSUFBUCxLQUFnQixRQUFwQixFQUE4QjtBQUM1QixXQUFPLEVBQVA7QUFDRDs7QUFDRCxRQUFNQyxNQUFNLEdBQUcsRUFBZjtBQUNBLE1BQUlDLFNBQVMsR0FBRyxDQUFoQjtBQUNBLE1BQUlDLEtBQUssR0FBRyxDQUFaOztBQUNBLFNBQU8sSUFBUCxFQUFhO0FBQ1gsVUFBTUMsS0FBSyxHQUFHVCxZQUFZLENBQUNVLElBQWIsQ0FBa0JMLElBQWxCLENBQWQ7O0FBQ0EsUUFBSUksS0FBSyxJQUFJLElBQWIsRUFBbUI7QUFDakI7QUFDRDs7QUFFRCxVQUFNRSxXQUFXLEdBQUdGLEtBQUssQ0FBQyxDQUFELENBQXpCLENBTlcsQ0FRWDs7QUFDQUgsSUFBQUEsTUFBTSxDQUFDTSxJQUFQLENBQ0VQLElBQUksQ0FBQ1EsS0FBTCxDQUFXTixTQUFYLEVBQXNCUCxZQUFZLENBQUNPLFNBQWIsR0FBeUJJLFdBQVcsQ0FBQ0csTUFBM0QsQ0FERjtBQUdBUCxJQUFBQSxTQUFTLEdBQUdQLFlBQVksQ0FBQ08sU0FBekI7QUFFQSxRQUFJUSxJQUFKO0FBQ0EsUUFBSUMsYUFBSjs7QUFDQSxRQUFJUCxLQUFLLENBQUMsQ0FBRCxDQUFMLElBQVksSUFBaEIsRUFBc0I7QUFDcEI7QUFDQSxZQUFNUSxHQUFHLEdBQUdmLFFBQVEsQ0FDbEJnQix1QkFBY0MsR0FBZCxDQUFrQixpQ0FBbEIsQ0FEa0IsQ0FBcEI7O0FBR0EsVUFBSUYsR0FBRyxLQUFLLEVBQVosRUFBZ0I7QUFDZEYsUUFBQUEsSUFBSSxHQUFHRSxHQUFHLENBQUNHLE9BQUosQ0FBWSxJQUFaLEVBQWtCVCxXQUFsQixDQUFQO0FBQ0Q7QUFDRixLQVJELE1BUU8sSUFBSUYsS0FBSyxDQUFDLENBQUQsQ0FBTCxJQUFZLElBQWhCLEVBQXNCO0FBQzNCO0FBQ0EsWUFBTVEsR0FBRyxHQUFHZixRQUFRLENBQ2xCZ0IsdUJBQWNDLEdBQWQsQ0FBa0IsaUNBQWxCLENBRGtCLENBQXBCOztBQUdBLFVBQUlGLEdBQUcsS0FBSyxFQUFaLEVBQWdCO0FBQ2RGLFFBQUFBLElBQUksR0FBR0UsR0FBRyxDQUFDRyxPQUFKLENBQVksSUFBWixFQUFrQlQsV0FBVyxDQUFDRSxLQUFaLENBQWtCLENBQWxCLENBQWxCLENBQVA7QUFDRDtBQUNGLEtBUk0sTUFRQSxJQUFJSixLQUFLLENBQUMsQ0FBRCxDQUFMLElBQVksSUFBaEIsRUFBc0I7QUFDM0I7QUFDQU0sTUFBQUEsSUFBSSxHQUFHSixXQUFQO0FBQ0Q7O0FBRURMLElBQUFBLE1BQU0sQ0FBQ00sSUFBUCxFQUNFO0FBQ0FHLElBQUFBLElBQUksZ0JBQ0Y7QUFDRSxNQUFBLEdBQUcsRUFBRyxJQUFHUCxLQUFNLEVBRGpCO0FBRUUsTUFBQSxJQUFJLEVBQUVPLElBRlI7QUFHRSxNQUFBLE1BQU0sRUFBQyxRQUhUO0FBSUUsTUFBQSxPQUFPLEVBQUVDO0FBSlgsT0FLR0wsV0FMSCxDQURFLEdBU0ZBLFdBWEo7QUFlQUgsSUFBQUEsS0FBSztBQUNOLEdBNURtQyxDQThEcEM7OztBQUNBRixFQUFBQSxNQUFNLENBQUNNLElBQVAsQ0FBWVAsSUFBSSxDQUFDUSxLQUFMLENBQVdOLFNBQVgsQ0FBWjtBQUVBLFNBQU9ELE1BQVA7QUFDRCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE3LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqXG4gKiBAZmxvd1xuICogQGZvcm1hdFxuICovXG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBmZWF0dXJlQ29uZmlnIGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLWF0b20vZmVhdHVyZS1jb25maWcnO1xuXG5pbXBvcnQge1VSTF9SRUdFWH0gZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMvc3RyaW5nJztcbmNvbnN0IERJRkZfUEFUVEVSTiA9ICdcXFxcYltkRF1bMS05XVswLTldezUsfVxcXFxiJztcbmNvbnN0IFRBU0tfUEFUVEVSTiA9ICdcXFxcYlt0VF1cXFxcZCtcXFxcYic7XG5cbi8qKlxuICogVGhpcyBkb2VzIE5PVCBjb250YWluIGEgcGF0dGVybiB0byBtYXRjaCBmaWxlIHJlZmVyZW5jZXMuIFRoaXMgaXMgYmVjYXVzZSBmaWxlIHBhdGhzIGRvIG5vdFxuICogY29udGFpbiBzdWZmaWNpZW50IGluZm9ybWF0aW9uIHRvIGxvY2F0ZSBhIGZpbGUuIENvbnNpZGVyIGBiL2MvZC50eHRgLiBXaGF0IGlzIGl0IHJlbGF0aXZlIHRvP1xuICogT25seSB0aGUgdGhpbmcgdGhhdCBnZW5lcmF0ZWQgdGhlIG1lc3NhZ2Uga25vd3MuIEV2ZW4gYWJzb2x1dGUgcGF0aHMgYXJlbid0IGVub3VnaC4gKEFyZSB0aGV5XG4gKiBsb2NhbD8gUmVtb3RlPyBXaGljaCBob3N0PykgSW4gYWRkaXRpb24sIHBhdHRlcm4gbWF0Y2hpbmcgZmlsZW5hbWVzIGlzbid0IHJlbGlhYmxlIChgYi50eHRgLFxuICogYGIuY29tYCkuIFRoZSB1cHNob3QgaXMgdGhhdCBcImJlc3QgZ3Vlc3NcIiBzb2x1dGlvbnMgYWRkIG1vcmUgY29uZnVzaW9uIHRoYW4gY29udmVuaWVuY2U7IGEgcHJvcGVyXG4gKiBzb2x1dGlvbiBwcm9iYWJseSByZXF1aXJlcyBib3RoIHN0YW5kYXJkaXphdGlvbiBvbiByZW1vdGUgcGF0aCAoZS5nLiBOdWNsaWRlVXJpcykgYW5kIHNvbWVcbiAqIG1lY2hhbmlzbSBmb3IgbWVzc2FnZSBjcmVhdG9ycyB0byBtYXJrIHVwIHRoZWlyIG1lc3NhZ2VzIHdpdGggdGhpcyBpbmZvcm1hdGlvbiAoZS5nLiBgPGE+YCkuXG4gKi9cbmNvbnN0IENMSUNLQUJMRV9QQVRURVJOUyA9IGAoJHtESUZGX1BBVFRFUk59KXwoJHtUQVNLX1BBVFRFUk59KXwoJHtcbiAgVVJMX1JFR0VYLnNvdXJjZVxufSlgO1xuY29uc3QgQ0xJQ0tBQkxFX1JFID0gbmV3IFJlZ0V4cChDTElDS0FCTEVfUEFUVEVSTlMsICdnJyk7XG5cbmZ1bmN0aW9uIHRvU3RyaW5nKHZhbHVlOiBtaXhlZCk6IHN0cmluZyB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnID8gdmFsdWUgOiAnJztcbn1cblxuLyoqXG4gKiBQYXJzZSBzcGVjaWFsIGVudGl0aWVzIGludG8gbGlua3MuIEluIHRoZSBmdXR1cmUsIGl0IHdvdWxkIGJlIGdyZWF0IHRvIGFkZCBhIHNlcnZpY2Ugc28gdGhhdCB3ZVxuICogY291bGQgYWRkIG5ldyBjbGlja2FibGUgdGhpbmdzIGFuZCB0byBhbGxvdyBwcm92aWRlcnMgdG8gbWFyayBzcGVjaWZpYyByYW5nZXMgYXMgbGlua3MgdG8gdGhpbmdzXG4gKiB0aGF0IG9ubHkgdGhleSBjYW4ga25vdyAoZS5nLiByZWxhdGl2ZSBwYXRocyBvdXRwdXQgaW4gQlVDSyBtZXNzYWdlcykuIEZvciBub3csIGhvd2V2ZXIsIHdlJ2xsXG4gKiBqdXN0IHVzZSBzb21lIHBhdHRlcm4gc2V0dGluZ3MgYW5kIGhhcmRjb2RlIHRoZSBwYXR0ZXJucyB3ZSBjYXJlIGFib3V0LlxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBwYXJzZVRleHQoXG4gIHRleHQ6IHN0cmluZyxcbik6IEFycmF5PHN0cmluZyB8IFJlYWN0LkVsZW1lbnQ8YW55Pj4ge1xuICBpZiAodHlwZW9mIHRleHQgIT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG4gIGNvbnN0IGNodW5rcyA9IFtdO1xuICBsZXQgbGFzdEluZGV4ID0gMDtcbiAgbGV0IGluZGV4ID0gMDtcbiAgd2hpbGUgKHRydWUpIHtcbiAgICBjb25zdCBtYXRjaCA9IENMSUNLQUJMRV9SRS5leGVjKHRleHQpO1xuICAgIGlmIChtYXRjaCA9PSBudWxsKSB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBjb25zdCBtYXRjaGVkVGV4dCA9IG1hdGNoWzBdO1xuXG4gICAgLy8gQWRkIGFsbCB0aGUgdGV4dCBzaW5jZSBvdXIgbGFzdCBtYXRjaC5cbiAgICBjaHVua3MucHVzaChcbiAgICAgIHRleHQuc2xpY2UobGFzdEluZGV4LCBDTElDS0FCTEVfUkUubGFzdEluZGV4IC0gbWF0Y2hlZFRleHQubGVuZ3RoKSxcbiAgICApO1xuICAgIGxhc3RJbmRleCA9IENMSUNLQUJMRV9SRS5sYXN0SW5kZXg7XG5cbiAgICBsZXQgaHJlZjtcbiAgICBsZXQgaGFuZGxlT25DbGljaztcbiAgICBpZiAobWF0Y2hbMV0gIT0gbnVsbCkge1xuICAgICAgLy8gSXQncyBhIGRpZmZcbiAgICAgIGNvbnN0IHVybCA9IHRvU3RyaW5nKFxuICAgICAgICBmZWF0dXJlQ29uZmlnLmdldCgnYXRvbS1pZGUtY29uc29sZS5kaWZmVXJsUGF0dGVybicpLFxuICAgICAgKTtcbiAgICAgIGlmICh1cmwgIT09ICcnKSB7XG4gICAgICAgIGhyZWYgPSB1cmwucmVwbGFjZSgnJXMnLCBtYXRjaGVkVGV4dCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChtYXRjaFsyXSAhPSBudWxsKSB7XG4gICAgICAvLyBJdCdzIGEgdGFza1xuICAgICAgY29uc3QgdXJsID0gdG9TdHJpbmcoXG4gICAgICAgIGZlYXR1cmVDb25maWcuZ2V0KCdhdG9tLWlkZS1jb25zb2xlLnRhc2tVcmxQYXR0ZXJuJyksXG4gICAgICApO1xuICAgICAgaWYgKHVybCAhPT0gJycpIHtcbiAgICAgICAgaHJlZiA9IHVybC5yZXBsYWNlKCclcycsIG1hdGNoZWRUZXh0LnNsaWNlKDEpKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG1hdGNoWzNdICE9IG51bGwpIHtcbiAgICAgIC8vIEl0J3MgYSBVUkxcbiAgICAgIGhyZWYgPSBtYXRjaGVkVGV4dDtcbiAgICB9XG5cbiAgICBjaHVua3MucHVzaChcbiAgICAgIC8vIGZsb3dsaW50LW5leHQtbGluZSBza2V0Y2h5LW51bGwtc3RyaW5nOm9mZlxuICAgICAgaHJlZiA/IChcbiAgICAgICAgPGFcbiAgICAgICAgICBrZXk9e2ByJHtpbmRleH1gfVxuICAgICAgICAgIGhyZWY9e2hyZWZ9XG4gICAgICAgICAgdGFyZ2V0PVwiX2JsYW5rXCJcbiAgICAgICAgICBvbkNsaWNrPXtoYW5kbGVPbkNsaWNrfT5cbiAgICAgICAgICB7bWF0Y2hlZFRleHR9XG4gICAgICAgIDwvYT5cbiAgICAgICkgOiAoXG4gICAgICAgIG1hdGNoZWRUZXh0XG4gICAgICApLFxuICAgICk7XG5cbiAgICBpbmRleCsrO1xuICB9XG5cbiAgLy8gQWRkIGFueSByZW1haW5pbmcgdGV4dC5cbiAgY2h1bmtzLnB1c2godGV4dC5zbGljZShsYXN0SW5kZXgpKTtcblxuICByZXR1cm4gY2h1bmtzO1xufVxuIl19