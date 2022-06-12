USE scheduler;
DROP TABLE IF EXISTS user;
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

DROP TABLE IF EXISTS sessions;
CREATE TABLE sessions (
  id int NOT NULL AUTO_INCREMENT UNIQUE,
  group_id int,
  session_title varchar(50) NOT NULL,
  session_desc varchar (255),
  max_session_members int NOT NULL DEFAULT 10,
  FOREIGN KEY (group_id) REFERENCES group(id) -- Consider deleting session is reference group is deleted
);

DROP TABLE IF EXISTS group;
CREATE TABLE group (
  id int NOT NULL AUTO_INCREMENT UNIQUE,
  group_name varchar (50) NOTNULL,
  dt_created datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
  max_group_members int NOT NULL DEFAULT 20,
  active boolean NOT NULL DEFAULT TRUE 

DROP TABLE IF EXISTS group_invitation;
CREATE TABLE group_invitation (
  id bigint NOT NULL AUTO_INCREMENT UNIQUE,
  group_id int NOT NULL,
  dt_created datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
  dt_expires datetime DEFAULT DATEADD(hour,1,CURRENT_TIMESTAMP) NOT NULL,
  max_group_members int NOT NULL DEFAULT 20,
  PRIMARY KEY (id),
  FOREIGN KEY (group_id) REFERENCES group(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS user_group;
CREATE TABLE user_group (
  id bigint NOT NULL AUTO_INCREMENT UNIQUE,
  group_id int NOT NULL,
  user_id int NOT NULL,
  max_group_members int NOT NULL DEFAULT 20,
  PRIMARY KEY (id, user_id, group_id),
  FOREIGN KEY (group_id) REFERENCES group(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS user_session;
CREATE TABLE user_session (
  id bigint NOT NULL AUTO_INCREMENT UNIQUE,
  user_id int NOT NULL,
  session_id int NOT NULL,
  role varchar(20),
  dt_joined datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id, user_id, session_id),
  FOREIGN KEY user_id REFERENCES user(id) ON DELETE CASCADE,
  FOREIGN KEY session_id REFERENCES sessions(id) ON DELETE CASCADE
)

DROP TABLE IF EXISTS session_time_range;
CREATE TABLE session_time_range (
  id bigint NOT NULL AUTO_INCREMENT UNIQUE,
  user_session_id int NOT NULL,
  role varchar(20),
  dt_start datetime NOT NULL,
  dt_end datetime NOT NULL,
  status varchar(20),
  PRIMARY KEY (id, user_session_id),
  FOREIGN KEY user_session_id REFERENCES user_session(id) ON DELETE CASCADE
)

DROP TABLE IF EXISTS session_invitation;
CREATE TABLE session_invitation (
  id bigint NOT NULL AUTO_INCREMENT UNIQUE,
  group_id int,
  user_id int,
  dt_created datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
  dt_expires datetime DEFAULT DATEADD(hour,1,CURRENT_TIMESTAMP) NOT NULL,
  status varchar(20),
  PRIMARY KEY (id),
  FOREIGN KEY group_id REFERENCES group(id) ON DELETE CASCADE,
  FOREIGN KEY user_id REFERENCES user(id) ON DELETE CASCADE
)

USE scheduler; SELECT * FROM user WHERE google_id = "112150195852534406291";

INSERT INTO user (username, password, nickname) VALUES ("Nathan", "potatoman", "Nate");