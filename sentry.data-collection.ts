// Shared Sentry data-collection baseline for the client, server and edge configs.
//
// @sentry/nextjs v11 replaced `sendDefaultPii` with `dataCollection`, and leaving `dataCollection`
// unset now collects user info, cookies, HTTP request/response bodies, GenAI inputs/outputs and more.
// This app never opted into `sendDefaultPii`, so we pin the v10 default explicitly (as recommended by
// the Sentry v10 -> v11 migration guide). In particular this keeps Aitor chat messages, plant images and
// allotment data in request bodies out of Sentry events.
import type { BrowserOptions } from '@sentry/nextjs'

const PII_KEY_DENYLIST = ['forwarded', '-ip', 'remote-', 'via', '-user']

export const sentryDataCollection: NonNullable<BrowserOptions['dataCollection']> = {
  userInfo: false,
  cookies: false,
  httpHeaders: {
    request: { deny: PII_KEY_DENYLIST },
    response: { deny: PII_KEY_DENYLIST },
  },
  httpBodies: [],
  urlQueryParams: { deny: PII_KEY_DENYLIST },
  genAI: { inputs: false, outputs: false },
  databaseQueryData: false,
  queues: false,
  graphQL: { document: false, variables: false },
}
