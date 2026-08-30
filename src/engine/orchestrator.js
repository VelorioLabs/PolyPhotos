// PolyPhotos Storage Orchestration Engine & Auto-Chaining Router

export const DEFAULT_THRESHOLD_MB = 1500; // Trigger warning & auto-switch when <= 1.5GB remaining

export class StorageOrchestrator {
  constructor(thresholdMb = DEFAULT_THRESHOLD_MB) {
    this.thresholdMb = thresholdMb;
    this.accounts = [];
    this.photoIndex = new Map(); // hash -> PhotoObject
  }

  // Add or initialize a cloud account (e.g. Google Photos 15GB, OneDrive 5GB)
  addAccount(account) {
    const acc = {
      id: account.id || `acc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: account.name || 'Google Account',
      email: account.email,
      provider: account.provider || 'Google Photos',
      quotaTotalMb: account.quotaTotalMb || 15360, // 15GB in MB
      quotaUsedMb: account.quotaUsedMb || 0,
      status: account.status || 'ACTIVE', // ACTIVE, THRESHOLD_REACHED, FULL, STANDBY
      linkedAt: account.linkedAt || new Date().toISOString()
    };

    this.updateAccountStatus(acc);
    this.accounts.push(acc);
    return acc;
  }

  // Check and update threshold status for an account
  updateAccountStatus(account) {
    const freeMb = account.quotaTotalMb - account.quotaUsedMb;
    if (freeMb <= 200) {
      account.status = 'FULL';
    } else if (freeMb <= this.thresholdMb) {
      account.status = 'THRESHOLD_REACHED';
    } else if (this.getActiveAccount() && this.getActiveAccount().id !== account.id) {
      account.status = 'STANDBY';
    } else {
      account.status = 'ACTIVE';
    }
  }

  getActiveAccount() {
    // Return current active account that has not reached threshold
    return this.accounts.find(a => a.status === 'ACTIVE') || 
           this.accounts.find(a => a.status === 'STANDBY' && (a.quotaTotalMb - a.quotaUsedMb) > this.thresholdMb);
  }

  // Calculate aggregate cloud pool statistics
  getPoolStats() {
    const totalMb = this.accounts.reduce((sum, a) => sum + a.quotaTotalMb, 0);
    const usedMb = this.accounts.reduce((sum, a) => sum + a.quotaUsedMb, 0);
    const freeMb = totalMb - usedMb;
    const totalPhotos = this.photoIndex.size;

    return {
      totalMb,
      usedMb,
      freeMb,
      percentUsed: totalMb > 0 ? ((usedMb / totalMb) * 100).toFixed(1) : '0.0',
      totalPhotos,
      activeAccount: this.getActiveAccount()
    };
  }

  // Fast differential SHA-256 / content fingerprint generator
  async computePhotoHash(fileOrBuffer) {
    if (typeof crypto !== 'undefined' && crypto.subtle && fileOrBuffer instanceof ArrayBuffer) {
      const hashBuffer = await crypto.subtle.digest('SHA-256', fileOrBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // Fallback deterministic string/size hash
    if (fileOrBuffer.name && fileOrBuffer.size) {
      return `hash-${fileOrBuffer.name}-${fileOrBuffer.size}-${fileOrBuffer.lastModified || 0}`;
    }
    return `hash-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }

  // Process a new photo for sync
  async syncPhoto(photoData) {
    const hash = photoData.hash || await this.computePhotoHash(photoData.file || photoData);
    
    // Check if photo is already synced to ANY linked account (differential deduplication)
    if (this.photoIndex.has(hash)) {
      return {
        status: 'SKIPPED_DUPLICATE',
        message: 'Photo already securely backed up in linked account.',
        photo: this.photoIndex.get(hash)
      };
    }

    let activeAcc = this.getActiveAccount();

    // Check if active account will cross threshold or is full
    const photoSizeMb = (photoData.sizeBytes || 4 * 1024 * 1024) / (1024 * 1024); // default ~4MB photo
    
    if (!activeAcc || (activeAcc.quotaTotalMb - activeAcc.quotaUsedMb - photoSizeMb) < this.thresholdMb) {
      // Current account reached safe threshold limit! Trigger auto-switch to next standby account!
      if (activeAcc) {
        activeAcc.status = 'THRESHOLD_REACHED';
      }

      // Look for next standby account with free space
      const nextAcc = this.accounts.find(a => a.status === 'STANDBY' && (a.quotaTotalMb - a.quotaUsedMb) > this.thresholdMb);
      if (nextAcc) {
        nextAcc.status = 'ACTIVE';
        activeAcc = nextAcc;
      }
    }

    if (!activeAcc) {
      return {
        status: 'ALL_ACCOUNTS_FULL',
        message: 'All linked cloud accounts have reached storage limits. Please link an additional account or offload to local storage.'
      };
    }

    // Add photo to active account
    const syncedPhoto = {
      id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      hash: hash,
      title: photoData.title || photoData.name || 'Untitled Photo',
      dateTaken: photoData.dateTaken || new Date().toISOString(),
      sizeMb: parseFloat(photoSizeMb.toFixed(2)),
      url: photoData.url || photoData.previewUrl,
      accountId: activeAcc.id,
      accountEmail: activeAcc.email,
      location: photoData.location || 'Unknown Location',
      tags: photoData.tags || ['Camera']
    };

    // Update account quota
    activeAcc.quotaUsedMb += photoSizeMb;
    this.updateAccountStatus(activeAcc);

    this.photoIndex.set(hash, syncedPhoto);

    return {
      status: 'SYNC_SUCCESS',
      photo: syncedPhoto,
      targetAccount: activeAcc,
      switchTriggered: activeAcc.status === 'THRESHOLD_REACHED'
    };
  }

  // Get Unified Photo Timeline (Sorted chronologically across all accounts)
  getUnifiedTimeline(filterQuery = '') {
    let photos = Array.from(this.photoIndex.values());

    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      photos = photos.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.accountEmail.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    return photos.sort((a, b) => new Date(b.dateTaken) - new Date(a.dateTaken));
  }

  // Offload an account to local disk / LocalDrop and clear quota
  offloadAccountToLocal(accountId) {
    const acc = this.accounts.find(a => a.id === accountId);
    if (!acc) return null;

    const accountPhotos = Array.from(this.photoIndex.values()).filter(p => p.accountId === accountId);
    const freedMb = acc.quotaUsedMb;

    acc.quotaUsedMb = 0.0;
    acc.status = 'ACTIVE';

    return {
      accountId: acc.id,
      accountEmail: acc.email,
      freedMb: parseFloat(freedMb.toFixed(2)),
      photosOffloadedCount: accountPhotos.length
    };
  }
}
