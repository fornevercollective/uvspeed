// beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
// History — Universal Timeline Search | Background Service Worker
// Cross-browser: Chrome, Edge, Brave, Opera, Arc, Vivaldi, Firefox
'use strict';

// Cross-browser API
const _runtime = (typeof browser !== 'undefined' && browser.runtime) ? browser.runtime : chrome.runtime;
const _storage = (typeof browser !== 'undefined' && browser.storage) ? browser.storage : chrome.storage;
const _tabs = (typeof browser !== 'undefined' && browser.tabs) ? browser.tabs : chrome.tabs;

_runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('History Search extension installed — v1.1.0');
        _storage.local.set({
            connectors: new Array(14).fill(true),
            settings: {
                autoExpand: true,
                showTimeline: true,
                maxResults: 50,
                theme: 'dark',
                auto: true,
            }
        });
    }
});

_runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'get-settings') {
        _storage.local.get(['connectors', 'settings'], data => {
            sendResponse(data);
        });
        return true;
    }
    if (msg.type === 'open-history') {
        _tabs.create({ url: msg.url || 'https://fornevercollective.github.io/uvspeed/web/history.html' });
    }
    if (msg.type === 'open-search') {
        _tabs.create({ url: msg.url || 'https://fornevercollective.github.io/uvspeed/web/search.html' });
    }
});
