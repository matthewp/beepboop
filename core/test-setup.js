import QUnit from 'qunit';
import { Window } from 'happy-dom';

// Make QUnit global for test files
globalThis.QUnit = QUnit;

// Setup Happy DOM
const window = new Window();
const document = window.document;

// Make DOM globals available
globalThis.window = window;
globalThis.document = document;
globalThis.HTMLElement = window.HTMLElement;
globalThis.Element = window.Element;