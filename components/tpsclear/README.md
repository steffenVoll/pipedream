# Overview

TPSClear screens UK phone numbers against the Telephone Preference Service (TPS) and Corporate TPS (CTPS) registers, the UK's do-not-call lists for live marketing calls. One action screens a number, another screens a list of up to 200, and each returns a verdict, a `safeToCall` flag that is true only for a clean number, and an audit record id you can quote if a call is ever questioned (`recordId`, which is `null` in the rare case the audit write failed). The account's own suppression list is managed from the same connection, so a number a customer asks you not to call stays out of every later screen without a register check or a charge.

Connect with a TPSClear API key. A test key (`tpsc_test_`) screens built-in fixtures and costs nothing, so build the workflow with that; a live key (`tpsc_live_`) screens the registers and uses the plan allowance or prepaid credits behind the key.

# Example Use Cases

- **Screen a new lead before it reaches the dialler**: when a lead lands in your CRM, run **Screen Phone Number**, write `status` and `safeToCall` back to the record, and route anything that is not safe to call away from the calling queue.
- **Re-screen a call list on a schedule**: a number should be screened again before calling if its last check is 27 or more days old, so a weekly workflow can read the numbers due for a call, run **Screen Phone Numbers** in batches of 200, and update the records that changed.
- **Honour an opt-out everywhere**: when a contact asks not to be called, run **Add Suppressions** so every later screen on the account returns that number as `suppressed`, whichever key or tool made the call.
- **Answer a compliance question**: store the `recordId` next to each call outcome, and run **Get Screening Record** to show exactly what TPSClear returned, and when, for that number.

# Getting Started

1. Sign in at [tpsclear.co.uk/account](https://tpsclear.co.uk/account) with a link emailed to your work address, then create a key. Start with a test key.
2. In Pipedream, connect your TPSClear account and paste the key. The connection is checked against the usage endpoint, which is read-only and free.
3. Add **Screen Phone Number** to a workflow. With a test key, `0113 496 0002` returns `tps-listed`, `020 7946 0018` returns `ctps-listed`, and any other valid UK number returns `clean`.
4. Filter later steps on `safeToCall`, not on the status text. `unknown` covers both a register check that failed and a number that is not a valid UK line, and it must never be treated as callable.
5. When the workflow is right, swap the connection for a live key.

Verdicts are `clean`, `tps-listed`, `ctps-listed`, `suppressed` (on your own suppression list), `consented` (on your own consent list) and `unknown`. Every distinct valid UK number sent to a screening action is one chargeable check on a live key; duplicates, invalid numbers and numbers on your own lists are not charged.

# Troubleshooting

Errors carry the API's own `error` code and a `message` written for the person reading it.

- **401 `unauthorized` or `invalid_api_key`**: the key is missing, revoked or mistyped. Reconnect the account with a current key from [tpsclear.co.uk/account](https://tpsclear.co.uk/account).
- **429 `rate_limited`**: the key's fair-use lookup budget for the current window is spent. The response says when it resets; a retry after that succeeds.
- **429 `allowance_reached`** or **`daily_cap_reached`**: the plan allowance for the period, or the account's daily screening cap, is used up. A retry will not clear it; raise the allowance in TPSClear settings or wait for the reset in the message.
- **402 `insufficient_credits`**: a prepaid key has run out. Buy a credit pack at [tpsclear.co.uk/account](https://tpsclear.co.uk/account). Nothing was screened.
- **402 `subscription_required`**: the HubSpot account the key belongs to has no active TPSClear subscription, or the account is not active. Nothing was screened.
- **403 `test_key_read_only`**: test keys cannot change the suppression list. Use a live key for **Add Suppressions** and **Remove Suppression**.
- **403 `screening_switched_off`**: screening is switched off in the TPSClear settings of the connected HubSpot account. Switch it on there.
- **400 `batch_too_large`** or a configuration error about the 200 limit: split the list across runs. Nothing was screened or charged.
- **400 `list_full`** from **Add Suppressions**: a suppression list holds up to 100,000 numbers. Remove numbers that no longer need to be on it with **Remove Suppression**.
- **503 `service_unavailable`**: TPSClear could not reach its own database, so it refused rather than return an unchecked verdict. Nothing was screened; retry shortly.
- **404 `not_found`** from **Get Screening Record**: no record with that id on this account. Pass the `recordId` a screening action returned, not the phone number.
