import { ConfigurationError } from "@pipedream/platform";
import tpsclear from "../../tpsclear.app.mjs";
import { DOCS_URL } from "../../common/constants.mjs";

export default {
  key: "tpsclear-remove-suppression",
  name: "Remove Suppression",
  description: "Remove one UK phone number from your account's suppression list, so later screens check it against the registers again."
    + " Removing a number that is not on the list succeeds with `removed: false`. Free, but needs a live key: test keys cannot change lists."
    + " Use **List Suppressions** to find what is on the list."
    + ` [See the documentation](${DOCS_URL})`,
  version: "0.0.1",
  type: "action",
  ai: "optimized",
  annotations: {
    destructiveHint: true,
    openWorldHint: true,
    readOnlyHint: false,
  },
  props: {
    tpsclear,
    phoneNumber: {
      propDefinition: [
        tpsclear,
        "phoneNumber",
      ],
      description: "The UK number to take off the suppression list, e.g. `020 7946 0018` or `+442079460018`.",
    },
    note: {
      propDefinition: [
        tpsclear,
        "note",
      ],
      description: "Optional reason the number came off the list, kept in the change log, e.g. `Customer asked to be contacted again`.",
    },
  },
  async run({ $ }) {
    const phoneNumber = String(this.phoneNumber ?? "").trim();
    if (!phoneNumber) {
      throw new ConfigurationError("Phone Number is required. Nothing was removed.");
    }
    const note = this.note?.trim() || undefined;

    const response = await this.tpsclear.removeSuppression({
      $,
      data: {
        number: phoneNumber,
        note,
      },
    });

    const removed = Boolean(response?.removed);
    $.export("$summary", removed
      ? `Removed ${phoneNumber} from the suppression list`
      : `${phoneNumber} was not on the suppression list`);

    return {
      ok: Boolean(response?.ok),
      removed,
      phoneNumber,
    };
  },
};
