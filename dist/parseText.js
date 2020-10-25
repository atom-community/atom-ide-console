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

const DIFF_PATTERN = "\\b[dD][1-9][0-9]{5,}\\b";
const TASK_PATTERN = "\\b[tT]\\d+\\b";
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
const CLICKABLE_RE = new RegExp(CLICKABLE_PATTERNS, "g");

function toString(value) {
  return typeof value === "string" ? value : "";
}
/**
 * Parse special entities into links. In the future, it would be great to add a service so that we
 * could add new clickable things and to allow providers to mark specific ranges as links to things
 * that only they can know (e.g. relative paths output in BUCK messages). For now, however, we'll
 * just use some pattern settings and hardcode the patterns we care about.
 */


function parseText(text) {
  if (typeof text !== "string") {
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
      const url = toString(_featureConfig.default.get("atom-ide-console.diffUrlPattern"));

      if (url !== "") {
        href = url.replace("%s", matchedText);
      }
    } else if (match[2] != null) {
      // It's a task
      const url = toString(_featureConfig.default.get("atom-ide-console.taskUrlPattern"));

      if (url !== "") {
        href = url.replace("%s", matchedText.slice(1));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBhcnNlVGV4dC5qcyJdLCJuYW1lcyI6WyJESUZGX1BBVFRFUk4iLCJUQVNLX1BBVFRFUk4iLCJDTElDS0FCTEVfUEFUVEVSTlMiLCJVUkxfUkVHRVgiLCJzb3VyY2UiLCJDTElDS0FCTEVfUkUiLCJSZWdFeHAiLCJ0b1N0cmluZyIsInZhbHVlIiwicGFyc2VUZXh0IiwidGV4dCIsImNodW5rcyIsImxhc3RJbmRleCIsImluZGV4IiwibWF0Y2giLCJleGVjIiwibWF0Y2hlZFRleHQiLCJwdXNoIiwic2xpY2UiLCJsZW5ndGgiLCJocmVmIiwiaGFuZGxlT25DbGljayIsInVybCIsImZlYXR1cmVDb25maWciLCJnZXQiLCJyZXBsYWNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7O0FBQ0E7O0FBRUE7Ozs7Ozs7O0FBQ0EsTUFBTUEsWUFBWSxHQUFHLDBCQUFyQjtBQUNBLE1BQU1DLFlBQVksR0FBRyxnQkFBckI7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBQ0EsTUFBTUMsa0JBQWtCLEdBQUksSUFBR0YsWUFBYSxNQUFLQyxZQUFhLE1BQUtFLGtCQUFVQyxNQUFPLEdBQXBGO0FBQ0EsTUFBTUMsWUFBWSxHQUFHLElBQUlDLE1BQUosQ0FBV0osa0JBQVgsRUFBK0IsR0FBL0IsQ0FBckI7O0FBRUEsU0FBU0ssUUFBVCxDQUFrQkMsS0FBbEIsRUFBd0M7QUFDdEMsU0FBTyxPQUFPQSxLQUFQLEtBQWlCLFFBQWpCLEdBQTRCQSxLQUE1QixHQUFvQyxFQUEzQztBQUNEO0FBRUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUFDZSxTQUFTQyxTQUFULENBQW1CQyxJQUFuQixFQUFxRTtBQUNsRixNQUFJLE9BQU9BLElBQVAsS0FBZ0IsUUFBcEIsRUFBOEI7QUFDNUIsV0FBTyxFQUFQO0FBQ0Q7O0FBQ0QsUUFBTUMsTUFBTSxHQUFHLEVBQWY7QUFDQSxNQUFJQyxTQUFTLEdBQUcsQ0FBaEI7QUFDQSxNQUFJQyxLQUFLLEdBQUcsQ0FBWjs7QUFDQSxTQUFPLElBQVAsRUFBYTtBQUNYLFVBQU1DLEtBQUssR0FBR1QsWUFBWSxDQUFDVSxJQUFiLENBQWtCTCxJQUFsQixDQUFkOztBQUNBLFFBQUlJLEtBQUssSUFBSSxJQUFiLEVBQW1CO0FBQ2pCO0FBQ0Q7O0FBRUQsVUFBTUUsV0FBVyxHQUFHRixLQUFLLENBQUMsQ0FBRCxDQUF6QixDQU5XLENBUVg7O0FBQ0FILElBQUFBLE1BQU0sQ0FBQ00sSUFBUCxDQUFZUCxJQUFJLENBQUNRLEtBQUwsQ0FBV04sU0FBWCxFQUFzQlAsWUFBWSxDQUFDTyxTQUFiLEdBQXlCSSxXQUFXLENBQUNHLE1BQTNELENBQVo7QUFDQVAsSUFBQUEsU0FBUyxHQUFHUCxZQUFZLENBQUNPLFNBQXpCO0FBRUEsUUFBSVEsSUFBSjtBQUNBLFFBQUlDLGFBQUo7O0FBQ0EsUUFBSVAsS0FBSyxDQUFDLENBQUQsQ0FBTCxJQUFZLElBQWhCLEVBQXNCO0FBQ3BCO0FBQ0EsWUFBTVEsR0FBRyxHQUFHZixRQUFRLENBQUNnQix1QkFBY0MsR0FBZCxDQUFrQixpQ0FBbEIsQ0FBRCxDQUFwQjs7QUFDQSxVQUFJRixHQUFHLEtBQUssRUFBWixFQUFnQjtBQUNkRixRQUFBQSxJQUFJLEdBQUdFLEdBQUcsQ0FBQ0csT0FBSixDQUFZLElBQVosRUFBa0JULFdBQWxCLENBQVA7QUFDRDtBQUNGLEtBTkQsTUFNTyxJQUFJRixLQUFLLENBQUMsQ0FBRCxDQUFMLElBQVksSUFBaEIsRUFBc0I7QUFDM0I7QUFDQSxZQUFNUSxHQUFHLEdBQUdmLFFBQVEsQ0FBQ2dCLHVCQUFjQyxHQUFkLENBQWtCLGlDQUFsQixDQUFELENBQXBCOztBQUNBLFVBQUlGLEdBQUcsS0FBSyxFQUFaLEVBQWdCO0FBQ2RGLFFBQUFBLElBQUksR0FBR0UsR0FBRyxDQUFDRyxPQUFKLENBQVksSUFBWixFQUFrQlQsV0FBVyxDQUFDRSxLQUFaLENBQWtCLENBQWxCLENBQWxCLENBQVA7QUFDRDtBQUNGLEtBTk0sTUFNQSxJQUFJSixLQUFLLENBQUMsQ0FBRCxDQUFMLElBQVksSUFBaEIsRUFBc0I7QUFDM0I7QUFDQU0sTUFBQUEsSUFBSSxHQUFHSixXQUFQO0FBQ0Q7O0FBRURMLElBQUFBLE1BQU0sQ0FBQ00sSUFBUCxFQUNFO0FBQ0FHLElBQUFBLElBQUksZ0JBQ0Y7QUFBRyxNQUFBLEdBQUcsRUFBRyxJQUFHUCxLQUFNLEVBQWxCO0FBQXFCLE1BQUEsSUFBSSxFQUFFTyxJQUEzQjtBQUFpQyxNQUFBLE1BQU0sRUFBQyxRQUF4QztBQUFpRCxNQUFBLE9BQU8sRUFBRUM7QUFBMUQsT0FDR0wsV0FESCxDQURFLEdBS0ZBLFdBUEo7QUFXQUgsSUFBQUEsS0FBSztBQUNOLEdBbERpRixDQW9EbEY7OztBQUNBRixFQUFBQSxNQUFNLENBQUNNLElBQVAsQ0FBWVAsSUFBSSxDQUFDUSxLQUFMLENBQVdOLFNBQVgsQ0FBWjtBQUVBLFNBQU9ELE1BQVA7QUFDRCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gXCJyZWFjdFwiXG5pbXBvcnQgZmVhdHVyZUNvbmZpZyBmcm9tIFwiQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtYXRvbS9mZWF0dXJlLWNvbmZpZ1wiXG5cbmltcG9ydCB7IFVSTF9SRUdFWCB9IGZyb20gXCJAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy9zdHJpbmdcIlxuY29uc3QgRElGRl9QQVRURVJOID0gXCJcXFxcYltkRF1bMS05XVswLTldezUsfVxcXFxiXCJcbmNvbnN0IFRBU0tfUEFUVEVSTiA9IFwiXFxcXGJbdFRdXFxcXGQrXFxcXGJcIlxuXG4vKipcbiAqIFRoaXMgZG9lcyBOT1QgY29udGFpbiBhIHBhdHRlcm4gdG8gbWF0Y2ggZmlsZSByZWZlcmVuY2VzLiBUaGlzIGlzIGJlY2F1c2UgZmlsZSBwYXRocyBkbyBub3RcbiAqIGNvbnRhaW4gc3VmZmljaWVudCBpbmZvcm1hdGlvbiB0byBsb2NhdGUgYSBmaWxlLiBDb25zaWRlciBgYi9jL2QudHh0YC4gV2hhdCBpcyBpdCByZWxhdGl2ZSB0bz9cbiAqIE9ubHkgdGhlIHRoaW5nIHRoYXQgZ2VuZXJhdGVkIHRoZSBtZXNzYWdlIGtub3dzLiBFdmVuIGFic29sdXRlIHBhdGhzIGFyZW4ndCBlbm91Z2guIChBcmUgdGhleVxuICogbG9jYWw/IFJlbW90ZT8gV2hpY2ggaG9zdD8pIEluIGFkZGl0aW9uLCBwYXR0ZXJuIG1hdGNoaW5nIGZpbGVuYW1lcyBpc24ndCByZWxpYWJsZSAoYGIudHh0YCxcbiAqIGBiLmNvbWApLiBUaGUgdXBzaG90IGlzIHRoYXQgXCJiZXN0IGd1ZXNzXCIgc29sdXRpb25zIGFkZCBtb3JlIGNvbmZ1c2lvbiB0aGFuIGNvbnZlbmllbmNlOyBhIHByb3BlclxuICogc29sdXRpb24gcHJvYmFibHkgcmVxdWlyZXMgYm90aCBzdGFuZGFyZGl6YXRpb24gb24gcmVtb3RlIHBhdGggKGUuZy4gTnVjbGlkZVVyaXMpIGFuZCBzb21lXG4gKiBtZWNoYW5pc20gZm9yIG1lc3NhZ2UgY3JlYXRvcnMgdG8gbWFyayB1cCB0aGVpciBtZXNzYWdlcyB3aXRoIHRoaXMgaW5mb3JtYXRpb24gKGUuZy4gYDxhPmApLlxuICovXG5jb25zdCBDTElDS0FCTEVfUEFUVEVSTlMgPSBgKCR7RElGRl9QQVRURVJOfSl8KCR7VEFTS19QQVRURVJOfSl8KCR7VVJMX1JFR0VYLnNvdXJjZX0pYFxuY29uc3QgQ0xJQ0tBQkxFX1JFID0gbmV3IFJlZ0V4cChDTElDS0FCTEVfUEFUVEVSTlMsIFwiZ1wiKVxuXG5mdW5jdGlvbiB0b1N0cmluZyh2YWx1ZTogbWl4ZWQpOiBzdHJpbmcge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiID8gdmFsdWUgOiBcIlwiXG59XG5cbi8qKlxuICogUGFyc2Ugc3BlY2lhbCBlbnRpdGllcyBpbnRvIGxpbmtzLiBJbiB0aGUgZnV0dXJlLCBpdCB3b3VsZCBiZSBncmVhdCB0byBhZGQgYSBzZXJ2aWNlIHNvIHRoYXQgd2VcbiAqIGNvdWxkIGFkZCBuZXcgY2xpY2thYmxlIHRoaW5ncyBhbmQgdG8gYWxsb3cgcHJvdmlkZXJzIHRvIG1hcmsgc3BlY2lmaWMgcmFuZ2VzIGFzIGxpbmtzIHRvIHRoaW5nc1xuICogdGhhdCBvbmx5IHRoZXkgY2FuIGtub3cgKGUuZy4gcmVsYXRpdmUgcGF0aHMgb3V0cHV0IGluIEJVQ0sgbWVzc2FnZXMpLiBGb3Igbm93LCBob3dldmVyLCB3ZSdsbFxuICoganVzdCB1c2Ugc29tZSBwYXR0ZXJuIHNldHRpbmdzIGFuZCBoYXJkY29kZSB0aGUgcGF0dGVybnMgd2UgY2FyZSBhYm91dC5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gcGFyc2VUZXh0KHRleHQ6IHN0cmluZyk6IEFycmF5PHN0cmluZyB8IFJlYWN0LkVsZW1lbnQ8YW55Pj4ge1xuICBpZiAodHlwZW9mIHRleHQgIT09IFwic3RyaW5nXCIpIHtcbiAgICByZXR1cm4gW11cbiAgfVxuICBjb25zdCBjaHVua3MgPSBbXVxuICBsZXQgbGFzdEluZGV4ID0gMFxuICBsZXQgaW5kZXggPSAwXG4gIHdoaWxlICh0cnVlKSB7XG4gICAgY29uc3QgbWF0Y2ggPSBDTElDS0FCTEVfUkUuZXhlYyh0ZXh0KVxuICAgIGlmIChtYXRjaCA9PSBudWxsKSB7XG4gICAgICBicmVha1xuICAgIH1cblxuICAgIGNvbnN0IG1hdGNoZWRUZXh0ID0gbWF0Y2hbMF1cblxuICAgIC8vIEFkZCBhbGwgdGhlIHRleHQgc2luY2Ugb3VyIGxhc3QgbWF0Y2guXG4gICAgY2h1bmtzLnB1c2godGV4dC5zbGljZShsYXN0SW5kZXgsIENMSUNLQUJMRV9SRS5sYXN0SW5kZXggLSBtYXRjaGVkVGV4dC5sZW5ndGgpKVxuICAgIGxhc3RJbmRleCA9IENMSUNLQUJMRV9SRS5sYXN0SW5kZXhcblxuICAgIGxldCBocmVmXG4gICAgbGV0IGhhbmRsZU9uQ2xpY2tcbiAgICBpZiAobWF0Y2hbMV0gIT0gbnVsbCkge1xuICAgICAgLy8gSXQncyBhIGRpZmZcbiAgICAgIGNvbnN0IHVybCA9IHRvU3RyaW5nKGZlYXR1cmVDb25maWcuZ2V0KFwiYXRvbS1pZGUtY29uc29sZS5kaWZmVXJsUGF0dGVyblwiKSlcbiAgICAgIGlmICh1cmwgIT09IFwiXCIpIHtcbiAgICAgICAgaHJlZiA9IHVybC5yZXBsYWNlKFwiJXNcIiwgbWF0Y2hlZFRleHQpXG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChtYXRjaFsyXSAhPSBudWxsKSB7XG4gICAgICAvLyBJdCdzIGEgdGFza1xuICAgICAgY29uc3QgdXJsID0gdG9TdHJpbmcoZmVhdHVyZUNvbmZpZy5nZXQoXCJhdG9tLWlkZS1jb25zb2xlLnRhc2tVcmxQYXR0ZXJuXCIpKVxuICAgICAgaWYgKHVybCAhPT0gXCJcIikge1xuICAgICAgICBocmVmID0gdXJsLnJlcGxhY2UoXCIlc1wiLCBtYXRjaGVkVGV4dC5zbGljZSgxKSlcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG1hdGNoWzNdICE9IG51bGwpIHtcbiAgICAgIC8vIEl0J3MgYSBVUkxcbiAgICAgIGhyZWYgPSBtYXRjaGVkVGV4dFxuICAgIH1cblxuICAgIGNodW5rcy5wdXNoKFxuICAgICAgLy8gZmxvd2xpbnQtbmV4dC1saW5lIHNrZXRjaHktbnVsbC1zdHJpbmc6b2ZmXG4gICAgICBocmVmID8gKFxuICAgICAgICA8YSBrZXk9e2ByJHtpbmRleH1gfSBocmVmPXtocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiBvbkNsaWNrPXtoYW5kbGVPbkNsaWNrfT5cbiAgICAgICAgICB7bWF0Y2hlZFRleHR9XG4gICAgICAgIDwvYT5cbiAgICAgICkgOiAoXG4gICAgICAgIG1hdGNoZWRUZXh0XG4gICAgICApXG4gICAgKVxuXG4gICAgaW5kZXgrK1xuICB9XG5cbiAgLy8gQWRkIGFueSByZW1haW5pbmcgdGV4dC5cbiAgY2h1bmtzLnB1c2godGV4dC5zbGljZShsYXN0SW5kZXgpKVxuXG4gIHJldHVybiBjaHVua3Ncbn1cbiJdfQ==