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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBhcnNlVGV4dC5qcyJdLCJuYW1lcyI6WyJESUZGX1BBVFRFUk4iLCJUQVNLX1BBVFRFUk4iLCJDTElDS0FCTEVfUEFUVEVSTlMiLCJVUkxfUkVHRVgiLCJzb3VyY2UiLCJDTElDS0FCTEVfUkUiLCJSZWdFeHAiLCJ0b1N0cmluZyIsInZhbHVlIiwicGFyc2VUZXh0IiwidGV4dCIsImNodW5rcyIsImxhc3RJbmRleCIsImluZGV4IiwibWF0Y2giLCJleGVjIiwibWF0Y2hlZFRleHQiLCJwdXNoIiwic2xpY2UiLCJsZW5ndGgiLCJocmVmIiwiaGFuZGxlT25DbGljayIsInVybCIsImZlYXR1cmVDb25maWciLCJnZXQiLCJyZXBsYWNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBWUE7O0FBQ0E7O0FBRUE7Ozs7Ozs7O0FBZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQU1BLE1BQU1BLFlBQVksR0FBRywwQkFBckI7QUFDQSxNQUFNQyxZQUFZLEdBQUcsZ0JBQXJCO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUNBLE1BQU1DLGtCQUFrQixHQUFJLElBQUdGLFlBQWEsTUFBS0MsWUFBYSxNQUM1REUsa0JBQVVDLE1BQ1gsR0FGRDtBQUdBLE1BQU1DLFlBQVksR0FBRyxJQUFJQyxNQUFKLENBQVdKLGtCQUFYLEVBQStCLEdBQS9CLENBQXJCOztBQUVBLFNBQVNLLFFBQVQsQ0FBa0JDLEtBQWxCLEVBQXdDO0FBQ3RDLFNBQU8sT0FBT0EsS0FBUCxLQUFpQixRQUFqQixHQUE0QkEsS0FBNUIsR0FBb0MsRUFBM0M7QUFDRDtBQUVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FBQ2UsU0FBU0MsU0FBVCxDQUNiQyxJQURhLEVBRXVCO0FBQ3BDLE1BQUksT0FBT0EsSUFBUCxLQUFnQixRQUFwQixFQUE4QjtBQUM1QixXQUFPLEVBQVA7QUFDRDs7QUFDRCxRQUFNQyxNQUFNLEdBQUcsRUFBZjtBQUNBLE1BQUlDLFNBQVMsR0FBRyxDQUFoQjtBQUNBLE1BQUlDLEtBQUssR0FBRyxDQUFaOztBQUNBLFNBQU8sSUFBUCxFQUFhO0FBQ1gsVUFBTUMsS0FBSyxHQUFHVCxZQUFZLENBQUNVLElBQWIsQ0FBa0JMLElBQWxCLENBQWQ7O0FBQ0EsUUFBSUksS0FBSyxJQUFJLElBQWIsRUFBbUI7QUFDakI7QUFDRDs7QUFFRCxVQUFNRSxXQUFXLEdBQUdGLEtBQUssQ0FBQyxDQUFELENBQXpCLENBTlcsQ0FRWDs7QUFDQUgsSUFBQUEsTUFBTSxDQUFDTSxJQUFQLENBQ0VQLElBQUksQ0FBQ1EsS0FBTCxDQUFXTixTQUFYLEVBQXNCUCxZQUFZLENBQUNPLFNBQWIsR0FBeUJJLFdBQVcsQ0FBQ0csTUFBM0QsQ0FERjtBQUdBUCxJQUFBQSxTQUFTLEdBQUdQLFlBQVksQ0FBQ08sU0FBekI7QUFFQSxRQUFJUSxJQUFKO0FBQ0EsUUFBSUMsYUFBSjs7QUFDQSxRQUFJUCxLQUFLLENBQUMsQ0FBRCxDQUFMLElBQVksSUFBaEIsRUFBc0I7QUFDcEI7QUFDQSxZQUFNUSxHQUFHLEdBQUdmLFFBQVEsQ0FDbEJnQix1QkFBY0MsR0FBZCxDQUFrQixpQ0FBbEIsQ0FEa0IsQ0FBcEI7O0FBR0EsVUFBSUYsR0FBRyxLQUFLLEVBQVosRUFBZ0I7QUFDZEYsUUFBQUEsSUFBSSxHQUFHRSxHQUFHLENBQUNHLE9BQUosQ0FBWSxJQUFaLEVBQWtCVCxXQUFsQixDQUFQO0FBQ0Q7QUFDRixLQVJELE1BUU8sSUFBSUYsS0FBSyxDQUFDLENBQUQsQ0FBTCxJQUFZLElBQWhCLEVBQXNCO0FBQzNCO0FBQ0EsWUFBTVEsR0FBRyxHQUFHZixRQUFRLENBQ2xCZ0IsdUJBQWNDLEdBQWQsQ0FBa0IsaUNBQWxCLENBRGtCLENBQXBCOztBQUdBLFVBQUlGLEdBQUcsS0FBSyxFQUFaLEVBQWdCO0FBQ2RGLFFBQUFBLElBQUksR0FBR0UsR0FBRyxDQUFDRyxPQUFKLENBQVksSUFBWixFQUFrQlQsV0FBVyxDQUFDRSxLQUFaLENBQWtCLENBQWxCLENBQWxCLENBQVA7QUFDRDtBQUNGLEtBUk0sTUFRQSxJQUFJSixLQUFLLENBQUMsQ0FBRCxDQUFMLElBQVksSUFBaEIsRUFBc0I7QUFDM0I7QUFDQU0sTUFBQUEsSUFBSSxHQUFHSixXQUFQO0FBQ0Q7O0FBRURMLElBQUFBLE1BQU0sQ0FBQ00sSUFBUCxFQUNFO0FBQ0FHLElBQUFBLElBQUksZ0JBQ0Y7QUFDRSxNQUFBLEdBQUcsRUFBRyxJQUFHUCxLQUFNLEVBRGpCO0FBRUUsTUFBQSxJQUFJLEVBQUVPLElBRlI7QUFHRSxNQUFBLE1BQU0sRUFBQyxRQUhUO0FBSUUsTUFBQSxPQUFPLEVBQUVDO0FBSlgsT0FLR0wsV0FMSCxDQURFLEdBU0ZBLFdBWEo7QUFlQUgsSUFBQUEsS0FBSztBQUNOLEdBNURtQyxDQThEcEM7OztBQUNBRixFQUFBQSxNQUFNLENBQUNNLElBQVAsQ0FBWVAsSUFBSSxDQUFDUSxLQUFMLENBQVdOLFNBQVgsQ0FBWjtBQUVBLFNBQU9ELE1BQVA7QUFDRCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTctcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cclxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuICpcclxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXHJcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxyXG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cclxuICpcclxuICogQGZsb3dcclxuICogQGZvcm1hdFxyXG4gKi9cclxuXHJcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcclxuaW1wb3J0IGZlYXR1cmVDb25maWcgZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtYXRvbS9mZWF0dXJlLWNvbmZpZyc7XHJcblxyXG5pbXBvcnQge1VSTF9SRUdFWH0gZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMvc3RyaW5nJztcclxuY29uc3QgRElGRl9QQVRURVJOID0gJ1xcXFxiW2REXVsxLTldWzAtOV17NSx9XFxcXGInO1xyXG5jb25zdCBUQVNLX1BBVFRFUk4gPSAnXFxcXGJbdFRdXFxcXGQrXFxcXGInO1xyXG5cclxuLyoqXHJcbiAqIFRoaXMgZG9lcyBOT1QgY29udGFpbiBhIHBhdHRlcm4gdG8gbWF0Y2ggZmlsZSByZWZlcmVuY2VzLiBUaGlzIGlzIGJlY2F1c2UgZmlsZSBwYXRocyBkbyBub3RcclxuICogY29udGFpbiBzdWZmaWNpZW50IGluZm9ybWF0aW9uIHRvIGxvY2F0ZSBhIGZpbGUuIENvbnNpZGVyIGBiL2MvZC50eHRgLiBXaGF0IGlzIGl0IHJlbGF0aXZlIHRvP1xyXG4gKiBPbmx5IHRoZSB0aGluZyB0aGF0IGdlbmVyYXRlZCB0aGUgbWVzc2FnZSBrbm93cy4gRXZlbiBhYnNvbHV0ZSBwYXRocyBhcmVuJ3QgZW5vdWdoLiAoQXJlIHRoZXlcclxuICogbG9jYWw/IFJlbW90ZT8gV2hpY2ggaG9zdD8pIEluIGFkZGl0aW9uLCBwYXR0ZXJuIG1hdGNoaW5nIGZpbGVuYW1lcyBpc24ndCByZWxpYWJsZSAoYGIudHh0YCxcclxuICogYGIuY29tYCkuIFRoZSB1cHNob3QgaXMgdGhhdCBcImJlc3QgZ3Vlc3NcIiBzb2x1dGlvbnMgYWRkIG1vcmUgY29uZnVzaW9uIHRoYW4gY29udmVuaWVuY2U7IGEgcHJvcGVyXHJcbiAqIHNvbHV0aW9uIHByb2JhYmx5IHJlcXVpcmVzIGJvdGggc3RhbmRhcmRpemF0aW9uIG9uIHJlbW90ZSBwYXRoIChlLmcuIE51Y2xpZGVVcmlzKSBhbmQgc29tZVxyXG4gKiBtZWNoYW5pc20gZm9yIG1lc3NhZ2UgY3JlYXRvcnMgdG8gbWFyayB1cCB0aGVpciBtZXNzYWdlcyB3aXRoIHRoaXMgaW5mb3JtYXRpb24gKGUuZy4gYDxhPmApLlxyXG4gKi9cclxuY29uc3QgQ0xJQ0tBQkxFX1BBVFRFUk5TID0gYCgke0RJRkZfUEFUVEVSTn0pfCgke1RBU0tfUEFUVEVSTn0pfCgke1xyXG4gIFVSTF9SRUdFWC5zb3VyY2VcclxufSlgO1xyXG5jb25zdCBDTElDS0FCTEVfUkUgPSBuZXcgUmVnRXhwKENMSUNLQUJMRV9QQVRURVJOUywgJ2cnKTtcclxuXHJcbmZ1bmN0aW9uIHRvU3RyaW5nKHZhbHVlOiBtaXhlZCk6IHN0cmluZyB7XHJcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgPyB2YWx1ZSA6ICcnO1xyXG59XHJcblxyXG4vKipcclxuICogUGFyc2Ugc3BlY2lhbCBlbnRpdGllcyBpbnRvIGxpbmtzLiBJbiB0aGUgZnV0dXJlLCBpdCB3b3VsZCBiZSBncmVhdCB0byBhZGQgYSBzZXJ2aWNlIHNvIHRoYXQgd2VcclxuICogY291bGQgYWRkIG5ldyBjbGlja2FibGUgdGhpbmdzIGFuZCB0byBhbGxvdyBwcm92aWRlcnMgdG8gbWFyayBzcGVjaWZpYyByYW5nZXMgYXMgbGlua3MgdG8gdGhpbmdzXHJcbiAqIHRoYXQgb25seSB0aGV5IGNhbiBrbm93IChlLmcuIHJlbGF0aXZlIHBhdGhzIG91dHB1dCBpbiBCVUNLIG1lc3NhZ2VzKS4gRm9yIG5vdywgaG93ZXZlciwgd2UnbGxcclxuICoganVzdCB1c2Ugc29tZSBwYXR0ZXJuIHNldHRpbmdzIGFuZCBoYXJkY29kZSB0aGUgcGF0dGVybnMgd2UgY2FyZSBhYm91dC5cclxuICovXHJcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHBhcnNlVGV4dChcclxuICB0ZXh0OiBzdHJpbmcsXHJcbik6IEFycmF5PHN0cmluZyB8IFJlYWN0LkVsZW1lbnQ8YW55Pj4ge1xyXG4gIGlmICh0eXBlb2YgdGV4dCAhPT0gJ3N0cmluZycpIHtcclxuICAgIHJldHVybiBbXTtcclxuICB9XHJcbiAgY29uc3QgY2h1bmtzID0gW107XHJcbiAgbGV0IGxhc3RJbmRleCA9IDA7XHJcbiAgbGV0IGluZGV4ID0gMDtcclxuICB3aGlsZSAodHJ1ZSkge1xyXG4gICAgY29uc3QgbWF0Y2ggPSBDTElDS0FCTEVfUkUuZXhlYyh0ZXh0KTtcclxuICAgIGlmIChtYXRjaCA9PSBudWxsKSB7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IG1hdGNoZWRUZXh0ID0gbWF0Y2hbMF07XHJcblxyXG4gICAgLy8gQWRkIGFsbCB0aGUgdGV4dCBzaW5jZSBvdXIgbGFzdCBtYXRjaC5cclxuICAgIGNodW5rcy5wdXNoKFxyXG4gICAgICB0ZXh0LnNsaWNlKGxhc3RJbmRleCwgQ0xJQ0tBQkxFX1JFLmxhc3RJbmRleCAtIG1hdGNoZWRUZXh0Lmxlbmd0aCksXHJcbiAgICApO1xyXG4gICAgbGFzdEluZGV4ID0gQ0xJQ0tBQkxFX1JFLmxhc3RJbmRleDtcclxuXHJcbiAgICBsZXQgaHJlZjtcclxuICAgIGxldCBoYW5kbGVPbkNsaWNrO1xyXG4gICAgaWYgKG1hdGNoWzFdICE9IG51bGwpIHtcclxuICAgICAgLy8gSXQncyBhIGRpZmZcclxuICAgICAgY29uc3QgdXJsID0gdG9TdHJpbmcoXHJcbiAgICAgICAgZmVhdHVyZUNvbmZpZy5nZXQoJ2F0b20taWRlLWNvbnNvbGUuZGlmZlVybFBhdHRlcm4nKSxcclxuICAgICAgKTtcclxuICAgICAgaWYgKHVybCAhPT0gJycpIHtcclxuICAgICAgICBocmVmID0gdXJsLnJlcGxhY2UoJyVzJywgbWF0Y2hlZFRleHQpO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2UgaWYgKG1hdGNoWzJdICE9IG51bGwpIHtcclxuICAgICAgLy8gSXQncyBhIHRhc2tcclxuICAgICAgY29uc3QgdXJsID0gdG9TdHJpbmcoXHJcbiAgICAgICAgZmVhdHVyZUNvbmZpZy5nZXQoJ2F0b20taWRlLWNvbnNvbGUudGFza1VybFBhdHRlcm4nKSxcclxuICAgICAgKTtcclxuICAgICAgaWYgKHVybCAhPT0gJycpIHtcclxuICAgICAgICBocmVmID0gdXJsLnJlcGxhY2UoJyVzJywgbWF0Y2hlZFRleHQuc2xpY2UoMSkpO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2UgaWYgKG1hdGNoWzNdICE9IG51bGwpIHtcclxuICAgICAgLy8gSXQncyBhIFVSTFxyXG4gICAgICBocmVmID0gbWF0Y2hlZFRleHQ7XHJcbiAgICB9XHJcblxyXG4gICAgY2h1bmtzLnB1c2goXHJcbiAgICAgIC8vIGZsb3dsaW50LW5leHQtbGluZSBza2V0Y2h5LW51bGwtc3RyaW5nOm9mZlxyXG4gICAgICBocmVmID8gKFxyXG4gICAgICAgIDxhXHJcbiAgICAgICAgICBrZXk9e2ByJHtpbmRleH1gfVxyXG4gICAgICAgICAgaHJlZj17aHJlZn1cclxuICAgICAgICAgIHRhcmdldD1cIl9ibGFua1wiXHJcbiAgICAgICAgICBvbkNsaWNrPXtoYW5kbGVPbkNsaWNrfT5cclxuICAgICAgICAgIHttYXRjaGVkVGV4dH1cclxuICAgICAgICA8L2E+XHJcbiAgICAgICkgOiAoXHJcbiAgICAgICAgbWF0Y2hlZFRleHRcclxuICAgICAgKSxcclxuICAgICk7XHJcblxyXG4gICAgaW5kZXgrKztcclxuICB9XHJcblxyXG4gIC8vIEFkZCBhbnkgcmVtYWluaW5nIHRleHQuXHJcbiAgY2h1bmtzLnB1c2godGV4dC5zbGljZShsYXN0SW5kZXgpKTtcclxuXHJcbiAgcmV0dXJuIGNodW5rcztcclxufVxyXG4iXX0=