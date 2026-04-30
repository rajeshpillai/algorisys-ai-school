import Config

# Configure the database for testing
config :backend, Backend.Repo,
  username: "ai_school",
  password: "ai_school_dev",
  hostname: "localhost",
  port: 55433,
  database: "ai_school_test#{System.get_env("MIX_TEST_PARTITION")}",
  pool: Ecto.Adapters.SQL.Sandbox,
  pool_size: System.schedulers_online() * 2

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :backend, BackendWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base: "D1HRLzcFWPvP6+osC3hIiq8pRsFEuQwPLyewJZzzLhQ7HBU1viZwGBbVESj/nyO/",
  server: false

# Print only warnings and errors during test
config :logger, level: :warning

# Initialize plugs at runtime for faster test compilation
config :phoenix, :plug_init_mode, :runtime

# Sort query params output of verified routes for robust url comparisons
config :phoenix,
  sort_verified_routes_query_params: true
