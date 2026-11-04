/**
 * Tarikh Lead Generation Form Controller
 *
 * Handles form validation, UI states, and persistence to Supabase or Firebase Firestore.
 * Supports zero-dependency REST submission to both Supabase and Firebase.
 *
 * CONFIGURATION:
 * Configure your Supabase or Firebase project details below.
 * If keys are left empty or with placeholder values, the form operates in local demo mode,
 * securely persisting leads to localStorage and providing immediate UI feedback.
 */
(function () {
  'use strict';

  const CONFIG = {
    // Database provider: 'supabase' | 'firebase' | 'local'
    provider: 'supabase',

    // Supabase Configuration
    supabase: {
      url: 'https://pygqvqeddxvafuvuqncs.supabase.co', // Project base URL
      anonKey: 'sb_publishable_Rier8Ilx7yStBbva400RMA_RhPXfUcF', // Your public anon key
      table: 'leads'
    },

    // Firebase Firestore Configuration (uses Firestore REST API, zero SDK required)
    firebase: {
      projectId: '', // e.g. 'tarikh-law-erp'
      apiKey: '', // Web API key
      collection: 'leads'
    }
  };

  /**
   * Check if the configured provider has valid credentials
   */
  function isConfigured(provider) {
    if (provider === 'supabase') {
      return Boolean(CONFIG.supabase.url && CONFIG.supabase.anonKey && !CONFIG.supabase.url.includes('YOUR_'));
    }
    if (provider === 'firebase') {
      return Boolean(CONFIG.firebase.projectId && !CONFIG.firebase.projectId.includes('YOUR_'));
    }
    return false;
  }

  /**
   * Save lead to Supabase via PostgREST API
   */
  async function saveToSupabase(lead) {
    let baseUrl = (CONFIG.supabase.url || '').trim().replace(/\/+$/, '');
    if (baseUrl.endsWith('/rest/v1')) {
      baseUrl = baseUrl.slice(0, -'/rest/v1'.length);
    }
    const endpoint = `${baseUrl}/rest/v1/${CONFIG.supabase.table}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'apikey': CONFIG.supabase.anonKey,
        'Authorization': `Bearer ${CONFIG.supabase.anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        firm_name: lead.firmName || null,
        user_name: lead.userName,
        email: lead.email,
        phone: lead.phone,
        total_staff: lead.staffCount || null,
        description: lead.description || null,
        source_url: lead.sourceUrl,
        created_at: lead.createdAt
      })
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Supabase request failed (${response.status}): ${errText}`);
    }
  }

  /**
   * Save lead to Firebase Firestore via standard Google REST API
   */
  async function saveToFirebase(lead) {
    const url = `https://firestore.googleapis.com/v1/projects/${CONFIG.firebase.projectId}/databases/(default)/documents/${CONFIG.firebase.collection}${CONFIG.firebase.apiKey ? `?key=${CONFIG.firebase.apiKey}` : ''}`;

    const fields = {
      user_name: { stringValue: lead.userName },
      email: { stringValue: lead.email },
      phone: { stringValue: lead.phone },
      source_url: { stringValue: lead.sourceUrl },
      created_at: { timestampValue: lead.createdAt }
    };

    if (lead.firmName) fields.firm_name = { stringValue: lead.firmName };
    if (lead.staffCount) fields.total_staff = { stringValue: lead.staffCount };
    if (lead.description) fields.description = { stringValue: lead.description };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Firebase request failed (${response.status}): ${errText}`);
    }
  }

  /**
   * Demo / Local fallback when database credentials are not set yet
   */
  async function saveToLocal(lead) {
    // Artificial network latency for realistic feel
    await new Promise((resolve) => setTimeout(resolve, 600));

    try {
      const existing = JSON.parse(localStorage.getItem('tarikh_leads') || '[]');
      existing.push(lead);
      localStorage.setItem('tarikh_leads', JSON.stringify(existing));
      console.info('[Tarikh Lead Form] Saved lead locally to localStorage (demo mode):', lead);
    } catch {
      // Ignore localStorage quotas or private mode issues
    }
  }

  /**
   * Submit lead to whichever database is configured
   */
  async function submitLead(lead) {
    const provider = CONFIG.provider;

    if (provider === 'supabase' && isConfigured('supabase')) {
      return saveToSupabase(lead);
    }

    if (provider === 'firebase' && isConfigured('firebase')) {
      return saveToFirebase(lead);
    }

    // Default to local mock mode with helpful console note
    console.warn(`[Tarikh Lead Form] Running in demo mode. Configure CONFIG in /js/lead-form.js to connect live ${provider}.`);
    return saveToLocal(lead);
  }

  /**
   * Validate lead data
   */
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

  /**
   * Initialize a lead form instance
   */
  function initForm(form) {
    const submitBtn = form.querySelector('[type="submit"]');
    const alertError = form.querySelector('.lead-form__alert--error');
    const alertSuccess = form.querySelector('.lead-form__alert--success');
    const formFields = form.querySelector('.lead-form__body');

    function clearFieldError(input) {
      input.classList.remove('is-invalid');
      input.removeAttribute('aria-invalid');
      const errSpan = form.querySelector(`#${input.id}Error`);
      if (errSpan) {
        errSpan.textContent = '';
      }
    }

    function setFieldError(input, message) {
      input.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
      const errSpan = form.querySelector(`#${input.id}Error`);
      if (errSpan) {
        errSpan.textContent = message;
      }
    }

    // Clear inline error on input change
    form.querySelectorAll('input, select, textarea').forEach((input) => {
      input.addEventListener('input', () => {
        clearFieldError(input);
        if (alertError) {
          alertError.hidden = true;
          alertError.textContent = '';
        }
      });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Check honeypot for spam bots
      const honeypot = form.querySelector('input[name="_gotcha"]');
      if (honeypot && honeypot.value) {
        // Silently succeed for bots
        if (formFields) formFields.hidden = true;
        if (alertSuccess) alertSuccess.hidden = false;
        return;
      }

      // Collect values
      const formData = new FormData(form);
      const data = {
        firmName: (formData.get('firmName') || '').toString().trim(),
        userName: (formData.get('userName') || '').toString().trim(),
        email: (formData.get('email') || '').toString().trim(),
        phone: (formData.get('phone') || '').toString().trim(),
        staffCount: (formData.get('staffCount') || '').toString().trim(),
        description: (formData.get('description') || '').toString().trim(),
        sourceUrl: window.location.href,
        createdAt: new Date().toISOString()
      };

      // Reset previous error messages
      form.querySelectorAll('.is-invalid').forEach(clearFieldError);
      if (alertError) {
        alertError.hidden = true;
        alertError.textContent = '';
      }

      // Client-side validation
      const errors = validateLead(data);
      const errorKeys = Object.keys(errors);

      if (errorKeys.length > 0) {
        let firstInput = null;
        errorKeys.forEach((key) => {
          const input = form.querySelector(`[name="${key === 'userName' ? 'userName' : key}"]`);
          if (input) {
            setFieldError(input, errors[key]);
            if (!firstInput) firstInput = input;
          }
        });
        if (firstInput) firstInput.focus();
        return;
      }

      // Loading state
      form.classList.add('is-submitting');
      if (submitBtn) {
        submitBtn.disabled = true;
      }

      try {
        await submitLead(data);

        // Success state
        form.classList.remove('is-submitting');
        if (formFields) formFields.hidden = true;
        if (alertSuccess) {
          alertSuccess.hidden = false;
          alertSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        form.reset();
      } catch (err) {
        console.error('[Tarikh Lead Form Error]', err);
        form.classList.remove('is-submitting');
        if (submitBtn) submitBtn.disabled = false;
        if (alertError) {
          alertError.hidden = false;
          alertError.textContent = 'Unable to send your request right now. Please check your connection and try again.';
        }
      }
    });
  }

  // Auto-init all lead forms on the page
  document.addEventListener('DOMContentLoaded', () => {
    const forms = document.querySelectorAll('form[data-lead-form]');
    forms.forEach(initForm);
  });

  // Expose configuration globally if needed for runtime configuration
  window.TarikhLeadForm = {
    configure: function (newConfig) {
      Object.assign(CONFIG, newConfig);
    },
    getConfig: function () {
      return { ...CONFIG };
    }
  };
})();