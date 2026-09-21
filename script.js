/* ===========================================================
   POORNA'S KITCHEN — STAFF CONSOLE
   Vanilla JS + Supabase
   Staff loyalty and customer management console.
   =========================================================== */

   /* =========================================================
   SUPABASE
   ========================================================= */

const SUPABASE_URL = 'https://nrcpqirndrdacefwsivm.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_hhdvw9nakoi213RX9tXXPQ_rKSdeeLC';

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storage: window.localStorage
    }
  }
);
console.log('Supabase connected:', !!supabaseClient);

(function () {
  'use strict';

  /* -------------------------------------------------------
     1. CONSTANTS
  ------------------------------------------------------- */
  var CYCLE_LENGTH = 5;            // stamps on the printed card
  var DEFAULT_DISCOUNT = 10;       // pre-filled percentage only
 var TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];




  async function loadAppData() {
  try {
    const [
      customersResult,
      visitsResult,
      rewardsResult
    ] = await Promise.all([
      supabaseClient
        .from('customers')
        .select(`
          id,
          name,
          phone,
          created_at,
          last_visit_at,
          lifetime_visits,
          current_cycle_visits,
          rewards_earned,
          is_active
        `)
        .order('last_visit_at', { ascending: false }),

      supabaseClient
        .from('visits')
        .select(`
          id,
          customer_id,
          visit_at,
          visit_number,
          cycle_number,
          cycle_position
        `)
        .order('visit_at', { ascending: false }),

      supabaseClient
        .from('rewards')
        .select(`
          id,
          customer_id,
          visit_id,
          bill_amount,
          discount_percentage,
          discount_amount,
          final_amount,
          created_at,
          status
        `)
        .order('created_at', { ascending: false })
    ]);

    if (customersResult.error) {
      throw customersResult.error;
    }

    if (visitsResult.error) {
      throw visitsResult.error;
    }

    if (rewardsResult.error) {
      throw rewardsResult.error;
    }

    state.customers = customersResult.data.map(function (row) {
      return {
        id: row.id,
        name: row.name,
        phone: row.phone,
        createdAt: row.created_at ? new Date(row.created_at) : null,
        lastVisit: row.last_visit_at ? new Date(row.last_visit_at) : null,
        lifetimeVisits: row.lifetime_visits,
        cycleVisits: row.current_cycle_visits,
        rewardsEarned: row.rewards_earned,
        status: row.is_active ? 'active' : 'archived'
      };
    });

    state.visits = visitsResult.data.map(function (row) {
      var visitDate = row.visit_at ? new Date(row.visit_at) : new Date();

      return {
        id: row.id,
        customerId: row.customer_id,
        date: visitDate,
        time: visitDate.toLocaleTimeString('en-IN', {
          hour: 'numeric',
          minute: '2-digit'
        }),
        visitNumber: row.visit_number,
        cycleNumber: row.cycle_number,
        cyclePosition: row.cycle_position
      };
    });

    state.rewards = rewardsResult.data.map(function (row) {
      return {
        id: row.id,
        customerId: row.customer_id,
        visitId: row.visit_id,
        bill: Number(row.bill_amount),
        pct: Number(row.discount_percentage),
        discount: Number(row.discount_amount),
        final: Number(row.final_amount),
        date: row.created_at ? new Date(row.created_at) : new Date(),
        status: row.status
      };
    });

    console.log('Supabase app data loaded:', {
      customers: state.customers.length,
      visits: state.visits.length,
      rewards: state.rewards.length
    });

    return true;

  } catch (err) {
    console.error('Unable to load app data from Supabase:', err);

    toast(
      'Unable to load loyalty data. Please refresh and try again.',
      'error'
    );

    return false;
  }
}

/* -------------------------------------------------------
   2. APPLICATION STATE
------------------------------------------------------- */
var state = {
  customers: [],
  visits: [],
  rewards: []
};


  /* -------------------------------------------------------
     3. SMALL HELPERS
  ------------------------------------------------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function pad(n, w) { var s = String(n); while (s.length < w) s = '0' + s; return s; }
  function esc(str) {
    return String(str).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }
  function fmtDate(d) { return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }
  function sameDay(a, b) { return a.toDateString() === b.toDateString(); }
  function isoDay(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1, 2) + '-' + pad(d.getDate(), 2); }
  function rupees(n) { return '\u20B9' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 }); }
  function initials(name) {
    var p = name.trim().split(/\s+/);
    return ((p[0] || '')[0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
  }
 
  function plural(n, word) { return n + ' ' + word + (n === 1 ? '' : 's'); }
  function byId(id) { return state.customers.filter(function (c) { return c.id === id; })[0]; }
  function activeCustomers() { return state.customers.filter(function (c) { return c.status === 'active'; }); }
  
  async function findCustomerByPhone(phone) {
  const { data, error } = await supabaseClient
    .from('customers')
    .select(`
      id,
      name,
      phone,
      created_at,
      last_visit_at,
      lifetime_visits,
      current_cycle_visits,
      rewards_earned,
      is_active
    `)
    .eq('phone', phone)
.maybeSingle();
  if (error) {
    console.error('Customer lookup failed:', error);
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    phone: data.phone,
    createdAt: data.created_at ? new Date(data.created_at) : null,
    lastVisit: data.last_visit_at ? new Date(data.last_visit_at) : null,
    lifetimeVisits: data.lifetime_visits,
    cycleVisits: data.current_cycle_visits,
    rewardsEarned: data.rewards_earned,
    status: data.is_active ? 'active' : 'archived'
  };
}
  function relativeDay(d) {
    if (sameDay(d, TODAY)) return 'Today';
    if (sameDay(d, new Date(TODAY.getTime() - 86400000))) return 'Yesterday';
    return fmtDate(d);
  }

  /* -------------------------------------------------------
     4. VALIDATION
  ------------------------------------------------------- */
  var PHONE_RE = /^[6-9]\d{9}$/;
  function validPhone(v) { return PHONE_RE.test(String(v).trim()); }
  function validName(v) { return String(v).trim().length >= 2; }

  function setFieldError(input, errEl, message) {
    if (message) {
      input.setAttribute('aria-invalid', 'true');
      errEl.textContent = message;
      errEl.hidden = false;
    } else {
      input.removeAttribute('aria-invalid');
      errEl.hidden = true;
      errEl.textContent = '';
    }
  }

  /* -------------------------------------------------------
     5. TOASTS
  ------------------------------------------------------- */
  function toast(message, kind) {
    kind = kind || 'success';
    var icon = kind === 'error' ? 'i-alert' : (kind === 'info' ? 'i-alert' : 'i-check');
    var el = document.createElement('div');
    el.className = 'toast ' + kind;
    el.innerHTML = '<svg class="ico"><use href="#' + icon + '"></use></svg><span>' + esc(message) + '</span>';
    $('#toasts').appendChild(el);
    setTimeout(function () {
      el.style.transition = 'opacity .25s'; el.style.opacity = '0';
      setTimeout(function () { el.remove(); }, 260);
    }, 3200);
  }

  /* -------------------------------------------------------
     6. MODAL MANAGER — exactly one modal, ever
  ------------------------------------------------------- */
  var lastFocus = null;
  function openModal(html, opts) {
    opts = opts || {};
    closeModal(true);                       // guarantees no stacking
    lastFocus = document.activeElement;
    var modal = $('#modal');
    modal.className = 'modal' + (opts.wide ? ' wide' : '');
    modal.innerHTML = html;
    $('#modal-layer').hidden = false;
    document.body.style.overflow = 'hidden';
    var focusTarget = modal.querySelector('[data-autofocus]') || modal.querySelector('button, input');
    if (focusTarget) focusTarget.focus();
    if (opts.onOpen) opts.onOpen(modal);
  }
  function closeModal(silent) {
    var layer = $('#modal-layer');
    if (layer.hidden) return;
    layer.hidden = true;
    $('#modal').innerHTML = '';
    document.body.style.overflow = '';
    if (!silent && lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }
  function modalOpen() { return !$('#modal-layer').hidden; }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modalOpen()) { closeModal(); }
    if (e.key === 'Tab' && modalOpen()) {
      var f = $$('button, input, select, [tabindex]:not([tabindex="-1"])', $('#modal'))
        .filter(function (el) { return !el.disabled && el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  document.addEventListener('click', function (e) {
    if (e.target.hasAttribute && e.target.hasAttribute('data-modal-dismiss')) closeModal();
  });

  /* -------------------------------------------------------
     7. ROUTER — one screen visible at a time
  ------------------------------------------------------- */
  var TITLES = {
    dashboard: 'Dashboard', search: 'Find customer', profile: 'Customer',
    'add-customer': 'Add customer', customers: 'Customers', visits: 'Visit history',
    rewards: 'Rewards', reports: 'Reports', settings: 'Settings'
  };
  var current = 'dashboard';
  var currentCustomerId = null;

  function navigate(name, arg) {
    closeModal(true);
    current = name;
    $$('.screen').forEach(function (s) { s.hidden = true; });
    var el = $('#screen-' + name);
    if (el) el.hidden = false;
    $$('.sb-link').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-goto') === name);
    });
    $('#topbar-title').textContent = TITLES[name] || '';
    closeNav();
    window.scrollTo(0, 0);

    if (name === 'dashboard') renderDashboard();
    if (name === 'customers') renderCustomers();
    if (name === 'visits') renderVisits();
    if (name === 'rewards') renderRewards();
    if (name === 'profile') { if (arg) currentCustomerId = arg; renderProfile(); }
    if (name === 'search') resetSearch();
    if (name === 'add-customer') resetAddCustomer();
  }

  function openNav() { $('#app').classList.add('nav-open'); $('#sb-scrim').hidden = false; }
  function closeNav() { $('#app').classList.remove('nav-open'); $('#sb-scrim').hidden = true; }

  /* -------------------------------------------------------
     8. SHARED RENDER PIECES
  ------------------------------------------------------- */
  function dotsHTML(count, large) {
    var out = '<div class="dots' + (large ? ' dots-lg' : '') + '">';
    for (var i = 1; i <= CYCLE_LENGTH; i++) {
      var on = i <= count;
      var cls = on ? (count === CYCLE_LENGTH ? 'dot ready' : 'dot on') : 'dot';
      out += '<span class="' + cls + '" data-slot="' + i + '">' +
        (large && on ? '<svg class="ico"><use href="#i-check"></use></svg>' : '') + '</span>';
    }
    return out + '</div>';
  }
  function loyaltyHTML(c) {
    return '<div class="loyalty">' + dotsHTML(c.cycleVisits) +
      '<span class="loyalty-count">' + c.cycleVisits + ' / ' + CYCLE_LENGTH + '</span></div>';
  }
  function emptyHTML(icon, title, body, ctaLabel, ctaGoto) {
    return '<div class="empty"><svg class="ico"><use href="#' + icon + '"></use></svg>' +
      '<h3>' + esc(title) + '</h3><p>' + esc(body) + '</p>' +
      (ctaLabel ? '<button class="btn btn-primary" data-goto="' + ctaGoto + '">' + esc(ctaLabel) + '</button>' : '') +
      '</div>';
  }
  function loadingHTML(rows) {
    var out = '<div class="skeleton loading-rows">';
    for (var i = 0; i < (rows || 4); i++) out += '<div class="sk-line"></div>';
    return out + '</div>';
  }

  /* -------------------------------------------------------
     9. DASHBOARD
  ------------------------------------------------------- */
  function renderDashboard() {
    $('#dash-date').textContent = fmtDate(TODAY);

    var todays = state.visits.filter(function (v) { return sameDay(v.date, TODAY); }).length;
    var monthly = state.visits.filter(function (v) {
      return v.date.getMonth() === TODAY.getMonth() && v.date.getFullYear() === TODAY.getFullYear();
    }).length;
    var rewardTotal = state.rewards.filter(function (r) { return r.status === 'completed'; });
    var given = rewardTotal.reduce(function (s, r) { return s + r.discount; }, 0);

    $('#dash-metrics').innerHTML = [
      metric('Visits today', todays, 'Stamps given at the counter', true),
      metric('Active customers', activeCustomers().length, 'On the loyalty programme'),
      metric('Rewards given', rewardTotal.length, rupees(given) + ' discounted in total'),
      metric('Visits this month', monthly, MONTHS[TODAY.getMonth()] + ' ' + TODAY.getFullYear())
    ].join('');

    var recent = state.visits.filter(function (v) {
  var c = byId(v.customerId);
  return c && c.status === 'active';
}).slice(0, 6);
    $('#dash-recent').innerHTML = recent.length ? '<div class="rows">' + recent.map(function (v) {
      var c = byId(v.customerId);
      if (!c) return '';
      return '<button class="row linkish" data-open-customer="' + c.id + '">' +
        '<span class="avatar">' + esc(initials(c.name)) + '</span>' +
        '<span class="row-main"><strong>' + esc(c.name) + '</strong><span>Visit ' + v.visitNumber + ' \u00B7 ' + esc(c.phone) + '</span></span>' +
        '<span class="row-meta">' + relativeDay(v.date) + ', ' + v.time + '</span></button>';
    }).join('') + '</div>'
      : emptyHTML('i-history', 'No visits yet today', 'Visits appear here as soon as you record them at the counter.');

    var near = activeCustomers().filter(function (c) { return c.cycleVisits >= CYCLE_LENGTH - 1; })
      .sort(function (a, b) { return b.cycleVisits - a.cycleVisits; }).slice(0, 4);
    $('#dash-near').innerHTML = near.length
      ? '<h3>Close to a reward</h3>' + near.map(function (c) {
        return '<div class="near-item"><span>' + esc(c.name) + '</span>' +
          '<span class="loyalty-count">' + c.cycleVisits + ' / ' + CYCLE_LENGTH + '</span></div>';
      }).join('')
      : '<h3>Close to a reward</h3><div class="near-item"><span>Nobody is on their fourth stamp right now.</span></div>';
  }
  function metric(label, value, foot, accent) {
    return '<div class="metric' + (accent ? ' is-accent' : '') + '">' +
      '<p class="metric-label">' + esc(label) + '</p>' +
      '<p class="metric-value">' + value + '</p>' +
      '<p class="metric-foot">' + esc(foot) + '</p></div>';
  }

  /* -------------------------------------------------------
     10. SEARCH
  ------------------------------------------------------- */
  function resetSearch() {
    $('#search-phone').value = '';
    setFieldError($('#search-phone'), $('#search-err'), '');
    $('#search-result').innerHTML = '';
  }

  function runSearch() {
    var input = $('#search-phone');
    var phone = input.value.trim();
    if (!validPhone(phone)) {
      setFieldError(input, $('#search-err'), 'Enter a valid 10-digit mobile number.');
      $('#search-result').innerHTML = '';
      input.focus();
      return;
    }
    setFieldError(input, $('#search-err'), '');
    $('#search-result').innerHTML = loadingHTML(3);

    setTimeout(async function () {
  var c = await findCustomerByPhone(phone);
     if (c && c.status === 'archived') {
  $('#search-result').innerHTML =
    '<div class="result-card">' +
      '<div class="profile-id">' +
        '<span class="avatar-xl">' + esc(initials(c.name)) + '</span>' +
        '<div>' +
          '<p class="profile-name" style="font-size:24px">' + esc(c.name) + '</p>' +
          '<p class="profile-phone">' + esc(c.phone) + '</p>' +
        '</div>' +
      '</div>' +

      '<div class="notice notice-warn">' +
        '<svg class="ico"><use href="#i-alert"></use></svg>' +
        '<div>' +
          '<strong>Archived customer</strong>' +
         '<p>This customer was deleted from the active loyalty list. Their previous loyalty history is still preserved.</p>' +
          '<div class="notice-actions">' +
            '<button class="btn btn-primary btn-sm" data-restore-customer="' + c.id + '">' +
              'Restore customer' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

} else if (c) {
        $('#search-result').innerHTML =
          '<div class="result-card">' +
          '<div class="profile-id"><span class="avatar-xl">' + esc(initials(c.name)) + '</span>' +
          '<div><p class="profile-name" style="font-size:24px">' + esc(c.name) + '</p>' +
          '<p class="profile-phone">' + esc(c.phone) + '</p></div></div>' +
          loyaltyHTML(c) +
          '<p class="metric-foot">Lifetime visits ' + c.lifetimeVisits + ' \u00B7 Rewards ' + c.rewardsEarned +
          ' \u00B7 Last visit ' + relativeDay(c.lastVisit) + '</p>' +
          '<div class="form-actions" style="margin-top:16px">' +
          '<button class="btn btn-primary" data-open-customer="' + c.id + '">Open customer</button>' +
          '<button class="btn btn-quiet" data-add-visit="' + c.id + '">Add visit</button>' +
          '</div></div>';
      } else {
        $('#search-result').innerHTML =
          '<div class="notice notice-warn"><svg class="ico"><use href="#i-alert"></use></svg><div>' +
          '<strong>No customer with that number</strong>' +
          '<p>' + esc(phone) + ' is not on the loyalty programme yet. Create the record and give them a card.</p>' +
          '<div class="notice-actions">' +
          '<button class="btn btn-primary btn-sm" data-new-with="' + esc(phone) + '">Add new customer</button>' +
          '<button class="btn btn-quiet btn-sm" data-goto="search">Search again</button>' +
          '</div></div></div>';
      }
    }, 420);
  }

  /* -------------------------------------------------------
     11. ADD CUSTOMER
  ------------------------------------------------------- */
  function resetAddCustomer(prefillPhone) {
    $('#add-name').value = '';
    $('#add-phone').value = prefillPhone || '';
    setFieldError($('#add-name'), $('#add-name-err'), '');
    setFieldError($('#add-phone'), $('#add-phone-err'), '');
    $('#dup-notice').hidden = true;
    $('#dup-notice').innerHTML = '';
    $('#add-success').hidden = true;
    $('#add-success').innerHTML = '';
    $('#add-form').hidden = false;
  }

async function submitAddCustomer() {
  var nameEl = $('#add-name');
  var phoneEl = $('#add-phone');

  var name = nameEl.value.trim();
  var phone = phoneEl.value.trim();

  var ok = true;

  /* -----------------------------
     Validate name
     ----------------------------- */
  if (!validName(name)) {
    setFieldError(
      nameEl,
      $('#add-name-err'),
      'Enter the customer’s name.'
    );
    ok = false;
  } else {
    setFieldError(nameEl, $('#add-name-err'), '');
  }

  /* -----------------------------
     Validate phone
     ----------------------------- */
  if (!phone) {
    setFieldError(
      phoneEl,
      $('#add-phone-err'),
      'Phone number is required.'
    );
    ok = false;
  } else if (!validPhone(phone)) {
    setFieldError(
      phoneEl,
      $('#add-phone-err'),
      'Enter a valid 10-digit mobile number.'
    );
    ok = false;
  } else {
    setFieldError(phoneEl, $('#add-phone-err'), '');
  }

  $('#dup-notice').hidden = true;

  if (!ok) {
    (nameEl.getAttribute('aria-invalid') ? nameEl : phoneEl).focus();
    return;
  }

  /* -----------------------------
     Make sure staff is signed in
     ----------------------------- */
  const {
    data: sessionData,
    error: sessionError
  } = await supabaseClient.auth.getSession();

  if (sessionError || !sessionData.session) {
    console.error('Session check failed:', sessionError);

    toast(
      'Your session has expired. Please sign in again.',
      'error'
    );

    showLoginScreen();
    return;
  }

  /* -----------------------------
     Check duplicate directly in DB
     ----------------------------- */
  const {
    data: existing,
    error: lookupError
  } = await supabaseClient
    .from('customers')
    .select('id, name, phone, is_active')
    .eq('phone', phone)
    .maybeSingle();

  if (lookupError) {
    console.error('Customer duplicate check failed:', lookupError);

    toast(
      'Unable to check this phone number. Please try again.',
      'error'
    );

    return;
  }

 if (existing) {
  var dup = $('#dup-notice');

  dup.hidden = false;

  if (existing.is_active) {

    dup.innerHTML =
      '<div class="notice notice-error">' +
        '<svg class="ico">' +
          '<use href="#i-alert"></use>' +
        '</svg>' +

        '<div>' +
          '<strong>Customer already exists</strong>' +

          '<p>' +
            esc(phone) +
            ' belongs to ' +
            esc(existing.name) +
            '. Open their record instead of creating a second one.' +
          '</p>' +

          '<div class="notice-actions">' +
            '<button class="btn btn-primary btn-sm" ' +
              'data-open-customer="' +
              existing.id +
            '">' +
              'View customer' +
            '</button>' +
          '</div>' +

        '</div>' +
      '</div>';

  } else {

    dup.innerHTML =
      '<div class="notice notice-warn">' +
        '<svg class="ico">' +
          '<use href="#i-alert"></use>' +
        '</svg>' +

        '<div>' +
          '<strong>Archived customer found</strong>' +

          '<p>' +
            esc(phone) +
            ' belongs to the archived customer ' +
            '<strong>' + esc(existing.name) + '</strong>.' +
            ' Restore their existing loyalty record instead of creating a duplicate.' +
          '</p>' +

          '<div class="notice-actions">' +
            '<button class="btn btn-primary btn-sm" ' +
              'data-restore-customer="' +
              existing.id +
            '">' +
              'Restore customer' +
            '</button>' +
          '</div>' +

        '</div>' +
      '</div>';
  }

  return;
}

  /* -----------------------------
     Create customer + first visit
     in ONE Supabase transaction
     ----------------------------- */
  try {

    const {
      data,
      error
    } = await supabaseClient.rpc(
      'add_customer_with_first_visit',
      {
        p_name: name,
        p_phone: phone
      }
    );

    if (error) {
      console.error('Add customer RPC failed:', error);

      toast(
        'Could not create the customer. Please try again.',
        'error'
      );

      return;
    }

    if (!data || !data.customer || !data.visit) {
      console.error('Unexpected RPC response:', data);

      toast(
        'Customer creation returned an unexpected result.',
        'error'
      );

      return;
    }

    /* -----------------------------
       Convert DB customer to
       existing UI format
       ----------------------------- */
    var c = {
      id: data.customer.id,
      name: data.customer.name,
      phone: data.customer.phone,

      createdAt: data.customer.created_at
        ? new Date(data.customer.created_at)
        : new Date(),

      lastVisit: data.customer.last_visit_at
        ? new Date(data.customer.last_visit_at)
        : new Date(),

      lifetimeVisits: data.customer.lifetime_visits,
      cycleVisits: data.customer.current_cycle_visits,
      rewardsEarned: data.customer.rewards_earned,

      status: data.customer.is_active
        ? 'active'
        : 'archived'
    };

    /* -----------------------------
       Add returned records to the
       current UI cache
       ----------------------------- */
    state.customers.push(c);

    state.visits.unshift({
      id: data.visit.id,
      customerId: data.visit.customer_id,
      date: new Date(data.visit.visit_at),
      time: new Date(data.visit.visit_at).toLocaleTimeString(
        'en-IN',
        {
          hour: 'numeric',
          minute: '2-digit'
        }
      ),
      visitNumber: data.visit.visit_number,
      cycleNumber: data.visit.cycle_number
    });

    /* -----------------------------
       Show success state
       ----------------------------- */
    $('#add-form').hidden = true;

    var success = $('#add-success');

    success.hidden = false;

    success.innerHTML =
      '<div class="notice notice-success">' +
        '<svg class="ico">' +
          '<use href="#i-check"></use>' +
        '</svg>' +

        '<div>' +
          '<strong>Customer created</strong>' +
          '<p>' +
            esc(c.name) +
            ' is on the programme. Visit 1 of 5 recorded.' +
          '</p>' +
        '</div>' +
      '</div>' +

      '<div class="loyalty-panel">' +
        '<div>' +

          '<p class="loyalty-title">' +
            'Loyalty card' +
          '</p>' +

          dotsHTML(1, true) +

          '<p class="loyalty-state">' +
            '<strong>1 / 5</strong> · Stamp slot 1 on the printed card.' +
          '</p>' +

        '</div>' +

        '<button class="btn btn-primary" ' +
          'data-open-customer="' +
          c.id +
        '">' +
          'Open customer' +
        '</button>' +

      '</div>' +

      '<div class="form-actions">' +

        '<button class="btn btn-quiet" ' +
          'data-goto="add-customer">' +
          'Add another customer' +
        '</button>' +

      '</div>';

    toast(
      'Customer created and first visit added.'
    );

  } catch (err) {

    console.error(
      'Unexpected customer creation error:',
      err
    );

    toast(
      'Something went wrong while creating the customer.',
      'error'
    );
  }
}
  function nowTime() {
    var h = new Date().getHours(), m = new Date().getMinutes();
    var ap = h >= 12 ? 'PM' : 'AM', hh = h % 12 || 12;
    return hh + ':' + pad(m, 2) + ' ' + ap;
  }

  /* -------------------------------------------------------
     12. CUSTOMER PROFILE
  ------------------------------------------------------- */
  function renderProfile() {
    var c = byId(currentCustomerId);
    var body = $('#profile-body');
    if (!c || c.status !== 'active') {
      body.innerHTML = emptyHTML('i-users', 'Customer not available',
        'This record has been removed from the active list.', 'Back to customers', 'customers');
      return;
    }
    var ready = c.cycleVisits >= CYCLE_LENGTH;
    var history = state.visits.filter(function (v) { return v.customerId === c.id; }).slice(0, 8);
    var rewards = state.rewards.filter(function (r) { return r.customerId === c.id; });

    body.innerHTML =
      '<div class="profile-head"><div class="profile-id">' +
      '<span class="avatar-xl">' + esc(initials(c.name)) + '</span>' +
      '<div><h1 class="profile-name">' + esc(c.name) + '</h1>' +
      '<p class="profile-phone"><svg class="ico"><use href="#i-phone"></use></svg>' + esc(c.phone) + '</p></div></div>' +
      (ready
        ? '<button class="btn btn-primary btn-lg" data-complete-reward="' + c.id + '">Complete reward</button>'
        : '<button class="btn btn-primary btn-lg" data-add-visit="' + c.id + '"><svg class="ico"><use href="#i-plus"></use></svg>Add visit</button>') +
      '</div>' +

      '<div class="facts">' +
      fact('Customer since', fmtDate(c.createdAt)) +
      fact('Lifetime visits', c.lifetimeVisits) +
      fact('Rewards earned', c.rewardsEarned) +
      fact('Last visit', relativeDay(c.lastVisit)) +
      '</div>' +

      '<div class="loyalty-panel' + (ready ? ' ready' : '') + '" id="loyalty-panel">' +
      '<div><p class="loyalty-title">Current loyalty card</p>' + dotsHTML(c.cycleVisits, true) +
      '<p class="loyalty-state"><strong>' + c.cycleVisits + ' / ' + CYCLE_LENGTH + '</strong> \u00B7 ' +
      (ready ? 'Card complete \u2014 the discount has not been applied yet.'
        : (CYCLE_LENGTH - c.cycleVisits) + ' more ' + (CYCLE_LENGTH - c.cycleVisits === 1 ? 'visit' : 'visits') + ' to a reward.') +
      '</p></div>' +
      (ready ? '<span class="badge badge-warn">Reward pending</span>' : '') +
      '</div>' +

      '<div class="panel" style="margin-bottom:24px">' +
      '<div class="panel-head"><h2>Visit history</h2><span class="row-meta">' + c.lifetimeVisits + ' total</span></div>' +
      (history.length ? '<div class="rows">' + history.map(function (v) {
        return '<div class="row"><span class="badge badge-muted">Visit ' + v.visitNumber + '</span>' +
          '<span class="row-main"><strong>' + relativeDay(v.date) + '</strong><span>Card ' + v.cycleNumber + ', stamp ' +
          (((v.visitNumber - 1) % CYCLE_LENGTH) + 1) + '</span></span>' +
          '<span class="row-meta">' + v.time + '</span></div>';
      }).join('') + '</div>'
        : emptyHTML('i-history', 'No visits recorded', 'This customer has no visit history yet.')) +
      '</div>' +

      '<div class="panel" style="margin-bottom:24px">' +
      '<div class="panel-head"><h2>Rewards</h2></div>' +
      (rewards.length ? '<div class="rows">' + rewards.map(function (r) {
        return '<div class="row"><span class="row-main"><strong>' + rupees(r.final) + ' paid</strong>' +
          '<span>Bill ' + rupees(r.bill) + ' \u00B7 ' + r.pct + '% off \u00B7 ' + rupees(r.discount) + ' discount</span></span>' +
          '<span class="row-meta">' + fmtDate(r.date) + '</span></div>';
      }).join('') + '</div>'
        : emptyHTML('i-reward', 'No rewards yet', 'The discount is applied when the fifth stamp is filled.')) +
      '</div>' +

      '<div class="form-actions" style="margin-top:0">' +
      '<button class="btn btn-quiet" data-goto="visits">All visit history</button>' +
      '<button class="btn btn-quiet" data-delete="' + c.id + '"><svg class="ico"><use href="#i-trash"></use></svg>Delete customer</button>' +
      '</div>';
  }
  function fact(label, value) {
    return '<div class="fact"><p class="fact-label">' + esc(label) + '</p><p class="fact-value">' + esc(value) + '</p></div>';
  }

  /* -------------------------------------------------------
     13. ADD VISIT  (+ fifth-visit trigger)
  ------------------------------------------------------- */
  var busy = false;

async function addVisit(customerId, sourceBtn) {
  if (busy) return;

  var c = byId(customerId);

  if (!c || c.status !== 'active') {
    toast('Customer could not be found.', 'error');
    return;
  }

  if (c.cycleVisits >= CYCLE_LENGTH) {
    toast('Card is already full. Complete the reward first.', 'error');
    navigate('profile', c.id);
    return;
  }

  busy = true;

  if (sourceBtn) {
    sourceBtn.disabled = true;
  }

  try {
    /* ---------------------------------------------
       Add visit through Supabase
       --------------------------------------------- */
    const { data, error } = await supabaseClient.rpc(
      'add_customer_visit',
      {
        p_customer_id: customerId
      }
    );

    if (error) {
      console.error('Add visit RPC failed:', error);

      if (
        error.message &&
        error.message.includes('completed card awaiting reward')
      ) {
        toast(
          'This customer has a completed card. Complete the reward first.',
          'error'
        );
      } else {
        toast(
          'Could not add this visit. Please try again.',
          'error'
        );
      }

      return;
    }

    if (!data || !data.customer || !data.visit) {
      console.error('Unexpected add visit response:', data);

      toast(
        'Visit was not returned correctly. Please refresh.',
        'error'
      );

      return;
    }

    /* ---------------------------------------------
       Update local UI cache using DB response
       --------------------------------------------- */
    c.name = data.customer.name;
    c.phone = data.customer.phone;

    c.createdAt = data.customer.created_at
      ? new Date(data.customer.created_at)
      : c.createdAt;

    c.lastVisit = data.customer.last_visit_at
      ? new Date(data.customer.last_visit_at)
      : new Date();

    c.lifetimeVisits = data.customer.lifetime_visits;
    c.cycleVisits = data.customer.current_cycle_visits;
    c.rewardsEarned = data.customer.rewards_earned;
    c.status = data.customer.is_active ? 'active' : 'archived';

    var visit = {
      id: data.visit.id,
      customerId: data.visit.customer_id,
      date: new Date(data.visit.visit_at),
      time: new Date(data.visit.visit_at).toLocaleTimeString(
        'en-IN',
        {
          hour: 'numeric',
          minute: '2-digit'
        }
      ),
      visitNumber: data.visit.visit_number,
      cycleNumber: data.visit.cycle_number,
      cyclePosition: data.visit.cycle_position
    };

    state.visits.unshift(visit);

    /* ---------------------------------------------
       Open customer profile
       --------------------------------------------- */
    if (
      current !== 'profile' ||
      currentCustomerId !== c.id
    ) {
      navigate('profile', c.id);
    } else {
      renderProfile();
    }

    /* ---------------------------------------------
       Animate the newly added stamp
       --------------------------------------------- */
    var slot = $(
      '#loyalty-panel .dots-lg .dot[data-slot="' +
      c.cycleVisits +
      '"]'
    );

    if (slot) {
      slot.classList.add('pop');
    }

    /* ---------------------------------------------
       Fifth visit = reward flow
       --------------------------------------------- */
    if (c.cycleVisits === CYCLE_LENGTH) {

      setTimeout(function () {
        openRewardModal(c.id, visit.id);
      }, 220);

    } else {

      toast(
        'Visit added — ' +
        c.cycleVisits +
        ' of ' +
        CYCLE_LENGTH +
        ' stamps.'
      );

    }

  } catch (err) {

    console.error(
      'Unexpected add visit error:',
      err
    );

    toast(
      'Something went wrong while adding the visit.',
      'error'
    );

  } finally {

    busy = false;

    if (sourceBtn) {
      sourceBtn.disabled = false;
    }
  }
}

  /* -------------------------------------------------------
     14. FIFTH-VISIT REWARD  (one focused modal)
  ------------------------------------------------------- */
  function openRewardModal(customerId, visitId) {
    var c = byId(customerId);
    if (!c) return;

    openModal(
      '<div class="reward-crest">' +
      '<div class="reward-dots">' +
      '<span class="dot ready"><svg class="ico"><use href="#i-check"></use></svg></span>'.repeat(5) +
      '</div>' +
      '<p class="reward-kicker">Card complete</p>' +
      '<h2 class="modal-title" id="modal-title">' + esc(c.name) + '</h2>' +
      '<p class="reward-sub">Fifth visit reached. Enter the bill and the discount agreed at the counter.</p>' +
      '</div>' +

      '<div class="modal-body">' +
      '<div class="bill-grid">' +
      '<div class="field" style="margin:0"><label for="rw-bill">Bill amount</label>' +
      '<div class="input-affix affix-left"><span class="affix-static">\u20B9</span>' +
      '<input id="rw-bill" type="number" inputmode="decimal" min="1" step="1" placeholder="0" data-autofocus aria-describedby="rw-bill-err"></div>' +
      '<p class="field-err" id="rw-bill-err" hidden></p></div>' +

      '<div class="field" style="margin:0"><label for="rw-pct">Discount</label>' +
      '<div class="input-affix"><input id="rw-pct" type="number" inputmode="numeric" min="0" max="100" step="1" value="' + DEFAULT_DISCOUNT + '" aria-describedby="rw-pct-err">' +
      '<span class="affix-static" style="left:auto;right:16px">%</span></div>' +
      '<p class="field-err" id="rw-pct-err" hidden></p></div>' +
      '</div>' +

      '<div class="calc invalid" id="rw-calc">' +
      '<div class="calc-row"><span>Bill amount</span><b id="rw-out-bill">\u2014</b></div>' +
      '<div class="calc-row"><span>Discount <span id="rw-out-pct"></span></span><b id="rw-out-disc">\u2014</b></div>' +
      '<div class="calc-row calc-total"><span>Final payable</span><b id="rw-out-final">\u2014</b></div>' +
      '</div>' +
      '</div>' +

      '<div class="modal-foot">' +
      '<button class="btn btn-quiet btn-lg" data-reward-cancel>Cancel</button>' +
      '<button class="btn btn-primary btn-lg" id="rw-confirm" data-reward-confirm="' + c.id + '" data-visit="' + (visitId || '') + '" disabled>Confirm &amp; complete reward</button>' +
      '</div>',
      {
        wide: true,
        onOpen: function (modal) {
          var bill = $('#rw-bill', modal), pct = $('#rw-pct', modal);
          bill.addEventListener('input', recalc);
          pct.addEventListener('input', recalc);
          recalc();
        }
      }
    );
  }

  function recalc() {
    var billEl = $('#rw-bill'), pctEl = $('#rw-pct');
    if (!billEl) return null;
    var billRaw = billEl.value.trim(), pctRaw = pctEl.value.trim();
    var bill = Number(billRaw), pct = Number(pctRaw);
    var billErr = '', pctErr = '';

    if (billRaw === '') billErr = 'Enter the bill amount.';
    else if (!isFinite(bill) || isNaN(bill)) billErr = 'Bill amount must be a number.';
    else if (bill <= 0) billErr = 'Bill amount must be more than \u20B90.';

    if (pctRaw === '') pctErr = 'Enter a discount percentage.';
    else if (!isFinite(pct) || isNaN(pct)) pctErr = 'Discount must be a number.';
    else if (pct < 0) pctErr = 'Discount cannot be negative.';
    else if (pct > 100) pctErr = 'Discount cannot be more than 100%.';

    setFieldError(billEl, $('#rw-bill-err'), billErr);
    setFieldError(pctEl, $('#rw-pct-err'), pctErr);

    var valid = !billErr && !pctErr;
    var calc = $('#rw-calc');
    var confirm = $('#rw-confirm');
    calc.classList.toggle('invalid', !valid);
    confirm.disabled = !valid;

    if (!valid) {
      $('#rw-out-bill').textContent = billErr ? '\u2014' : rupees(bill);
      $('#rw-out-pct').textContent = '';
      $('#rw-out-disc').textContent = '\u2014';
      $('#rw-out-final').textContent = '\u2014';
      return null;
    }

    var discount = Math.round(bill * pct) / 100;   // billAmount × pct / 100
    var final = Math.max(0, bill - discount);      // never negative
    $('#rw-out-bill').textContent = rupees(bill);
    $('#rw-out-pct').textContent = '(' + pct + '%)';
    $('#rw-out-disc').textContent = '\u2212 ' + rupees(discount);
    $('#rw-out-final').textContent = rupees(final);
    return { bill: bill, pct: pct, discount: discount, final: final };
  }

 async function confirmReward(customerId, visitId) {
  var res = recalc();

  if (!res) return;

  var c = byId(customerId);

  if (!c) {
    toast('Customer could not be found.', 'error');
    return;
  }

  if (!visitId) {
    toast('The fifth visit record could not be found.', 'error');
    return;
  }

  var confirmBtn = $('#rw-confirm');

  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<span>Completing…</span>';
  }

  try {

    /* ---------------------------------------------
       Save reward + reset card in Supabase
       --------------------------------------------- */
    const { data, error } = await supabaseClient.rpc(
      'complete_customer_reward',
      {
        p_customer_id: customerId,
        p_visit_id: visitId,
        p_bill_amount: res.bill,
        p_discount_percentage: res.pct
      }
    );

    if (error) {
      console.error(
        'Complete reward RPC failed:',
        error
      );

      toast(
        error.message &&
        error.message.includes('already been completed')
          ? 'This reward has already been completed.'
          : 'Could not complete the reward. Please try again.',
        'error'
      );

      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML =
          'Confirm &amp; complete reward';
      }

      return;
    }

    if (!data || !data.customer || !data.reward) {
      console.error(
        'Unexpected reward response:',
        data
      );

      toast(
        'Reward was not returned correctly. Please refresh.',
        'error'
      );

      return;
    }

    /* ---------------------------------------------
       Update local customer cache
       --------------------------------------------- */
    c.name = data.customer.name;
    c.phone = data.customer.phone;

    c.createdAt = data.customer.created_at
      ? new Date(data.customer.created_at)
      : c.createdAt;

    c.lastVisit = data.customer.last_visit_at
      ? new Date(data.customer.last_visit_at)
      : c.lastVisit;

    c.lifetimeVisits =
      data.customer.lifetime_visits;

    c.cycleVisits =
      data.customer.current_cycle_visits;

    c.rewardsEarned =
      data.customer.rewards_earned;

    c.status =
      data.customer.is_active
        ? 'active'
        : 'archived';

    /* ---------------------------------------------
       Add saved reward to local cache
       --------------------------------------------- */
    state.rewards.unshift({
      id: data.reward.id,
      customerId: data.reward.customer_id,
      visitId: data.reward.visit_id,

      bill: Number(data.reward.bill_amount),
      pct: Number(data.reward.discount_percentage),
      discount: Number(data.reward.discount_amount),
      final: Number(data.reward.final_amount),

      date: data.reward.created_at
        ? new Date(data.reward.created_at)
        : new Date(),

      status: data.reward.status
    });

    /* ---------------------------------------------
       Success modal
       --------------------------------------------- */
    openModal(
      '<div class="reward-crest">' +

      '<div class="modal-danger-icon" ' +
      'style="background:var(--success-soft);color:var(--success);margin:0 auto 16px">' +
      '<svg class="ico"><use href="#i-check"></use></svg>' +
      '</div>' +

      '<h2 class="modal-title" id="modal-title">' +
      'Reward completed' +
      '</h2>' +

      '<p class="reward-sub">' +
      esc(c.name) +
      ' paid ' +
      rupees(res.final) +
      ' after a ' +
      res.pct +
      '% discount. Start a fresh card on their next visit.' +
      '</p>' +

      '</div>' +

      '<div class="modal-body">' +

      '<div class="calc">' +

      '<div class="calc-row">' +
      '<span>Bill amount</span>' +
      '<b>' + rupees(res.bill) + '</b>' +
      '</div>' +

      '<div class="calc-row">' +
      '<span>Discount (' + res.pct + '%)</span>' +
      '<b>− ' + rupees(res.discount) + '</b>' +
      '</div>' +

      '<div class="calc-row">' +
      '<span>Lifetime visits</span>' +
      '<b>' + c.lifetimeVisits + ' (unchanged)</b>' +
      '</div>' +

      '<div class="calc-row">' +
      '<span>New loyalty card</span>' +
      '<b>0 / 5</b>' +
      '</div>' +

      '</div>' +

      '</div>' +

      '<div class="modal-foot">' +

      '<button class="btn btn-quiet btn-lg" ' +
      'data-goto-close="rewards">' +
      'View all rewards' +
      '</button>' +

      '<button class="btn btn-primary btn-lg" ' +
      'data-goto-close="profile" ' +
      'data-customer="' + c.id + '" ' +
      'data-autofocus>' +
      'Back to customer' +
      '</button>' +

      '</div>'
    );

    toast(
      'Reward completed — card reset to 0 of 5.'
    );

  } catch (err) {

    console.error(
      'Unexpected reward completion error:',
      err
    );

    toast(
      'Something went wrong while completing the reward.',
      'error'
    );

    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML =
        'Confirm &amp; complete reward';
    }
  }
}
  /* -------------------------------------------------------
     15. CUSTOMERS LIST
  ------------------------------------------------------- */
  function renderCustomers() {
    var q = $('#cust-filter').value.trim().toLowerCase();
    var sort = $('#cust-sort').value;
    var list = activeCustomers().filter(function (c) {
      return !q || c.name.toLowerCase().indexOf(q) > -1 || c.phone.indexOf(q) > -1;
    });

    list.sort(function (a, b) {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'visits') return b.lifetimeVisits - a.lifetimeVisits;
      if (sort === 'close') return b.cycleVisits - a.cycleVisits;
      return b.lastVisit - a.lastVisit;
    });

    var body = $('#customers-body');
    if (!activeCustomers().length) {
      body.innerHTML = emptyHTML('i-users', 'No customers yet',
        'Add the first customer when someone gives you their number at the counter.',
        'Add customer', 'add-customer');
      return;
    }
    if (!list.length) {
      body.innerHTML = emptyHTML('i-search', 'No matches',
        'Nothing matches that name or number. Check the spelling, or add a new customer.',
        'Add customer', 'add-customer');
      return;
    }

    body.innerHTML =
      '<div class="table-wrap"><table><thead><tr>' +
      '<th>Customer</th><th>Phone</th><th class="col-optional">Lifetime visits</th><th>Current loyalty</th><th class="col-optional">Rewards</th><th>Last visit</th><th><span class="sr-only">Action</span></th>' +
      '</tr></thead><tbody>' +
      list.map(function (c) {
        return '<tr>' +
          '<td><button class="cell-name linkish" data-open-customer="' + c.id + '">' +
          '<span class="avatar">' + esc(initials(c.name)) + '</span><strong>' + esc(c.name) + '</strong></button></td>' +
          '<td class="num">' + esc(c.phone) + '</td>' +
          '<td class="num col-optional">' + c.lifetimeVisits + '</td>' +
          '<td>' + loyaltyHTML(c) + '</td>' +
          '<td class="num col-optional">' + c.rewardsEarned + '</td>' +
          '<td class="num">' + relativeDay(c.lastVisit) + '</td>' +
          '<td class="actions"><button class="icon-btn danger" data-delete="' + c.id + '" aria-label="Delete ' + esc(c.name) + '">' +
          '<svg class="ico"><use href="#i-trash"></use></svg></button></td>' +
          '</tr>';
      }).join('') + '</tbody></table></div>' +

      '<div class="only-mobile-cards">' + list.map(function (c) {
        return '<div class="mcard">' +
          '<div class="mcard-top"><div><p class="mcard-name">' + esc(c.name) + '</p>' +
          '<p class="mcard-phone">' + esc(c.phone) + '</p></div>' +
          '<button class="icon-btn danger" data-delete="' + c.id + '" aria-label="Delete ' + esc(c.name) + '">' +
          '<svg class="ico"><use href="#i-trash"></use></svg></button></div>' +
          '<div class="mcard-meta"><span>' + plural(c.lifetimeVisits, 'lifetime visit') + '</span><span>' + plural(c.rewardsEarned, 'reward') + '</span>' +
          '<span>Last visit ' + relativeDay(c.lastVisit) + '</span></div>' +
          '<div class="mcard-foot">' + loyaltyHTML(c) +
          '<button class="btn btn-quiet btn-sm" data-open-customer="' + c.id + '">Open</button></div>' +
          '</div>';
      }).join('') + '</div>' ;
       
  
    }

  /* -------------------------------------------------------
     16. VISIT HISTORY
  ------------------------------------------------------- */
  function renderVisits() {
    var q = $('#visit-filter').value.trim().toLowerCase();
    var day = $('#visit-date').value;
    var rows = state.visits.filter(function (v) {
      var c = byId(v.customerId);
      if (!c || c.status !== 'active') return false;
      if (q && c.name.toLowerCase().indexOf(q) === -1 && c.phone.indexOf(q) === -1) return false;
      if (day && isoDay(v.date) !== day) return false;
      return true;
    }).slice(0, 60);

    var body = $('#visits-body');
    if (!rows.length) {
      body.innerHTML = emptyHTML('i-history', 'No visits found',
        (q || day) ? 'Nothing matches these filters. Clear them to see all visits.'
          : 'Visits appear here as soon as you record them at the counter.');
      return;
    }
    body.innerHTML =
      '<div class="table-wrap"><table><thead><tr>' +
      '<th>Customer</th><th>Phone</th><th>Visit number</th><th>Date</th><th>Time</th>' +
      '</tr></thead><tbody>' +
      rows.map(function (v) {
        var c = byId(v.customerId);
        return '<tr>' +
          '<td><button class="cell-name linkish" data-open-customer="' + c.id + '">' +
          '<span class="avatar">' + esc(initials(c.name)) + '</span><strong>' + esc(c.name) + '</strong></button></td>' +
          '<td class="num">' + esc(c.phone) + '</td>' +
          '<td class="num">' + v.visitNumber + '</td>' +
          '<td class="num">' + fmtDate(v.date) + '</td>' +
          '<td class="num">' + v.time + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<div class="only-mobile-cards">' + rows.map(function (v) {
        var c = byId(v.customerId);
        return '<button class="mcard" data-open-customer="' + c.id + '">' +
          '<div class="mcard-top"><div><p class="mcard-name">' + esc(c.name) + '</p>' +
          '<p class="mcard-phone">' + esc(c.phone) + '</p></div>' +
          '<span class="badge badge-muted">Visit ' + v.visitNumber + '</span></div>' +
          '<div class="mcard-meta"><span>' + fmtDate(v.date) + '</span><span>' + v.time + '</span></div></button>';
      }).join('') + '</div>';
  }

  /* -------------------------------------------------------
     17. REWARDS
  ------------------------------------------------------- */
  function renderRewards() {
    var rows = state.rewards.filter(function (r) {
      var c = byId(r.customerId);
      return c && c.status === 'active';
    });
    var body = $('#rewards-body');
    if (!rows.length) {
      body.innerHTML = emptyHTML('i-reward', 'No rewards yet',
        'A reward is recorded the first time a customer fills all five stamps.');
      return;
    }
    var total = rows.reduce(function (s, r) { return s + r.discount; }, 0);
    body.innerHTML =
      '<div class="metrics" style="grid-template-columns:repeat(3,1fr)">' +
      metric('Rewards given', rows.length, 'Completed loyalty cards', true) +
      metric('Total discount', rupees(total), 'Across all rewards') +
      metric('Average bill', rupees(Math.round(rows.reduce(function (s, r) { return s + r.bill; }, 0) / rows.length)), 'On reward visits') +
      '</div>' +
      '<div class="table-wrap"><table><thead><tr>' +
      '<th>Customer</th><th>Bill amount</th><th>Discount %</th><th class="col-optional">Discount amount</th><th>Final amount</th><th>Date</th><th>Status</th>' +
      '</tr></thead><tbody>' +
      rows.map(function (r) {
        var c = byId(r.customerId);
        return '<tr>' +
          '<td><button class="cell-name linkish" data-open-customer="' + c.id + '">' +
          '<span class="avatar">' + esc(initials(c.name)) + '</span><strong>' + esc(c.name) + '</strong></button></td>' +
          '<td class="num">' + rupees(r.bill) + '</td>' +
          '<td class="num">' + r.pct + '%</td>' +
          '<td class="num col-optional">' + rupees(r.discount) + '</td>' +
          '<td class="num"><strong>' + rupees(r.final) + '</strong></td>' +
          '<td class="num">' + fmtDate(r.date) + '</td>' +
          '<td><span class="badge badge-success"><svg class="ico" style="width:13px;height:13px"><use href="#i-check"></use></svg>Completed</span></td>' +
          '</tr>';
      }).join('') + '</tbody></table></div>' +
      '<div class="only-mobile-cards">' + rows.map(function (r) {
        var c = byId(r.customerId);
        return '<div class="mcard"><div class="mcard-top"><div><p class="mcard-name">' + esc(c.name) + '</p>' +
          '<p class="mcard-phone">' + fmtDate(r.date) + '</p></div>' +
          '<span class="badge badge-success">Completed</span></div>' +
          '<div class="mcard-meta"><span>Bill ' + rupees(r.bill) + '</span><span>' + r.pct + '% off</span>' +
          '<span>Discount ' + rupees(r.discount) + '</span></div>' +
          '<div class="mcard-foot"><span class="metric-label">Final paid</span><strong>' + rupees(r.final) + '</strong></div></div>';
      }).join('') + '</div>';
  }

  /* -------------------------------------------------------
     18. DELETE (one modal, nothing behind it)
  ------------------------------------------------------- */
  function openDeleteModal(customerId) {
    var c = byId(customerId);
    if (!c) return;
    openModal(
      '<div class="modal-head">' +
      '<div class="modal-danger-icon"><svg class="ico"><use href="#i-trash"></use></svg></div>' +
      '<h2 class="modal-title" id="modal-title">Delete customer?</h2>' +
      '<p class="modal-sub">Are you sure you want to delete ' + esc(c.name) + '? They will no longer appear in the active customer list, ' +
      'and their ' + c.lifetimeVisits + ' recorded ' + (c.lifetimeVisits === 1 ? 'visit' : 'visits') + ' will be hidden from history.</p>' +
      '</div>' +
      '<div class="modal-foot">' +
      '<button class="btn btn-quiet btn-lg" data-modal-cancel data-autofocus>Cancel</button>' +
      '<button class="btn btn-danger btn-lg" data-delete-confirm="' + c.id + '">Delete customer</button>' +
      '</div>'
    );
  }
 async function deleteCustomer(customerId) {
  var c = byId(customerId);

  if (!c || c.status !== 'active') {
    closeModal();
    toast('Customer is no longer active.', 'error');
    return;
  }

  try {
    const { data, error } = await supabaseClient.rpc(
      'archive_customer',
      {
        p_customer_id: customerId
      }
    );

    if (error) {
      console.error('Archive customer RPC failed:', error);
      toast('Could not remove this customer. Please try again.', 'error');
      return;
    }

    if (!data) {
      console.error('Unexpected archive response:', data);
      toast('Customer archive was not confirmed.', 'error');
      return;
    }

    /* Update local UI cache */
    c.status = 'archived';

    closeModal();

    toast(c.name + ' removed from the active list.');

    if (current === 'profile' && currentCustomerId === c.id) {
      navigate('customers');
    } else if (current === 'customers') {
      renderCustomers();
    } else if (current === 'dashboard') {
      renderDashboard();
    }

  } catch (err) {
    console.error('Unexpected delete error:', err);
    toast('Something went wrong while removing the customer.', 'error');
  }
}

