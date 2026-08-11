export function ensureDraftForSaving({ currentDraftId, createNewDraft, saveDraftData }) {
  if (currentDraftId) {
    saveDraftData(currentDraftId);
    return currentDraftId;
  }

  const createdDraftId = createNewDraft();
  if (!createdDraftId) return null;

  saveDraftData(createdDraftId);
  return createdDraftId;
}
