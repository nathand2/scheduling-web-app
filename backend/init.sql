USE scheduler;
DROP TABLE IF EXISTS users;
CREATE TABLE users (
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
  group_id int NOT NULL,
  session_title varchar(50) NOT NULL,
  session_desc varchar (255),
  max_session_members int NOT NULL DEFAULT 10,
  FOREIGN KEY (group_id) REFERENCES group(id)
);

DROP TABLE IF EXISTS group;
CREATE TABLE group (
  id int NOT NULL AUTO_INCREMENT UNIQUE,
  group_name varchar (50) NOTNULL,
  dt_created datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
  max_group_members int NOT NULL DEFAULT 20,
);

DROP TABLE IF EXISTS group_invitation;
CREATE TABLE group_invitation (
  id bigint NOT NULL AUTO_INCREMENT UNIQUE,
  group_id int NOT NULL,
  dt_created datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
  dt_expires datetime DEFAULT DATEADD(hour,1,CURRENT_TIMESTAMP) NOT NULL,
  max_group_members int NOT NULL DEFAULT 20,
  PRIMARY KEY (id),
  FOREIGN KEY (group_id) REFERENCES group(id)
);

DROP TABLE IF EXISTS user_group;
CREATE TABLE user_group (
  id bigint NOT NULL AUTO_INCREMENT UNIQUE,
  group_id int NOT NULL,
  user_id int NOT NULL,
  max_group_members int NOT NULL DEFAULT 20,
  PRIMARY KEY (id),
  FOREIGN KEY (group_id) REFERENCES group(id),
  FOREIGN KEY (user_id) REFERENCES user(id)
);

USE scheduler; SELECT * FROM users WHERE google_id = "112150195852534406291";

INSERT INTO users (username, password, nickname) VALUES ("Nathan", "potatoman", "Nate");