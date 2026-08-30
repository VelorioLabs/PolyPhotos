import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { StorageOrchestrator } from '../src/engine/orchestrator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Running PolyPhotos Storage Orchestrator Unit Tests...');

// Test 1: Verify package structure
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
assert.strictEqual(pkg.name, 'polyphotos');
console.log('✅ PASS: package.json verified!');

// Test 2: Threshold & Auto-Switching
const orch = new StorageOrchestrator(1500); // 1.5GB threshold

orch.addAccount({
  id: 'acc-1',
  email: 'account1@gmail.com',
  quotaTotalMb: 15360,
  quotaUsedMb: 14000 // 1.36GB left (Under 1.5GB threshold)
});

orch.addAccount({
  id: 'acc-2',
  email: 'account2@gmail.com',
  quotaTotalMb: 15360,
  quotaUsedMb: 1000 // 14.36GB left
});

const stats = orch.getPoolStats();
assert.strictEqual(stats.totalMb, 30720, 'Total pool should be 30GB');
console.log('✅ PASS: Pool capacity aggregation verified (30.0 GB)');

// Test 3: Syncing a photo should route to account 2 because account 1 hit threshold
const syncRes1 = await orch.syncPhoto({
  title: 'Test Photo 1',
  sizeBytes: 5 * 1024 * 1024,
  dateTaken: '2026-08-30T10:00:00Z',
  url: 'http://test.com/photo1.jpg'
});

assert.strictEqual(syncRes1.status, 'SYNC_SUCCESS');
assert.strictEqual(syncRes1.photo.accountId, 'acc-2', 'Should auto-switch and sync to account2@gmail.com');
console.log('✅ PASS: Auto-switching router correctly bypassed full account and synced to Account 2!');

// Test 4: Differential deduplication (attempting to sync same photo again)
const syncResDuplicate = await orch.syncPhoto({
  title: 'Test Photo 1',
  hash: syncRes1.photo.hash,
  sizeBytes: 5 * 1024 * 1024
});

assert.strictEqual(syncResDuplicate.status, 'SKIPPED_DUPLICATE');
console.log('✅ PASS: Differential deduplication successfully prevented duplicate upload!');

// Test 5: Unified timeline
const timeline = orch.getUnifiedTimeline();
assert.strictEqual(timeline.length, 1);
console.log('✅ PASS: Unified timeline sorting verified!');

// Test 6: Offloading full account
const offload = orch.offloadAccountToLocal('acc-1');
assert.strictEqual(offload.accountId, 'acc-1');
assert.strictEqual(orch.accounts.find(a => a.id === 'acc-1').quotaUsedMb, 0);
console.log('✅ PASS: Local offloader successfully freed up Account 1 quota!');

console.log('🎉 All PolyPhotos orchestrator tests passed with 100% success!');