async function restoreCustomer(customerId) {
  try {

    const { data, error } = await supabaseClient.rpc(
      'restore_customer',
      {
        p_customer_id: customerId
      }
    );

    if (error) {
      console.error('Restore customer RPC failed:', error);

      toast(
        'Could not restore this customer. Please try again.',
        'error'
      );

      return;
    }

    if (!data) {
      console.error('Unexpected restore response:', data);

      toast(
        'Customer restoration was not confirmed.',
        'error'
      );

      return;
    }

    /* ---------------------------------------------
       Update local customer cache
       --------------------------------------------- */
    var c = byId(customerId);

    if (c) {

      c.name = data.name;
      c.phone = data.phone;

      c.createdAt = data.created_at
        ? new Date(data.created_at)
        : c.createdAt;

      c.lastVisit = data.last_visit_at
        ? new Date(data.last_visit_at)
        : c.lastVisit;

      c.lifetimeVisits = data.lifetime_visits;
      c.cycleVisits = data.current_cycle_visits;
      c.rewardsEarned = data.rewards_earned;

      c.status = data.is_active
        ? 'active'
        : 'archived';

    } else {

      state.customers.push({
        id: data.id,
        name: data.name,
        phone: data.phone,

        createdAt: data.created_at
          ? new Date(data.created_at)
          : new Date(),

        lastVisit: data.last_visit_at
          ? new Date(data.last_visit_at)
          : null,

        lifetimeVisits: data.lifetime_visits,
        cycleVisits: data.current_cycle_visits,
        rewardsEarned: data.rewards_earned,

        status: data.is_active
          ? 'active'
          : 'archived'
      });

    }

    $('#dup-notice').hidden = true;
    $('#dup-notice').innerHTML = '';

    toast(
      data.name + ' has been restored.'
    );

    navigate('profile', data.id);

  } catch (err) {

    console.error(
      'Unexpected restore error:',
      err
    );

    toast(
      'Something went wrong while restoring the customer.',
      'error'
    );
  }
}

  /* -------------------------------------------------------
     19. EVENT WIRING
  ------------------------------------------------------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest
  ? e.target.closest(
      '[data-goto],[data-open-customer],[data-add-visit],[data-delete],[data-delete-confirm],[data-modal-cancel],[data-reward-cancel],[data-reward-confirm],[data-complete-reward],[data-new-with],[data-fill],[data-goto-close],[data-restore-customer]'
    )
  : null;
    if (!t) return;

    if (t.hasAttribute('data-goto')) { navigate(t.getAttribute('data-goto')); return; }

    if (t.hasAttribute('data-goto-close')) {
      var dest = t.getAttribute('data-goto-close');
      closeModal(true);
      navigate(dest, t.getAttribute('data-customer') || undefined);
      return;
    }
    if (t.hasAttribute('data-open-customer')) { navigate('profile', t.getAttribute('data-open-customer')); return; }
    if (t.hasAttribute('data-restore-customer')) {
  restoreCustomer(
    t.getAttribute('data-restore-customer')
  );
  return;
}
    if (t.hasAttribute('data-add-visit')) { addVisit(t.getAttribute('data-add-visit'), t); return; }
    if (t.hasAttribute('data-complete-reward')) {
      var cid = t.getAttribute('data-complete-reward');
      var lastVisit = state.visits.filter(function (v) { return v.customerId === cid; })[0];
      openRewardModal(cid, lastVisit ? lastVisit.id : null);
      return;
    }
    if (t.hasAttribute('data-delete')) { openDeleteModal(t.getAttribute('data-delete')); return; }
    if (t.hasAttribute('data-delete-confirm')) { deleteCustomer(t.getAttribute('data-delete-confirm')); return; }
    if (t.hasAttribute('data-modal-cancel')) { closeModal(); return; }
    if (t.hasAttribute('data-reward-cancel')) {
      closeModal();
      toast('Reward cancelled. Nothing was recorded.', 'info');
      navigate('profile', currentCustomerId);
      return;
    }
    if (t.hasAttribute('data-reward-confirm')) {
      confirmReward(t.getAttribute('data-reward-confirm'), t.getAttribute('data-visit'));
      return;
    }
    if (t.hasAttribute('data-new-with')) {
      navigate('add-customer');
      resetAddCustomer(t.getAttribute('data-new-with'));
      $('#add-name').focus();
      return;
    }
    if (t.hasAttribute('data-fill')) {
      $('#search-phone').value = t.getAttribute('data-fill');
      runSearch();
      return;
    }
   
  });

// Login — Supabase authentication
$('#login-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  var form = e.currentTarget;
  var btn = $('#login-submit');
  var userInput = $('#login-user');
  var passInput = $('#login-pass');

  var email = userInput.value.trim();
  var password = passInput.value;

  // Basic validation
  if (!email) {
    toast('Please enter your email.');
    userInput.focus();
    return;
  }

  if (!password) {
    toast('Please enter your password.');
    passInput.focus();
    return;
  }

  // Prevent double-clicking
  btn.disabled = true;
  btn.innerHTML = '<span>Signing in…</span>';

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      console.error('Login error:', error);
      toast('Invalid email or password.');
      passInput.focus();
      return;
    }

   console.log('Authenticated user:', data.user);

var staffLoaded = await loadAuthenticatedStaff();

if (!staffLoaded) {
  return;
}

toast('Signed in. Have a good shift.');

  } catch (err) {
    console.error('Unexpected login error:', err);
    toast('Something went wrong. Please try again.');

  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>Sign In</span><span class="login-arrow">→</span>';
  }
});
  $('#toggle-pass').addEventListener('click', function () {
    var input = $('#login-pass');
    var showing = input.type === 'text';
    input.type = showing ? 'password' : 'text';
    this.setAttribute('aria-pressed', String(!showing));
    this.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    this.innerHTML = '<svg class="ico"><use href="#' + (showing ? 'i-eye' : 'i-eyeoff') + '"></use></svg>';
  });

 // Logout — Supabase
// Logout — Supabase
var logoutBtn = $('#logout-btn');

if (logoutBtn) {
  logoutBtn.addEventListener('click', async function () {
    var btn = logoutBtn;

    btn.disabled = true;

    try {
      const { error } = await supabaseClient.auth.signOut({
        scope: 'local'
      });

      if (error) {
        console.error('Logout error:', error);
        toast('Could not sign out. Please try again.');
        return;
      }

      $('#login-user').value = '';
      $('#login-pass').value = '';

      $('#app').hidden = true;
      $('#screen-login').hidden = false;

      closeNav();
      window.scrollTo(0, 0);

      toast('You have been signed out.');

    } catch (err) {
      console.error('Unexpected logout error:', err);
      toast('Something went wrong while signing out.');

    } finally {
      btn.disabled = false;
    }
  });
}

  // Navigation drawer
  $('#sb-open').addEventListener('click', openNav);
  $('#sb-close').addEventListener('click', closeNav);
  $('#sb-scrim').addEventListener('click', closeNav);

  // Search
  $('#search-form').addEventListener('submit', function (e) { e.preventDefault(); runSearch(); });
  $('#search-phone').addEventListener('input', function () {
    this.value = this.value.replace(/\D/g, '').slice(0, 10);
  });

 // Add customer
var addForm = $('#add-form');

if (addForm) {
  addForm.onsubmit = function (e) {
    e.preventDefault();
    e.stopPropagation();

    submitAddCustomer();

    return false;
  };
}

$('#add-phone').addEventListener('input', function () {
  this.value = this.value.replace(/\D/g, '').slice(0, 10);
  $('#dup-notice').hidden = true;
});

  // Profile
  $('#profile-back').addEventListener('click', function () { navigate('customers'); });

  // Filters
  $('#cust-filter').addEventListener('input', renderCustomers);
  $('#cust-sort').addEventListener('change', renderCustomers);
  $('#visit-filter').addEventListener('input', renderVisits);
  $('#visit-date').addEventListener('change', renderVisits);
  $('#visit-clear').addEventListener('click', function () {
    $('#visit-filter').value = ''; $('#visit-date').value = ''; renderVisits();
  });

 /* -------------------------------------------------------
   20. BOOT
------------------------------------------------------- */
function showLoginScreen() {
  $('#app').hidden = true;
  $('#screen-login').hidden = false;

  closeNav();
  window.scrollTo(0, 0);
}

