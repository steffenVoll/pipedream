import { ConfigurationError } from "@pipedream/platform";
import tpsclear from "../../tpsclear.app.mjs";
import { DOCS_URL } from "../../common/constants.mjs";

export default {
  key: "tpsclear-get-screening-record",
  name: "Get Screening Record",
  description: "Fetch a stored screening run by its audit record id: when it ran, which environment, the per-number results and the verdict counts."
    + " Read-only and free. The id comes from the `recordId` field of **Screen Phone Number** or **Screen Phone Numbers**."
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
    recordId: {
      propDefinition: [
        tpsclear,
        "recordId",
      ],
    },
  },
  async run({ $ }) {
    const recordId = String(this.recordId ?? "").trim();
    if (!recordId) {
      // A blank id would request the bare screen path, which answers with the
      // public service description rather than a 404.
      throw new ConfigurationError("Audit Record ID is required. Use the `recordId` from **Screen Phone Number** or **Screen Phone Numbers**.");
    }

    const record = await this.tpsclear.getScreeningRecord({
      $,
      recordId,
    });

    const count = Array.isArray(record?.results)
      ? record.results.length
      : 0;
    $.export("$summary", `Retrieved screening record ${record?.id ?? recordId} (${count} result${count === 1
      ? ""
      : "s"})`);

    return record;
  },
};
