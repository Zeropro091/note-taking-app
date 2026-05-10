// Script to sync embeddings for all existing notes
import { getAllNotes } from '../src/lib/file-system.js';
import { syncAllEmbeddings } from '../src/lib/vector-store.js';

async function main() {
  console.log('--- Nemesi Embedding Sync ---');
  try {
    const notes = await getAllNotes();
    console.log(`Found ${notes.length} notes. Starting sync...`);
    await syncAllEmbeddings(notes);
    console.log('Sync complete! All notes are now semantically indexed.');
  } catch (error) {
    console.error('Sync failed:', error);
    process.exit(1);
  }
}

main();
