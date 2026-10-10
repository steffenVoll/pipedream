import { ConfigurationError } from "@pipedream/platform";
import tpsclear from "../../tpsclear.app.mjs";
import {
  DOCS_URL, MAX_LIST_BATCH,
} from "../../common/constants.mjs";
import { parsePhoneNumbers } from "../../common/utils.mjs";

export default {
  key: "tpsclear-add-suppressions",
  name: "Add Suppressions",
  description: "Add UK phone numbers to your account's suppression list, so every later screen on any key for the account returns them as `suppressed` without a register check or a charge."
    + " Numbers already on the list are left as they are. Free, but needs a live key: test keys cannot change lists."
    + " Use **List Suppressions** to review the list and **Remove Suppression** to take a number off it."
    + ` [See the documentation](${DOCS_URL})`,
  version: "0.0.1",
  type: "action",
  ai: "optimized",
  annotations: {
    destructiveHint: false,
    openWorldHint: true,
    readOnlyHint: false,
  },
  props: {
    tpsclear,
    phoneNumbers: {
      propDefinition: [
        tpsclear,
        "listNumbers",
      ],
    },
    note: {
      propDefinition: [
        tpsclear,
        "note",
      ],
    },
  },
  async run({ $ }) {
    const numbers = parsePhoneNumbers(this.phoneNumbers);
    const note = this.note?.trim() || undefined;
    if (numbers.length === 0) {
      throw new ConfigurationError("Phone Numbers must contain at least one number.");
    }
    if (numbers.length > MAX_LIST_BATCH) {
      throw new ConfigurationError(
        `Phone Numbers holds ${numbers.length} entries; the limit is ${MAX_LIST_BATCH} per run. Split the list across runs. Nothing was added.`,
      );
    }

    const response = await this.tpsclear.addSuppressions({
      $,
      data: {
        numbers,
        note,
      },
    });

    const added = response?.added ?? 0;
    const alreadyListed = response?.alreadyListed ?? 0;
    const invalid = response?.invalidCount ?? (response?.invalid?.length ?? 0);
    const total = response?.total ?? 0;
    $.export("$summary", `Added ${added} number${added === 1
      ? ""
      : "s"} to the suppression list (${alreadyListed} already listed, ${invalid} invalid); ${total} on the list`);

    return response;
  },
};
