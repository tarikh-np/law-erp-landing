const { test } = require('node:test');
const assert = require('node:assert/strict');

// Replicate core validation logic from js/lead-form.js
function validateLead(data) {
  const errors = {};

  if (!data.userName || data.userName.trim().length < 2) {
    errors.userName = 'Please enter your full name.';
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailPattern.test(data.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }

  const phonePattern = /^[\d\s+\-()]{7,20}$/;
  if (!data.phone || !phonePattern.test(data.phone.trim())) {
    errors.phone = 'Please enter a valid phone number (minimum 7 digits).';
  }

  return errors;
}

test('valid lead data passes validation', () => {
  const valid = {
    firmName: 'Kathmandu Law Chamber',
    userName: 'Advocate Ramesh Bhatta',
    email: 'ramesh@lawchamber.np',
    phone: '+977 9851234567',
    staffCount: '6-15',
    description: 'We need court hearing and Peshi date reminders for Supreme Court and Patan High Court.'
  };

  const errors = validateLead(valid);
  assert.equal(Object.keys(errors).length, 0);
});

test('missing required fields are caught', () => {
  const invalid = {
    firmName: 'Only Firm Name Provided',
    userName: '',
    email: 'not-an-email',
    phone: '123'
  };

  const errors = validateLead(invalid);
  assert.ok(errors.userName, 'Should require user name');
  assert.ok(errors.email, 'Should reject invalid email');
  assert.ok(errors.phone, 'Should require at least 7 digits for phone');
});

test('optional fields do not trigger validation failure', () => {
  const minimal = {
    userName: 'Sita Sharma',
    email: 'sita@example.com',
    phone: '9841000000'
  };

  const errors = validateLead(minimal);
  assert.equal(Object.keys(errors).length, 0);
});

