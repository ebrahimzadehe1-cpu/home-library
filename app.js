let books = JSON.parse(localStorage.getItem('homeLibrary')) || [];
let currentBorrowId = null;
let currentFilter = 'all';
let currentView = localStorage.getItem('viewMode') || 'list';
let newCoverData = null;

const addForm = document.getElementById('addForm');
const bookList = document.getElementById('bookList');
const searchInput = document.getElementById('search');
const modal = document.getElementById('borrowModal');
const imageModal = document.getElementById('imageModal');
const viewerImage = document.getElementById('viewerImage');
const borrowerName = document.getElementById('borrowerName');
const borrowDays = document.getElementById('borrowDays');
const borrowBookTitle = document.getElementById('borrowBookTitle');
const toast = document.getElementById('toast');
const coverInput = document.getElementById('coverInput');
const coverPreview = document.getElementById('coverPreview');
const removeCoverBtn = document.getElementById('removeCover');

const toFa = n => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);

function formatDate(dateStr) {
  if (!dateStr) return '';
  try { return new Date(dateStr).toLocaleDateString('fa-IR'); }
  catch { return ''; }
}

function isOverdue(book) {
  if (!book.borrowed || !book.dueDate) return false;
  return new Date(book.dueDate) < new Date();
}

function daysLeft(book) {
  if (!book.dueDate) return 0;
  return Math.ceil((new Date(book.dueDate) - new Date()) / 86400000);
}

function showToast(msg, type = '') {
  toast.textContent = msg;
  toast.className = 'toast show ' + type;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.className = 'toast', 2500);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function compressImage(file, maxSize = 400, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

coverInput.addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showToast('فقط فایل تصویری مجاز است ❌', 'error');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast('حجم عکس باید کمتر از ۵ مگابایت باشد', 'error');
    return;
  }
  try {
    const dataUrl = await compressImage(file, 400, 0.8);
    newCoverData = dataUrl;
    updateCoverPreview();
    showToast('عکس آماده شد ✅', 'success');
  } catch (err) {
    showToast('خطا در پردازش عکس ❌', 'error');
  }
  e.target.value = '';
});

removeCoverBtn.addEventListener('click', () => {
  newCoverData = null;
  updateCoverPreview();
});

function updateCoverPreview() {
  if (newCoverData) {
    coverPreview.innerHTML = `<img src="${newCoverData}" alt="cover">`;
    removeCoverBtn.classList.remove('hidden');
  } else {
    coverPreview.innerHTML = `<span class="cover-placeholder">📷<br><small>عکس جلد</small></span>`;
    removeCoverBtn.classList.add('hidden');
  }
}

coverPreview.addEventListener('click', () => {
  if (newCoverData) openImageViewer(newCoverData);
  else coverInput.click();
});

function openImageViewer(src) {
  viewerImage.src = src;
  imageModal.classList.remove('hidden');
}

document.getElementById('closeViewer').addEventListener('click', () => {
  imageModal.classList.add('hidden');
  viewerImage.src = '';
});

imageModal.addEventListener('click', e => {
  if (e.target === imageModal) {
    imageModal.classList.add('hidden');
    viewerImage.src = '';
  }
});

function save() {
  try {
    localStorage.setItem('homeLibrary', JSON.stringify(books));
  } catch (e) {
    showToast('⚠️ فضای ذخیره‌سازی پر شده!', 'error');
  }
}

function updateStats() {
  document.getElementById('totalCount').textContent = toFa(books.length);
  document.getElementById('availableCount').textContent = toFa(books.filter(b => !b.borrowed).length);
  document.getElementById('borrowedCount').textContent = toFa(books.filter(b => b.borrowed).length);
  document.getElementById('overdueCount').textContent = toFa(books.filter(isOverdue).length);
}

function render() {
  const query = searchInput.value.trim().toLowerCase();
  let filtered = books.filter(b =>
    b.title.toLowerCase().includes(query) ||
    b.author.toLowerCase().includes(query) ||
    (b.genre || '').toLowerCase().includes(query)
  );

  if (currentFilter === 'available') filtered = filtered.filter(b => !b.borrowed);
  else if (currentFilter === 'borrowed') filtered = filtered.filter(b => b.borrowed);
  else if (currentFilter === 'overdue') filtered = filtered.filter(isOverdue);

  bookList.className = `book-list ${currentView === 'grid' ? 'grid-view' : 'list-view'}`;

  if (filtered.length === 0) {
    bookList.innerHTML = '<div class="empty">📭 کتابی یافت نشد</div>';
    updateStats();
    return;
  }

  bookList.innerHTML = filtered.map(book => {
    const overdue = isOverdue(book);
    const days = book.borrowed ? daysLeft(book) : 0;
    let statusHtml = '';
    let itemClass = '';

    if (book.borrowed) {
      itemClass = overdue ? 'overdue' : 'borrowed';
      statusHtml = `
        <p class="borrower">👤 ${escapeHtml(book.borrower)}</p>
        ${overdue
          ? `<p class="overdue-tag">⚠️ ${toFa(Math.abs(days))} روز تأخیر</p>`
          : `<p style="font-size:0.72rem;color:#27ae60">⏳ ${toFa(days)} روز مانده</p>`}
      `;
    } else {
      statusHtml = '<p style="color:#27ae60;font-size:0.75rem">✅ موجود</p>';
    }

    let coverHtml;
    if (book.cover) {
      coverHtml = `<img class="book-cover" src="${book.cover}" alt="cover" data-img-id="${book.id}" style="cursor:pointer">`;
    } else {
      coverHtml = `<div class="book-cover-placeholder">📖</div>`;
    }

    return `
      <div class="book-item ${itemClass}">
        ${coverHtml}
        <div class="book-info">
          <h4>${escapeHtml(book.title)}</h4>
          <p>✍️ ${escapeHtml(book.author)}${book.genre ? ' • ' + escapeHtml(book.genre) : ''}</p>
          ${statusHtml}
        </div>
        <div class="book-actions">
          ${book.borrowed
            ? `<button class="btn-return" data-action="return" data-id="${book.id}">↩️ برگشت</button>`
            : `<button class="btn-borrow" data-action="borrow" data-id="${book.id}">📤 امانت</button>`}
          <button class="btn-delete" data-action="delete" data-id="${book.id}">🗑️</button>
        </div>
      </div>
    `;
  }).join('');

  updateStats();
}

