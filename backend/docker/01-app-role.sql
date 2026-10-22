-- Least-privilege runtime role: no superuser, no BYPASSRLS, so Row-Level Security applies to the API.
CREATE ROLE staffsync_app LOGIN PASSWORD 'staffsync_app' NOSUPERUSER NOBYPASSRLS;
GRANT CONNECT ON DATABASE staffsync TO staffsync_app;
