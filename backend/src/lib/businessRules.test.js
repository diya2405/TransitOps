import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTripAssignment } from './businessRules.js';

test('allows a valid trip assignment when vehicle and driver are available', () => {
  const result = validateTripAssignment(
    { status: 'available', max_load_capacity_kg: 500 },
    { status: 'available', license_expiry_date: '2030-01-01' },
    450
  );

  assert.equal(result.ok, true);
  assert.deepEqual(result.reasons, []);
});

test('rejects a trip assignment when driver is suspended or license is expired', () => {
  const result = validateTripAssignment(
    { status: 'available', max_load_capacity_kg: 500 },
    { status: 'suspended', license_expiry_date: '2020-01-01' },
    450
  );

  assert.equal(result.ok, false);
  assert.match(result.reasons.join(' '), /Driver/i);
});
