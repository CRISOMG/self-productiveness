SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict 8upW6aKAnKDUuusbehJ0hCXH2JnYVRcW8ruDM5kzhOuQNrGDcffBGEhoNObj0RA

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', 'c60549bd-f3d1-44d9-b129-6ece6d65f184', '{"action":"user_signedup","actor_id":"4ddb8909-ef46-4cde-8feb-8ce0a3c72564","actor_username":"cristiancaraballo112@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-12-23 02:10:56.44401+00', ''),
	('00000000-0000-0000-0000-000000000000', '653dbea6-d224-4dea-ae74-ac58f108aaab', '{"action":"login","actor_id":"4ddb8909-ef46-4cde-8feb-8ce0a3c72564","actor_username":"cristiancaraballo112@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-12-23 02:10:56.455808+00', ''),
	('00000000-0000-0000-0000-000000000000', '0e45503a-a37e-43b3-8e2c-00325c6eba44', '{"action":"token_refreshed","actor_id":"4ddb8909-ef46-4cde-8feb-8ce0a3c72564","actor_username":"cristiancaraballo112@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-12-23 03:08:59.380943+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ec080c76-2177-45ba-9c38-1b572aa5453e', '{"action":"token_revoked","actor_id":"4ddb8909-ef46-4cde-8feb-8ce0a3c72564","actor_username":"cristiancaraballo112@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-12-23 03:08:59.382521+00', ''),
	('00000000-0000-0000-0000-000000000000', '67eb75ee-0a19-4b8a-82d3-f6e2f792a715', '{"action":"token_refreshed","actor_id":"4ddb8909-ef46-4cde-8feb-8ce0a3c72564","actor_username":"cristiancaraballo112@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-12-23 04:06:59.378874+00', ''),
	('00000000-0000-0000-0000-000000000000', '2c7d2a31-3a6e-4012-8c22-7f67d205d12a', '{"action":"token_revoked","actor_id":"4ddb8909-ef46-4cde-8feb-8ce0a3c72564","actor_username":"cristiancaraballo112@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-12-23 04:06:59.379925+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e12e359d-c4d3-4ecd-90dc-4955eb4dd978', '{"action":"token_refreshed","actor_id":"4ddb8909-ef46-4cde-8feb-8ce0a3c72564","actor_username":"cristiancaraballo112@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-12-23 05:04:59.362483+00', ''),
	('00000000-0000-0000-0000-000000000000', '01e9afda-570a-4f0d-b3cd-0216624ac716', '{"action":"token_revoked","actor_id":"4ddb8909-ef46-4cde-8feb-8ce0a3c72564","actor_username":"cristiancaraballo112@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-12-23 05:04:59.363287+00', ''),
	('00000000-0000-0000-0000-000000000000', '9ac1205e-2b14-4e02-917b-c54587cb5c3d', '{"action":"token_refreshed","actor_id":"4ddb8909-ef46-4cde-8feb-8ce0a3c72564","actor_username":"cristiancaraballo112@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-12-23 17:36:32.141873+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c0b3cace-a0af-40e0-bba5-16c5a5889dfb', '{"action":"token_revoked","actor_id":"4ddb8909-ef46-4cde-8feb-8ce0a3c72564","actor_username":"cristiancaraballo112@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-12-23 17:36:32.145901+00', ''),
	('00000000-0000-0000-0000-000000000000', '4587fb31-c6a9-45e5-9daf-68185af96b81', '{"action":"token_refreshed","actor_id":"4ddb8909-ef46-4cde-8feb-8ce0a3c72564","actor_username":"cristiancaraballo112@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-12-23 17:36:32.249285+00', ''),
	('00000000-0000-0000-0000-000000000000', '7c9fd0c5-cbc7-41fd-bfe6-dad8ea86e1dd', '{"action":"token_refreshed","actor_id":"4ddb8909-ef46-4cde-8feb-8ce0a3c72564","actor_username":"cristiancaraballo112@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-12-23 18:56:57.880317+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c412b75c-d9e9-4919-a9fb-24e6d73a8c55', '{"action":"token_revoked","actor_id":"4ddb8909-ef46-4cde-8feb-8ce0a3c72564","actor_username":"cristiancaraballo112@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-12-23 18:56:57.881958+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ea2e60f9-3c0f-47ec-997e-451476ac0242', '{"action":"token_refreshed","actor_id":"4ddb8909-ef46-4cde-8feb-8ce0a3c72564","actor_username":"cristiancaraballo112@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-12-23 19:55:40.471527+00', ''),
	('00000000-0000-0000-0000-000000000000', '03a08cda-98fc-4084-875c-ac2adf6fe7c3', '{"action":"token_revoked","actor_id":"4ddb8909-ef46-4cde-8feb-8ce0a3c72564","actor_username":"cristiancaraballo112@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-12-23 19:55:40.474045+00', ''),
	('00000000-0000-0000-0000-000000000000', '4fc70fa6-3813-4ac5-96e8-91ed8b1e1eec', '{"action":"token_refreshed","actor_id":"4ddb8909-ef46-4cde-8feb-8ce0a3c72564","actor_username":"cristiancaraballo112@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-12-23 21:57:38.857989+00', ''),
	('00000000-0000-0000-0000-000000000000', '19e44955-1898-4920-b9cd-f9defb7982f7', '{"action":"token_revoked","actor_id":"4ddb8909-ef46-4cde-8feb-8ce0a3c72564","actor_username":"cristiancaraballo112@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-12-23 21:57:38.860156+00', ''),
	('00000000-0000-0000-0000-000000000000', '5d059619-6957-446e-8400-9b1533a3ba73', '{"action":"token_refreshed","actor_id":"4ddb8909-ef46-4cde-8feb-8ce0a3c72564","actor_username":"cristiancaraballo112@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-12-23 22:56:01.005334+00', ''),
	('00000000-0000-0000-0000-000000000000', '7d051bc5-ad9b-44de-9a4d-3366365607f5', '{"action":"token_revoked","actor_id":"4ddb8909-ef46-4cde-8feb-8ce0a3c72564","actor_username":"cristiancaraballo112@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-12-23 22:56:01.006707+00', ''),
	('00000000-0000-0000-0000-000000000000', '36686abb-21ea-4ab6-80de-c1ed2c44dffd', '{"action":"token_refreshed","actor_id":"4ddb8909-ef46-4cde-8feb-8ce0a3c72564","actor_username":"cristiancaraballo112@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-12-23 23:54:07.229477+00', ''),
	('00000000-0000-0000-0000-000000000000', '4f47aab8-9ae7-4033-a9bf-1bd6de2a18bc', '{"action":"token_revoked","actor_id":"4ddb8909-ef46-4cde-8feb-8ce0a3c72564","actor_username":"cristiancaraballo112@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-12-23 23:54:07.230387+00', ''),
	('00000000-0000-0000-0000-000000000000', '8ca4de36-06ce-4d42-8431-22e6ede421e6', '{"action":"token_refreshed","actor_id":"4ddb8909-ef46-4cde-8feb-8ce0a3c72564","actor_username":"cristiancaraballo112@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-12-24 00:53:05.516397+00', ''),
	('00000000-0000-0000-0000-000000000000', 'afecd4ab-ae41-48bd-be06-9f154544bc9b', '{"action":"token_revoked","actor_id":"4ddb8909-ef46-4cde-8feb-8ce0a3c72564","actor_username":"cristiancaraballo112@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-12-24 00:53:05.517267+00', ''),
	('00000000-0000-0000-0000-000000000000', '939883bf-b880-494d-b828-3bb576b02f22', '{"action":"token_refreshed","actor_id":"4ddb8909-ef46-4cde-8feb-8ce0a3c72564","actor_username":"cristiancaraballo112@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-12-24 02:09:31.525761+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b5966db4-ea43-4a32-8216-fde1a50f996b', '{"action":"token_revoked","actor_id":"4ddb8909-ef46-4cde-8feb-8ce0a3c72564","actor_username":"cristiancaraballo112@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-12-24 02:09:31.527252+00', ''),
	('00000000-0000-0000-0000-000000000000', '3587904a-87d8-42f7-8c9d-cc4861486447', '{"action":"token_refreshed","actor_id":"4ddb8909-ef46-4cde-8feb-8ce0a3c72564","actor_username":"cristiancaraballo112@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-12-24 03:10:19.691183+00', ''),
	('00000000-0000-0000-0000-000000000000', '947deaca-538e-4374-96ba-e05e22d43ba2', '{"action":"token_revoked","actor_id":"4ddb8909-ef46-4cde-8feb-8ce0a3c72564","actor_username":"cristiancaraballo112@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-12-24 03:10:19.692801+00', '');


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'authenticated', 'authenticated', 'cristiancaraballo112@gmail.com', '$2a$10$cEPnVheG6J0coDIu.LY9d.vnqANT26rbeP6T/5qvsPx9VYvPAxRey', '2025-12-23 02:10:56.4449+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-12-23 02:10:56.457098+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "4ddb8909-ef46-4cde-8feb-8ce0a3c72564", "email": "cristiancaraballo112@gmail.com", "fullname": "cristian caraballo", "username": "crisomg", "email_verified": true, "phone_verified": false}', NULL, '2025-12-23 02:10:56.425598+00', '2025-12-24 03:10:19.695839+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '{"sub": "4ddb8909-ef46-4cde-8feb-8ce0a3c72564", "email": "cristiancaraballo112@gmail.com", "fullname": "cristian caraballo", "username": "crisomg", "email_verified": false, "phone_verified": false}', 'email', '2025-12-23 02:10:56.440639+00', '2025-12-23 02:10:56.440675+00', '2025-12-23 02:10:56.440675+00', '1c5042ad-cb93-46f8-b986-fef5090269d0');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") VALUES
	('dbdf729b-835e-400e-8d51-50ec441f6768', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:10:56.457269+00', '2025-12-24 03:10:19.697432+00', NULL, 'aal1', NULL, '2025-12-24 03:10:19.697371', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('dbdf729b-835e-400e-8d51-50ec441f6768', '2025-12-23 02:10:56.461429+00', '2025-12-23 02:10:56.461429+00', 'password', 'f58b9634-c23d-435c-80b2-c33279b08dd0');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 33, 'oqegr7g2upm4', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', true, '2025-12-23 02:10:56.459337+00', '2025-12-23 03:08:59.383193+00', NULL, 'dbdf729b-835e-400e-8d51-50ec441f6768'),
	('00000000-0000-0000-0000-000000000000', 34, 'v5u3xqgthl3k', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', true, '2025-12-23 03:08:59.384659+00', '2025-12-23 04:06:59.380504+00', 'oqegr7g2upm4', 'dbdf729b-835e-400e-8d51-50ec441f6768'),
	('00000000-0000-0000-0000-000000000000', 35, 'rtgdgbzzngar', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', true, '2025-12-23 04:06:59.381114+00', '2025-12-23 05:04:59.363794+00', 'v5u3xqgthl3k', 'dbdf729b-835e-400e-8d51-50ec441f6768'),
	('00000000-0000-0000-0000-000000000000', 36, 'hn6zxufj3qii', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', true, '2025-12-23 05:04:59.364232+00', '2025-12-23 17:36:32.147045+00', 'rtgdgbzzngar', 'dbdf729b-835e-400e-8d51-50ec441f6768'),
	('00000000-0000-0000-0000-000000000000', 37, '26sh5mvgbro2', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', true, '2025-12-23 17:36:32.150196+00', '2025-12-23 18:56:57.882921+00', 'hn6zxufj3qii', 'dbdf729b-835e-400e-8d51-50ec441f6768'),
	('00000000-0000-0000-0000-000000000000', 38, 'thzvcmy7bezw', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', true, '2025-12-23 18:56:57.8841+00', '2025-12-23 19:55:40.474842+00', '26sh5mvgbro2', 'dbdf729b-835e-400e-8d51-50ec441f6768'),
	('00000000-0000-0000-0000-000000000000', 39, 'wz5iy5t6u5rq', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', true, '2025-12-23 19:55:40.477074+00', '2025-12-23 21:57:38.860929+00', 'thzvcmy7bezw', 'dbdf729b-835e-400e-8d51-50ec441f6768'),
	('00000000-0000-0000-0000-000000000000', 40, 'y5kfbobtwnsz', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', true, '2025-12-23 21:57:38.862147+00', '2025-12-23 22:56:01.007285+00', 'wz5iy5t6u5rq', 'dbdf729b-835e-400e-8d51-50ec441f6768'),
	('00000000-0000-0000-0000-000000000000', 41, '2u6h5s6cpmcq', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', true, '2025-12-23 22:56:01.008447+00', '2025-12-23 23:54:07.23165+00', 'y5kfbobtwnsz', 'dbdf729b-835e-400e-8d51-50ec441f6768'),
	('00000000-0000-0000-0000-000000000000', 42, 'zv6vyiqh2mwq', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', true, '2025-12-23 23:54:07.232302+00', '2025-12-24 00:53:05.517751+00', '2u6h5s6cpmcq', 'dbdf729b-835e-400e-8d51-50ec441f6768'),
	('00000000-0000-0000-0000-000000000000', 43, '6apuwbfdkmfo', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', true, '2025-12-24 00:53:05.518285+00', '2025-12-24 02:09:31.527852+00', 'zv6vyiqh2mwq', 'dbdf729b-835e-400e-8d51-50ec441f6768'),
	('00000000-0000-0000-0000-000000000000', 44, '4bmizcaloqbx', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', true, '2025-12-24 02:09:31.529043+00', '2025-12-24 03:10:19.693344+00', '6apuwbfdkmfo', 'dbdf729b-835e-400e-8d51-50ec441f6768'),
	('00000000-0000-0000-0000-000000000000', 45, 'nortvhxtarw6', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', false, '2025-12-24 03:10:19.694495+00', '2025-12-24 03:10:19.694495+00', '4bmizcaloqbx', 'dbdf729b-835e-400e-8d51-50ec441f6768');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: api_keys; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: pomodoros_cycles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."pomodoros_cycles" ("id", "created_at", "state", "user_id", "required_tags") VALUES
	(1, '2025-12-23 02:15:48.075399+00', 'finished', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '{focus,break,focus,long-break}'),
	(2, '2025-12-23 02:19:06.37616+00', 'finished', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '{focus,break,focus,long-break}'),
	(3, '2025-12-23 02:24:01.556271+00', 'finished', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '{focus,break,focus,long-break}'),
	(4, '2025-12-23 02:25:26.676691+00', 'finished', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '{focus,break,focus,long-break}'),
	(5, '2025-12-23 02:27:24.636181+00', 'finished', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '{focus,break,focus,long-break}'),
	(6, '2025-12-23 02:28:36.980062+00', 'finished', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '{focus,break,focus,long-break}'),
	(7, '2025-12-23 02:28:39.847788+00', 'finished', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '{focus,break,focus,long-break}'),
	(8, '2025-12-23 02:29:11.639762+00', 'finished', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '{focus,break,focus,long-break}'),
	(9, '2025-12-23 02:29:18.63552+00', 'finished', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '{focus,break,focus,long-break}'),
	(10, '2025-12-23 02:40:17.90432+00', 'finished', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '{focus,break,focus,long-break}'),
	(11, '2025-12-23 02:40:59.115902+00', 'finished', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '{focus,break,focus,long-break}'),
	(12, '2025-12-23 02:44:12.95229+00', 'finished', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '{focus,break,focus,long-break}'),
	(13, '2025-12-23 02:44:18.619538+00', 'finished', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '{focus,break,focus,long-break}'),
	(14, '2025-12-23 19:47:18.009605+00', 'finished', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '{focus,break,focus,long-break}'),
	(15, '2025-12-24 03:33:28.831041+00', 'current', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '{focus,break,focus,long-break}');


--
-- Data for Name: pomodoros; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."pomodoros" ("id", "created_at", "started_at", "expected_end", "timelapse", "user_id", "state", "finished_at", "toggle_timeline", "cycle", "expected_duration", "type") VALUES
	(1, '2025-12-23 02:15:48.081+00', '2025-12-23 02:15:48.081+00', '2025-12-23 02:40:48.130574+00', 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-23 02:18:20.929+00', '[{"at": "2025-12-23T02:15:48.081Z", "type": "play"}]', 1, 1500, 'focus'),
	(2, '2025-12-23 02:18:21.012+00', '2025-12-23 02:18:40.316+00', '2025-12-23 02:23:40.367947+00', 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-23 02:18:43.887+00', '[{"at": "2025-12-23T02:18:40.316Z", "type": "play"}]', 1, 300, 'break'),
	(10, '2025-12-23 02:25:17.75+00', NULL, NULL, 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', NULL, '[]', 3, 300, 'break'),
	(3, '2025-12-23 02:18:43.992+00', '2025-12-23 02:19:02.737+00', '2025-12-23 02:44:02.784718+00', 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-23 02:19:04.886+00', '[{"at": "2025-12-23T02:19:02.737Z", "type": "play"}]', 1, 1500, 'focus'),
	(4, '2025-12-23 02:19:04.97+00', NULL, NULL, 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-23 02:19:06.186+00', '[]', 1, 300, 'break'),
	(11, '2025-12-23 02:25:17.789+00', '2025-12-23 02:25:19.511+00', NULL, 2, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', NULL, '[{"at": "2025-12-23T02:25:19.511Z", "type": "play"}, {"at": "2025-12-23T02:25:20.210Z", "type": "play"}, {"at": "2025-12-23T02:25:21.030Z", "type": "pause"}, {"at": "2025-12-23T02:25:25.477Z", "type": "play"}, {"at": "2025-12-23T02:25:26.038Z", "type": "pause"}]', 3, 300, 'break'),
	(5, '2025-12-23 02:19:06.383+00', '2025-12-23 02:19:25.167+00', '2025-12-23 02:44:25.216293+00', 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-23 02:19:27.929+00', '[{"at": "2025-12-23T02:19:25.167Z", "type": "play"}]', 2, 1500, 'focus'),
	(6, '2025-12-23 02:19:28.032+00', NULL, NULL, 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-23 02:22:52.496+00', '[]', 2, 300, 'break'),
	(7, '2025-12-23 02:22:52.583+00', NULL, NULL, 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-23 02:23:54.615+00', '[]', 2, 1500, 'focus'),
	(8, '2025-12-23 02:23:54.709+00', NULL, NULL, 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-23 02:24:01.361+00', '[]', 2, 300, 'break'),
	(12, '2025-12-23 02:25:26.684+00', '2025-12-23 02:25:27.566+00', '2025-12-23 02:50:29.164074+00', 1, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', NULL, '[{"at": "2025-12-23T02:25:27.566Z", "type": "play"}, {"at": "2025-12-23T02:25:28.462Z", "type": "pause"}, {"at": "2025-12-23T02:25:29.152Z", "type": "play"}, {"at": "2025-12-23T02:25:29.782Z", "type": "play"}, {"at": "2025-12-23T02:25:29.963Z", "type": "play"}, {"at": "2025-12-23T02:25:30.118Z", "type": "play"}]', 4, 1500, 'focus'),
	(9, '2025-12-23 02:24:01.565+00', '2025-12-23 02:25:16.119+00', '2025-12-23 02:50:16.168454+00', 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-23 02:25:17.712+00', '[{"at": "2025-12-23T02:25:16.119Z", "type": "play"}]', 3, 1500, 'focus'),
	(13, '2025-12-23 02:25:31.404+00', NULL, NULL, 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', NULL, '[]', 4, 300, 'break'),
	(14, '2025-12-23 02:25:32.607+00', '2025-12-23 02:25:33.242+00', '2025-12-23 02:30:33.48848+00', 108, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', NULL, '[{"at": "2025-12-23T02:25:33.242Z", "type": "play"}, {"at": "2025-12-23T02:25:33.927Z", "type": "play"}, {"at": "2025-12-23T02:27:21.442Z", "type": "play"}]', 4, 300, 'break'),
	(15, '2025-12-23 02:27:24.643+00', NULL, NULL, 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-23 02:28:28.469+00', '[]', 5, 300, 'break'),
	(29, '2025-12-23 02:38:28.816+00', NULL, NULL, 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-23 02:38:38.653+00', '[]', 9, 1500, 'focus'),
	(16, '2025-12-23 02:28:28.569+00', NULL, NULL, 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-23 02:28:29.733+00', '[]', 5, 1500, 'focus'),
	(17, '2025-12-23 02:28:29.836+00', NULL, NULL, 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-23 02:28:36.785+00', '[]', 5, 300, 'break'),
	(18, '2025-12-23 02:28:36.986+00', NULL, NULL, 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-23 02:28:38.131+00', '[]', 6, 1500, 'focus'),
	(19, '2025-12-23 02:28:38.229+00', NULL, NULL, 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-23 02:28:38.763+00', '[]', 6, 300, 'break'),
	(20, '2025-12-23 02:28:38.85+00', NULL, NULL, 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-23 02:28:39.664+00', '[]', 6, 900, 'long-break'),
	(21, '2025-12-23 02:28:39.853+00', NULL, NULL, 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-23 02:28:54.798+00', '[]', 7, 1500, 'focus'),
	(22, '2025-12-23 02:28:54.948+00', NULL, NULL, 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-23 02:29:01.153+00', '[]', 7, 300, 'break'),
	(23, '2025-12-23 02:29:01.231+00', NULL, NULL, 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-23 02:29:11.448+00', '[]', 7, 300, 'break'),
	(24, '2025-12-23 02:29:11.644+00', NULL, NULL, 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-23 02:29:16.457+00', '[]', 8, 1500, 'focus'),
	(25, '2025-12-23 02:29:16.537+00', NULL, NULL, 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-23 02:29:17.119+00', '[]', 8, 300, 'break'),
	(26, '2025-12-23 02:29:17.202+00', NULL, NULL, 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-23 02:29:18.022+00', '[]', 8, 1500, 'focus'),
	(27, '2025-12-23 02:29:18.102+00', NULL, NULL, 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-23 02:29:18.436+00', '[]', 8, 900, 'long-break'),
	(30, '2025-12-23 02:38:38.736+00', '2025-12-23 02:40:15.325+00', '2025-12-23 03:05:15.372442+00', 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-23 02:40:17.715+00', '[{"at": "2025-12-23T02:40:15.325Z", "type": "play"}]', 9, 1500, 'focus'),
	(28, '2025-12-23 02:29:18.639+00', '2025-12-23 02:38:26.924+00', '2025-12-23 02:43:26.9721+00', 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-23 02:38:28.731+00', '[{"at": "2025-12-23T02:38:26.924Z", "type": "play"}]', 9, 300, 'break'),
	(31, '2025-12-23 02:40:17.911+00', '2025-12-23 02:40:27.276+00', '2025-12-23 02:45:27.324313+00', 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-23 02:40:31.207+00', '[{"at": "2025-12-23T02:40:27.276Z", "type": "play"}]', 10, 300, 'break'),
	(37, '2025-12-23 02:43:23.468+00', '2025-12-23 02:44:10.235+00', '2025-12-23 02:59:10.27975+00', 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-23 02:44:12.756+00', '[{"at": "2025-12-23T02:44:10.235Z", "type": "play"}]', 11, 900, 'long-break'),
	(32, '2025-12-23 02:40:31.286+00', '2025-12-23 02:40:48.915+00', '2025-12-23 03:05:48.964814+00', 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-23 02:40:51.361+00', '[{"at": "2025-12-23T02:40:48.915Z", "type": "play"}]', 10, 1500, 'focus'),
	(33, '2025-12-23 02:40:51.46+00', NULL, NULL, 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-23 02:40:58.923+00', '[]', 10, 300, 'break'),
	(34, '2025-12-23 02:40:59.121+00', '2025-12-23 02:41:01.428+00', '2025-12-23 03:06:01.47653+00', 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-23 02:41:05.164+00', '[{"at": "2025-12-23T02:41:01.428Z", "type": "play"}]', 11, 1500, 'focus'),
	(35, '2025-12-23 02:41:05.24+00', '2025-12-23 02:42:27.107+00', '2025-12-23 02:47:27.156253+00', 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-23 02:42:30.179+00', '[{"at": "2025-12-23T02:42:27.107Z", "type": "play"}]', 11, 300, 'break'),
	(38, '2025-12-23 02:44:12.962+00', '2025-12-23 02:44:14.488+00', '2025-12-23 03:09:14.536773+00', 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-23 02:44:16.972+00', '[{"at": "2025-12-23T02:44:14.488Z", "type": "play"}]', 12, 1500, 'focus'),
	(36, '2025-12-23 02:42:30.26+00', '2025-12-23 02:43:20.599+00', '2025-12-23 03:08:20.648963+00', 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-23 02:43:23.369+00', '[{"at": "2025-12-23T02:43:20.599Z", "type": "play"}]', 11, 1500, 'focus'),
	(39, '2025-12-23 02:44:17.053+00', NULL, NULL, 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-23 02:44:17.736+00', '[]', 12, 300, 'break'),
	(40, '2025-12-23 02:44:17.844+00', NULL, NULL, 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-23 02:44:18.42+00', '[]', 12, 900, 'long-break'),
	(42, '2025-12-23 18:06:35.519+00', '2025-12-23 18:13:49.587+00', '2025-12-23 18:18:49.642896+00', 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-23 18:18:49.413+00', '[{"at": "2025-12-23T18:13:49.588Z", "type": "play"}]', 13, 300, 'break'),
	(41, '2025-12-23 02:44:18.624+00', '2025-12-23 17:41:10.999+00', '2025-12-23 18:06:11.060534+00', 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-23 18:06:35.429+00', '[{"at": "2025-12-23T17:41:10.999Z", "type": "play"}]', 13, 1500, 'focus'),
	(44, '2025-12-23 19:47:18.018+00', '2025-12-23 23:40:45.161+00', '2025-12-24 00:05:45.213758+00', 1500, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-24 00:06:00.011411+00', '[{"at": "2025-12-23T23:40:45.161Z", "type": "play"}]', 14, 1500, 'focus'),
	(43, '2025-12-23 18:18:49.499+00', '2025-12-23 19:32:18.713+00', '2025-12-23 19:47:18.776129+00', 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-23 19:47:17.809+00', '[{"at": "2025-12-23T19:32:18.713Z", "type": "play"}]', 13, 900, 'long-break'),
	(45, '2025-12-24 00:06:35.507+00', '2025-12-24 01:41:59.668+00', '2025-12-24 01:46:59.947022+00', 5301, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-24 03:10:21.991+00', '[{"at": "2025-12-24T01:41:59.668Z", "type": "play"}, {"at": "2025-12-24T03:10:20.898Z", "type": "play"}]', 14, 300, 'break'),
	(46, '2025-12-24 03:10:22.081+00', '2025-12-24 03:12:11.092+00', '2025-12-24 03:37:11.153037+00', 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-24 03:12:12.977+00', '[{"at": "2025-12-24T03:12:11.092Z", "type": "play"}]', 14, 1500, 'focus'),
	(47, '2025-12-24 03:12:13.058+00', '2025-12-24 03:33:18.837+00', '2025-12-24 03:48:18.886445+00', 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-24 03:33:28.63+00', '[{"at": "2025-12-24T03:33:18.838Z", "type": "play"}]', 14, 900, 'long-break'),
	(48, '2025-12-24 03:33:28.841+00', '2025-12-24 03:43:49.582+00', '2025-12-24 04:08:49.644617+00', 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-24 03:43:51.892+00', '[{"at": "2025-12-24T03:43:49.582Z", "type": "play"}]', 15, 1500, 'focus'),
	(50, '2025-12-24 03:50:35.471+00', NULL, NULL, 0, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'paused', NULL, '[]', 15, 1500, 'focus'),
	(49, '2025-12-24 03:43:51.983+00', '2025-12-24 03:44:55.409+00', '2025-12-24 03:49:55.49943+00', 300, '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'finished', '2025-12-24 03:50:00.020292+00', '[{"at": "2025-12-24T03:44:55.409Z", "type": "play"}]', 15, 300, 'break');


--
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."tags" ("id", "created_at", "type", "label", "user_id") VALUES
	(1, '2025-12-23 02:16:03.481239+00', NULL, '1234', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564');


--
-- Data for Name: pomodoros_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."pomodoros_tags" ("user_id", "pomodoro", "tag") VALUES
	('4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 1, 1),
	('4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 2, 1),
	('4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 3, 1),
	('4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 5, 1),
	('4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 8, 1),
	('4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 9, 1),
	('4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 17, 1),
	('4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 21, 1),
	('4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 24, 1),
	('4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 28, 1),
	('4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 30, 1),
	('4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 32, 1),
	('4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 33, 1),
	('4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 34, 1),
	('4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 35, 1),
	('4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 36, 1),
	('4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 37, 1),
	('4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 38, 1),
	('4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 39, 1),
	('4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 40, 1),
	('4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 41, 1),
	('4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 42, 1),
	('4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 43, 1),
	('4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 44, 1),
	('4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 45, 1),
	('4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 46, 1),
	('4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 47, 1),
	('4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 48, 1),
	('4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 49, 1),
	('4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 50, 1);


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."tasks" ("id", "user_id", "title", "description", "done", "tag_id", "pomodoro_id", "archived", "created_at", "updated_at", "done_at", "keep") VALUES
	('99811c90-d29b-44cd-800d-a5f018625e13', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'asdf', 'fasdf', true, 1, NULL, false, '2025-12-23 02:15:52.119987+00', '2025-12-23 02:15:52.119987+00', '2025-12-23 02:22:50.247358+00', false),
	('5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '1', 'qwerty', true, 1, NULL, false, '2025-12-23 02:16:21.604249+00', '2025-12-23 02:16:21.604249+00', '2025-12-23 19:30:04.49943+00', false),
	('c678b774-ed9b-4ba2-9532-a9571a1a8947', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '[fdoasdklfjas;dkfjasldkfjl;skafjasl;kdfla;skfdjas;kldfjas;dkfjas;dkfljasd;fkasfdksad;fksald;kfjsa;dkfjsa;dklfjas;dklfjasdkfjasdkjf;askdjf;askdjf;askdjfas;kdfas;dkfjsa;dkfljasd;fkasdlf;sdl;fkjsa;dflkasj', 'gfh', false, NULL, NULL, false, '2025-12-23 19:41:31.515455+00', '2025-12-23 19:41:31.515455+00', NULL, false),
	('39db750b-5ea3-4f08-a8c3-a729f6512903', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '3', 'qwerty', false, 1, NULL, false, '2025-12-23 02:16:34.777199+00', '2025-12-23 02:16:34.777199+00', NULL, true),
	('0337130c-68e4-4983-9374-fade8890733a', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '4', 'qwerty', true, 1, NULL, true, '2025-12-23 02:16:41.812399+00', '2025-12-23 02:16:41.812399+00', '2025-12-23 20:06:05.947147+00', false),
	('960c365d-8dfc-4dcc-ae39-946df883d5e3', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2', 'qwrety', true, 1, NULL, false, '2025-12-23 02:16:27.073196+00', '2025-12-23 02:16:27.073196+00', '2025-12-24 03:34:37.395302+00', false);


--
-- Data for Name: pomodoros_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."pomodoros_tasks" ("id", "pomodoro_id", "task_id", "user_id", "created_at") VALUES
	(1, 1, '99811c90-d29b-44cd-800d-a5f018625e13', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:16:12.000319+00'),
	(2, 1, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:16:59.392884+00'),
	(3, 2, '99811c90-d29b-44cd-800d-a5f018625e13', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:18:21.064372+00'),
	(4, 2, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:18:21.064372+00'),
	(5, 3, '99811c90-d29b-44cd-800d-a5f018625e13', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:18:44.051503+00'),
	(6, 3, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:18:44.051503+00'),
	(7, 4, '99811c90-d29b-44cd-800d-a5f018625e13', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:19:05.016041+00'),
	(8, 4, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:19:05.016041+00'),
	(9, 5, '99811c90-d29b-44cd-800d-a5f018625e13', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:19:06.428623+00'),
	(10, 5, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:19:06.428623+00'),
	(11, 6, '99811c90-d29b-44cd-800d-a5f018625e13', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:19:28.087349+00'),
	(12, 6, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:19:28.087349+00'),
	(13, 7, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:22:52.632441+00'),
	(14, 8, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:23:54.756393+00'),
	(15, 9, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:24:01.611915+00'),
	(16, 10, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:25:17.795612+00'),
	(17, 11, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:25:17.839768+00'),
	(18, 12, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:25:26.732075+00'),
	(19, 13, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:25:31.447764+00'),
	(20, 14, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:25:32.660277+00'),
	(21, 15, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:27:24.692445+00'),
	(22, 16, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:28:28.61614+00'),
	(23, 17, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:28:29.884105+00'),
	(24, 18, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:28:37.031915+00'),
	(25, 19, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:28:38.275596+00'),
	(26, 20, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:28:38.896774+00'),
	(27, 21, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:28:39.899978+00'),
	(28, 22, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:28:54.996422+00'),
	(29, 23, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:29:01.275765+00'),
	(30, 24, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:29:11.692187+00'),
	(31, 25, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:29:16.583719+00'),
	(32, 26, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:29:17.247803+00'),
	(33, 27, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:29:18.151646+00'),
	(34, 28, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:29:18.6839+00'),
	(35, 29, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:38:28.863805+00'),
	(36, 30, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:38:38.784297+00'),
	(37, 31, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:40:17.960944+00'),
	(38, 32, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:40:31.33216+00'),
	(39, 33, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:40:51.508374+00'),
	(40, 34, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:40:59.168397+00'),
	(41, 35, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:41:05.288611+00'),
	(42, 36, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:42:30.308985+00'),
	(43, 37, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:43:23.519758+00'),
	(44, 38, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:44:13.012499+00'),
	(45, 39, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:44:17.103639+00'),
	(46, 40, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:44:17.891861+00'),
	(47, 41, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 02:44:18.671661+00'),
	(48, 42, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 18:06:35.569795+00'),
	(49, 43, '5a8c5077-62bc-42ab-a2fe-bbcf9792278e', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 18:18:49.54559+00'),
	(50, 44, '960c365d-8dfc-4dcc-ae39-946df883d5e3', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-23 19:47:18.065638+00'),
	(51, 45, '960c365d-8dfc-4dcc-ae39-946df883d5e3', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-24 00:06:35.565657+00'),
	(52, 45, '39db750b-5ea3-4f08-a8c3-a729f6512903', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-24 00:06:35.565657+00'),
	(53, 46, '960c365d-8dfc-4dcc-ae39-946df883d5e3', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-24 03:10:22.13039+00'),
	(54, 46, '39db750b-5ea3-4f08-a8c3-a729f6512903', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-24 03:10:22.13039+00'),
	(55, 47, '960c365d-8dfc-4dcc-ae39-946df883d5e3', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-24 03:12:13.108272+00'),
	(56, 47, '39db750b-5ea3-4f08-a8c3-a729f6512903', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-24 03:12:13.108272+00'),
	(57, 48, '960c365d-8dfc-4dcc-ae39-946df883d5e3', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-24 03:33:28.892341+00'),
	(58, 48, '39db750b-5ea3-4f08-a8c3-a729f6512903', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-24 03:33:28.892341+00'),
	(59, 49, '39db750b-5ea3-4f08-a8c3-a729f6512903', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-24 03:43:52.031111+00'),
	(60, 50, '39db750b-5ea3-4f08-a8c3-a729f6512903', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564', '2025-12-24 03:50:35.526327+00');


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."profiles" ("id", "username", "fullname", "avatar_url", "updated_at", "has_password", "settings") VALUES
	('4ddb8909-ef46-4cde-8feb-8ce0a3c72564', 'crisomg', 'cristian caraballo', 'http://localhost:54321/storage/v1/object/public/avatars/4ddb8909-ef46-4cde-8feb-8ce0a3c72564/avatar.png', '2025-12-23 19:30:00.936588+00', true, '{"keep_tags": true, "webhook_url": "https://webhook-test.com/657c52f164da5c582869ce06529fa37b"}');


--
-- Data for Name: webhook_trace; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."webhook_trace" ("id", "pgmq_msg_id", "net_request_id", "processed_at", "user_id") VALUES
	(1, 2, 6, '2025-12-24 03:10:00.016808+00', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564'),
	(2, 3, 7, '2025-12-24 03:12:00.029824+00', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564'),
	(3, 4, 8, '2025-12-24 03:33:00.018789+00', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564'),
	(4, 5, 10, '2025-12-24 03:44:00.012118+00', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564'),
	(5, 6, 11, '2025-12-24 03:50:00.021008+00', '4ddb8909-ef46-4cde-8feb-8ce0a3c72564');


--

--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 45, true);


--
-- Name: pomodoros_cycles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."pomodoros_cycles_id_seq"', 15, true);


--
-- Name: pomodoros_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."pomodoros_id_seq"', 50, true);


--
-- Name: pomodoros_tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."pomodoros_tasks_id_seq"', 60, true);


--
-- Name: tags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."tags_id_seq"', 1, true);


--
-- Name: webhook_trace_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."webhook_trace_id_seq"', 5, true);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

-- \unrestrict 8upW6aKAnKDUuusbehJ0hCXH2JnYVRcW8ruDM5kzhOuQNrGDcffBGEhoNObj0RA

RESET ALL;
