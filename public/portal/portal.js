/**
 * Q8 Fleet Portal - Logic
 * Firebase Auth + Firestore voor fleet managers
 */
(function() {
  'use strict';

  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();

  const DEFAULT_TENANT = 'default';

  let portalUser = null;
  let tenantId = DEFAULT_TENANT;
  let usersUnsub = null;
  let sessionsUnsub = null;

  // --- DOM ---
  const $ = id => document.getElementById(id);
  const $all = sel => document.querySelectorAll(sel);

  function showView(id) {
    document.querySelectorAll('.portal-view').forEach(v => v.classList.add('hidden'));
    const el = $(id);
    if (el) el.classList.remove('hidden');
  }

  function showSection(sectionId) {
    document.querySelectorAll('.portal-section').forEach(s => s.classList.add('hidden'));
    const el = $(sectionId);
    if (el) el.classList.remove('hidden');
    $all('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.section === sectionId.replace('section-', '')));
    const titles = { dashboard: 'Dashboard', users: 'Gebruikers', sessions: 'Actieve sessies', settings: 'Instellingen', plates: 'Kentekenbeheer' };
    const titleEl = $('portal-section-title');
    if (titleEl) titleEl.textContent = titles[sectionId.replace('section-', '')] || sectionId;
  }

  function toast(msg) {
    const el = $('portal-toast');
    if (el) {
      el.textContent = msg;
      el.classList.remove('hidden');
      setTimeout(() => el.classList.add('hidden'), 3000);
    }
  }

  // --- Auth ---
  function initAuth() {
    auth.onAuthStateChanged(user => {
      if (user) {
        loadPortalUser(user.uid).then(profile => {
          if (!profile) {
            return ensurePortalUser(user).then(() => initAuth());
          }
          portalUser = { ...user, profile };
          tenantId = profile.tenantId || DEFAULT_TENANT;
          if (profile.role === 'driver') {
            toast('Geen toegang: alleen voor fleet managers');
            auth.signOut();
            return;
          }
          showView('view-portal');
          $('portal-user-email').textContent = user.email;
          initPortal();
        }).catch(() => {
          ensurePortalUser(user).then(() => initAuth());
        });
      } else {
        portalUser = null;
        showView('view-login');
        if (usersUnsub) usersUnsub();
        if (sessionsUnsub) sessionsUnsub();
      }
    });
  }

  function loadPortalUser(uid) {
    return db.collection('users').doc(uid).get().then(doc => doc.exists ? doc.data() : null);
  }

  function ensurePortalUser(user) {
    return db.collection('users').doc(user.uid).get().then(doc => {
      if (!doc.exists) {
        return db.collection('users').doc(user.uid).set({
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          tenantId: DEFAULT_TENANT,
          role: 'fleetmanager',
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
    });
  }

  function login(email, password) {
    const errEl = $('login-error');
    if (errEl) errEl.classList.add('hidden');
    return auth.signInWithEmailAndPassword(email, password).catch(err => {
      if (errEl) {
        errEl.textContent = err.message || 'Inloggen mislukt';
        errEl.classList.remove('hidden');
      }
    });
  }

  function logout() {
    auth.signOut();
    showView('view-login');
  }

  // --- Firestore: Users ---
  function loadUsers(cb) {
    usersUnsub = db.collection('users')
      .where('tenantId', '==', tenantId)
      .where('role', 'in', ['driver', 'fleetmanager'])
      .onSnapshot(snap => {
        const users = [];
        snap.forEach(d => users.push({ id: d.id, ...d.data() }));
        cb(users);
      }, err => console.error('Users snapshot error', err));
  }

  function inviteUser(email, displayName) {
    return db.collection('invites').add({
      email: email.toLowerCase().trim(),
      displayName: (displayName || '').trim() || null,
      tenantId,
      role: 'driver',
      createdBy: auth.currentUser.uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  function updateDriverSettings(uid, settings) {
    return db.collection('users').doc(uid).update({
      driverSettings: settings,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  function addPlateToUser(uid, plateText) {
    const normalized = (plateText || '').trim().replace(/[\s\-]/g, '').toUpperCase();
    if (!normalized) return Promise.reject(new Error('Geen kenteken'));
    return db.collection('users').doc(uid).update({
      adminPlates: firebase.firestore.FieldValue.arrayUnion({
        id: normalized,
        text: normalized,
        source: 'admin',
        locked: true
      }),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  function removePlateFromUser(uid, plateId) {
    return db.collection('users').doc(uid).get().then(doc => {
      const data = doc.data();
      const adminPlates = (data.adminPlates || []).filter(p => p.id !== plateId);
      return doc.ref.update({
        adminPlates,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });
  }

  // --- Firestore: Sessions ---
  function loadSessions(cb) {
    sessionsUnsub = db.collection('sessions')
      .where('tenantId', '==', tenantId)
      .where('status', '==', 'active')
      .onSnapshot(snap => {
        const sessions = [];
        snap.forEach(d => sessions.push({ id: d.id, ...d.data() }));
        cb(sessions);
      }, err => console.error('Sessions snapshot error', err));
  }

  function stopSession(sessionId) {
    return db.collection('sessions').doc(sessionId).update({
      status: 'ended',
      endedAt: firebase.firestore.FieldValue.serverTimestamp(),
      endedBy: 'portal'
    });
  }

  // --- Firestore: Tenant settings ---
  function loadTenantSettings(cb) {
    db.collection('tenants').doc(tenantId).get().then(doc => {
      cb(doc.exists ? doc.data() : {});
    });
  }

  function saveTenantSettings(settings) {
    return db.collection('tenants').doc(tenantId).set({
      ...settings,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }

  // --- Render ---
  function renderUsers(users) {
    const tbody = $('users-tbody');
    const empty = $('users-empty');
    if (!tbody) return;
    if (users.length === 0) {
      tbody.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');
    tbody.innerHTML = users.map(u => {
      const ds = u.driverSettings || {};
      const plateInfo = ds.platesLocked ? 'Vergrendeld' : (ds.canAddPlates ? 'Zelf toevoegen' : 'Alleen bekijken');
      return `
        <tr>
          <td>${u.email || '-'}</td>
          <td>${u.displayName || '-'}</td>
          <td><span class="badge badge-neutral">${u.role || 'driver'}</span></td>
          <td>${plateInfo}</td>
          <td><button class="btn btn-sm btn-secondary edit-driver-plates" data-uid="${u.id}">Kentekens</button></td>
        </tr>
      `;
    }).join('');
  }

  function renderSessions(sessions) {
    const tbody = $('sessions-tbody');
    const empty = $('sessions-empty');
    if (!tbody) return;
    if (sessions.length === 0) {
      tbody.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');
    tbody.innerHTML = sessions.map(s => {
      const start = s.start && (s.start.toDate ? s.start.toDate() : new Date(s.start));
      const startStr = start ? start.toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' }) : '-';
      return `
        <tr>
          <td>${s.userEmail || s.userId || '-'}</td>
          <td>${s.zone || '-'}</td>
          <td>${s.plate || '-'}</td>
          <td>${startStr}</td>
          <td><button class="btn btn-sm btn-danger stop-session" data-id="${s.id}">Stoppen</button></td>
        </tr>
      `;
    }).join('');
  }

  function renderPlatesPanel(user) {
    const panel = $('plates-driver-panel');
    const select = $('plates-driver-select');
    if (!panel || !select) return;
    if (!user) {
      panel.classList.add('hidden');
      return;
    }
    panel.classList.remove('hidden');
    const ds = user.driverSettings || {};
    $('plates-can-add').checked = ds.canAddPlates !== false;
    $('plates-locked').checked = !!ds.platesLocked;
    $('plates-max').value = ds.maxPlates || 0;
    const adminPlates = user.adminPlates || [];
    const listEl = $('plates-driver-list');
    if (listEl) {
      listEl.innerHTML = adminPlates.map(p => `
        <span class="plate-chip">
          ${p.text || p.id}
          <span class="remove-plate" data-uid="${user.id}" data-plate="${p.id}">&times;</span>
        </span>
      `).join('') || '<span class="text-secondary">Geen kentekens toegevoegd</span>';
    }
    select.value = user.id;
  }

  function populateDriverSelect(users) {
    const select = $('plates-driver-select');
    if (!select) return;
    const drivers = users.filter(u => u.role === 'driver');
    select.innerHTML = '<option value="">-- Selecteer bestuurder --</option>' +
      drivers.map(u => `<option value="${u.id}">${u.displayName || u.email} (${u.email})</option>`).join('');
  }

  // --- Init Portal ---
  function initPortal() {
    let users = [];
    loadUsers(u => {
      users = u;
      renderUsers(users);
      populateDriverSelect(users);
      $('stat-drivers').textContent = users.filter(x => x.role === 'driver').length;
    });
    loadSessions(sessions => {
      renderSessions(sessions);
      $('stat-active-sessions').textContent = sessions.length;
    });
    loadTenantSettings(settings => {
      $('setting-auto-stop-enabled').checked = !!settings.autoStopEnabled;
      $('setting-auto-stop').value = settings.autoStopTime || '18:00';
    });

    $('plates-driver-select').addEventListener('change', () => {
      const uid = $('plates-driver-select').value;
      const user = users.find(u => u.id === uid);
      renderPlatesPanel(user);
    });
  }

  // --- Event Handlers ---
  function initEvents() {
    $('login-form').addEventListener('submit', e => {
      e.preventDefault();
      login($('login-email').value, $('login-password').value);
    });
    $('btn-portal-logout').addEventListener('click', logout);

    $all('.nav-item').forEach(n => {
      n.addEventListener('click', e => {
        e.preventDefault();
        const section = n.dataset.section;
        if (section) showSection('section-' + section);
      });
    });

    $('btn-add-user').addEventListener('click', () => {
      $('modal-add-user').classList.remove('hidden');
      $('add-user-email').value = '';
      $('add-user-name').value = '';
    });
    $('btn-cancel-add-user').addEventListener('click', () => $('modal-add-user').classList.add('hidden'));
    $('modal-add-user').querySelector('.modal-backdrop').addEventListener('click', () => $('modal-add-user').classList.add('hidden'));

    $('add-user-form').addEventListener('submit', e => {
      e.preventDefault();
      const email = $('add-user-email').value.trim();
      const name = $('add-user-name').value.trim();
      inviteUser(email, name || undefined).then(() => {
        toast('Uitnodiging opgeslagen. Bestuurder verschijnt na registratie in de app.');
        $('modal-add-user').classList.add('hidden');
      }).catch(err => toast(err.message || 'Fout bij opslaan'));
    });

    document.addEventListener('click', e => {
      const stopBtn = e.target.closest('.stop-session');
      if (stopBtn) {
        const id = stopBtn.dataset.id;
        if (id && confirm('Sessie handmatig stoppen?')) {
          stopSession(id).then(() => toast('Sessie gestopt')).catch(err => toast(err.message));
        }
      }
      const editPlates = e.target.closest('.edit-driver-plates');
      if (editPlates) {
        const uid = editPlates.dataset.uid;
        showSection('section-plates');
        $('plates-driver-select').value = uid;
        loadUsers(users => {
          const user = users.find(u => u.id === uid);
          renderPlatesPanel(user);
        });
      }
      const removePlate = e.target.closest('.remove-plate');
      if (removePlate) {
        const uid = removePlate.dataset.uid;
        const plateId = removePlate.dataset.plate;
        removePlateFromUser(uid, plateId).then(() => {
          toast('Kenteken verwijderd');
          loadUsers(users => {
            const user = users.find(u => u.id === uid);
            renderPlatesPanel(user);
          });
        }).catch(err => toast(err.message));
      }
    });

    $('btn-save-settings').addEventListener('click', () => {
      saveTenantSettings({
        autoStopEnabled: $('setting-auto-stop-enabled').checked,
        autoStopTime: $('setting-auto-stop').value
      }).then(() => toast('Instellingen opgeslagen')).catch(err => toast(err.message));
    });

    $('btn-save-plates-settings').addEventListener('click', () => {
      const uid = $('plates-driver-select').value;
      if (!uid) return toast('Selecteer eerst een bestuurder');
      const settings = {
        canAddPlates: $('plates-can-add').checked,
        platesLocked: $('plates-locked').checked,
        maxPlates: parseInt($('plates-max').value, 10) || 0
      };
      updateDriverSettings(uid, settings).then(() => {
        toast('Kentekeninstellingen opgeslagen');
        loadUsers(u => { renderUsers(u); renderPlatesPanel(u.find(x => x.id === uid)); });
      }).catch(err => toast(err.message));
    });

    $('btn-add-plate-driver').addEventListener('click', () => {
      const uid = $('plates-driver-select').value;
      const plate = $('plates-add-input').value.trim();
      if (!uid) return toast('Selecteer eerst een bestuurder');
      if (!plate) return toast('Voer een kenteken in');
      addPlateToUser(uid, plate).then(() => {
        toast('Kenteken toegevoegd');
        $('plates-add-input').value = '';
        loadUsers(users => {
          const user = users.find(u => u.id === uid);
          renderPlatesPanel(user);
        });
      }).catch(err => toast(err.message));
    });
  }

  // --- Run ---
  initEvents();
  initAuth();
})();
