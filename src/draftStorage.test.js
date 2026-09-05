import test from 'node:test';
import assert from 'node:assert/strict';
import { saveCurrentDraftState } from './draftStorage.js';

test('creates a new draft and saves it when no draft is active', () => {
  let createdDraftId = null;
  let savedDraftId = null;

  const result = saveCurrentDraftState({
    currentDraftId: null,
    createNewDraft: () => {
      createdDraftId = 'draft-42';
      return createdDraftId;
    },
    saveDraftData: (draftId) => {
      savedDraftId = draftId;
    }
  });

  assert.equal(result, 'draft-42');
  assert.equal(createdDraftId, 'draft-42');
  assert.equal(savedDraftId, 'draft-42');
});
