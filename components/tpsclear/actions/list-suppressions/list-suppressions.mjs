import tpsclear from "../../tpsclear.app.mjs";
import { DOCS_URL } from "../../common/constants.mjs";

export default {
  key: "tpsclear-list-suppressions",
  name: "List Suppressions",
  description: "List the 100 most recent numbers on your account's suppression list, each with its note and the time it was added."
    + " The full count is exported as `total`. Read-only and free."
    + " Use **Add Suppressions** and **Remove Suppression** to change the list."
    + ` [See the documentation](${DOCS_URL})`,
  version: "0.0.1",
  type: "action",
  ai: "optimized",
  annotations: {
    destructiveHint: false,
    openWorldHint: true,
    readOnlyHint: true,
  },
  props: {
    tpsclear,
  },
  async run({ $ }) {
    const response = await this.tpsclear.listSuppressions({
      $,
    });

    const suppressions = response?.suppressions ?? [];
    const total = response?.count ?? suppressions.length;
    $.export("total", total);
    $.export("$summary", `Showing ${suppressions.length} of ${total} suppressed number${total === 1
      ? ""
      : "s"}`);

    return suppressions;
  },
};
