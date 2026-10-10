export const BASE_URL = "https://api.tpsclear.co.uk/v1";

export const DOCS_URL = "https://tpsclear.co.uk/developers";

// Numbers per Screen Phone Numbers run. The API accepts 1,000, but a full
// batch with the provider's per-number fallback can outlast a workflow step,
// and a retry would pay twice. Raising it later is not a breaking change.
export const MAX_SCREEN_BATCH = 200;

// Numbers per Add Suppressions run, the API's own ceiling.
export const MAX_LIST_BATCH = 10000;

export const STATUS_CLEAN = "clean";
