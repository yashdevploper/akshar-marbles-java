CREATE DATABASE IF NOT EXISTS akshar_marbles;
USE akshar_marbles;


-- Table structure for table `admins`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `admins` (
  `admin_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`admin_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admins`
--


--

-- Table structure for table `categories`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `categories` (
  `category_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `category_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `category_name` (`category_name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

INSERT IGNORE INTO `categories` VALUES (1,'Italian Marble',NULL,'2026-11-15 04:41:11'),(2,'European Marble',NULL,'2026-11-15 04:41:11'),(3,'Indian Marble',NULL,'2026-11-15 04:41:11'),(4,'Turkish Marble',NULL,'2026-11-15 04:41:11');

--

-- Table structure for table `customers`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `customers` (
  `customer_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`customer_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--


--

-- Table structure for table `discounts`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `discounts` (
  `discount_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `discount_name` varchar(150) NOT NULL,
  `discount_type` enum('percentage','fixed') NOT NULL,
  `discount_value` decimal(10,2) NOT NULL,
  `coupon_code` varchar(50) DEFAULT NULL,
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`discount_id`),
  UNIQUE KEY `coupon_code` (`coupon_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `discounts`
--


--

-- Table structure for table `website_pages`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `website_pages` (
  `page_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `page_name` varchar(100) NOT NULL,
  `page_filename` varchar(150) NOT NULL,
  `page_type` enum('admin','customer','public') NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`page_id`),
  UNIQUE KEY `page_filename` (`page_filename`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `website_pages`
--

INSERT IGNORE INTO `website_pages` VALUES (1,'Admin Dashboard','admin-dashboard.html','admin','Admin overview and statistics','2026-11-15 04:41:11'),(2,'Admin Pricing & Discounts','admin-pricing-discounts.html','admin','Product pricing and discount management','2026-11-15 04:41:11'),(3,'Admin Logistics','admin-logistics.html','admin','Shipment and delivery management','2026-11-15 04:41:11'),(4,'Admin Inventory','admin-inventory.html','admin','Product stock management','2026-11-15 04:41:11'),(5,'Admin Customers','admin-customers.html','admin','Customer management','2026-11-15 04:41:11'),(6,'Admin Login','admin-login.html','admin','Administrator authentication','2026-11-15 04:41:11'),(7,'Product Details','product.html','public','Individual product details','2026-11-15 04:41:11'),(8,'Browse Products','browse.html','public','Product catalogue','2026-11-15 04:41:11'),(9,'Shopping Cart','cart.html','customer','Shopping cart','2026-11-15 04:41:11'),(10,'Navbar','navbar.html','public','Website navigation','2026-11-15 04:41:11'),(11,'Home','home.html','public','Homepage','2026-11-15 04:41:11'),(12,'Orders','orders.html','customer','Customer order management','2026-11-15 04:41:11'),(13,'Register','register.html','public','Customer registration','2026-11-15 04:41:11'),(14,'Login','login.html','public','Customer authentication','2026-11-15 04:41:11');

--

-- Table structure for table `customer_addresses`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `customer_addresses` (
  `address_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` int(10) unsigned NOT NULL,
  `address_type` enum('billing','shipping','both') DEFAULT 'both',
  `full_name` varchar(150) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address_line1` varchar(255) NOT NULL,
  `address_line2` varchar(255) DEFAULT NULL,
  `city` varchar(100) NOT NULL,
  `state` varchar(100) NOT NULL,
  `postal_code` varchar(15) NOT NULL,
  `country` varchar(100) DEFAULT 'India',
  `is_default` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`address_id`),
  KEY `idx_customer_address` (`customer_id`),
  CONSTRAINT `customer_addresses_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_addresses`
--


--

-- Table structure for table `carts`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `carts` (
  `cart_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` int(10) unsigned DEFAULT NULL,
  `session_token` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`cart_id`),
  UNIQUE KEY `session_token` (`session_token`),
  KEY `idx_cart_customer` (`customer_id`),
  CONSTRAINT `carts_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carts`
--


--

-- Table structure for table `orders`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `orders` (
  `order_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `order_number` varchar(50) NOT NULL,
  `customer_id` int(10) unsigned NOT NULL,
  `shipping_address_id` int(10) unsigned DEFAULT NULL,
  `billing_address_id` int(10) unsigned DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount_amount` decimal(10,2) DEFAULT 0.00,
  `tax_amount` decimal(10,2) DEFAULT 0.00,
  `shipping_amount` decimal(10,2) DEFAULT 0.00,
  `total_amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `payment_status` enum('Pending','Paid','Failed','Refunded') DEFAULT 'Pending',
  `order_status` enum('Pending','Confirmed','Processing','Shipped','Delivered','Cancelled') DEFAULT 'Pending',
  `customer_notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`order_id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `shipping_address_id` (`shipping_address_id`),
  KEY `billing_address_id` (`billing_address_id`),
  KEY `idx_order_customer` (`customer_id`),
  KEY `idx_order_status` (`order_status`),
  KEY `idx_order_date` (`created_at`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`),
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`shipping_address_id`) REFERENCES `customer_addresses` (`address_id`) ON DELETE SET NULL,
  CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`billing_address_id`) REFERENCES `customer_addresses` (`address_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--


--

-- Table structure for table `products`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `products` (
  `product_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `product_code` varchar(30) NOT NULL,
  `product_name` varchar(200) NOT NULL,
  `category_id` int(10) unsigned NOT NULL,
  `origin` varchar(100) DEFAULT NULL,
  `finish` varchar(100) DEFAULT NULL,
  `tile_size` varchar(50) DEFAULT NULL,
  `type_of_stone` varchar(100) DEFAULT NULL,
  `badge_text` varchar(100) DEFAULT NULL,
  `badge_style` varchar(50) DEFAULT NULL,
  `stock_status` enum('In Stock','Out of Stock','Low Stock','Pre Order') DEFAULT 'In Stock',
  `image_path` varchar(500) DEFAULT NULL,
  `image_alt` varchar(255) DEFAULT NULL,
  `product_page` varchar(255) DEFAULT 'product.html',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`product_id`),
  UNIQUE KEY `product_code` (`product_code`),
  KEY `idx_product_name` (`product_name`),
  KEY `idx_product_category` (`category_id`),
  KEY `idx_product_stock` (`stock_status`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

INSERT IGNORE INTO `products` VALUES (1,'P001','Statuario White',1,'Italy','Polished','24\"×24\"','Natural Marble','Bestseller','gold','In Stock','assets/Front-images/Statuario white Italian marble slab with dramatic grey veining, polished surface, luxury material ph.png','Statuario White','product.html',1,'2026-11-15 04:41:11','2026-11-15 04:41:11'),(2,'P002','Calacatta Gold',1,'Italy','Polished','24\"×48\"','Natural Marble','Premium','green','In Stock','assets/Front-images/Calacatta Gold Italian marble with golden yellow veins on white background, luxury interior stone, p.png','Calacatta Gold','product.html',1,'2026-11-15 04:41:11','2026-11-15 04:41:11'),(3,'P003','Bianco Sivec',2,'Macedonia','Honed','18\"×18\"','Natural Marble',NULL,NULL,'In Stock','assets/Front-images/polished Italian white Carrara marble surface close-up, elegant veining pattern, luxury stone textur.png','Bianco Sivec','product.html',1,'2026-11-15 04:41:11','2026-11-15 04:41:11'),(4,'P004','Arabescato Corchia',1,'Italy','Polished','24\"×24\"','Natural Marble','New Arrival','gold','In Stock','assets/Front-images/Arabescato-Corchia-Marble.png','Arabescato Corchia','product.html',1,'2026-11-15 04:41:11','2026-11-15 04:41:11'),(5,'P005','Makrana White',3,'India','Polished','24\"×24\"','Natural Marble',NULL,NULL,'In Stock','assets/Front-images/Makrana-Marble-2.png','Makrana White','product.html',1,'2026-11-15 04:41:11','2026-11-15 04:41:11'),(6,'P006','Crystal White',4,'Turkey','Polished','24\"×24\"','Natural Marble','15% OFF','gold','In Stock','assets/Front-images/Nero Marquina black marble with white veins, Spain, luxury dark stone slab, polished surface close-u.png','Crystal White','product.html',1,'2026-11-15 04:41:11','2026-11-15 04:41:11');

--

-- Table structure for table `cart_items`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `cart_items` (
  `cart_item_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `cart_id` int(10) unsigned NOT NULL,
  `product_id` int(10) unsigned NOT NULL,
  `quantity` int(10) unsigned NOT NULL DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`cart_item_id`),
  UNIQUE KEY `unique_cart_product` (`cart_id`,`product_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`cart_id`) ON DELETE CASCADE,
  CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_items`
--


--

-- Table structure for table `inventory`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `inventory` (
  `inventory_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `product_id` int(10) unsigned NOT NULL,
  `quantity` int(10) unsigned NOT NULL DEFAULT 0,
  `low_stock_threshold` int(10) unsigned DEFAULT 5,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`inventory_id`),
  UNIQUE KEY `product_id` (`product_id`),
  CONSTRAINT `inventory_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory`
--

INSERT IGNORE INTO `inventory` VALUES (1,1,0,5,'2026-11-15 04:41:12'),(2,2,0,5,'2026-11-15 04:41:12'),(3,3,0,5,'2026-11-15 04:41:12'),(4,4,0,5,'2026-11-15 04:41:12'),(5,5,0,5,'2026-11-15 04:41:12'),(6,6,0,5,'2026-11-15 04:41:12');

--

-- Table structure for table `inventory_movements`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `inventory_movements` (
  `movement_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `product_id` int(10) unsigned NOT NULL,
  `admin_id` int(10) unsigned DEFAULT NULL,
  `movement_type` enum('IN','OUT','ADJUSTMENT') NOT NULL,
  `quantity` int(10) unsigned NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`movement_id`),
  KEY `admin_id` (`admin_id`),
  KEY `idx_inventory_movement` (`product_id`,`created_at`),
  CONSTRAINT `inventory_movements_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`),
  CONSTRAINT `inventory_movements_ibfk_2` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`admin_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_movements`
--


--

-- Table structure for table `order_items`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `order_items` (
  `order_item_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `order_id` int(10) unsigned NOT NULL,
  `product_id` int(10) unsigned DEFAULT NULL,
  `product_name` varchar(200) NOT NULL,
  `product_code` varchar(30) DEFAULT NULL,
  `quantity` int(10) unsigned NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  PRIMARY KEY (`order_item_id`),
  KEY `product_id` (`product_id`),
  KEY `idx_order_items` (`order_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--


--

-- Table structure for table `order_status_history`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `order_status_history` (
  `history_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `order_id` int(10) unsigned NOT NULL,
  `admin_id` int(10) unsigned DEFAULT NULL,
  `previous_status` varchar(50) DEFAULT NULL,
  `new_status` varchar(50) NOT NULL,
  `notes` text DEFAULT NULL,
  `changed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`history_id`),
  KEY `admin_id` (`admin_id`),
  KEY `idx_order_history` (`order_id`,`changed_at`),
  CONSTRAINT `order_status_history_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `order_status_history_ibfk_2` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`admin_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_status_history`
--


--

-- Table structure for table `product_discounts`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `product_discounts` (
  `product_id` int(10) unsigned NOT NULL,
  `discount_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`product_id`,`discount_id`),
  KEY `discount_id` (`discount_id`),
  CONSTRAINT `product_discounts_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `product_discounts_ibfk_2` FOREIGN KEY (`discount_id`) REFERENCES `discounts` (`discount_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_discounts`
--


--

-- Table structure for table `product_images`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `product_images` (
  `image_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `product_id` int(10) unsigned NOT NULL,
  `image_path` varchar(500) NOT NULL,
  `image_type` enum('main','gallery') NOT NULL,
  `display_order` tinyint(3) unsigned DEFAULT 1,
  `image_alt` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`image_id`),
  UNIQUE KEY `unique_product_image_order` (`product_id`,`display_order`),
  KEY `idx_product_images` (`product_id`),
  CONSTRAINT `product_images_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_images`
--

INSERT IGNORE INTO `product_images` VALUES (1,1,'assets/Front-images/Statuario white Italian marble slab with dramatic grey veining, polished surface, luxury material ph.png','main',1,NULL,'2026-11-15 04:41:12'),(2,2,'assets/Front-images/Calacatta Gold Italian marble with golden yellow veins on white background, luxury interior stone, p.png','main',1,NULL,'2026-11-15 04:41:12'),(3,3,'assets/Front-images/polished Italian white Carrara marble surface close-up, elegant veining pattern, luxury stone textur.png','main',1,NULL,'2026-11-15 04:41:12'),(4,4,'assets/Front-images/Arabescato-Corchia-Marble.png','main',1,NULL,'2026-11-15 04:41:12'),(5,5,'assets/Front-images/Makrana-Marble-2.png','main',1,NULL,'2026-11-15 04:41:12'),(6,6,'assets/Front-images/Nero Marquina black marble with white veins, Spain, luxury dark stone slab, polished surface close-u.png','main',1,NULL,'2026-11-15 04:41:12'),(8,1,'assets/Front-images/vertical-product thumbnails/P001/1.png','gallery',2,NULL,'2026-11-15 04:41:12'),(9,1,'assets/Front-images/vertical-product thumbnails/P001/2.png','gallery',3,NULL,'2026-11-15 04:41:12'),(10,1,'assets/Front-images/vertical-product thumbnails/P001/3.png','gallery',4,NULL,'2026-11-15 04:41:12'),(11,2,'assets/Front-images/vertical-product thumbnails/P002/1.png','gallery',2,NULL,'2026-11-15 04:41:12'),(12,2,'assets/Front-images/vertical-product thumbnails/P002/2.png','gallery',3,NULL,'2026-11-15 04:41:12'),(13,2,'assets/Front-images/vertical-product thumbnails/P002/3.png','gallery',4,NULL,'2026-11-15 04:41:12'),(14,3,'assets/Front-images/vertical-product thumbnails/P003/1.png','gallery',2,NULL,'2026-11-15 04:41:12'),(15,3,'assets/Front-images/vertical-product thumbnails/P003/2.png','gallery',3,NULL,'2026-11-15 04:41:12'),(16,3,'assets/Front-images/vertical-product thumbnails/P003/3.png','gallery',4,NULL,'2026-11-15 04:41:12'),(17,4,'assets/Front-images/vertical-product thumbnails/P004/1.png','gallery',2,NULL,'2026-11-15 04:41:12'),(18,4,'assets/Front-images/vertical-product thumbnails/P004/2.png','gallery',3,NULL,'2026-11-15 04:41:12'),(19,4,'assets/Front-images/vertical-product thumbnails/P004/3.png','gallery',4,NULL,'2026-11-15 04:41:12'),(20,5,'assets/Front-images/vertical-product thumbnails/P005/1.png','gallery',2,NULL,'2026-11-15 04:41:12'),(21,5,'assets/Front-images/vertical-product thumbnails/P005/2.png','gallery',3,NULL,'2026-11-15 04:41:12'),(22,5,'assets/Front-images/vertical-product thumbnails/P005/3.png','gallery',4,NULL,'2026-11-15 04:41:12'),(23,6,'assets/Front-images/vertical-product thumbnails/P006/1.png','gallery',2,NULL,'2026-11-15 04:41:12'),(24,6,'assets/Front-images/vertical-product thumbnails/P006/2.png','gallery',3,NULL,'2026-11-15 04:41:12'),(25,6,'assets/Front-images/vertical-product thumbnails/P006/3.png','gallery',4,NULL,'2026-11-15 04:41:12');

--

-- Table structure for table `product_prices`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `product_prices` (
  `price_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `product_id` int(10) unsigned NOT NULL,
  `current_price` decimal(10,2) NOT NULL,
  `original_price` decimal(10,2) DEFAULT NULL,
  `price_unit` varchar(30) DEFAULT '/sqft',
  `effective_from` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`price_id`),
  KEY `idx_product_price` (`product_id`),
  CONSTRAINT `product_prices_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_prices`
--

INSERT IGNORE INTO `product_prices` VALUES (1,1,450.00,500.00,'/sqft','2026-11-15 04:41:11','2026-11-15 04:41:11'),(2,2,900.00,1000.00,'/sqft','2026-11-15 04:41:11','2026-11-15 04:41:11'),(3,3,380.00,NULL,'/sqft','2026-11-15 04:41:11','2026-11-15 04:41:11'),(4,4,520.00,NULL,'/sqft','2026-11-15 04:41:11','2026-11-15 04:41:11'),(5,5,220.00,NULL,'/sqft','2026-11-15 04:41:11','2026-11-15 04:41:11'),(6,6,310.00,365.00,'/sqft','2026-11-15 04:41:11','2026-11-15 04:41:11');

--

-- Table structure for table `product_rating_summaries`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `product_rating_summaries` (
  `product_id` int(10) unsigned NOT NULL,
  `rating_score` decimal(2,1) NOT NULL,
  `rating_stars` varchar(10) DEFAULT NULL,
  `review_count` int(10) unsigned DEFAULT 0,
  PRIMARY KEY (`product_id`),
  CONSTRAINT `product_rating_summaries_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_rating_summaries`
--

INSERT IGNORE INTO `product_rating_summaries` VALUES (1,4.9,'★★★★★',284),(2,4.7,'★★★★★',196),(3,4.2,'★★★★☆',84),(4,5.0,'★★★★★',32),(5,4.1,'★★★★☆',218),(6,4.3,'★★★★☆',102);

--

-- Table structure for table `product_reviews`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `product_reviews` (
  `review_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `product_id` int(10) unsigned NOT NULL,
  `customer_id` int(10) unsigned DEFAULT NULL,
  `rating` tinyint(3) unsigned NOT NULL,
  `review_text` text DEFAULT NULL,
  `is_approved` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`review_id`),
  KEY `customer_id` (`customer_id`),
  KEY `idx_product_reviews` (`product_id`),
  KEY `idx_review_approval` (`is_approved`),
  CONSTRAINT `product_reviews_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `product_reviews_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE SET NULL,
  CONSTRAINT `CONSTRAINT_1` CHECK (`rating` between 1 and 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_reviews`
--


--

-- Table structure for table `product_specifications`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `product_specifications` (
  `specification_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `product_id` int(10) unsigned NOT NULL,
  `thickness_mm` decimal(8,2) DEFAULT NULL,
  `water_absorption` varchar(50) DEFAULT NULL,
  `hardness_mohs` varchar(50) DEFAULT NULL,
  `weight_kg_m2` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`specification_id`),
  UNIQUE KEY `product_id` (`product_id`),
  CONSTRAINT `product_specifications_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_specifications`
--

INSERT IGNORE INTO `product_specifications` VALUES (1,1,18.00,'0.09–0.14','3–3.5','48.8','2026-11-15 04:41:11'),(2,2,18.00,'0.05–0.18','3.5–4','48.6','2026-11-15 04:41:11'),(3,3,18.00,'0.14–0.23','3–4','50.0–51.1','2026-11-15 04:41:11'),(4,4,18.00,'0.10–0.30','3–4','47.7–49.5','2026-11-15 04:41:11'),(5,5,18.00,'0.04','3–4','48.4','2026-11-15 04:41:11'),(6,6,18.00,'0.10–0.30*','3–4*','48.6*','2026-11-15 04:41:11');

--

-- Table structure for table `shipments`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `shipments` (
  `shipment_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `order_id` int(10) unsigned NOT NULL,
  `tracking_number` varchar(100) DEFAULT NULL,
  `courier_name` varchar(150) DEFAULT NULL,
  `shipment_status` enum('Pending','Packed','Dispatched','In Transit','Delivered','Returned') DEFAULT 'Pending',
  `dispatch_date` datetime DEFAULT NULL,
  `estimated_delivery` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `shipping_notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`shipment_id`),
  UNIQUE KEY `order_id` (`order_id`),
  UNIQUE KEY `tracking_number` (`tracking_number`),
  KEY `idx_shipment_status` (`shipment_status`),
  CONSTRAINT `shipments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shipments`
--


--

-- Table structure for table `wishlists`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `wishlists` (
  `wishlist_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` int(10) unsigned NOT NULL,
  `product_id` int(10) unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`wishlist_id`),
  UNIQUE KEY `unique_wishlist_product` (`customer_id`,`product_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `wishlists_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE,
  CONSTRAINT `wishlists_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wishlists`
--

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-17 17:46:25