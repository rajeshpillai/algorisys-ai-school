const STORAGE_KEY = 'learner_id';

function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Get the learner ID from localStorage, generating one if it doesn't exist.
 * This ID persists across sessions and will be linked to a user account
 * when authentication is added.
 */
export function getLearnerId(): string {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = generateId();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
