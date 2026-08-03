module.exports = Object.freeze({
  success: 200,
  bad_request: 400,
  unauthorized: 401,

  // Keep legacy key for compatibility with existing imports.
  token_unprovide: 401,
  token_unprovided: 401,

  forbidden: 403,
  not_found: 404,

  // App-specific response codes used by current project.
  wrong_password: 405,
  empty_data: 406,
  already_exists: 407,

  internal_server_error: 500,
  service_not_available: 503,
  gateway_timeout: 504,

  // Keep typo key for backward compatibility and provide corrected alias.
  update_aplication: 505,
  update_application: 505
});