function showAppScreen() {
  $('#screen-login').hidden = true;
  $('#app').hidden = false;
}

async function loadAuthenticatedStaff() {
  /*
    First check the locally persisted session.
  */
  const {
    data: sessionData,
    error: sessionError
  } = await supabaseClient.auth.getSession();

  if (sessionError) {
    console.error('Session check failed:', sessionError);
    showLoginScreen();
    return false;
  }

  if (!sessionData.session) {
    console.log('No active Supabase session.');
    showLoginScreen();
    return false;
  }

  /*
    Now ask Supabase Auth for the verified user.
  */
  const {
    data: { user },
    error: userError
  } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    console.error('Unable to verify authenticated user:', userError);
    showLoginScreen();
    return false;
  }

  console.log('Authenticated user:', user.email);

  /*
    Load application-specific staff profile.
  */
  const {
    data: profile,
    error: profileError
  } = await supabaseClient
    .from('staff_profiles')
    .select('user_id, full_name, role, is_active')
    .eq('user_id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('Unable to load staff profile:', profileError);
    toast('Unable to load your staff profile.', 'error');
    showLoginScreen();
    return false;
  }

  if (!profile) {
    console.error('No staff profile found for this user.');

    toast(
      'Your staff account is not configured.',
      'error'
    );

    await supabaseClient.auth.signOut({
      scope: 'local'
    });

    showLoginScreen();
    return false;
  }

  if (!profile.is_active) {
    console.error('Staff account is inactive.');

    toast(
      'Your staff account is inactive.',
      'error'
    );

    await supabaseClient.auth.signOut({
      scope: 'local'
    });

    showLoginScreen();
    return false;
  }

  /*
    Store trusted application profile.
  */
  window.currentStaff = {
    userId: profile.user_id,
    email: user.email,
    fullName: profile.full_name,
    role: profile.role,
    isActive: profile.is_active
  };

  /*
    Update staff identity in sidebar.
  */
  $('#staff-name').textContent =
    window.currentStaff.fullName;

  $('#staff-email').textContent =
    window.currentStaff.email;

  $('#staff-avatar').textContent =
    initials(window.currentStaff.fullName);

  console.log('Staff profile loaded:', {
    name: window.currentStaff.fullName,
    role: window.currentStaff.role
  });

showAppScreen();

var dataLoaded = await loadAppData();

if (!dataLoaded) {
  return false;
}

navigate('dashboard');

return true;
}

async function restoreAuthSession() {
  try {
    await loadAuthenticatedStaff();
  } catch (err) {
    console.error(
      'Unexpected authentication error:',
      err
    );

    showLoginScreen();
  }
}

$('#dash-date').textContent =
  'Monday, ' + fmtDate(TODAY);

restoreAuthSession();

supabaseClient.auth.onAuthStateChange(function (event) {
  console.log('Auth state changed:', event);

  if (event === 'SIGNED_OUT') {
    showLoginScreen();
  }
});

})();

