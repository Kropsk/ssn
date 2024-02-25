import "dotenv/config";
import { Client } from "pg";

let connectionString = `${process.env.DATABASE_URL}`;
if (process.env.NODE_ENV === "development") {
  connectionString = connectionString.replace("@warehouse", "@localhost");
}

const client = new Client({
  connectionString,
});

await client.connect();

// source: https://github.com/LuckPerms/LuckPerms/blob/master/common/src/main/resources/me/lucko/luckperms/schema/postgresql.sql
const prefix = "luckperms_";
const result = await client.query(`-- LuckPerms PostgreSQL Schema

CREATE TABLE "${prefix}user_permissions" (
  "id"         SERIAL PRIMARY KEY      NOT NULL,
  "uuid"       VARCHAR(36)             NOT NULL,
  "permission" VARCHAR(200)            NOT NULL,
  "value"      BOOL                    NOT NULL,
  "server"     VARCHAR(36)             NOT NULL,
  "world"      VARCHAR(64)             NOT NULL,
  "expiry"     BIGINT                  NOT NULL,
  "contexts"   VARCHAR(200)            NOT NULL
);
CREATE INDEX "${prefix}user_permissions_uuid" ON "${prefix}user_permissions" ("uuid");

CREATE TABLE "${prefix}group_permissions" (
  "id"         SERIAL PRIMARY KEY       NOT NULL,
  "name"       VARCHAR(36)              NOT NULL,
  "permission" VARCHAR(200)             NOT NULL,
  "value"      BOOL                     NOT NULL,
  "server"     VARCHAR(36)              NOT NULL,
  "world"      VARCHAR(64)              NOT NULL,
  "expiry"     BIGINT                   NOT NULL,
  "contexts"   VARCHAR(200)             NOT NULL
);
CREATE INDEX "${prefix}group_permissions_name" ON "${prefix}group_permissions" ("name");

CREATE TABLE "${prefix}players" (
  "uuid"          VARCHAR(36) PRIMARY KEY NOT NULL,
  "username"      VARCHAR(16)             NOT NULL,
  "primary_group" VARCHAR(36)             NOT NULL
);
CREATE INDEX "${prefix}players_username" ON "${prefix}players" ("username");

CREATE TABLE "${prefix}groups" (
  "name" VARCHAR(36) PRIMARY KEY NOT NULL
);

CREATE TABLE "${prefix}actions" (
  "id"         SERIAL PRIMARY KEY       NOT NULL,
  "time"       BIGINT                   NOT NULL,
  "actor_uuid" VARCHAR(36)              NOT NULL,
  "actor_name" VARCHAR(100)             NOT NULL,
  "type"       CHAR(1)                  NOT NULL,
  "acted_uuid" VARCHAR(36)              NOT NULL,
  "acted_name" VARCHAR(36)              NOT NULL,
  "action"     VARCHAR(300)             NOT NULL
);

CREATE TABLE "${prefix}tracks" (
  "name"   VARCHAR(36) PRIMARY KEY NOT NULL,
  "groups" TEXT                    NOT NULL
);`);
console.log(result);

await client.end();
