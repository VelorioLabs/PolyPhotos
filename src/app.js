// PolyPhotos Application Controller & Theme Manager
import { StorageOrchestrator, DEFAULT_THRESHOLD_MB } from './engine/orchestrator.js';
import { loadAccounts, saveAccounts, loadAllPhotos, savePhoto } from './db/vaultDb.js';

const orchestrator = new StorageOrchestrator(DEFAULT_THRESHOLD_MB);
let activeFilter = 'all';

// DOM Elements
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeIcon = document.getElementById('themeIcon');
const totalPoolLabel = document.getElementById('totalPoolLabel');
const freePoolLabel = document.getElementById('freePoolLabel');
const accountsGrid = document.getElementById('accountsGrid');
const thresholdAlertBanner = document.getElementById('thresholdAlertBanner');
const photoDropZone = document.getElementById('photoDropZone');
const fileInput = document.getElementById('fileInput');
const photosGrid = document.getElementById('photosGrid');
const photoCountBadge = document.getElementById('photoCountBadge');
const photoSearchInput = document.getElementById('photoSearchInput');
const addAccountBtn = document.getElementById('addAccountBtn');
const accountModal = document.getElementById('accountModal');
const closeAccountModalBtn = document.getElementById('closeAccountModalBtn');
const newAccountForm = document.getElementById('newAccountForm');
const accEmailInput = document.getElementById('accEmailInput');
const accProviderInput = document.getElementById('accProviderInput');
const lightboxModal = document.getElementById('lightboxModal');
const closeLightboxBtn = document.getElementById('closeLightboxBtn');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxTitle = document.getElementById('lightboxTitle');
const lightboxDate = document.getElementById('lightboxDate');
const lightboxAccount = document.getElementById('lightboxAccount');
const lightboxSize = document.getElementById('lightboxSize');
const lightboxHash = document.getElementById('lightboxHash');
const offloadSingleBtn = document.getElementById('offloadSingleBtn');

// 1. Dark & Light Theme Controller
function initTheme() {
  const savedTheme = localStorage.getItem('polyphotos_theme') || 'dark';
  applyTheme(savedTheme);
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    themeIcon.className = 'fa-solid fa-sun';
    localStorage.setItem('polyphotos_theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    themeIcon.className = 'fa-solid fa-moon';
    localStorage.setItem('polyphotos_theme', 'light');
  }
}

themeToggleBtn.addEventListener('click', () => {
  const isDark = document.documentElement.classList.contains('dark');
  applyTheme(isDark ? 'light' : 'dark');
});

