"use strict";

function debounce(fn, delay) {
  let timer = null;

  return function (...args) {

    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);

  };
}
const input = document.getElementById("search");
const log = document.getElementById("log");

function searchHandler(event) {
  const value = event.target.value;
  log.textContent = "Searching for: " + value;
}

const debouncedSearch = debounce(searchHandler, 500);

input.addEventListener("input", debouncedSearch);