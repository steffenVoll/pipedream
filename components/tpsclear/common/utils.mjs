import { STATUS_CLEAN } from "./constants.mjs";

/**
 * True only for a clean verdict. "unknown" covers both a register check that
 * failed and a number that is not a valid UK line, and "suppressed" is the
 * account's own do-not-call list, so neither may read as callable.
 * "consented" is kept false too: the rule stays clean-only, and the status
 * field says why a number was not screened.
 */
export const safeToCall = (status) => status === STATUS_CLEAN;

/**
 * Accept a phone-number list however a workflow hands it over: a real array,
 * a JSON-encoded array, or one string of comma or newline separated numbers.
 * Returns trimmed non-empty strings.
 */
export const parsePhoneNumbers = (value) => {
  if (value === undefined || value === null) {
    return [];
  }
  let items = value;
  if (typeof value === "string") {
    const text = value.trim();
    if (text.startsWith("[")) {
      try {
        items = JSON.parse(text);
      } catch {
        items = text;
      }
    }
    if (typeof items === "string") {
      items = items.split(/[\r\n,]+/);
    }
  }
  if (!Array.isArray(items)) {
    items = [
      items,
    ];
  }
  return items
    .map((item) => String(item ?? "").trim())
    .filter((item) => item.length > 0);
};

/**
 * The audit record id travels in the X-Request-Id response header. Axios
 * lowercases header names; the `get` branch covers an AxiosHeaders instance.
 */
export const requestIdOf = (headers) => {
  if (!headers) {
    return null;
  }
  const direct = headers["x-request-id"] ?? headers["X-Request-Id"];
  if (direct) {
    return String(direct);
  }
  if (typeof headers.get === "function") {
    const got = headers.get("x-request-id");
    return got
      ? String(got)
      : null;
  }
  return null;
};

/**
 * One screening result as the workflow sees it: the API's own fields plus
 * `safeToCall`, and the audit record id so a later step can quote it.
 */
export const shapeResult = (result, extras = {}) => ({
  phoneNumber: result.phoneNumber,
  status: result.status,
  safeToCall: safeToCall(result.status),
  tpsListed: Boolean(result.tpsListed),
  ctpsListed: Boolean(result.ctpsListed),
  checkedAt: result.checkedAt ?? null,
  ...extras,
});

/**
 * Count verdicts for a batch summary line.
 */
export const countStatuses = (results) => {
  const counts = {
    clean: 0,
    tpsListed: 0,
    ctpsListed: 0,
    suppressed: 0,
    consented: 0,
    unknown: 0,
  };
  for (const r of results) {
    switch (r.status) {
    case "clean":
      counts.clean += 1;
      break;
    case "tps-listed":
      counts.tpsListed += 1;
      break;
    case "ctps-listed":
      counts.ctpsListed += 1;
      break;
    case "suppressed":
      counts.suppressed += 1;
      break;
    case "consented":
      counts.consented += 1;
      break;
    default:
      counts.unknown += 1;
    }
  }
  return counts;
};

/**
 * Plain-English verdict for a summary line.
 */
export const describeStatus = (status) => {
  switch (status) {
  case "clean":
    return "clean (safe to call)";
  case "tps-listed":
    return "TPS-listed";
  case "ctps-listed":
    return "CTPS-listed";
  case "suppressed":
    return "on your suppression list";
  case "consented":
    return "on your consent list";
  default:
    return "unknown (could not be checked)";
  }
};
