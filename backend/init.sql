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

USE scheduler; SELECT * FROM users WHERE google_id = "112150195852534406291";

INSERT INTO users (username, password, nickname) VALUES ("Nathan", "potatoman", "Nate");