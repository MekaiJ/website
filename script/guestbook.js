const SUPABASE_URL      = 'https://rslapntfoxxlfzywwidv.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzbGFwbnRmb3h4bGZ6eXd3aWR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMzk4NTksImV4cCI6MjA4NzcxNTg1OX0.EcWnmNjVmSmZIYlJGzq6ONGaQryUIl8GbLrSUS4VN-k';
    const TABLE_NAME        = 'Message';

    const isConfigured = !SUPABASE_URL.includes('YOUR_');

    let formVisible = true;

    function toggleForm() {
      formVisible = !formVisible;
      document.getElementById('formWrap').style.display = formVisible ? 'block' : 'none';
      document.getElementById('toggleBtn').textContent =
        (formVisible ? '▼' : '▶') + ' sign the guestbook';
    }

    const api = (path, opts = {}) =>
      fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
          ...opts.headers,
        },
        ...opts,
      });

    async function loadEntries() {
      const wrap  = document.getElementById('entries');
      const count = document.getElementById('entryCount');

      try {
        const res  = await api(`${TABLE_NAME}?select=*&order=created_at.desc&limit=50`);
        const data = await res.json();

        if (!Array.isArray(data) || data.length === 0) {
          wrap.innerHTML = '<p class="empty">no entries yet — be the first!</p>';
          count.textContent = '';
          return;
        }

        count.textContent = `${data.length} entr${data.length === 1 ? 'y' : 'ies'}`;

        wrap.innerHTML = data.map(e => `
          <div class="entry">
            <span class="entry-name">${esc(e.name)}</span>
            <span class="entry-date">${fmt(e.created_at)}</span>
            <p class="entry-msg">${esc(e.message)}</p>
          </div>
        `).join('');

      } catch {
        wrap.innerHTML = '<p class="empty">could not load entries. check your supabase config.</p>';
      }
    }

    async function submitMessage() {
      const name    = document.getElementById('name').value.trim();
      const message = document.getElementById('message').value.trim();
      const statusEl = document.getElementById('status');

      statusEl.className = 'status';

      if (!name || !message) {
        statusEl.className = 'status error';
        statusEl.textContent = 'please fill in both fields.';
        return;
      }


      statusEl.textContent = 'submitting...';

      try {
        const res = await api(TABLE_NAME, {
          method: 'POST',
          body: JSON.stringify({ name, message }),
        });

        if (res.ok || res.status === 201) {
          statusEl.textContent = 'thanks for signing! :)';
          document.getElementById('name').value = '';
          document.getElementById('message').value = '';
          await loadEntries();
        } else {
          const err = await res.json();
          statusEl.className = 'status error';
          statusEl.textContent = `error: ${err.message || 'something went wrong.'}`;
        }
      } catch {
        statusEl.className = 'status error';
        statusEl.textContent = 'network error. try again.';
      }
    }

    function esc(s) {
      return String(s)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function fmt(iso) {
      if (!iso) return '';
      return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    }

    loadEntries();