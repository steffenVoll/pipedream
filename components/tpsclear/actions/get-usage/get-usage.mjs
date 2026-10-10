import tpsclear from "../../tpsclear.app.mjs";
import { DOCS_URL } from "../../common/constants.mjs";

export default {
  key: "tpsclear-get-usage",
  name: "Get Usage",
  description: "Read the connected key's usage: lookups used and remaining in the current fair-use window, when the window resets, and the account's calls and lookups over the last 30 days."
    + " Read-only and never consumes screening budget. Use it to check headroom before **Screen Phone Numbers**."
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
    const usage = await this.tpsclear.getUsage({
      $,
    });

    const last4 = usage?.key?.last4
      ? ` ending ${usage.key.last4}`
      : "";
    const used = usage?.window?.used ?? 0;
    const limit = usage?.window?.limit ?? 0;
    $.export("$summary", `Key${last4} (${usage?.environment ?? "unknown"}): ${used} of ${limit} lookups used in the current window`);

    return usage;
  },
};
