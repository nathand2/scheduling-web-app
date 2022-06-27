DROP DATABASE IF EXISTS scheduler;
CREATE DATABASE scheduler;
USE scheduler;
DROP TABLE IF EXISTS user;
DROP TABLE IF EXISTS group;
DROP TABLE IF EXISTS session;
DROP TABLE IF EXISTS user_group;
DROP TABLE IF EXISTS user_session;
DROP TABLE IF EXISTS session_invite;
DROP TABLE IF EXISTS group_invitation;
DROP TABLE IF EXISTS session_time_range;
DROP TABLE IF EXISTS refresh_token;

USE scheduler;
CREATE TABLE user (
    id int NOT NULL AUTO_INCREMENT UNIQUE,
    role varchar(20) DEFAULT 'user',
    username varchar(25) UNIQUE,
    password varchar(255),
    google_id varchar(255) UNIQUE,
    nickname varchar(25),
    dt_created datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
    dt_last_login datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE group_ (
  id int NOT NULL AUTO_INCREMENT UNIQUE,
  group_name varchar(50) NOT NULL,
  dt_created datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
  max_group_members int NOT NULL DEFAULT 20,
  active boolean NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id)
);

CREATE TABLE session (
  id int NOT NULL AUTO_INCREMENT UNIQUE,
  group_id int,
  session_title varchar(50) NOT NULL,
  session_desc varchar(255),
  max_session_members int NOT NULL DEFAULT 10,
  dt_created datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
  dt_expires datetime NOT NULL,
  attend_type varchar(20) NOT NULL DEFAULT "account",
  PRIMARY KEY (id),
  FOREIGN KEY (group_id) REFERENCES group_(id)
);

CREATE TABLE user_session (
  id bigint NOT NULL AUTO_INCREMENT UNIQUE,
  user_id int NOT NULL,
  session_id int NOT NULL,
  role varchar(20) NOT NULL DEFAULT "attendee",
  dt_joined datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id, user_id, session_id),
  FOREIGN KEY(user_id) REFERENCES user(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES session(id) ON DELETE CASCADE
);

CREATE TABLE session_time_range (
  id bigint NOT NULL AUTO_INCREMENT UNIQUE,
  user_session_id bigint NOT NULL,
  dt_start datetime NOT NULL,
  dt_end datetime NOT NULL,
  status varchar(20) NOT NULL DEFAULT "going",
  PRIMARY KEY (id, user_session_id),
  FOREIGN KEY (user_session_id) REFERENCES user_session(id) ON DELETE CASCADE
);

CREATE TABLE session_invite (
  id bigint NOT NULL AUTO_INCREMENT UNIQUE,
  session_id int NOT NULL,
  group_id int,
  user_id int,
  dt_created datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (group_id) REFERENCES group_(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES session(id) ON DELETE CASCADE
);

CREATE TABLE group_invitation (
  id bigint NOT NULL AUTO_INCREMENT UNIQUE,
  group_id int NOT NULL,
  dt_created datetime NOT NULL,
  dt_expires datetime NOT NULL,
  max_group_members int NOT NULL DEFAULT 20,
  PRIMARY KEY (id),
  FOREIGN KEY (group_id) REFERENCES group_(id) ON DELETE CASCADE
);

CREATE TABLE user_group (
  id bigint NOT NULL AUTO_INCREMENT UNIQUE,
  group_id int NOT NULL,
  user_id int NOT NULL,
  dt_joined datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
  nickname varchar(25),
  PRIMARY KEY (id, user_id, group_id),
  FOREIGN KEY (group_id) REFERENCES group_(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE refresh_token (
  id bigint NOT NULL AUTO_INCREMENT UNIQUE,
  user_id int NOT NULL,
  token varchar(512) NOT NULL UNIQUE
);

USE scheduler; SELECT * FROM user WHERE google_id = "112150195852534406291";

INSERT INTO user (username, password, nickname) VALUES ("Nathan", "potatoman", "Nate");