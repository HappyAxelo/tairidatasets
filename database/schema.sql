-- TAIRI DataHub — PostgreSQL schema
-- Auto-generated from SQLAlchemy models. Do not edit by hand.

CREATE TABLE categories (
	id SERIAL NOT NULL, 
	name VARCHAR(120) NOT NULL, 
	slug VARCHAR(140) NOT NULL, 
	description TEXT, 
	PRIMARY KEY (id)
);

CREATE UNIQUE INDEX ix_categories_slug ON categories (slug);
CREATE UNIQUE INDEX ix_categories_name ON categories (name);

CREATE TABLE departments (
	id SERIAL NOT NULL, 
	name VARCHAR(160) NOT NULL, 
	faculty VARCHAR(160), 
	PRIMARY KEY (id)
);

CREATE UNIQUE INDEX ix_departments_name ON departments (name);

CREATE TABLE licenses (
	id SERIAL NOT NULL, 
	code VARCHAR(60) NOT NULL, 
	name VARCHAR(160) NOT NULL, 
	url VARCHAR(512), 
	description TEXT, 
	PRIMARY KEY (id)
);

CREATE UNIQUE INDEX ix_licenses_code ON licenses (code);

CREATE TABLE permissions (
	id SERIAL NOT NULL, 
	code VARCHAR(64) NOT NULL, 
	description VARCHAR(255), 
	PRIMARY KEY (id)
);

CREATE UNIQUE INDEX ix_permissions_code ON permissions (code);

CREATE TABLE research_areas (
	id SERIAL NOT NULL, 
	name VARCHAR(120) NOT NULL, 
	slug VARCHAR(140) NOT NULL, 
	description TEXT, 
	PRIMARY KEY (id)
);

CREATE UNIQUE INDEX ix_research_areas_name ON research_areas (name);
CREATE UNIQUE INDEX ix_research_areas_slug ON research_areas (slug);

CREATE TABLE roles (
	id SERIAL NOT NULL, 
	name VARCHAR(50) NOT NULL, 
	description VARCHAR(255), 
	PRIMARY KEY (id)
);

CREATE UNIQUE INDEX ix_roles_name ON roles (name);

CREATE TABLE tags (
	id SERIAL NOT NULL, 
	name VARCHAR(80) NOT NULL, 
	slug VARCHAR(100) NOT NULL, 
	PRIMARY KEY (id)
);

CREATE UNIQUE INDEX ix_tags_slug ON tags (slug);
CREATE UNIQUE INDEX ix_tags_name ON tags (name);

CREATE TABLE role_permissions (
	role_id INTEGER NOT NULL, 
	permission_id INTEGER NOT NULL, 
	PRIMARY KEY (role_id, permission_id), 
	FOREIGN KEY(role_id) REFERENCES roles (id) ON DELETE CASCADE, 
	FOREIGN KEY(permission_id) REFERENCES permissions (id) ON DELETE CASCADE
);

