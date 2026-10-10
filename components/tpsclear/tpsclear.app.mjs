import { axios } from "@pipedream/platform";
import {
  BASE_URL, MAX_LIST_BATCH, MAX_SCREEN_BATCH,
} from "./common/constants.mjs";

export default {
  type: "app",
  app: "tpsclear",
  propDefinitions: {
    phoneNumber: {
      type: "string",
      label: "Phone Number",
      description: "A UK phone number in any common format, e.g. `020 7946 0018` or `+442079460018`. Spaces, dashes and brackets are ignored. A number outside the UK comes back as `unknown`.",
    },
    phoneNumbers: {
      type: "string[]",
      label: "Phone Numbers",
      description: `UK phone numbers in any common format, e.g. \`["0113 496 0001", "+442079460018"]\`. Up to ${MAX_SCREEN_BATCH} per run. Each distinct valid UK number is one chargeable check; duplicates and numbers that are not valid UK numbers are not charged.`,
    },
    campaignRef: {
      type: "string",
      label: "Campaign Reference",
      description: "Optional tag stored on the audit record, e.g. `Autumn outbound`, so a later compliance request can be answered per campaign. Up to 120 characters: letters, digits, spaces and `. , : / # _ -` only.",
      optional: true,
    },
    recordId: {
      type: "string",
      label: "Audit Record ID",
      description: "The audit record id of a past screening run, e.g. `6f1d2c9a-4b3e-4f2a-9c1d-8e7b6a5f4d3c`. Use **Screen Phone Number** or **Screen Phone Numbers** to get it (the `recordId` field).",
    },
    listNumbers: {
      type: "string[]",
      label: "Phone Numbers",
      description: `UK phone numbers to add, e.g. \`["0113 496 0001", "+442079460018"]\`. Up to ${MAX_LIST_BATCH.toLocaleString("en-GB")} per run. Numbers already on the list are ignored rather than duplicated.`,
    },
    note: {
      type: "string",
      label: "Note",
      description: "Optional reason kept in the list's change log, e.g. `Asked not to be called on 3 October`.",
      optional: true,
    },
  },
  methods: {
    /**
     * Every endpoint takes the same bearer API key (tpsc_test_... or
     * tpsc_live_...). Which register data a key sees is decided server side
     * by the key itself, so one base URL covers both.
     */
    _makeRequest({
      $ = this, headers, ...args
    }) {
      return axios($, {
        baseURL: BASE_URL,
        headers: {
          "Authorization": `Bearer ${this.$auth.api_key}`,
          "Content-Type": "application/json",
          ...headers,
        },
        ...args,
      });
    },
    /**
     * Screen up to 1,000 numbers against the registers and the account's own
     * lists. Chargeable on a live key. Returns the full response so the caller
     * can read the X-Request-Id header, which is the audit record id.
     * @param {object} args - request options; `data` is `{ phoneNumbers, campaignRef? }`.
     * @returns {Promise<object>} axios response: `{ data: { results, campaignRef? }, headers }`
     */
    screen(args = {}) {
      return this._makeRequest({
        method: "POST",
        url: "/screen",
        returnFullResponse: true,
        ...args,
      });
    },
    /**
     * Fetch a stored screening run by its audit record id. Read-only.
     * @param {object} args - `recordId` plus request options.
     * @returns {Promise<object>} `{ id, createdAt, environment, lookups, campaignRef,
     *   summary, providerFailures, results }`
     */
    getScreeningRecord({
      recordId, ...args
    }) {
      return this._makeRequest({
        url: `/screen/${encodeURIComponent(recordId)}`,
        ...args,
      });
    },
    /**
     * Current-window usage for the key and 30-day totals for the account.
     * Read-only and never consumes screening budget, so it doubles as the
     * connection test.
     * @returns {Promise<object>} `{ key, environment, plan, window, last30d }`
     */
    getUsage(args = {}) {
      return this._makeRequest({
        url: "/usage",
        ...args,
      });
    },
    /**
     * The 100 most recent numbers on the account's suppression list, plus the
     * full count.
     * @returns {Promise<object>} `{ count, suppressions }`
     */
    listSuppressions(args = {}) {
      return this._makeRequest({
        url: "/suppressions",
        ...args,
      });
    },
    /**
     * Add numbers to the account's suppression list. Live keys only.
     * @param {object} args - request options; `data` is `{ numbers, note? }`.
     * @returns {Promise<object>} `{ ok, added, alreadyListed, invalidCount, total,
     *   invalid, invalidRows }`
     */
    addSuppressions(args = {}) {
      return this._makeRequest({
        method: "POST",
        url: "/suppressions",
        ...args,
      });
    },
    /**
     * Remove one number from the account's suppression list. Live keys only.
     * The number travels in the body, not the query string, so it stays out
     * of access logs.
     * @param {object} args - request options; `data` is `{ number, note? }`.
     * @returns {Promise<object>} `{ ok, removed }`
     */
    removeSuppression(args = {}) {
      return this._makeRequest({
        method: "DELETE",
        url: "/suppressions",
        ...args,
      });
    },
  },
};
