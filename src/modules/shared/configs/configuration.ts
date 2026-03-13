import { decodeBase64 } from "../utils/base64";

export const configuration = () => ({
  ...process.env,
  clientBaseUrl: process.env.WEB_URL,
  redisConfig: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
    db: parseInt(process.env.REDIS_DB || '0'),
    subscribeDb: parseInt(process.env.REDIS_SUBSCRIBE_DB || '1'),
    queueDb: parseInt(process.env.REDIS_QUEUE_DB || '2'),
    password: process.env.REDIS_PASSWORD,
    keyPrefix: process.env.REDIS_PREFIX,
    ssl: String(process.env.REDIS_SSL) !== 'false'
  },
  dbConfig: {
    host: process.env.DATABASE_HOST || process.env.DB_HOST,
    port: parseInt(process.env.DATABASE_PORT || process.env.DB_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || process.env.DB_USERNAME,
    password: process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.DATABASE_NAME || process.env.DB_DATABASE,
    logging: String(process.env.DB_LOGGING) === 'true',
    ssl: String(process.env.DB_SSL) !== 'false',
    url: process.env.DATABASE_URL
  },
  dbReplicaConfig: {
    host: process.env.DB_REPLICA_HOST,
    port: parseInt(process.env.DB_REPLICA_PORT),
    username: process.env.DB_REPLICA_USERNAME,
    password: process.env.DB_REPLICA_PASSWORD,
    database: process.env.DB_REPLICA_DATABASE,
    logging: String(process.env.DB_REPLICA_LOGGING) === 'true',
    ssl: String(process.env.DB_REPLICA_SSL) !== 'false',
    url: process.env.DATABASE_REPLICA_URL
  },
  slackConfig: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL,
    enabledForDeBug: String(process.env.SLACK_ENABLED_FOR_DEBUG) === 'true',
    channel: process.env.SLACK_NOTIFICATION_CHANNEL,
    channelForLockApp: process.env.SLACK_NOTIFICATION_CHANNEL_FOR_LOCK_APP
  },
  // log for slack
  loggerConfig: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL,
    enabled: String(process.env.SLACK_LOG_ENABLED) !== 'false',
    channel: process.env.SLACK_LOG_CHANNEL
  },
  env: {
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    isTest: process.env.NODE_ENV === 'test',
    isStaging: process.env.APP_ENV === 'staging',
    envName: process.env.NODE_ENV
  },
  // sendgridConfig: {
  //   apiKey: process.env.SENDGRID_API_KEY
  // },
  mailgunConfig: {
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN || 'cleanover.com'
  },
  auth0Config: {
    // Management API
    domain: String(process.env.AUTH0_DOMAIN),
    // Only use user-facing operations, this is unused for now
    customDomain: process.env.AUTH0_CUSTOM_DOMAIN,
    clientId: String(process.env.AUTH0_CLIENT_ID),
    clientSecret: String(process.env.AUTH0_CLIENT_SECRET),
    audience: String(process.env.AUTH0_AUDIENCE),
    issuer: String(process.env.AUTH0_ISSUER),
    connectionId: String(process.env.AUTH0_CONNECTION_ID),
    dbConnection: String(process.env.AUTH0_DB_CONNECTION),
    algorithms: ['RS256'] as any[],
    jwksUri: `${process.env.AUTH0_ISSUER}.well-known/jwks.json`
  },
  googleConfig: {
    apiKey: process.env.GOOGLE_API_KEY
  },
  onesignalConfig: {
    appId: process.env.ONESIGNAL_APP_ID,
    apiKey: process.env.ONESIGNAL_API_KEY
  },
  jwtConfig: {
    privateKey: decodeBase64(process.env.JWT_PRIVATE_KEY),
    publicKey: decodeBase64(process.env.JWT_PUBLIC_KEY),
    expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '86400'),
    algorithm: (process.env.JWT_ALGORITHM || 'RS256') as any,
    expiresInForExternal: parseInt(process.env.JWT_EXPIRES_IN_FOR_EXTERNAL || '604800')
  },
  airTableConfig: {
    apiKey: process.env.AIRTABLE_KEY,
    baseId: 'appzOt9S3QZPC3HhJ'
  },
  graphqlConfig: {
    // TODO: update this one after project is stable
    playground: String(process.env.GRAPHQL_PLAYGROUND) === 'true' || process.env.NODE_ENV === 'development',
    introspection: String(process.env.GRAPHQL_INTROSPECTION) === 'true'
  },
  mockConfig: {
    enabledMockUserData: String(process.env.MOCK_USER_DATA) === 'true'
  },
  moduleConfig: {
    enableCronModule: String(process.env.ENABLE_CRON_MODULE) !== 'false',
    enableApiModule: String(process.env.ENABLE_API_MODULE) !== 'false',
    enableQueueConsumer: String(process.env.ENABLE_API_MODULE) !== 'false'
  },
  throttleConfig: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60'),
    limit: parseInt(process.env.THROTTLE_LIMIT || '10')
  },
  cronConfig: {
    enableAirtableCron: String(process.env.ENABLE_AIRTABLE_CRON) !== 'false',
    enableIcalCron: String(process.env.ENABLE_ICAL_CRON) !== 'false',
    enableCalendarInHostAwayCron: String(process.env.ENABLE_CALENDAR_IN_HOST_AWAY_CRON) !== 'false',
    enableJobInHostAwayCron: String(process.env.ENABLE_JOB_IN_HOST_AWAY_CRON) !== 'false',
    enableCheckJobInHostawayCron: String(process.env.ENABLE_CHECK_JOB_IN_HOSTAWAY_CRON) !== 'false',
    enableAutoArchiveClosedTicket: String(process.env.ENABLE_AUTO_ARCHIVE_CLOSED_TICKET) !== 'false',
    enableInactiveUserCron: String(process.env.ENABLE_INACTIVE_USER_CRON) !== 'false',
    enableFetchConversationHostAwayCron:
      String(process.env.ENABLE_FETCH_CONVERSATION_HOST_AWAY_CRON) !== 'false',
    enableScheduleMessageForLockAppCron:
      String(process.env.ENABLE_SCHEDULE_MESSAGE_FOR_LOCK_APP_CRON) === 'true',
    enableSendMessageLockCodeForLockAppCron:
      String(process.env.ENABLE_SEND_MESSAGE_LOCK_CODE_FOR_LOCK_APP_CRON) === 'true',
    enableScheduledFileDeletion: String(process.env.ENABLE_SCHEDULED_FILE_DELETION) == 'true'
  },
  azureStorageConfig: {
    containerName: process.env.AZURE_BLOB_CONTAINER_NAME || 'dev2-images',
    videoContainerName: process.env.AZURE_BLOB_VIDEO_CONTAINER_NAME || 'dev-videos',
    sasToken: process.env.AZURE_BLOB_SAS_TOKEN || '',
    blobEndpoint:
      process.env.AZURE_BLOB_ENDPOINT ||
      `https://${process.env.AZURE_BLOB_ACCOUNT_NAME}.blob.core.windows.net`,
    accountName: process.env.AZURE_BLOB_ACCOUNT_NAME,
    functionCode: process.env.AZURE_FUNCTION_CODE || '',
    subFolders: {
      autoMuxSyncChecklist: 'auto-mux-sync-checklist',
      syncVideoToMux: 'sync-video-to-mux'
    }
  },
  muxConfig: {
    tokenSecret: process.env.MUX_TOKEN_SECRET,
    tokenId: process.env.MUX_TOKEN_ID
  },
  smsConfig: {
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioMessageServiceId: process.env.TWILIO_MESSAGE_SERVICE_ID_LOGIN_FOR_CLEANOVER,
    enabled: String(process.env.SMS_ENABLED) !== 'false',
    enabledForDebug: String(process.env.SMS_ENABLED_FOR_DEBUG) === 'true'
  },
  googleApiConfig: {
    apiKey: process.env.GOOGLE_API_KEY
  },
  hostawayConfig: {
    Secret: process.env.HOSTAWAY_SECRET,
    allowUpdatePricesToHostaway: String(process.env.PRICING_ALLOW_UPDATE_HOSTAWAY) === 'true',
    allowSendMessageHostaway: String(process.env.ALLOW_SEND_MESSAGE_HOSTAWAY) === 'true'
  },
  livekitConfig: {
    host: process.env.LIVEKIT_HOST!,
    apiSecret: process.env.LIVEKIT_API_SECRET!,
    apiKey: process.env.LIVEKIT_API_KEY!
  },
  lockAppConfig: {
    endpoint: process.env.LOCK_APP_ENDPOINT || '',
    apiKey: process.env.LOCK_APP_API_KEY || ''
  },
  googleSheet: {
    googlePrivateKey: Buffer.from(process.env.GOOGLE_PRIVATE_KEY_BASE64!, 'base64').toString('utf8'),
    googleClientEmail: process.env.GOOGLE_CLIENT_EMAIL!,
    gsheetId: process.env.GSHEET_ID!,
    gsheetTab: process.env.GSHEET_TAB!,
    enableMaintenanceTicketExport: process.env.ENABLE_MAINTENANCE_TICKET_EXPORT === 'true'
  },
  appConfigs: {
    mobileAppKey: 'mwgyosghlmec',
    webAppKey: 'webappkey'
  },
  fcmConfig: {
    serviceAccountJson: process.env.FCM_SERVICE_ACCOUNT_JSON
  },
  internalApiConfig: {
    // totp settings -> will use for future internal api authentication
    totpSecret: process.env.INTERNAL_API_TOTP_SECRET || '',
    totpStep: parseInt(process.env.INTERNAL_API_TOTP_STEP || '60'),
    totpWindow: parseInt(process.env.INTERNAL_API_TOTP_WINDOW || '5'),
    // apiKey: process.env.INTERNAL_API_KEY || ''
    apiKeySecret: process.env.API_KEY_SECRET || 'FXqWzdclMCxzS7aHdhUcttJQdmBAGt52'
  },
  sentry: {
    sentryDsn: process.env.SENTRY_DSN,
    serviceName: process.env.SERVICE_NAME || 'cleanover-api-service',
    sentryProfilesSampleRate: Number(process.env.SENTRY_PROFILES_SAMPLE_RATE ?? 0)
  }
});

export type IEnvironment = ReturnType<typeof configuration>;
