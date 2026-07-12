import test from 'node:test';
import assert from 'node:assert/strict';
import { validateVehiclePayload, validateDriverPayload, validateFuelPayload, validateExpensePayload } from '../src/lib/validation.js';

test('vehicle validation accepts a complete payload', () => {
  const result = validateVehiclePayload({
    registration_number: 'GJ-01-XX-9999',
    name_model: 'Tata Ace',
    type: 'Car',
    max_load_capacity_kg: 600,
    odometer_km: 1000,
    acquisition_cost: 700000,
    region: 'West',
  });

  assert.deepEqual(result.errors, []);
});

test('driver validation rejects expired or invalid license data', () => {
  const result = validateDriverPayload({
    name: 'Asha',
    license_number: 'DL-100',
    license_category: 'Truck',
    license_expiry_date: '2020-01-01',
    safety_score: 120,
  });

  assert.ok(result.errors.some((message) => message.includes('license_expiry_date')));
  assert.ok(result.errors.some((message) => message.includes('safety_score')));
});

test('fuel validation rejects missing vehicle and negative cost', () => {
  const result = validateFuelPayload({ vehicle_id: '', liters: 20, cost: -10, date: '2026-07-12' });

  assert.ok(result.errors.some((message) => message.includes('vehicle_id')));
  assert.ok(result.errors.some((message) => message.includes('cost')));
});

test('expense validation requires a supported type', () => {
  const result = validateExpensePayload({ vehicle_id: '123', type: 'invalid', amount: 100, date: '2026-07-12' });

  assert.ok(result.errors.some((message) => message.includes('type')));
});