// Event delegation برای دکمه‌ها و عکس‌ها
bookList.addEventListener('click', e => {
  const img = e.target.closest('.book-cover');
  if (img) {
    const id = parseInt(img.dataset.imgId);
    const book = books.find(b => b.id === id);
    if (book && book.cover) openImageViewer(book.cover);
    return;
  }
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const id = parseInt(btn.dataset.id);
  const action = btn.dataset.action;
  if (action === 'borrow') openBorrow(id);
  else if (action === 'return') returnBook(id);
  else if (action === 'delete') deleteBook(id);
});

addForm.addEventListener('submit', e => {
  e.preventDefault();
  const title = document.getElementById('title').value.trim();
  const author = document.getElementById('author').value.trim();
  const genre = document.getElementById('genre').value.trim();
  if (!title || !author) return;

  books.push({
    id: Date.now(),
    title,
    author,
    genre,
    cover: newCoverData,
    borrowed: false,
    borrower: '',
    borrowDate: null,
    dueDate: null
  });

  save();
  render();
  addForm.reset();
  newCoverData = null;
  updateCoverPreview();
  document.getElementById('title').focus();
  showToast('کتاب اضافه شد ✅', 'success');
});

function openBorrow(id) {
  const book = books.find(b => b.id === id);
  if (!book) return;
  currentBorrowId = id;
  borrowBookTitle.textContent = `📖 ${book.title}`;
  borrowerName.value = '';
  borrowDays.value = 14;
  modal.classList.remove('hidden');
  setTimeout(() => borrowerName.focus(), 100);
}

document.getElementById('confirmBorrow').addEventListener('click', () => {
  const name = borrowerName.value.trim();
  const days = parseInt(borrowDays.value) || 14;
  if (!name) { borrowerName.focus(); return; }

  const book = books.find(b => b.id === currentBorrowId);
  if (book) {
    const now = new Date();
    const due = new Date();
    due.setDate(due.getDate() + days);
    book.borrowed = true;
    book.borrower = name;
    book.borrowDate = now.toISOString();
    book.dueDate = due.toISOString();
    save();
    render();
    showToast(`کتاب به ${name} امانت داده شد`, 'success');
  }
  closeModal();
});

document.getElementById('cancelBorrow').addEventListener('click', closeModal);

function closeModal() {
  modal.classList.add('hidden');
  currentBorrowId = null;
}

borrowerName.addEventListener('keypress', e => {
  if (e.key === 'Enter') document.getElementById('confirmBorrow').click();
});

function returnBook(id) {
  const book = books.find(b => b.id === id);
  if (book) {
    const name = book.borrower;
    book.borrowed = false;
    book.borrower = '';
    book.borrowDate = null;
    book.dueDate = null;
    save();
    render();
    showToast(`کتاب از ${name} بازگردانده شد ✅`, 'success');
  }
}

function deleteBook(id) {
  const book = books.find(b => b.id === id);
  if (!book) return;
  if (!confirm(`حذف «${book.title}»؟`)) return;
  books = books.filter(b => b.id !== id);
  save();
  render();
  showToast('کتاب حذف شد', 'error');
}

searchInput.addEventListener('input', render);

document.querySelectorAll('.filter').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    render();
  });
});

document.querySelectorAll('.view-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentView = btn.dataset.view;
    localStorage.setItem('viewMode', currentView);
    render();
  });
});

document.querySelectorAll('.view-btn').forEach(b => {
  if (b.dataset.view === currentView) b.classList.add('active');
  else b.classList.remove('active');
});

document.getElementById('exportBtn').addEventListener('click', () => {
  const data = JSON.stringify(books, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `library-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('پشتیبان دانلود شد 📤', 'success');
});

document.getElementById('importBtn').addEventListener('click', () => {
  document.getElementById('importFile').click();
});

document.getElementById('importFile').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!Array.isArray(data)) throw new Error('فرمت نامعتبر');
      if (!confirm(`${data.length} کتاب بارگذاری شود؟`)) return;
      books = data;
      save();
      render();
      showToast('پشتیبان بازیابی شد ✅', 'success');
    } catch (err) {
      showToast('فایل نامعتبر است ❌', 'error');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .catch(err => console.log('SW registration failed:', err));
  });
}

updateCoverPreview();
render();