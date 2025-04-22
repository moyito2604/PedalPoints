-- MySQL dump 10.13  Distrib 8.0.41, for macos15.2 (arm64)
--
-- Host: 34.192.107.181    Database: pedalpointsdb
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `About`
--

DROP TABLE IF EXISTS `About`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `About` (
  `team_number` int NOT NULL,
  `version_number` int NOT NULL,
  `release_date` date NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `product_description` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Admin`
--

DROP TABLE IF EXISTS `Admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Admin` (
  `UserID` int NOT NULL,
  PRIMARY KEY (`UserID`),
  CONSTRAINT `Admin_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `Users` (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `AuditLog`
--

DROP TABLE IF EXISTS `AuditLog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `AuditLog` (
  `AuditLogID` int NOT NULL AUTO_INCREMENT,
  `AuditLogDate` datetime DEFAULT CURRENT_TIMESTAMP,
  `UserID` int DEFAULT NULL,
  `AuditType` varchar(255) DEFAULT NULL,
  `AuditDetails` text,
  PRIMARY KEY (`AuditLogID`),
  KEY `UserID` (`UserID`),
  CONSTRAINT `AuditLog_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `Users` (`UserID`)
) ENGINE=InnoDB AUTO_INCREMENT=914 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Cart`
--

DROP TABLE IF EXISTS `Cart`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Cart` (
  `DriverRelationID` int NOT NULL,
  `ProductTrackId` varchar(255) DEFAULT NULL,
  `Quantity` int NOT NULL,
  UNIQUE KEY `unique_driver_relation_product` (`DriverRelationID`,`ProductTrackId`),
  KEY `DriverRelationID` (`DriverRelationID`),
  KEY `Cart_ibfk_2` (`ProductTrackId`),
  CONSTRAINT `Cart_ibfk_1` FOREIGN KEY (`DriverRelationID`) REFERENCES `DriverRelation` (`DriverRelationID`),
  CONSTRAINT `Cart_ibfk_2` FOREIGN KEY (`ProductTrackId`) REFERENCES `Product` (`ProductTrackId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Commission`
--

DROP TABLE IF EXISTS `Commission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Commission` (
  `CommissionID` int NOT NULL AUTO_INCREMENT,
  `SponsorID` int DEFAULT NULL,
  `CommissionAmount` decimal(10,2) DEFAULT NULL,
  `CommissionStatus` int DEFAULT '0',
  `PurchaseID` int DEFAULT NULL,
  PRIMARY KEY (`CommissionID`),
  KEY `SponsorID` (`SponsorID`),
  KEY `PurchaseID` (`PurchaseID`),
  CONSTRAINT `Commission_ibfk_1` FOREIGN KEY (`SponsorID`) REFERENCES `Sponsor` (`SponsorID`),
  CONSTRAINT `Commission_ibfk_2` FOREIGN KEY (`PurchaseID`) REFERENCES `Purchase` (`PurchaseID`)
) ENGINE=InnoDB AUTO_INCREMENT=88 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `DriverInfo`
--

DROP TABLE IF EXISTS `DriverInfo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `DriverInfo` (
  `UserID` int NOT NULL,
  `DriverExp` varchar(45) DEFAULT NULL,
  `DriverTruckInfo` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`UserID`),
  CONSTRAINT `fk_DriverInfo_Users1` FOREIGN KEY (`UserID`) REFERENCES `Users` (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `DriverRelation`
--

DROP TABLE IF EXISTS `DriverRelation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `DriverRelation` (
  `DriverRelationID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `SponsorID` int NOT NULL,
  `DriverReason` varchar(255) DEFAULT NULL,
  `DriverStatus` int DEFAULT NULL,
  `DriverPoints` int DEFAULT '0',
  `SponsorReason` mediumtext,
  PRIMARY KEY (`DriverRelationID`),
  KEY `SponsorID` (`SponsorID`),
  KEY `Drivers_ibfk_1` (`UserID`),
  CONSTRAINT `Drivers_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `Users` (`UserID`),
  CONSTRAINT `Drivers_ibfk_2` FOREIGN KEY (`SponsorID`) REFERENCES `Sponsor` (`SponsorID`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Notification`
--

DROP TABLE IF EXISTS `Notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Notification` (
  `NotificationID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `NotificationType` varchar(255) DEFAULT NULL,
  `NotificationDetails` text,
  `NotificationDate` datetime DEFAULT NULL,
  `NotificationAck` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`NotificationID`),
  KEY `UserID` (`UserID`),
  CONSTRAINT `Notification_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `Users` (`UserID`)
) ENGINE=InnoDB AUTO_INCREMENT=295 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Product`
--

DROP TABLE IF EXISTS `Product`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Product` (
  `SponsorID` int NOT NULL,
  `ProductName` varchar(255) DEFAULT NULL,
  `ProductTrackId` varchar(255) DEFAULT NULL,
  `ProductCollectionId` varchar(255) DEFAULT NULL,
  `ProductTrackName` varchar(255) DEFAULT NULL,
  `ProductCollectionName` varchar(255) DEFAULT NULL,
  `ProductArtistName` varchar(255) DEFAULT NULL,
  `ProductGenre` varchar(100) DEFAULT NULL,
  `ProductPrice` decimal(10,2) DEFAULT NULL,
  `ProductImage` varchar(255) DEFAULT NULL,
  `ProductType` varchar(100) DEFAULT NULL,
  `ProductActive` int DEFAULT NULL,
  KEY `SponsorID` (`SponsorID`),
  KEY `idx_ProductTrackId` (`ProductTrackId`),
  CONSTRAINT `Product_ibfk_1` FOREIGN KEY (`SponsorID`) REFERENCES `Sponsor` (`SponsorID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Purchase`
--

DROP TABLE IF EXISTS `Purchase`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Purchase` (
  `PurchaseID` int NOT NULL AUTO_INCREMENT,
  `DriverRelationID` int NOT NULL,
  `ProductID` int NOT NULL,
  `PurchaseDate` datetime DEFAULT CURRENT_TIMESTAMP,
  `PurchaseQuantity` int DEFAULT NULL,
  PRIMARY KEY (`PurchaseID`),
  KEY `ProductID` (`ProductID`),
  KEY `fk_Purchase_DriverRelation1_idx` (`DriverRelationID`),
  CONSTRAINT `fk_Purchase_DriverRelation1` FOREIGN KEY (`DriverRelationID`) REFERENCES `DriverRelation` (`DriverRelationID`)
) ENGINE=InnoDB AUTO_INCREMENT=194 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`%`*/ /*!50003 TRIGGER `CALC_COMMISSION` AFTER INSERT ON `Purchase` FOR EACH ROW BEGIN
	DECLARE Sponsor INT;
    DECLARE Quantity INT;
    DECLARE Price DECIMAL(10,2);
    SELECT SponsorID INTO Sponsor FROM DriverRelation WHERE DriverRelationID=NEW.DriverRelationID;
    SELECT PurchaseQuantity INTO Quantity FROM Purchase WHERE PurchaseID=New.PurchaseID;
    SELECT ProductPrice INTO Price FROM Product WHERE ProductTrackID=New.ProductID AND SponsorID=Sponsor;
	INSERT INTO Commission (SponsorID, CommissionAmount, CommissionStatus, PurchaseID)
    VALUES (Sponsor, ROUND(Quantity*Price*0.01, 2), 0, New.PurchaseID);
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `Sponsor`
--

DROP TABLE IF EXISTS `Sponsor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Sponsor` (
  `SponsorID` int NOT NULL AUTO_INCREMENT,
  `SponsorCompanyName` varchar(255) DEFAULT NULL,
  `SponsorContact` text,
  `SponsorPointValue` decimal(10,2) DEFAULT '0.01',
  `SponsorEmail` text,
  `SponsorTimeFrame` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`SponsorID`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `SponsorPreset`
--

DROP TABLE IF EXISTS `SponsorPreset`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `SponsorPreset` (
  `PresetID` int NOT NULL AUTO_INCREMENT,
  `SponsorID` int DEFAULT NULL,
  `PresetPointValue` int DEFAULT NULL,
  `PresetReason` text,
  PRIMARY KEY (`PresetID`),
  KEY `SponsorID` (`SponsorID`),
  CONSTRAINT `SponsorPreset_ibfk_1` FOREIGN KEY (`SponsorID`) REFERENCES `Sponsor` (`SponsorID`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `SponsorUser`
--

DROP TABLE IF EXISTS `SponsorUser`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `SponsorUser` (
  `UserID` int NOT NULL,
  `SponsorID` int NOT NULL,
  PRIMARY KEY (`UserID`),
  KEY `SponsorID` (`SponsorID`),
  CONSTRAINT `SponsorUser_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `Users` (`UserID`),
  CONSTRAINT `SponsorUser_ibfk_2` FOREIGN KEY (`SponsorID`) REFERENCES `Sponsor` (`SponsorID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Transaction`
--

DROP TABLE IF EXISTS `Transaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Transaction` (
  `TransactionID` int NOT NULL AUTO_INCREMENT,
  `DriverRelationID` int DEFAULT NULL,
  `TransactionDate` datetime DEFAULT CURRENT_TIMESTAMP,
  `TransactionChange` int DEFAULT NULL,
  `TransactionReason` text,
  PRIMARY KEY (`TransactionID`),
  KEY `fk_Transaction_DriverRelation1_idx` (`DriverRelationID`),
  CONSTRAINT `fk_Transaction_DriverRelation1` FOREIGN KEY (`DriverRelationID`) REFERENCES `DriverRelation` (`DriverRelationID`)
) ENGINE=InnoDB AUTO_INCREMENT=133 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`%`*/ /*!50003 TRIGGER `TRANSACT_POINTS` AFTER INSERT ON `Transaction` FOR EACH ROW BEGIN
	UPDATE DriverRelation SET DriverPoints = DriverPoints + NEW.TransactionChange WHERE DriverRelationID = NEW.DriverRelationID;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `Users`
--

DROP TABLE IF EXISTS `Users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Users` (
  `UserID` int NOT NULL AUTO_INCREMENT,
  `UserFName` varchar(255) DEFAULT NULL,
  `UserLName` varchar(255) DEFAULT NULL,
  `Username` varchar(255) DEFAULT NULL,
  `UserPassword` varchar(255) DEFAULT NULL,
  `UserBio` text,
  `UserPhone` text,
  `UserEmail` varchar(30) DEFAULT NULL,
  `UserAddress` text,
  `UserCity` text,
  `UserState` text,
  `UserZipCode` text,
  `UserSecAddress` text,
  `UserPFP` varchar(60) DEFAULT NULL,
  `UserIsActive` int DEFAULT '1',
  PRIMARY KEY (`UserID`),
  UNIQUE KEY `UserEmail` (`Username`)
) ENGINE=InnoDB AUTO_INCREMENT=81 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`%`*/ /*!50003 TRIGGER `USERS_AUDIT_INSERT` AFTER INSERT ON `Users` FOR EACH ROW BEGIN
	INSERT INTO AuditLog (AuditLogDate, UserID, AuditType, AuditDetails) 
	VALUES (NOW(), NEW.UserID, "User Created", CONCAT(NEW.Username, "'s Account Created"));
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`%`*/ /*!50003 TRIGGER `USERS_AUDIT` AFTER UPDATE ON `Users` FOR EACH ROW BEGIN
	IF NOT (NEW.UserPassword <=> OLD.UserPassword) THEN
		INSERT INTO AuditLog (AuditLogDate, UserID, AuditType, AuditDetails) 
        VALUES (NOW(), NEW.UserID, "Password Change", CONCAT(NEW.Username, "'s Password Changed"));
	END IF;
    IF NOT (NEW.Username <=> OLD.Username) THEN
		INSERT INTO AuditLog (AuditLogDate, UserID, AuditType, AuditDetails) 
        VALUES (NOW(), NEW.UserID, "Username Change", CONCAT(OLD.Username, "'s Username Changed to ", NEW.Username));
    END IF;
    IF NOT (NEW.UserFName <=> OLD.UserFName) OR NOT (NEW.UserLName <=> OLD.UserLName) THEN
		INSERT INTO AuditLog (AuditLogDate, UserID, AuditType, AuditDetails) 
        VALUES (NOW(), NEW.UserID, "Name Change", CONCAT(OLD.UserFName, " ", OLD.UserLName, "'s Name Changed to ", NEW.UserFName, " ", NEW.UserLName));
    END IF;
    IF NOT (NEW.UserBio <=> OLD.UserBio) THEN
		INSERT INTO AuditLog (AuditLogDate, UserID, AuditType, AuditDetails) 
        VALUES (NOW(), NEW.UserID, "Bio Change", CONCAT(NEW.Username, "'s Bio Changed"));
    END IF;
    IF NOT (NEW.UserPhone <=> OLD.UserPhone) THEN
		INSERT INTO AuditLog (AuditLogDate, UserID, AuditType, AuditDetails) 
        VALUES (NOW(), NEW.UserID, "Phone Number Change", CONCAT(NEW.Username, "'s Phone Number Changed"));
    END IF;
	IF NOT (NEW.UserEmail <=> OLD.UserEmail) THEN
		INSERT INTO AuditLog (AuditLogDate, UserID, AuditType, AuditDetails) 
        VALUES (NOW(), NEW.UserID, "Email Change", CONCAT(NEW.Username, "'s Email Changed"));
    END IF;
    IF NOT (NEW.UserAddress <=> OLD.UserAddress) OR NOT (NEW.UserCity <=> OLD.UserCity) OR NOT (NEW.UserState <=> OLD.UserState) OR NOT (NEW.UserZipCode <=> OLD.UserZipCode) OR NOT (NEW.UserSecAddress <=> OLD.UserSecAddress) THEN
		INSERT INTO AuditLog (AuditLogDate, UserID, AuditType, AuditDetails) 
        VALUES (NOW(), NEW.UserID, "Address Change", CONCAT(NEW.Username, "'s Address Changed"));
    END IF;
    IF NOT (NEW.UserPFP <=> OLD.UserPFP) THEN
		INSERT INTO AuditLog (AuditLogDate, UserID, AuditType, AuditDetails) 
        VALUES (NOW(), NEW.UserID, "Profile Picture Change", CONCAT(NEW.Username, "'s Profile Picture Changed"));
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Dumping routines for database 'pedalpointsdb'
--
/*!50003 DROP PROCEDURE IF EXISTS `ADD_ADMIN` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`pedalpoints`@`%` PROCEDURE `ADD_ADMIN`(IN USERFNAME VARCHAR(255),
   IN USERLNAME VARCHAR(255),
   IN USERNAME VARCHAR(255),
   IN USERPASSWORD VARCHAR(255),
   IN USERPHONE TEXT,
   IN USEREMAIL VARCHAR(30),
   IN USERADDRESS TEXT,
   IN USERCITY TEXT,
   IN USERSTATE TEXT,
   IN USERZIPCODE TEXT,
   IN USERSECADDRESS TEXT)
BEGIN
	INSERT INTO Users (UserFName, UserLName, Username, UserPassword, UserPhone, UserEmail, UserAddress, UserCity, UserState, UserZipCode, UserSecAddress) 
    VALUES (USERFNAME, USERLNAME, USERNAME, USERPASSWORD, USERPHONE, USEREMAIL, USERADDRESS, USERCITY, USERSTATE, USERZIPCODE, USERSECADDRESS);

    INSERT INTO Admin VALUES (LAST_INSERT_ID());
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `ADD_DRIVER` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`pedalpoints`@`%` PROCEDURE `ADD_DRIVER`(IN USERFNAME VARCHAR(255),
   IN USERLNAME VARCHAR(255),
   IN USERNAME VARCHAR(255),
   IN USERPASSWORD VARCHAR(255),
   IN USERPHONE TEXT,
   IN USEREMAIL VARCHAR(30),
   IN USERADDRESS TEXT,
   IN USERCITY TEXT,
   IN USERSTATE TEXT,
   IN USERZIPCODE TEXT,
   IN USERSECADDRESS TEXT)
BEGIN
	INSERT INTO Users (UserFName, UserLName, Username, UserPassword, UserPhone, UserEmail, UserAddress, UserCity, UserState, UserZipCode, UserSecAddress) 
    VALUES (USERFNAME, USERLNAME, USERNAME, USERPASSWORD, USERPHONE, USEREMAIL, USERADDRESS, USERCITY, USERSTATE, USERZIPCODE, USERSECADDRESS);

    INSERT INTO DriverInfo (UserID, DriverExp, DriverTruckInfo) 
    VALUES (LAST_INSERT_ID(), NULL, NULL);
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `ADD_SPONSOR_USER` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`pedalpoints`@`%` PROCEDURE `ADD_SPONSOR_USER`(IN USERFNAME VARCHAR(255),
   IN USERLNAME VARCHAR(255),
   IN USERNAME VARCHAR(255),
   IN USERPASSWORD VARCHAR(255),
   IN USERPHONE TEXT,
   IN USEREMAIL VARCHAR(30),
   IN USERADDRESS TEXT,
   IN USERCITY TEXT,
   IN USERSTATE TEXT,
   IN USERZIPCODE TEXT,
   IN USERSECADDRESS TEXT,
   IN SPONSORID INT)
BEGIN
	INSERT INTO Users (UserFName, UserLName, Username, UserPassword, UserPhone, UserEmail, UserAddress, UserCity, UserState, UserZipCode, UserSecAddress) 
    VALUES (USERFNAME, USERLNAME, USERNAME, USERPASSWORD, USERPHONE, USEREMAIL, USERADDRESS, USERCITY, USERSTATE, USERZIPCODE, USERSECADDRESS);

    INSERT INTO SponsorUser (UserID, SponsorID) VALUES (LAST_INSERT_ID(), SPONSORID);
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-04-20 14:25:25
