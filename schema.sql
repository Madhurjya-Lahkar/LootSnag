-- LootSnag Database Schema
-- Run: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS lootsnag CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lootsnag;

CREATE TABLE IF NOT EXISTS guilds (
  id VARCHAR(20) PRIMARY KEY,
  free_games_channel VARCHAR(20) DEFAULT NULL,
  deals_channel VARCHAR(20) DEFAULT NULL,
  wishlist_channel VARCHAR(20) DEFAULT NULL,
  logs_channel VARCHAR(20) DEFAULT NULL,
  deal_threshold INT NOT NULL DEFAULT 80,
  currency ENUM('INR','USD') NOT NULL DEFAULT 'INR',
  enabled_stores JSON NOT NULL DEFAULT '["steam","epic","gog","humble","fanatical","ubisoft","prime","itch"]',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(20) PRIMARY KEY,
  currency ENUM('INR','USD') NOT NULL DEFAULT 'INR',
  alert_method ENUM('dm','channel','both') NOT NULL DEFAULT 'channel',
  preferred_stores JSON NOT NULL DEFAULT '["steam","epic","gog","humble","fanatical"]',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wishlists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(20) NOT NULL,
  game_id VARCHAR(150) NOT NULL,
  game_title VARCHAR(255) NOT NULL,
  store VARCHAR(50) DEFAULT NULL,
  store_url VARCHAR(500) DEFAULT NULL,
  added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_game (user_id, game_id),
  INDEX idx_user (user_id),
  INDEX idx_game (game_id)
);

CREATE TABLE IF NOT EXISTS sent_deals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  deal_id VARCHAR(255) NOT NULL,
  game_title VARCHAR(255) NOT NULL,
  store VARCHAR(50) NOT NULL,
  sale_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  normal_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  discount INT NOT NULL DEFAULT 0,
  deal_type ENUM('free','deal') NOT NULL,
  sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL DEFAULT NULL,
  UNIQUE KEY uq_deal (deal_id),
  INDEX idx_sent_at (sent_at),
  INDEX idx_type (deal_type)
);

CREATE TABLE IF NOT EXISTS message_map (
  id INT AUTO_INCREMENT PRIMARY KEY,
  deal_id VARCHAR(255) NOT NULL,
  guild_id VARCHAR(20) NOT NULL,
  channel_id VARCHAR(20) NOT NULL,
  message_id VARCHAR(20) NOT NULL,
  deal_type ENUM('free','deal') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_deal_guild (deal_id, guild_id),
  INDEX idx_deal (deal_id)
);

CREATE TABLE IF NOT EXISTS wishlist_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(20) NOT NULL,
  game_id VARCHAR(150) NOT NULL,
  deal_id VARCHAR(255) NOT NULL,
  sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_deal (user_id, deal_id),
  INDEX idx_user (user_id)
);

CREATE TABLE IF NOT EXISTS exchange_rates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  base_currency VARCHAR(3) NOT NULL,
  target_currency VARCHAR(3) NOT NULL,
  rate DECIMAL(15,6) NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pair (base_currency, target_currency)
);

CREATE TABLE IF NOT EXISTS bot_stats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  stat_key VARCHAR(100) NOT NULL,
  stat_value BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_key (stat_key)
);

INSERT IGNORE INTO bot_stats (stat_key, stat_value) VALUES
  ('free_games_sent', 0),
  ('deals_sent', 0),
  ('wishlist_alerts_sent', 0),
  ('searches_performed', 0),
  ('commands_used', 0);
