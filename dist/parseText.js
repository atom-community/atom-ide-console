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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBhcnNlVGV4dC5qcyJdLCJuYW1lcyI6WyJESUZGX1BBVFRFUk4iLCJUQVNLX1BBVFRFUk4iLCJDTElDS0FCTEVfUEFUVEVSTlMiLCJVUkxfUkVHRVgiLCJzb3VyY2UiLCJDTElDS0FCTEVfUkUiLCJSZWdFeHAiLCJ0b1N0cmluZyIsInZhbHVlIiwicGFyc2VUZXh0IiwidGV4dCIsImNodW5rcyIsImxhc3RJbmRleCIsImluZGV4IiwibWF0Y2giLCJleGVjIiwibWF0Y2hlZFRleHQiLCJwdXNoIiwic2xpY2UiLCJsZW5ndGgiLCJocmVmIiwiaGFuZGxlT25DbGljayIsInVybCIsImZlYXR1cmVDb25maWciLCJnZXQiLCJyZXBsYWNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7O0FBQ0E7O0FBRUE7Ozs7Ozs7O0FBQ0EsTUFBTUEsWUFBWSxHQUFHLDBCQUFyQjtBQUNBLE1BQU1DLFlBQVksR0FBRyxnQkFBckI7QUFFQTs7Ozs7Ozs7OztBQVNBLE1BQU1DLGtCQUFrQixHQUFJLElBQUdGLFlBQWEsTUFBS0MsWUFBYSxNQUFLRSxrQkFBVUMsTUFBTyxHQUFwRjtBQUNBLE1BQU1DLFlBQVksR0FBRyxJQUFJQyxNQUFKLENBQVdKLGtCQUFYLEVBQStCLEdBQS9CLENBQXJCOztBQUVBLFNBQVNLLFFBQVQsQ0FBa0JDLEtBQWxCLEVBQXdDO0FBQ3RDLFNBQU8sT0FBT0EsS0FBUCxLQUFpQixRQUFqQixHQUE0QkEsS0FBNUIsR0FBb0MsRUFBM0M7QUFDRDtBQUVEOzs7Ozs7OztBQU1lLFNBQVNDLFNBQVQsQ0FBbUJDLElBQW5CLEVBQXFFO0FBQ2xGLE1BQUksT0FBT0EsSUFBUCxLQUFnQixRQUFwQixFQUE4QjtBQUM1QixXQUFPLEVBQVA7QUFDRDs7QUFDRCxRQUFNQyxNQUFNLEdBQUcsRUFBZjtBQUNBLE1BQUlDLFNBQVMsR0FBRyxDQUFoQjtBQUNBLE1BQUlDLEtBQUssR0FBRyxDQUFaOztBQUNBLFNBQU8sSUFBUCxFQUFhO0FBQ1gsVUFBTUMsS0FBSyxHQUFHVCxZQUFZLENBQUNVLElBQWIsQ0FBa0JMLElBQWxCLENBQWQ7O0FBQ0EsUUFBSUksS0FBSyxJQUFJLElBQWIsRUFBbUI7QUFDakI7QUFDRDs7QUFFRCxVQUFNRSxXQUFXLEdBQUdGLEtBQUssQ0FBQyxDQUFELENBQXpCLENBTlcsQ0FRWDs7QUFDQUgsSUFBQUEsTUFBTSxDQUFDTSxJQUFQLENBQVlQLElBQUksQ0FBQ1EsS0FBTCxDQUFXTixTQUFYLEVBQXNCUCxZQUFZLENBQUNPLFNBQWIsR0FBeUJJLFdBQVcsQ0FBQ0csTUFBM0QsQ0FBWjtBQUNBUCxJQUFBQSxTQUFTLEdBQUdQLFlBQVksQ0FBQ08sU0FBekI7QUFFQSxRQUFJUSxJQUFKO0FBQ0EsUUFBSUMsYUFBSjs7QUFDQSxRQUFJUCxLQUFLLENBQUMsQ0FBRCxDQUFMLElBQVksSUFBaEIsRUFBc0I7QUFDcEI7QUFDQSxZQUFNUSxHQUFHLEdBQUdmLFFBQVEsQ0FBQ2dCLHVCQUFjQyxHQUFkLENBQWtCLGlDQUFsQixDQUFELENBQXBCOztBQUNBLFVBQUlGLEdBQUcsS0FBSyxFQUFaLEVBQWdCO0FBQ2RGLFFBQUFBLElBQUksR0FBR0UsR0FBRyxDQUFDRyxPQUFKLENBQVksSUFBWixFQUFrQlQsV0FBbEIsQ0FBUDtBQUNEO0FBQ0YsS0FORCxNQU1PLElBQUlGLEtBQUssQ0FBQyxDQUFELENBQUwsSUFBWSxJQUFoQixFQUFzQjtBQUMzQjtBQUNBLFlBQU1RLEdBQUcsR0FBR2YsUUFBUSxDQUFDZ0IsdUJBQWNDLEdBQWQsQ0FBa0IsaUNBQWxCLENBQUQsQ0FBcEI7O0FBQ0EsVUFBSUYsR0FBRyxLQUFLLEVBQVosRUFBZ0I7QUFDZEYsUUFBQUEsSUFBSSxHQUFHRSxHQUFHLENBQUNHLE9BQUosQ0FBWSxJQUFaLEVBQWtCVCxXQUFXLENBQUNFLEtBQVosQ0FBa0IsQ0FBbEIsQ0FBbEIsQ0FBUDtBQUNEO0FBQ0YsS0FOTSxNQU1BLElBQUlKLEtBQUssQ0FBQyxDQUFELENBQUwsSUFBWSxJQUFoQixFQUFzQjtBQUMzQjtBQUNBTSxNQUFBQSxJQUFJLEdBQUdKLFdBQVA7QUFDRDs7QUFFREwsSUFBQUEsTUFBTSxDQUFDTSxJQUFQLEVBQ0U7QUFDQUcsSUFBQUEsSUFBSSxnQkFDRjtBQUFHLE1BQUEsR0FBRyxFQUFHLElBQUdQLEtBQU0sRUFBbEI7QUFBcUIsTUFBQSxJQUFJLEVBQUVPLElBQTNCO0FBQWlDLE1BQUEsTUFBTSxFQUFDLFFBQXhDO0FBQWlELE1BQUEsT0FBTyxFQUFFQztBQUExRCxPQUNHTCxXQURILENBREUsR0FLRkEsV0FQSjtBQVdBSCxJQUFBQSxLQUFLO0FBQ04sR0FsRGlGLENBb0RsRjs7O0FBQ0FGLEVBQUFBLE1BQU0sQ0FBQ00sSUFBUCxDQUFZUCxJQUFJLENBQUNRLEtBQUwsQ0FBV04sU0FBWCxDQUFaO0FBRUEsU0FBT0QsTUFBUDtBQUNEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSBcInJlYWN0XCJcbmltcG9ydCBmZWF0dXJlQ29uZmlnIGZyb20gXCJAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy1hdG9tL2ZlYXR1cmUtY29uZmlnXCJcblxuaW1wb3J0IHsgVVJMX1JFR0VYIH0gZnJvbSBcIkBhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zL3N0cmluZ1wiXG5jb25zdCBESUZGX1BBVFRFUk4gPSBcIlxcXFxiW2REXVsxLTldWzAtOV17NSx9XFxcXGJcIlxuY29uc3QgVEFTS19QQVRURVJOID0gXCJcXFxcYlt0VF1cXFxcZCtcXFxcYlwiXG5cbi8qKlxuICogVGhpcyBkb2VzIE5PVCBjb250YWluIGEgcGF0dGVybiB0byBtYXRjaCBmaWxlIHJlZmVyZW5jZXMuIFRoaXMgaXMgYmVjYXVzZSBmaWxlIHBhdGhzIGRvIG5vdFxuICogY29udGFpbiBzdWZmaWNpZW50IGluZm9ybWF0aW9uIHRvIGxvY2F0ZSBhIGZpbGUuIENvbnNpZGVyIGBiL2MvZC50eHRgLiBXaGF0IGlzIGl0IHJlbGF0aXZlIHRvP1xuICogT25seSB0aGUgdGhpbmcgdGhhdCBnZW5lcmF0ZWQgdGhlIG1lc3NhZ2Uga25vd3MuIEV2ZW4gYWJzb2x1dGUgcGF0aHMgYXJlbid0IGVub3VnaC4gKEFyZSB0aGV5XG4gKiBsb2NhbD8gUmVtb3RlPyBXaGljaCBob3N0PykgSW4gYWRkaXRpb24sIHBhdHRlcm4gbWF0Y2hpbmcgZmlsZW5hbWVzIGlzbid0IHJlbGlhYmxlIChgYi50eHRgLFxuICogYGIuY29tYCkuIFRoZSB1cHNob3QgaXMgdGhhdCBcImJlc3QgZ3Vlc3NcIiBzb2x1dGlvbnMgYWRkIG1vcmUgY29uZnVzaW9uIHRoYW4gY29udmVuaWVuY2U7IGEgcHJvcGVyXG4gKiBzb2x1dGlvbiBwcm9iYWJseSByZXF1aXJlcyBib3RoIHN0YW5kYXJkaXphdGlvbiBvbiByZW1vdGUgcGF0aCAoZS5nLiBOdWNsaWRlVXJpcykgYW5kIHNvbWVcbiAqIG1lY2hhbmlzbSBmb3IgbWVzc2FnZSBjcmVhdG9ycyB0byBtYXJrIHVwIHRoZWlyIG1lc3NhZ2VzIHdpdGggdGhpcyBpbmZvcm1hdGlvbiAoZS5nLiBgPGE+YCkuXG4gKi9cbmNvbnN0IENMSUNLQUJMRV9QQVRURVJOUyA9IGAoJHtESUZGX1BBVFRFUk59KXwoJHtUQVNLX1BBVFRFUk59KXwoJHtVUkxfUkVHRVguc291cmNlfSlgXG5jb25zdCBDTElDS0FCTEVfUkUgPSBuZXcgUmVnRXhwKENMSUNLQUJMRV9QQVRURVJOUywgXCJnXCIpXG5cbmZ1bmN0aW9uIHRvU3RyaW5nKHZhbHVlOiBtaXhlZCk6IHN0cmluZyB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIgPyB2YWx1ZSA6IFwiXCJcbn1cblxuLyoqXG4gKiBQYXJzZSBzcGVjaWFsIGVudGl0aWVzIGludG8gbGlua3MuIEluIHRoZSBmdXR1cmUsIGl0IHdvdWxkIGJlIGdyZWF0IHRvIGFkZCBhIHNlcnZpY2Ugc28gdGhhdCB3ZVxuICogY291bGQgYWRkIG5ldyBjbGlja2FibGUgdGhpbmdzIGFuZCB0byBhbGxvdyBwcm92aWRlcnMgdG8gbWFyayBzcGVjaWZpYyByYW5nZXMgYXMgbGlua3MgdG8gdGhpbmdzXG4gKiB0aGF0IG9ubHkgdGhleSBjYW4ga25vdyAoZS5nLiByZWxhdGl2ZSBwYXRocyBvdXRwdXQgaW4gQlVDSyBtZXNzYWdlcykuIEZvciBub3csIGhvd2V2ZXIsIHdlJ2xsXG4gKiBqdXN0IHVzZSBzb21lIHBhdHRlcm4gc2V0dGluZ3MgYW5kIGhhcmRjb2RlIHRoZSBwYXR0ZXJucyB3ZSBjYXJlIGFib3V0LlxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBwYXJzZVRleHQodGV4dDogc3RyaW5nKTogQXJyYXk8c3RyaW5nIHwgUmVhY3QuRWxlbWVudDxhbnk+PiB7XG4gIGlmICh0eXBlb2YgdGV4dCAhPT0gXCJzdHJpbmdcIikge1xuICAgIHJldHVybiBbXVxuICB9XG4gIGNvbnN0IGNodW5rcyA9IFtdXG4gIGxldCBsYXN0SW5kZXggPSAwXG4gIGxldCBpbmRleCA9IDBcbiAgd2hpbGUgKHRydWUpIHtcbiAgICBjb25zdCBtYXRjaCA9IENMSUNLQUJMRV9SRS5leGVjKHRleHQpXG4gICAgaWYgKG1hdGNoID09IG51bGwpIHtcbiAgICAgIGJyZWFrXG4gICAgfVxuXG4gICAgY29uc3QgbWF0Y2hlZFRleHQgPSBtYXRjaFswXVxuXG4gICAgLy8gQWRkIGFsbCB0aGUgdGV4dCBzaW5jZSBvdXIgbGFzdCBtYXRjaC5cbiAgICBjaHVua3MucHVzaCh0ZXh0LnNsaWNlKGxhc3RJbmRleCwgQ0xJQ0tBQkxFX1JFLmxhc3RJbmRleCAtIG1hdGNoZWRUZXh0Lmxlbmd0aCkpXG4gICAgbGFzdEluZGV4ID0gQ0xJQ0tBQkxFX1JFLmxhc3RJbmRleFxuXG4gICAgbGV0IGhyZWZcbiAgICBsZXQgaGFuZGxlT25DbGlja1xuICAgIGlmIChtYXRjaFsxXSAhPSBudWxsKSB7XG4gICAgICAvLyBJdCdzIGEgZGlmZlxuICAgICAgY29uc3QgdXJsID0gdG9TdHJpbmcoZmVhdHVyZUNvbmZpZy5nZXQoXCJhdG9tLWlkZS1jb25zb2xlLmRpZmZVcmxQYXR0ZXJuXCIpKVxuICAgICAgaWYgKHVybCAhPT0gXCJcIikge1xuICAgICAgICBocmVmID0gdXJsLnJlcGxhY2UoXCIlc1wiLCBtYXRjaGVkVGV4dClcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG1hdGNoWzJdICE9IG51bGwpIHtcbiAgICAgIC8vIEl0J3MgYSB0YXNrXG4gICAgICBjb25zdCB1cmwgPSB0b1N0cmluZyhmZWF0dXJlQ29uZmlnLmdldChcImF0b20taWRlLWNvbnNvbGUudGFza1VybFBhdHRlcm5cIikpXG4gICAgICBpZiAodXJsICE9PSBcIlwiKSB7XG4gICAgICAgIGhyZWYgPSB1cmwucmVwbGFjZShcIiVzXCIsIG1hdGNoZWRUZXh0LnNsaWNlKDEpKVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAobWF0Y2hbM10gIT0gbnVsbCkge1xuICAgICAgLy8gSXQncyBhIFVSTFxuICAgICAgaHJlZiA9IG1hdGNoZWRUZXh0XG4gICAgfVxuXG4gICAgY2h1bmtzLnB1c2goXG4gICAgICAvLyBmbG93bGludC1uZXh0LWxpbmUgc2tldGNoeS1udWxsLXN0cmluZzpvZmZcbiAgICAgIGhyZWYgPyAoXG4gICAgICAgIDxhIGtleT17YHIke2luZGV4fWB9IGhyZWY9e2hyZWZ9IHRhcmdldD1cIl9ibGFua1wiIG9uQ2xpY2s9e2hhbmRsZU9uQ2xpY2t9PlxuICAgICAgICAgIHttYXRjaGVkVGV4dH1cbiAgICAgICAgPC9hPlxuICAgICAgKSA6IChcbiAgICAgICAgbWF0Y2hlZFRleHRcbiAgICAgIClcbiAgICApXG5cbiAgICBpbmRleCsrXG4gIH1cblxuICAvLyBBZGQgYW55IHJlbWFpbmluZyB0ZXh0LlxuICBjaHVua3MucHVzaCh0ZXh0LnNsaWNlKGxhc3RJbmRleCkpXG5cbiAgcmV0dXJuIGNodW5rc1xufVxuIl19