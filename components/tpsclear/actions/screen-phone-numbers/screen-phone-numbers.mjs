import { ConfigurationError } from "@pipedream/platform";
import tpsclear from "../../tpsclear.app.mjs";
import {
  DOCS_URL, MAX_SCREEN_BATCH,
} from "../../common/constants.mjs";
import {
  countStatuses, parsePhoneNumbers, requestIdOf, shapeResult,
} from "../../common/utils.mjs";

export default {
  key: "tpsclear-screen-phone-numbers",
  name: "Screen Phone Numbers",
  description: "Screen a list of UK phone numbers against the TPS and CTPS registers and your account's own suppression and consent lists in one run."
    + ` Up to ${MAX_SCREEN_BATCH} numbers; split a longer list across runs.`
    + " Returns one result per number with `status`, `safeToCall` (true only for `clean`) and the shared audit record id."
    + " Each distinct valid UK number is one chargeable check on a live key."
    + " Use **Screen Phone Number** for a single number, and **Get Screening Record** to fetch the stored run later."
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
        "phoneNumbers",
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
    const phoneNumbers = parsePhoneNumbers(this.phoneNumbers);
    if (phoneNumbers.length === 0) {
      throw new ConfigurationError("Phone Numbers must contain at least one number.");
    }
    if (phoneNumbers.length > MAX_SCREEN_BATCH) {
      throw new ConfigurationError(
        `Phone Numbers holds ${phoneNumbers.length} entries; the limit is ${MAX_SCREEN_BATCH} per run. Split the list across runs. Nothing was screened or charged.`,
      );
    }
    const campaignRef = this.campaignRef?.trim() || undefined;

    const response = await this.tpsclear.screen({
      $,
      data: {
        phoneNumbers,
        campaignRef,
      },
    });

    const recordId = requestIdOf(response.headers);
    const results = (response.data?.results ?? []).map((result) => shapeResult(result, {
      recordId,
    }));
    const summary = countStatuses(results);

    $.export(
      "$summary",
      `Screened ${results.length} number${results.length === 1
        ? ""
        : "s"}: ${summary.clean} clean, ${summary.tpsListed} TPS-listed, ${summary.ctpsListed} CTPS-listed, ${summary.suppressed} suppressed, ${summary.consented} consented, ${summary.unknown} unknown`,
    );

    return {
      recordId,
      campaignRef: campaignRef ?? null,
      summary,
      results,
    };
  },
};