// 2. Initial Sample Accounts Setup (Google Photos multi-account scenario)
async function initAccounts() {
  let storedAccounts = await loadAccounts();

  if (storedAccounts.length === 0) {
    storedAccounts = [
      {
        id: 'acc-google-1',
        name: 'Primary Google Account',
        email: 'varshan.main@gmail.com',
        provider: 'Google Photos',
        quotaTotalMb: 15360, // 15GB
        quotaUsedMb: 14100, // 13.77GB used (Only 1.2GB left -> THRESHOLD REACHED!)
        status: 'THRESHOLD_REACHED'
      },
      {
        id: 'acc-google-2',
        name: 'Secondary Backup Account',
        email: 'varshan.photos2@gmail.com',
        provider: 'Google Photos',
        quotaTotalMb: 15360,
        quotaUsedMb: 2400, // 2.3GB used (13GB Free -> ACTIVE)
        status: 'ACTIVE'
      },
      {
        id: 'acc-google-3',
        name: 'Cold Archive Account',
        email: 'varshan.vault3@gmail.com',
        provider: 'Google Photos',
        quotaTotalMb: 15360,
        quotaUsedMb: 0,
        status: 'STANDBY'
      }
    ];
    await saveAccounts(storedAccounts);
  }

  storedAccounts.forEach(acc => orchestrator.addAccount(acc));

  // Load sample photos if empty
  const storedPhotos = await loadAllPhotos();
  if (storedPhotos.length === 0) {
    const samplePhotos = [
      {
        id: 'p-01',
        title: 'Sunset over Neon Skyline',
        dateTaken: '2026-08-25T19:30:00Z',
        sizeBytes: 4.8 * 1024 * 1024,
        sizeMb: 4.8,
        url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop&q=80',
        accountId: 'acc-google-1',
        accountEmail: 'varshan.main@gmail.com',
        location: 'Bengaluru, India',
        tags: ['Landscape', 'Sunset', 'City']
      },
      {
        id: 'p-02',
        title: 'Cyberpunk Workshop Hardware',
        dateTaken: '2026-08-26T14:15:00Z',
        sizeBytes: 5.2 * 1024 * 1024,
        sizeMb: 5.2,
        url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
        accountId: 'acc-google-1',
        accountEmail: 'varshan.main@gmail.com',
        location: 'Lab Room 4',
        tags: ['Tech', 'Coding']
      },
      {
        id: 'p-03',
        title: 'Mountain Road Fog Drift',
        dateTaken: '2026-08-28T09:40:00Z',
        sizeBytes: 6.1 * 1024 * 1024,
        sizeMb: 6.1,
        url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
        accountId: 'acc-google-2',
        accountEmail: 'varshan.photos2@gmail.com',
        location: 'Western Ghats',
        tags: ['Travel', 'Nature']
      },
      {
        id: 'p-04',
        title: 'Geometric Concrete Architecture',
        dateTaken: '2026-08-29T11:20:00Z',
        sizeBytes: 3.9 * 1024 * 1024,
        sizeMb: 3.9,
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        accountId: 'acc-google-2',
        accountEmail: 'varshan.photos2@gmail.com',
        location: 'Modern Art Center',
        tags: ['Architecture', 'Minimal']
      }
    ];

    for (const p of samplePhotos) {
      await orchestrator.syncPhoto(p);
      await savePhoto(p);
    }
  } else {
    for (const p of storedPhotos) {
      orchestrator.photoIndex.set(p.hash || p.id, p);
    }
  }

  updateUI();
}

// 3. Render Pool & Accounts Status
function updateUI() {
  const stats = orchestrator.getPoolStats();
  totalPoolLabel.textContent = `${(stats.totalMb / 1024).toFixed(1)} GB`;
  freePoolLabel.textContent = `${(stats.freeMb / 1024).toFixed(1)} GB`;

  renderThresholdAlert();
  renderAccountsGrid();
  renderPhotosTimeline(photoSearchInput ? photoSearchInput.value : '');
}

function renderThresholdAlert() {
  const thresholdAcc = orchestrator.accounts.find(a => a.status === 'THRESHOLD_REACHED');
  const activeAcc = orchestrator.getActiveAccount();

  if (thresholdAcc) {
    const freeMb = thresholdAcc.quotaTotalMb - thresholdAcc.quotaUsedMb;
    thresholdAlertBanner.className = 'rounded-2xl p-4.5 border bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-300 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg';
    thresholdAlertBanner.innerHTML = `
      <div class="flex items-start gap-3">
        <i class="fa-solid fa-triangle-exclamation text-amber-500 text-base mt-0.5"></i>
        <div>
          <div class="font-bold text-slate-900 dark:text-white">Storage Threshold Reached on ${thresholdAcc.email} (${(freeMb / 1024).toFixed(2)} GB left)</div>
          <div class="text-[11px] opacity-90 mt-0.5">
            Auto-chaining engaged: New remaining photos will automatically route to <span class="font-bold text-emerald-600 dark:text-[#ccff00] underline">${activeAcc ? activeAcc.email : 'Next Standby Account'}</span>. Old photos remain safe.
          </div>
        </div>
      </div>
      <button id="offloadAccBtn" data-id="${thresholdAcc.id}" class="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 shadow-sm">
        <i class="fa-solid fa-hard-drive"></i>
        <span>Archive & Free Up</span>
      </button>
    `;
    thresholdAlertBanner.classList.remove('hidden');

    const offloadBtn = document.getElementById('offloadAccBtn');
    if (offloadBtn) {
      offloadBtn.addEventListener('click', async () => {
        const res = orchestrator.offloadAccountToLocal(thresholdAcc.id);
        if (res) {
          await saveAccounts(orchestrator.accounts);
          alert(`Successfully scheduled cold backup for ${res.accountEmail}. Freed ${(res.freedMb / 1024).toFixed(2)} GB!`);
          updateUI();
        }
      });
    }
  } else {
    thresholdAlertBanner.classList.add('hidden');
  }
}

