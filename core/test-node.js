#!/usr/bin/env node

// Setup QUnit global first
import './test-setup.js';
import QUnit from 'qunit';

// Import test files
import './test/init.test.js';
import './test/nested-assign.test.js';
import './test/props.test.js';
import './test/standard-schema.test.js';
import './test/invoke.test.js';
import './test/child-actors.test.js';

// Setup callbacks to see test progress
QUnit.testDone((details) => {
  if (details.failed > 0) {
    console.log(`❌ ${details.module} > ${details.name}`);
    details.assertions.forEach(assertion => {
      if (!assertion.result) {
        console.log(`   ${assertion.message}`);
      }
    });
  } else {
    console.log(`✅ ${details.module} > ${details.name}`);
  }
});

QUnit.done((details) => {
  console.log(`\nTotal: ${details.total}, Failed: ${details.failed}, Passed: ${details.passed}`);
  process.exit(details.failed > 0 ? 1 : 0);
});

// Run the tests
QUnit.start();