CREATE TABLE users (
	id SERIAL NOT NULL, 
	username VARCHAR(80) NOT NULL, 
	email VARCHAR(255) NOT NULL, 
	hashed_password VARCHAR(255) NOT NULL, 
	full_name VARCHAR(160), 
	role_id INTEGER NOT NULL, 
	status userstatus NOT NULL, 
	is_email_verified BOOLEAN NOT NULL, 
	affiliation VARCHAR(255), 
	department_id INTEGER, 
	bio TEXT, 
	avatar_url VARCHAR(512), 
	email_verification_token VARCHAR(128), 
	password_reset_token VARCHAR(128), 
	password_reset_expires TIMESTAMP WITH TIME ZONE, 
	last_login_at TIMESTAMP WITH TIME ZONE, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(role_id) REFERENCES roles (id), 
	FOREIGN KEY(department_id) REFERENCES departments (id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX ix_users_email ON users (email);
CREATE UNIQUE INDEX ix_users_username ON users (username);
CREATE INDEX ix_users_role_id ON users (role_id);

CREATE TABLE announcements (
	id SERIAL NOT NULL, 
	title VARCHAR(255) NOT NULL, 
	body TEXT NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	created_by_id INTEGER, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(created_by_id) REFERENCES users (id)
);

CREATE TABLE audit_logs (
	id SERIAL NOT NULL, 
	actor_id INTEGER, 
	action VARCHAR(120) NOT NULL, 
	entity_type VARCHAR(80), 
	entity_id INTEGER, 
	detail TEXT, 
	ip_address VARCHAR(64), 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(actor_id) REFERENCES users (id)
);

CREATE INDEX ix_audit_logs_actor_id ON audit_logs (actor_id);
CREATE INDEX ix_audit_logs_action ON audit_logs (action);

CREATE TABLE datasets (
	id SERIAL NOT NULL, 
	slug VARCHAR(220) NOT NULL, 
	title VARCHAR(255) NOT NULL, 
	description TEXT, 
	authors VARCHAR(512), 
	affiliation VARCHAR(255), 
	contact_email VARCHAR(255), 
	keywords VARCHAR(512), 
	funding_agency VARCHAR(255), 
	doi VARCHAR(120), 
	publication_link VARCHAR(512), 
	citation_text TEXT, 
	readme TEXT, 
	documentation TEXT, 
	preview_image_url VARCHAR(512), 
	owner_id INTEGER NOT NULL, 
	department_id INTEGER, 
	research_area_id INTEGER, 
	category_id INTEGER, 
	license_id INTEGER, 
	visibility visibility NOT NULL, 
	status datasetstatus NOT NULL, 
	rejection_reason TEXT, 
	download_count INTEGER NOT NULL, 
	view_count INTEGER NOT NULL, 
	like_count INTEGER NOT NULL, 
	total_size_bytes BIGINT NOT NULL, 
	file_count INTEGER NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	approved_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(owner_id) REFERENCES users (id), 
	FOREIGN KEY(department_id) REFERENCES departments (id) ON DELETE SET NULL, 
	FOREIGN KEY(research_area_id) REFERENCES research_areas (id) ON DELETE SET NULL, 
	FOREIGN KEY(category_id) REFERENCES categories (id) ON DELETE SET NULL, 
	FOREIGN KEY(license_id) REFERENCES licenses (id) ON DELETE SET NULL
);

CREATE INDEX ix_datasets_title ON datasets (title);
CREATE INDEX ix_datasets_owner_id ON datasets (owner_id);
CREATE UNIQUE INDEX ix_datasets_slug ON datasets (slug);
CREATE INDEX ix_datasets_is_deleted ON datasets (is_deleted);
CREATE INDEX ix_datasets_status ON datasets (status);

CREATE TABLE notifications (
	id SERIAL NOT NULL, 
	user_id INTEGER NOT NULL, 
	type notificationtype NOT NULL, 
	title VARCHAR(255) NOT NULL, 
	body TEXT, 
	link VARCHAR(512), 
	is_read BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE INDEX ix_notifications_is_read ON notifications (is_read);
CREATE INDEX ix_notifications_user_id ON notifications (user_id);

CREATE TABLE access_requests (
	id SERIAL NOT NULL, 
	dataset_id INTEGER NOT NULL, 
	requester_id INTEGER NOT NULL, 
	purpose TEXT, 
	institution VARCHAR(255), 
	research_area VARCHAR(255), 
	message TEXT, 
	status accessrequeststatus NOT NULL, 
	decided_by_id INTEGER, 
	decision_note TEXT, 
	access_level accesslevel, 
	grant_duration grantduration, 
	expires_at TIMESTAMP WITH TIME ZONE, 
	decided_at TIMESTAMP WITH TIME ZONE, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(dataset_id) REFERENCES datasets (id) ON DELETE CASCADE, 
	FOREIGN KEY(requester_id) REFERENCES users (id), 
	FOREIGN KEY(decided_by_id) REFERENCES users (id)
);

CREATE INDEX ix_access_requests_requester_id ON access_requests (requester_id);
CREATE INDEX ix_access_requests_dataset_id ON access_requests (dataset_id);
CREATE INDEX ix_access_requests_status ON access_requests (status);

CREATE TABLE citations (
	id SERIAL NOT NULL, 
	dataset_id INTEGER NOT NULL, 
	user_id INTEGER, 
	cited_in VARCHAR(512), 
	style VARCHAR(20), 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(dataset_id) REFERENCES datasets (id) ON DELETE CASCADE, 
	FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE INDEX ix_citations_dataset_id ON citations (dataset_id);

CREATE TABLE comments (
	id SERIAL NOT NULL, 
	dataset_id INTEGER NOT NULL, 
	user_id INTEGER NOT NULL, 
	parent_id INTEGER, 
	body TEXT NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(dataset_id) REFERENCES datasets (id) ON DELETE CASCADE, 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(parent_id) REFERENCES comments (id) ON DELETE CASCADE
);

CREATE INDEX ix_comments_dataset_id ON comments (dataset_id);

CREATE TABLE dataset_tags (
	dataset_id INTEGER NOT NULL, 
	tag_id INTEGER NOT NULL, 
	PRIMARY KEY (dataset_id, tag_id), 
	FOREIGN KEY(dataset_id) REFERENCES datasets (id) ON DELETE CASCADE, 
	FOREIGN KEY(tag_id) REFERENCES tags (id) ON DELETE CASCADE
);

CREATE TABLE dataset_versions (
	id SERIAL NOT NULL, 
	dataset_id INTEGER NOT NULL, 
	version VARCHAR(20) NOT NULL, 
	changelog TEXT, 
	is_current BOOLEAN NOT NULL, 
	total_size_bytes BIGINT NOT NULL, 
	created_by_id INTEGER, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(dataset_id) REFERENCES datasets (id) ON DELETE CASCADE, 
	FOREIGN KEY(created_by_id) REFERENCES users (id)
);

CREATE INDEX ix_dataset_versions_dataset_id ON dataset_versions (dataset_id);

CREATE TABLE favorites (
	id SERIAL NOT NULL, 
	dataset_id INTEGER NOT NULL, 
	user_id INTEGER NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_favorite UNIQUE (dataset_id, user_id), 
	FOREIGN KEY(dataset_id) REFERENCES datasets (id) ON DELETE CASCADE, 
	FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE INDEX ix_favorites_dataset_id ON favorites (dataset_id);
CREATE INDEX ix_favorites_user_id ON favorites (user_id);

CREATE TABLE views (
	id SERIAL NOT NULL, 
	dataset_id INTEGER NOT NULL, 
	user_id INTEGER, 
	ip_address VARCHAR(64), 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(dataset_id) REFERENCES datasets (id) ON DELETE CASCADE, 
	FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE INDEX ix_views_dataset_id ON views (dataset_id);

CREATE TABLE files (
	id SERIAL NOT NULL, 
	version_id INTEGER NOT NULL, 
	filename VARCHAR(512) NOT NULL, 
	storage_key VARCHAR(1024) NOT NULL, 
	content_type VARCHAR(160), 
	size_bytes BIGINT NOT NULL, 
	checksum_sha256 VARCHAR(64), 
	virus_scan_status VARCHAR(20) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(version_id) REFERENCES dataset_versions (id) ON DELETE CASCADE
);

CREATE INDEX ix_files_version_id ON files (version_id);

CREATE TABLE downloads (
	id SERIAL NOT NULL, 
	dataset_id INTEGER NOT NULL, 
	file_id INTEGER, 
	user_id INTEGER, 
	ip_address VARCHAR(64), 
	user_agent VARCHAR(512), 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(dataset_id) REFERENCES datasets (id) ON DELETE CASCADE, 
	FOREIGN KEY(file_id) REFERENCES files (id) ON DELETE SET NULL, 
	FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE INDEX ix_downloads_dataset_id ON downloads (dataset_id);
CREATE INDEX ix_downloads_user_id ON downloads (user_id);