function renderAccountsGrid() {
  accountsGrid.innerHTML = '';

  orchestrator.accounts.forEach(acc => {
    const usedGb = (acc.quotaUsedMb / 1024).toFixed(1);
    const totalGb = (acc.quotaTotalMb / 1024).toFixed(1);
    const percent = ((acc.quotaUsedMb / acc.quotaTotalMb) * 100).toFixed(0);
    const isFull = acc.status === 'FULL' || acc.status === 'THRESHOLD_REACHED';
    const isActive = acc.status === 'ACTIVE';

    const card = document.createElement('div');
    card.className = `p-4.5 rounded-2xl border transition-all font-mono text-xs flex flex-col justify-between ${
      isActive 
        ? 'bg-emerald-500/5 dark:bg-[#ccff00]/5 border-emerald-500/40 dark:border-[#ccff00]/40' 
        : isFull 
        ? 'bg-amber-500/5 border-amber-500/30' 
        : 'bg-slate-50 dark:bg-[#0b0d12] border-slate-200 dark:border-white/10'
    }`;

    card.innerHTML = `
      <div>
        <div class="flex items-center justify-between mb-2.5">
          <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
            isActive ? 'bg-emerald-600 dark:bg-[#ccff00] text-white dark:text-black font-bold' : isFull ? 'bg-amber-500 text-black font-bold' : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-zinc-400'
          }">${acc.status}</span>
          <span class="text-[11px] text-slate-500 dark:text-zinc-400">${percent}%</span>
        </div>
        <div class="font-display font-bold text-sm text-slate-900 dark:text-white truncate">${acc.email}</div>
        <div class="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">${acc.provider}</div>
      </div>

      <div class="mt-4 pt-3 border-t border-slate-200 dark:border-white/5 space-y-1.5">
        <div class="w-full h-2 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div class="h-full rounded-full transition-all ${isFull ? 'bg-amber-500' : 'bg-emerald-600 dark:bg-[#ccff00]'}" style="width: ${percent}%"></div>
        </div>
        <div class="flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-500">
          <span>${usedGb} GB used</span>
          <span>${totalGb} GB total</span>
        </div>
      </div>
    `;
    accountsGrid.appendChild(card);
  });
}

// 4. Render Unified Timeline
function renderPhotosTimeline(query = '') {
  let photos = orchestrator.getUnifiedTimeline(query);

  if (activeFilter === 'active') {
    const activeAcc = orchestrator.getActiveAccount();
    if (activeAcc) {
      photos = photos.filter(p => p.accountId === activeAcc.id);
    }
  }

  photoCountBadge.textContent = `${photos.length} photo${photos.length === 1 ? '' : 's'}`;
  photosGrid.innerHTML = '';

  if (photos.length === 0) {
    photosGrid.innerHTML = `<div class="col-span-full text-center py-16 text-slate-400 dark:text-zinc-500 font-mono text-xs">No photos matching current filter. Drop a photo above to sync!</div>`;
    return;
  }

  photos.forEach(photo => {
    const el = document.createElement('div');
    el.className = 'group relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-[#080a0f] border border-slate-200 dark:border-white/10 aspect-square cursor-pointer shadow-sm hover:shadow-xl transition-all';
    
    el.innerHTML = `
      <img src="${photo.url}" alt="${photo.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy">
      
      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between font-mono text-white text-[10px]">
        <div class="flex items-center justify-between">
          <span class="bg-black/70 px-2 py-0.5 rounded-full border border-white/10 text-[#ccff00]">${photo.accountEmail.split('@')[0]}</span>
          <span>${photo.sizeMb}MB</span>
        </div>
        <div>
          <div class="font-bold truncate text-xs">${photo.title}</div>
          <div class="text-[9px] text-zinc-300">${new Date(photo.dateTaken).toLocaleDateString()}</div>
        </div>
      </div>
    `;

    el.addEventListener('click', () => openLightbox(photo));
    photosGrid.appendChild(el);
  });
}

