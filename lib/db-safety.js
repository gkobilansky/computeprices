/**
 * Database Safety Utilities
 *
 * Provides safeguards to prevent accidental production database modifications.
 * All scripts that modify the database should use these utilities.
 */

import readline from 'readline';

/**
 * Environment detection result
 * @typedef {Object} EnvironmentInfo
 * @property {string} type - 'local', 'production', or 'unknown'
 * @property {string} url - The database URL
 * @property {boolean} isProduction - True if production environment detected
 * @property {string[]} indicators - List of indicators that led to this detection
 */

/**
 * Detects the current database environment based on NEXT_PUBLIC_SUPABASE_URL
 * @returns {EnvironmentInfo}
 */
function detectEnvironment() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const nodeEnv = process.env.NODE_ENV || 'development';
  const indicators = [];

  // Check for local development indicators
  const isLocalUrl =
    url.includes('127.0.0.1') ||
    url.includes('localhost') ||
    url.includes(':54321'); // Default Supabase local port

  // Check for production indicators
  const isProductionUrl = url.includes('.supabase.co');
  const isProductionEnv = nodeEnv === 'production';

  if (isLocalUrl) {
    indicators.push('URL contains localhost/127.0.0.1 or port 54321');
    return {
      type: 'local',
      url,
      isProduction: false,
      indicators
    };
  }

  if (isProductionUrl) {
    indicators.push('URL contains .supabase.co');
    if (isProductionEnv) {
      indicators.push('NODE_ENV is production');
    }
    return {
      type: 'production',
      url,
      isProduction: true,
      indicators
    };
  }

  // Unknown environment - treat as potentially dangerous
  indicators.push('Unable to determine environment from URL');
  return {
    type: 'unknown',
    url,
    isProduction: true, // Err on the side of caution
    indicators
  };
}

/**
 * Validates that required environment variables are set
 * @param {string[]} requiredVars - List of required environment variable names
 * @throws {Error} If any required variable is missing
 */
function validateEnvVars(requiredVars) {
  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n` +
      missing.map(v => `  - ${v}`).join('\n') +
      `\n\nPlease check your .env.local file. See .env.example for reference.`
    );
  }
}

/**
 * Creates a readline interface for user prompts
 * @returns {readline.Interface}
 */
function createPromptInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * Prompts the user for confirmation
 * @param {string} message - The confirmation message to display
 * @returns {Promise<boolean>} - True if user confirmed, false otherwise
 */
async function promptConfirmation(message) {
  const rl = createPromptInterface();

  return new Promise((resolve) => {
    rl.question(`${message} (yes/no): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Logs database target information with clear visual indicators
 * @param {string} operation - Description of the operation being performed
 * @param {EnvironmentInfo} [envInfo] - Environment info (auto-detected if not provided)
 */
function logDatabaseTarget(operation, envInfo = null) {
  const env = envInfo || detectEnvironment();

  const separator = '='.repeat(70);
  const warning = env.isProduction
    ? '\x1b[31m*** PRODUCTION DATABASE ***\x1b[0m'
    : '\x1b[32m*** LOCAL DATABASE ***\x1b[0m';

  console.log('\n' + separator);
  console.log(warning);
  console.log(separator);
  console.log(`Operation: ${operation}`);
  console.log(`Database URL: ${env.url}`);
  console.log(`Environment: ${env.type}`);
  console.log(`Detection indicators:`);
  env.indicators.forEach(i => console.log(`  - ${i}`));
  console.log(separator + '\n');
}

/**
 * Parses command line arguments for common safety flags
 * @param {string[]} args - Command line arguments (process.argv)
 * @returns {Object} Parsed flags
 */
function parseDbSafetyFlags(args) {
  return {
    dryRun: args.includes('--dry-run'),
    production: args.includes('--production'),
    force: args.includes('--force'),
    help: args.includes('--help') || args.includes('-h')
  };
}

/**
 * Main safety check function - call at the start of any database-modifying script
 *
 * @param {Object} options
 * @param {string} options.operation - Description of the operation
 * @param {string[]} [options.requiredEnvVars] - Required environment variables
 * @param {boolean} [options.allowProduction=false] - Whether to allow production operations
 * @param {string[]} [options.args] - Command line arguments (defaults to process.argv)
 * @returns {Promise<Object>} Object with env info and parsed flags
 * @throws {Error} If safety checks fail
 */
async function runSafetyChecks(options) {
  const {
    operation,
    requiredEnvVars = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
    allowProduction = false,
    args = process.argv
  } = options;

  // Parse command line flags
  const flags = parseDbSafetyFlags(args);

  // Show help if requested
  if (flags.help) {
    console.log(`
Database Safety Flags:
  --dry-run       Run without making database changes
  --production    Required flag to run against production database
  --force         Skip confirmation prompts (use with caution)
  --help, -h      Show this help message
    `);
    process.exit(0);
  }

  // Validate environment variables
  validateEnvVars(requiredEnvVars);

  // Detect environment
  const env = detectEnvironment();

  // Log the target database
  logDatabaseTarget(operation, env);

  // Production safety checks
  if (env.isProduction) {
    if (!allowProduction) {
      throw new Error(
        'Production database operations are not allowed by this script.\n' +
        'If you need to run this against production, please use the appropriate deployment process.'
      );
    }

    if (!flags.production) {
      throw new Error(
        'Production database detected!\n' +
        'To run against production, you must explicitly pass the --production flag.\n' +
        'Example: node script.js --production'
      );
    }

    if (!flags.force) {
      console.log('\x1b[33m⚠️  WARNING: You are about to modify the PRODUCTION database!\x1b[0m\n');
      const confirmed = await promptConfirmation(
        'Are you absolutely sure you want to continue?'
      );

      if (!confirmed) {
        console.log('Operation cancelled by user.');
        process.exit(0);
      }
    }
  }

  // Dry run notice
  if (flags.dryRun) {
    console.log('\x1b[36m📋 DRY RUN MODE - No database changes will be made\x1b[0m\n');
  }

  return {
    env,
    flags,
    isDryRun: flags.dryRun,
    isProduction: env.isProduction
  };
}

/**
 * Wraps a database operation with safety logging
 * @param {string} operationName - Name of the operation for logging
 * @param {Function} operation - Async function that performs the database operation
 * @param {boolean} isDryRun - Whether this is a dry run
 * @returns {Promise<any>} Result of the operation (or null for dry run)
 */
async function safeDbOperation(operationName, operation, isDryRun) {
  if (isDryRun) {
    console.log(`[DRY RUN] Would execute: ${operationName}`);
    return null;
  }

  console.log(`Executing: ${operationName}`);
  const result = await operation();
  console.log(`Completed: ${operationName}`);
  return result;
}

export {
  detectEnvironment,
  validateEnvVars,
  promptConfirmation,
  logDatabaseTarget,
  parseDbSafetyFlags,
  runSafetyChecks,
  safeDbOperation
};
