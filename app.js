/* ============================================
       STATE
    ============================================ */
    var todos         = [];
    var activeFilter  = 'all';
    var valTimer      = null;

    /* ============================================
       DOM REFS  (grabbed after DOMContentLoaded)
    ============================================ */
    var todoInput, addBtn, prioritySel, dueDateEl,
        valMsg, todoList, emptyState,
        cntTotal, cntActive, cntDone, progressFill,
        themeBtn, themeIcon, dateLabel,
        filterBtns, clearBtn;

    /* ============================================
       BOOT
    ============================================ */
    document.addEventListener('DOMContentLoaded', function () {
      // Cache DOM refs
      todoInput    = document.getElementById('todoInput');
      addBtn       = document.getElementById('addBtn');
      prioritySel  = document.getElementById('prioritySel');
      dueDateEl    = document.getElementById('dueDate');
      valMsg       = document.getElementById('valMsg');
      todoList     = document.getElementById('todoList');
      emptyState   = document.getElementById('emptyState');
      cntTotal     = document.getElementById('cntTotal');
      cntActive    = document.getElementById('cntActive');
      cntDone      = document.getElementById('cntDone');
      progressFill = document.getElementById('progressFill');
      themeBtn     = document.getElementById('themeBtn');
      themeIcon    = document.getElementById('themeIcon');
      dateLabel    = document.getElementById('dateLabel');
      filterBtns   = document.querySelectorAll('.f-btn');
      clearBtn     = document.getElementById('clearBtn');

      // Wire events
      addBtn.addEventListener('click', addTodo);
      todoInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') addTodo(); });
      todoInput.addEventListener('input',   function ()  { hideVal(); });
      themeBtn.addEventListener('click',    toggleTheme);
      clearBtn.addEventListener('click',    clearCompleted);

      filterBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          activeFilter = btn.getAttribute('data-filter');
          filterBtns.forEach(function (b) { b.classList.toggle('active', b === btn); });
          render();
        });
      });

      // Load persisted data
      loadStorage();
      loadTheme();

      // Date display
      var now = new Date();
      dateLabel.textContent = now.toLocaleDateString('en-GB', {
        weekday: 'short', day: '2-digit', month: 'short'
      }).toUpperCase();

      render();
    });

    /* ============================================
       LOCAL STORAGE
    ============================================ */
    function loadStorage() {
      try {
        var raw = localStorage.getItem('focus_todos');
        if (raw) todos = JSON.parse(raw);
      } catch (e) {
        todos = [];
      }
    }

    function save() {
      try { localStorage.setItem('focus_todos', JSON.stringify(todos)); } catch (e) {}
    }

    /* ============================================
       THEME
    ============================================ */
    function loadTheme() {
      var t = '';
      try { t = localStorage.getItem('focus_theme') || 'light'; } catch (e) { t = 'light'; }
      applyTheme(t);
    }

    function applyTheme(t) {
      document.documentElement.setAttribute('data-theme', t);
      themeIcon.textContent = (t === 'dark') ? '○' : '☾';
    }

    function toggleTheme() {
      var cur  = document.documentElement.getAttribute('data-theme');
      var next = (cur === 'dark') ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem('focus_theme', next); } catch (e) {}
    }

    /* ============================================
       ADD TODO
    ============================================ */
    function addTodo() {
      var text = todoInput.value.trim();
      if (!text) {
        showVal('Please enter a task description.');
        todoInput.focus();
        return;
      }

      todos.unshift({
        id:        'td-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        text:      text,
        completed: false,
        priority:  prioritySel.value,
        dueDate:   dueDateEl.value,
        createdAt: Date.now()
      });

      todoInput.value      = '';
      prioritySel.value    = 'none';
      dueDateEl.value      = '';
      save();
      render();
      todoInput.focus();
    }

    /* ============================================
       TOGGLE COMPLETE
    ============================================ */
    function toggleComplete(id) {
      todos = todos.map(function (t) {
        return t.id === id ? Object.assign({}, t, { completed: !t.completed }) : t;
      });
      save();
      render();
    }

    /* ============================================
       DELETE TODO  (with animation)
    ============================================ */
    function deleteTodo(id) {
      var el = todoList.querySelector('[data-id="' + id + '"]');
      if (!el) return;
      el.classList.add('removing');
      el.addEventListener('animationend', function () {
        todos = todos.filter(function (t) { return t.id !== id; });
        save();
        render();
      }, { once: true });
    }

    /* ============================================
       EDIT TODO  (inline)
    ============================================ */
    function editTodo(id) {
      var el   = todoList.querySelector('[data-id="' + id + '"]');
      var todo = todos.find(function (t) { return t.id === id; });
      if (!el || !todo) return;

      var textEl = el.querySelector('.item-text');
      if (!textEl) return;

      var inp = document.createElement('input');
      inp.type      = 'text';
      inp.value     = todo.text;
      inp.className = 'edit-input';
      inp.maxLength = 120;
      textEl.replaceWith(inp);
      inp.focus();
      inp.select();

      var committed = false;

      function commit() {
        if (committed) return;
        committed = true;
        var newText = inp.value.trim();
        if (newText && newText !== todo.text) {
          todos = todos.map(function (t) {
            return t.id === id ? Object.assign({}, t, { text: newText }) : t;
          });
          save();
        }
        render();
      }

      inp.addEventListener('blur', commit, { once: true });
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter')  { inp.blur(); }
        if (e.key === 'Escape') { committed = true; render(); }
      });
    }

    /* ============================================
       CLEAR COMPLETED
    ============================================ */
    function clearCompleted() {
      todos = todos.filter(function (t) { return !t.completed; });
      save();
      render();
    }

    /* ============================================
       RENDER
    ============================================ */
    function getFiltered() {
      if (activeFilter === 'active')    return todos.filter(function (t) { return !t.completed; });
      if (activeFilter === 'completed') return todos.filter(function (t) { return  t.completed; });
      return todos;
    }

    function render() {
      var filtered  = getFiltered();
      var total     = todos.length;
      var done      = todos.filter(function (t) { return t.completed; }).length;
      var active    = total - done;
      var pct       = total > 0 ? Math.round((done / total) * 100) : 0;

      // Stats
      cntTotal.textContent    = total;
      cntActive.textContent   = active;
      cntDone.textContent     = done;
      progressFill.style.width = pct + '%';

      // Empty state
      if (filtered.length === 0) {
        emptyState.classList.add('show');
      } else {
        emptyState.classList.remove('show');
      }

      // Build list
      todoList.innerHTML = filtered.map(buildItem).join('');

      // Attach listeners to each item
      todoList.querySelectorAll('.todo-item').forEach(function (item) {
        var id = item.getAttribute('data-id');

        var cb = item.querySelector('.todo-check');
        if (cb) cb.addEventListener('change', function () { toggleComplete(id); });

        var editBt = item.querySelector('.act-btn.edit');
        if (editBt) editBt.addEventListener('click', function () { editTodo(id); });

        var delBt = item.querySelector('.act-btn.del');
        if (delBt) delBt.addEventListener('click', function () { deleteTodo(id); });
      });
    }

    function buildItem(todo) {
      var doneClass = todo.completed ? 'done' : '';

      // Priority badge
      var priHTML = '';
      if (todo.priority && todo.priority !== 'none') {
        priHTML = '<span class="badge ' + esc(todo.priority) + '">' + esc(todo.priority) + '</span>';
      }

      // Due-date badge
      var dueHTML = '';
      if (todo.dueDate) {
        var overdueClass = isOverdue(todo) ? 'overdue' : '';
        dueHTML = '<span class="due-badge ' + overdueClass + '">' + fmtDate(todo.dueDate) + '</span>';
      }

      var metaHTML = (priHTML || dueHTML)
        ? '<div class="item-meta">' + priHTML + dueHTML + '</div>'
        : '';

      var checked = todo.completed ? 'checked' : '';

      return (
        '<li class="todo-item ' + doneClass + '" data-id="' + esc(todo.id) + '">' +
          '<input type="checkbox" class="todo-check" ' + checked + ' aria-label="Toggle complete" />' +
          '<div class="item-body">' +
            '<span class="item-text">' + esc(todo.text) + '</span>' +
            metaHTML +
          '</div>' +
          '<div class="item-actions">' +
            '<button class="act-btn edit" title="Edit" aria-label="Edit task">✎</button>' +
            '<button class="act-btn del"  title="Delete" aria-label="Delete task">✕</button>' +
          '</div>' +
        '</li>'
      );
    }

    /* ============================================
       UTILITIES
    ============================================ */
    function esc(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function fmtDate(dateStr) {
      if (!dateStr) return '';
      var parts = dateStr.split('-');
      var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }

    function isOverdue(todo) {
      if (!todo.dueDate || todo.completed) return false;
      var today = new Date(); today.setHours(0, 0, 0, 0);
      var parts = todo.dueDate.split('-');
      var due   = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return due < today;
    }

    /* ============================================
       VALIDATION MESSAGE
    ============================================ */
    function showVal(msg) {
      valMsg.textContent = msg;
      valMsg.classList.add('show');
      clearTimeout(valTimer);
      valTimer = setTimeout(hideVal, 2800);
    }

    function hideVal() {
      valMsg.classList.remove('show');
    }