function openLightbox(photo) {
  lightboxImg.src = photo.url;
  lightboxTitle.textContent = photo.title;
  lightboxDate.textContent = new Date(photo.dateTaken).toLocaleString();
  lightboxAccount.textContent = photo.accountEmail;
  lightboxSize.textContent = `${photo.sizeMb} MB (Lossless Master)`;
  lightboxHash.textContent = photo.hash || 'sha256:d8a2b3...';
  lightboxModal.classList.remove('hidden');
}

closeLightboxBtn.addEventListener('click', () => lightboxModal.classList.add('hidden'));
lightboxModal.addEventListener('click', (e) => {
  if (e.target === lightboxModal) lightboxModal.classList.add('hidden');
});

// 5. Drag & Drop Photo Upload Simulator
photoDropZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleFileUploads(e.target.files);
  }
});

photoDropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  photoDropZone.classList.add('border-emerald-500', 'bg-emerald-500/5');
});

photoDropZone.addEventListener('dragleave', () => {
  photoDropZone.classList.remove('border-emerald-500', 'bg-emerald-500/5');
});

photoDropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  photoDropZone.classList.remove('border-emerald-500', 'bg-emerald-500/5');
  if (e.dataTransfer.files.length > 0) {
    handleFileUploads(e.dataTransfer.files);
  }
});

async function handleFileUploads(files) {
  for (const file of files) {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const photoObj = {
        title: file.name.replace(/\.[^/.]+$/, ''),
        name: file.name,
        dateTaken: new Date(file.lastModified || Date.now()).toISOString(),
        sizeBytes: file.size,
        url: event.target.result,
        location: 'Mobile Camera Roll',
        tags: ['Camera', 'Uploaded']
      };

      const result = await orchestrator.syncPhoto(photoObj);
      if (result.status === 'SYNC_SUCCESS') {
        await savePhoto(result.photo);
        await saveAccounts(orchestrator.accounts);
      } else if (result.status === 'SKIPPED_DUPLICATE') {
        console.log('Skipped duplicate photo upload:', file.name);
      }
      updateUI();
    };
    reader.readAsDataURL(file);
  }
}

// 6. Link New Account Modal Handling
addAccountBtn.addEventListener('click', () => accountModal.classList.remove('hidden'));
closeAccountModalBtn.addEventListener('click', () => accountModal.classList.add('hidden'));

newAccountForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = accEmailInput.value.trim();
  const provider = accProviderInput.value;

  if (email) {
    orchestrator.addAccount({
      email,
      provider,
      quotaTotalMb: 15360,
      quotaUsedMb: 0,
      status: 'STANDBY'
    });

    await saveAccounts(orchestrator.accounts);
    accountModal.classList.add('hidden');
    accEmailInput.value = '';
    updateUI();
  }
});

// Search & Filter
photoSearchInput.addEventListener('input', (e) => {
  renderPhotosTimeline(e.target.value);
});

document.querySelectorAll('.filter-timeline-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-timeline-btn').forEach(b => {
      b.className = 'filter-timeline-btn bg-slate-100 dark:bg-[#0b0d12] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 font-mono text-xs';
    });
    btn.className = 'filter-timeline-btn active bg-slate-900 dark:bg-[#ccff00] text-white dark:text-black px-3 py-1.5 rounded-lg font-bold font-mono text-xs';
    activeFilter = btn.getAttribute('data-filter');
    renderPhotosTimeline(photoSearchInput.value);
  });
});

// Initialize
initTheme();
initAccounts();
