import { ConfigurationError } from "@pipedream/platform";
import tpsclear from "../../tpsclear.app.mjs";
import { DOCS_URL } from "../../common/constants.mjs";
import {
  describeStatus, requestIdOf, shapeResult,
} from "../../common/utils.mjs";

export default {
  key: "tpsclear-screen-phone-number",
  name: "Screen Phone Number",
  description: "Screen one UK phone number against the TPS and CTPS registers and your account's own suppression and consent lists."
    + " Returns the verdict (`clean`, `tps-listed`, `ctps-listed`, `suppressed`, `consented` or `unknown`),"
    + " `safeToCall` (true only for `clean`) and the audit record id."
    + " At most one chargeable check per run on a live key (a number on your own lists or not a valid UK number is not charged); a test key screens built-in fixtures for free."
    + " Use **Screen Phone Numbers** for a list, and **Get Screening Record** to fetch the stored run later."
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
    phoneNumber: {
      propDefinition: [
        tpsclear,
        "phoneNumber",
      ],
    },
    campaignRef: {
      propDefinition: [
        tpsclear,
        "campaignRef",
      ],
    },
  },
  async run({ $ }) {
    const phoneNumber = String(this.phoneNumber ?? "").trim();
    if (!phoneNumber) {
      throw new ConfigurationError("Phone Number is required. Nothing was screened.");
    }
    const campaignRef = this.campaignRef?.trim() || undefined;

    const response = await this.tpsclear.screen({
      $,
      data: {
        phoneNumbers: [
          phoneNumber,
        ],
        campaignRef,
      },
    });

    const recordId = requestIdOf(response.headers);
    const result = response.data?.results?.[0];
    if (!result) {
      throw new Error(`TPSClear returned no verdict for that number. Check the run with **Get Screening Record**${recordId
        ? ` (record ${recordId})`
        : ""} before screening it again.`);
    }

    const shaped = shapeResult(result, {
      campaignRef: campaignRef ?? null,
      recordId,
    });

    $.export("$summary", `${shaped.phoneNumber} is ${describeStatus(shaped.status)}`);

    return shaped;
  },
};
