"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getAllRecords = getAllRecords;
exports.getCurrentExecutorId = getCurrentExecutorId;

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
function getAllRecords(state) {
  const {
    records,
    incompleteRecords
  } = state;
  return records.concat(incompleteRecords);
}

function getCurrentExecutorId(state) {
  let {
    currentExecutorId
  } = state;

  if (currentExecutorId == null) {
    const firstExecutor = Array.from(state.executors.values())[0];
    currentExecutorId = firstExecutor && firstExecutor.id;
  }

  return currentExecutorId;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlNlbGVjdG9ycy5qcyJdLCJuYW1lcyI6WyJnZXRBbGxSZWNvcmRzIiwic3RhdGUiLCJyZWNvcmRzIiwiaW5jb21wbGV0ZVJlY29yZHMiLCJjb25jYXQiLCJnZXRDdXJyZW50RXhlY3V0b3JJZCIsImN1cnJlbnRFeGVjdXRvcklkIiwiZmlyc3RFeGVjdXRvciIsIkFycmF5IiwiZnJvbSIsImV4ZWN1dG9ycyIsInZhbHVlcyIsImlkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFLTyxTQUFTQSxhQUFULENBQXVCQyxLQUF2QixFQUFzRDtBQUMzRCxRQUFNO0FBQUNDLElBQUFBLE9BQUQ7QUFBVUMsSUFBQUE7QUFBVixNQUErQkYsS0FBckM7QUFDQSxTQUFPQyxPQUFPLENBQUNFLE1BQVIsQ0FBZUQsaUJBQWYsQ0FBUDtBQUNEOztBQUVNLFNBQVNFLG9CQUFULENBQThCSixLQUE5QixFQUF3RDtBQUM3RCxNQUFJO0FBQUNLLElBQUFBO0FBQUQsTUFBc0JMLEtBQTFCOztBQUNBLE1BQUlLLGlCQUFpQixJQUFJLElBQXpCLEVBQStCO0FBQzdCLFVBQU1DLGFBQWEsR0FBR0MsS0FBSyxDQUFDQyxJQUFOLENBQVdSLEtBQUssQ0FBQ1MsU0FBTixDQUFnQkMsTUFBaEIsRUFBWCxFQUFxQyxDQUFyQyxDQUF0QjtBQUNBTCxJQUFBQSxpQkFBaUIsR0FBR0MsYUFBYSxJQUFJQSxhQUFhLENBQUNLLEVBQW5EO0FBQ0Q7O0FBQ0QsU0FBT04saUJBQVA7QUFDRCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE3LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqXG4gKiBAZmxvdyBzdHJpY3QtbG9jYWxcbiAqIEBmb3JtYXRcbiAqL1xuXG5pbXBvcnQgdHlwZSB7QXBwU3RhdGUsIFJlY29yZH0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0IHR5cGUge0xpc3R9IGZyb20gJ2ltbXV0YWJsZSc7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRBbGxSZWNvcmRzKHN0YXRlOiBBcHBTdGF0ZSk6IExpc3Q8UmVjb3JkPiB7XG4gIGNvbnN0IHtyZWNvcmRzLCBpbmNvbXBsZXRlUmVjb3Jkc30gPSBzdGF0ZTtcbiAgcmV0dXJuIHJlY29yZHMuY29uY2F0KGluY29tcGxldGVSZWNvcmRzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRFeGVjdXRvcklkKHN0YXRlOiBBcHBTdGF0ZSk6ID9zdHJpbmcge1xuICBsZXQge2N1cnJlbnRFeGVjdXRvcklkfSA9IHN0YXRlO1xuICBpZiAoY3VycmVudEV4ZWN1dG9ySWQgPT0gbnVsbCkge1xuICAgIGNvbnN0IGZpcnN0RXhlY3V0b3IgPSBBcnJheS5mcm9tKHN0YXRlLmV4ZWN1dG9ycy52YWx1ZXMoKSlbMF07XG4gICAgY3VycmVudEV4ZWN1dG9ySWQgPSBmaXJzdEV4ZWN1dG9yICYmIGZpcnN0RXhlY3V0b3IuaWQ7XG4gIH1cbiAgcmV0dXJuIGN1cnJlbnRFeGVjdXRvcklkO1xufVxuIl19