-- MySQL dump 10.13  Distrib 9.4.0, for Win64 (x86_64)
--
-- Host: localhost    Database: gtel_talento
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.32-MariaDB

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
-- Current Database: `gtel_talento`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `gtel_talento` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;

USE `gtel_talento`;

--
-- Table structure for table `auditoria`
--

DROP TABLE IF EXISTS `auditoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auditoria` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `tabla_afectada` varchar(50) NOT NULL,
  `registro_id` bigint(20) NOT NULL,
  `accion` enum('crear','actualizar','eliminar') NOT NULL,
  `detalle` varchar(255) DEFAULT NULL,
  `usuario_id` bigint(20) DEFAULT NULL,
  `fecha_accion` timestamp NOT NULL DEFAULT current_timestamp(),
  `actor_id_historico` bigint(20) DEFAULT NULL,
  `actor_email_historico` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_auditoria_usuarios` (`usuario_id`),
  CONSTRAINT `fk_auditoria_usuarios` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auditoria`
--

LOCK TABLES `auditoria` WRITE;
/*!40000 ALTER TABLE `auditoria` DISABLE KEYS */;
/*!40000 ALTER TABLE `auditoria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_email_challenges`
--

DROP TABLE IF EXISTS `auth_email_challenges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_email_challenges` (
  `usuario_id` bigint(20) NOT NULL,
  `session_id` varchar(36) NOT NULL,
  `email` varchar(150) NOT NULL,
  `rol` varchar(50) NOT NULL,
  `code_hash` varchar(64) NOT NULL,
  `expires_at` bigint(20) NOT NULL,
  `deadline` bigint(20) NOT NULL,
  `resend_at` bigint(20) NOT NULL,
  `attempts` int(11) NOT NULL DEFAULT 0,
  `sends` int(11) NOT NULL DEFAULT 0,
  `consumed` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`usuario_id`),
  UNIQUE KEY `session_id` (`session_id`),
  CONSTRAINT `fk_auth_challenge_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_email_challenges`
--

LOCK TABLES `auth_email_challenges` WRITE;
/*!40000 ALTER TABLE `auth_email_challenges` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_email_challenges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departamentos`
--

DROP TABLE IF EXISTS `departamentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departamentos` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(80) NOT NULL,
  `descripcion` varchar(200) DEFAULT NULL,
  `estado` enum('activo','inactivo') DEFAULT 'activo',
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departamentos`
--

LOCK TABLES `departamentos` WRITE;
/*!40000 ALTER TABLE `departamentos` DISABLE KEYS */;
INSERT INTO `departamentos` VALUES (1,'Ventas y Comercial','Campa?as comerciales outbound e inbound de telecomunicaciones','activo'),(2,'Atenci?n al Cliente','Atenci?n y soporte telef?nico de usuarios','activo'),(3,'Soporte T?cnico e IT','Soporte de sistemas y conectividad para operaciones','activo'),(4,'Recursos Humanos','Atracci?n, selecci?n y bienestar del talento humano','activo'),(5,'Operaciones Call Center','Gesti?n y supervisi?n de piso operativo','activo');
/*!40000 ALTER TABLE `departamentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `entrevistas`
--

DROP TABLE IF EXISTS `entrevistas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `entrevistas` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `postulacion_id` bigint(20) NOT NULL,
  `fecha` date NOT NULL,
  `hora` time NOT NULL,
  `duracion_min` int(11) DEFAULT 30,
  `tipo` enum('video','presencial') NOT NULL,
  `ubicacion` varchar(255) DEFAULT NULL,
  `estado` enum('programada','realizada','cancelada') DEFAULT 'programada',
  PRIMARY KEY (`id`),
  KEY `fk_entrevistas_postulaciones` (`postulacion_id`),
  CONSTRAINT `fk_entrevistas_postulaciones` FOREIGN KEY (`postulacion_id`) REFERENCES `postulaciones` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=105 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `entrevistas`
--

LOCK TABLES `entrevistas` WRITE;
/*!40000 ALTER TABLE `entrevistas` DISABLE KEYS */;
INSERT INTO `entrevistas` VALUES (101,102,'2026-10-09','15:30:00',45,'video','https://teams.microsoft.com/l/meetup-join/gtel-interview-carlos-mendoza','programada'),(102,105,'2026-10-10','10:00:00',30,'presencial','Sede Central GTEL - Av. Primavera 120, Sala 3B','programada'),(103,103,'2026-10-06','09:00:00',45,'video','https://meet.google.com/gtel-interview-lucia-ramos','realizada'),(104,108,'2026-10-19','22:00:00',30,'video','https://teams.microsoft.com/l/meetup-join/gtel-talento','programada');
/*!40000 ALTER TABLE `entrevistas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluacion_detalle`
--

DROP TABLE IF EXISTS `evaluacion_detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluacion_detalle` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `evaluacion_id` bigint(20) NOT NULL,
  `criterio` varchar(100) NOT NULL,
  `puntaje` int(11) NOT NULL,
  `porcentaje` int(11) DEFAULT NULL,
  `observacion` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_detalle_evaluaciones` (`evaluacion_id`),
  CONSTRAINT `fk_detalle_evaluaciones` FOREIGN KEY (`evaluacion_id`) REFERENCES `evaluaciones` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=106 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluacion_detalle`
--

LOCK TABLES `evaluacion_detalle` WRITE;
/*!40000 ALTER TABLE `evaluacion_detalle` DISABLE KEYS */;
INSERT INTO `evaluacion_detalle` VALUES (101,101,'Diagn?stico de Redes y Conectividad',95,40,'Excelente comprensi?n de protocolos TCP/IP y resoluci?n de fallas'),(102,101,'Atenci?n y Comunicaci?n con Usuario',90,30,'Trato cordial y vocabulario t?cnico accesible'),(103,101,'Gesti?n y Seguimiento de Tickets Helpdesk',90,30,'Conocimiento de buenas pr?cticas ITIL y SLA'),(104,102,'Gesti?n de KPIs y Adherencia Operativa',98,50,'Dominio sobresaliente de m?tricas de call center (AHT, FCR, CSAT)'),(105,102,'Liderazgo y Coaching de Equipos',94,50,'Capacidad demostrada para motivar y dar feedback oportuno');
/*!40000 ALTER TABLE `evaluacion_detalle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluaciones`
--

DROP TABLE IF EXISTS `evaluaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluaciones` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `postulacion_id` bigint(20) NOT NULL,
  `tipo_evaluacion` varchar(100) NOT NULL,
  `puntaje_total` int(11) NOT NULL,
  `tiempo_min` int(11) DEFAULT NULL,
  `resultado` enum('aprobado','en_revision','no_aprobado') NOT NULL,
  `fecha_evaluacion` date DEFAULT curdate(),
  `usuario_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_evaluaciones_postulaciones` (`postulacion_id`),
  KEY `fk_evaluaciones_usuarios` (`usuario_id`),
  CONSTRAINT `fk_evaluaciones_postulaciones` FOREIGN KEY (`postulacion_id`) REFERENCES `postulaciones` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_evaluaciones_usuarios` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=103 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluaciones`
--

LOCK TABLES `evaluaciones` WRITE;
/*!40000 ALTER TABLE `evaluaciones` DISABLE KEYS */;
INSERT INTO `evaluaciones` VALUES (101,102,'Soporte y Diagn?stico N1',92,25,'aprobado','2026-10-09',3),(102,103,'Liderazgo y Habilidades Operativas',96,30,'aprobado','2026-10-05',3);
/*!40000 ALTER TABLE `evaluaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificaciones`
--

DROP TABLE IF EXISTS `notificaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificaciones` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `usuario_id` bigint(20) NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `mensaje` text NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `enlace` varchar(255) DEFAULT NULL,
  `leida` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `enviada` tinyint(1) NOT NULL DEFAULT 0,
  `intentos` int(11) NOT NULL DEFAULT 0,
  `proximo_intento` bigint(20) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_notificaciones_usuario` (`usuario_id`),
  KEY `idx_notificaciones_leida` (`leida`),
  KEY `idx_notificaciones_tipo` (`tipo`),
  KEY `idx_notificaciones_created_at` (`created_at`),
  CONSTRAINT `fk_notificaciones_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificaciones`
--

LOCK TABLES `notificaciones` WRITE;
/*!40000 ALTER TABLE `notificaciones` DISABLE KEYS */;
INSERT INTO `notificaciones` VALUES (1,3,'Nueva postulaci?n recibida','Carlos Mendoza se ha postulado a la vacante \"Ingeniero de Redes y Telecomunicaciones\".','POSTULACION_NUEVA','/reclutador/postulantes',0,'2026-10-12 19:31:20',0,0,0),(2,3,'Nueva postulaci?n recibida','Ana Torres se ha postulado a la vacante \"Desarrollador Full Stack Senior\".','POSTULACION_NUEVA','/reclutador/postulantes',0,'2026-10-12 17:31:20',0,0,0),(3,3,'Requerimiento de personal','Jefatura Solicitante ha creado una nueva solicitud de puesto: \"Especialista en Fibra ?ptica FTTH\".','REQUERIMIENTO_ESTADO','/reclutador/requerimientos',1,'2026-10-11 20:31:20',0,0,0),(4,4,'Requerimiento en proceso','Tu requerimiento para \"Especialista en Fibra ?ptica FTTH\" ha sido asignado al equipo de RRHH.','REQUERIMIENTO_ESTADO','/reclutador/requerimientos',0,'2026-10-12 18:31:20',0,0,0),(5,5,'Revisi?n de candidatos','Tienes nuevas postulaciones pendientes de validaci?n inicial en la bandeja de entrada.','POSTULACION_NUEVA','/reclutador/postulantes',0,'2026-10-12 16:31:20',0,0,0),(6,6,'Entrevista t?cnica asignada','Se te ha asignado la entrevista de evaluaci?n t?cnica con el candidato Carlos Mendoza.','ENTREVISTA_PROGRAMADA','/reclutador/entrevistas',0,'2026-10-12 15:31:20',0,0,0),(7,2,'Postulaci?n recibida con ?xito','Tu postulaci?n a la vacante \"Ingeniero de Redes y Telecomunicaciones\" fue registrada con c?digo GTEL-2026-0001.','POSTULACION_REGISTRADA','/mis-postulaciones',0,'2026-10-12 14:31:20',0,0,0),(8,1,'Auditor?a del Sistema','Todos los servicios de seguridad, rate limiting y base de datos operan con normalidad.','SISTEMA','/reclutador/dashboard',1,'2026-10-12 08:31:20',0,0,0),(9,1,'Nueva postulación recibida','Brian Rivera Bautista se ha postulado a \"Asesor de Ventas Telef?nicas Outbound\".','POSTULACION_NUEVA','/reclutador/postulantes',0,'2026-10-20 02:52:51',0,0,0),(10,5,'Nueva postulación recibida','Brian Rivera Bautista se ha postulado a \"Asesor de Ventas Telef?nicas Outbound\".','POSTULACION_NUEVA','/reclutador/postulantes',0,'2026-10-20 02:52:51',0,0,0),(11,3,'Nueva postulación recibida','Brian Rivera Bautista se ha postulado a \"Asesor de Ventas Telef?nicas Outbound\".','POSTULACION_NUEVA','/reclutador/postulantes',0,'2026-10-20 02:52:51',0,0,0),(12,1,'Postulación recibida con éxito','Tu postulación a \"Asesor de Ventas Telef?nicas Outbound\" fue registrada con código GTEL-2026-2840.','POSTULACION_REGISTRADA','/mis-postulaciones',0,'2026-10-20 02:52:51',0,0,0),(13,1,'Nueva postulación recibida','Brian De Prueba se ha postulado a \"Asesor de Ventas Telef?nicas Outbound\".','POSTULACION_NUEVA','/reclutador/postulantes',0,'2026-10-20 02:54:58',0,0,0),(14,5,'Nueva postulación recibida','Brian De Prueba se ha postulado a \"Asesor de Ventas Telef?nicas Outbound\".','POSTULACION_NUEVA','/reclutador/postulantes',0,'2026-10-20 02:54:58',0,0,0),(15,3,'Nueva postulación recibida','Brian De Prueba se ha postulado a \"Asesor de Ventas Telef?nicas Outbound\".','POSTULACION_NUEVA','/reclutador/postulantes',0,'2026-10-20 02:54:58',0,0,0),(16,2,'Postulación recibida con éxito','Tu postulación a \"Asesor de Ventas Telef?nicas Outbound\" fue registrada con código GTEL-2026-9515.','POSTULACION_REGISTRADA','/mis-postulaciones',0,'2026-10-20 02:54:58',0,0,0),(17,1,'Actualización de postulación','Tu postulación a \"Asesor de Ventas Telef?nicas Outbound\" ha cambiado de estado a: Aprobada.','CANDIDATO_FASE','/mis-postulaciones',0,'2026-10-20 03:10:13',0,0,0),(18,1,'Actualización de postulación','Tu postulación a \"Asesor de Ventas Telef?nicas Outbound\" ha cambiado de estado a: Aprobada.','CANDIDATO_FASE','/mis-postulaciones',0,'2026-10-20 03:10:16',0,0,0),(19,2,'Entrevista programada','Se ha programado tu entrevista para el 19/10/2026 a las 22:00.','ENTREVISTA_PROGRAMADA','/mis-postulaciones',0,'2026-10-20 03:10:57',0,0,0),(20,1,'Entrevista agendada','Entrevista programada con Brian De Prueba para el 19/10/2026 a las 22:00.','ENTREVISTA_PROGRAMADA','/reclutador/entrevistas',0,'2026-10-20 03:10:57',0,0,0),(21,6,'Entrevista agendada','Entrevista programada con Brian De Prueba para el 19/10/2026 a las 22:00.','ENTREVISTA_PROGRAMADA','/reclutador/entrevistas',0,'2026-10-20 03:10:57',0,0,0),(22,3,'Entrevista agendada','Entrevista programada con Brian De Prueba para el 19/10/2026 a las 22:00.','ENTREVISTA_PROGRAMADA','/reclutador/entrevistas',0,'2026-10-20 03:10:57',0,0,0);
/*!40000 ALTER TABLE `notificaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `perfiles_contacto`
--

DROP TABLE IF EXISTS `perfiles_contacto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `perfiles_contacto` (
  `usuario_id` bigint(20) NOT NULL,
  `nombres` varchar(100) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  `telefono` varchar(16) DEFAULT NULL,
  `ubicacion` varchar(100) DEFAULT NULL,
  `localidad` varchar(100) DEFAULT NULL,
  `correo_contacto` varchar(150) DEFAULT NULL,
  `foto` mediumtext DEFAULT NULL,
  `educacion` text DEFAULT NULL,
  `experiencia` text DEFAULT NULL,
  PRIMARY KEY (`usuario_id`),
  CONSTRAINT `fk_perfiles_contacto_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `perfiles_contacto`
--

LOCK TABLES `perfiles_contacto` WRITE;
/*!40000 ALTER TABLE `perfiles_contacto` DISABLE KEYS */;
/*!40000 ALTER TABLE `perfiles_contacto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `postulacion_timeline`
--

DROP TABLE IF EXISTS `postulacion_timeline`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `postulacion_timeline` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `postulacion_id` bigint(20) NOT NULL,
  `estado_anterior` varchar(50) DEFAULT NULL,
  `estado_nuevo` varchar(50) NOT NULL,
  `comentario` varchar(255) DEFAULT NULL,
  `fecha_cambio` timestamp NOT NULL DEFAULT current_timestamp(),
  `usuario_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_timeline_postulaciones` (`postulacion_id`),
  KEY `fk_timeline_usuarios` (`usuario_id`),
  CONSTRAINT `fk_timeline_postulaciones` FOREIGN KEY (`postulacion_id`) REFERENCES `postulaciones` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_timeline_usuarios` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `postulacion_timeline`
--

LOCK TABLES `postulacion_timeline` WRITE;
/*!40000 ALTER TABLE `postulacion_timeline` DISABLE KEYS */;
INSERT INTO `postulacion_timeline` VALUES (1,101,NULL,'recibida','Postulaci?n registrada en el portal','2026-10-05 17:46:54',101),(2,101,'recibida','en_revision','Perfil cumple con experiencia m?nima requerida para outbound','2026-10-07 17:46:54',3),(3,102,NULL,'recibida','Postulaci?n registrada en el portal','2026-10-04 17:46:54',102),(4,102,'recibida','en_revision','Revisi?n t?cnica de certificaciones de redes','2026-10-06 17:46:54',3),(5,102,'en_revision','entrevista','Pase a entrevista t?cnica con soporte N2','2026-10-08 17:46:54',3),(6,103,NULL,'recibida','Postulaci?n registrada en el portal','2026-09-27 17:46:54',103),(7,103,'recibida','en_revision','Experiencia destacada en supervisi?n de call center','2026-09-29 17:46:54',3),(8,103,'en_revision','entrevista','Entrevista por competencias con Gerencia de Operaciones','2026-10-02 17:46:54',3),(9,103,'entrevista','aprobada','Candidata seleccionada para la vacante. Oferta econ?mica aceptada.','2026-10-07 17:46:54',3),(10,104,NULL,'recibida','Postulaci?n recibida pendiente de revisi?n inicial','2026-10-08 17:46:54',104),(11,105,NULL,'recibida','Postulaci?n registrada en el portal','2026-10-06 17:46:54',105),(12,105,'recibida','en_revision','Validaci?n de t?tulos y experiencia en reclutamiento masivo','2026-10-07 17:46:54',3),(13,105,'en_revision','entrevista','Agendada entrevista t?cnica presencial','2026-10-08 17:46:54',3),(14,106,NULL,'recibida','Postulaci?n recibida en el portal','2026-10-02 17:46:54',106),(15,106,'recibida','rechazada','No cumple con la disponibilidad horaria completa exigida para el turno de tarde','2026-10-04 17:46:54',3),(16,107,NULL,'recibida','Postulación registrada exitosamente a través del portal de empleo.','2026-10-20 02:52:51',1),(17,108,NULL,'recibida','Postulación registrada exitosamente a través del portal de empleo.','2026-10-20 02:54:58',2),(18,107,'recibida','aprobada','Candidato aprobado satisfactoriamente en el proceso de selección.','2026-10-20 03:10:13',3),(19,107,'aprobada','aprobada','Candidato aprobado satisfactoriamente en el proceso de selección.','2026-10-20 03:10:16',3),(20,108,'recibida','entrevista','Entrevista virtual programada para el 19/10/2026 a las 22:00. Ubicación: https://teams.microsoft.com/l/meetup-join/gtel-talento','2026-10-20 03:10:57',3);
/*!40000 ALTER TABLE `postulacion_timeline` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `postulaciones`
--

DROP TABLE IF EXISTS `postulaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `postulaciones` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(30) DEFAULT NULL,
  `postulante_id` bigint(20) NOT NULL,
  `vacante_id` bigint(20) NOT NULL,
  `puntaje_general` int(11) DEFAULT NULL,
  `estado` enum('recibida','en_revision','entrevista','aprobada','rechazada') DEFAULT 'recibida',
  `fecha_postulacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `cv_url` varchar(255) DEFAULT NULL,
  `cv_nombre` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `fk_postulaciones_postulantes` (`postulante_id`),
  KEY `fk_postulaciones_vacantes` (`vacante_id`),
  CONSTRAINT `fk_postulaciones_postulantes` FOREIGN KEY (`postulante_id`) REFERENCES `postulantes` (`id`),
  CONSTRAINT `fk_postulaciones_vacantes` FOREIGN KEY (`vacante_id`) REFERENCES `vacantes` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=109 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `postulaciones`
--

LOCK TABLES `postulaciones` WRITE;
/*!40000 ALTER TABLE `postulaciones` DISABLE KEYS */;
INSERT INTO `postulaciones` VALUES (101,'GTEL-2026-1001',101,1,85,'en_revision','2026-10-05 17:46:54','/api/recruiter/cv/ana_torres_cv.pdf','CV_Ana_Torres_2026.pdf'),(102,'GTEL-2026-1002',102,2,92,'entrevista','2026-10-04 17:46:54','/api/recruiter/cv/carlos_mendoza_cv.pdf','CV_Carlos_Mendoza_TI.pdf'),(103,'GTEL-2026-1003',103,3,96,'aprobada','2026-09-27 17:46:54','/api/recruiter/cv/lucia_ramos_cv.pdf','CV_Lucia_Ramos_Ops.pdf'),(104,'GTEL-2026-1004',104,4,74,'recibida','2026-10-08 17:46:54','/api/recruiter/cv/diego_salazar_cv.pdf','CV_Diego_Salazar.pdf'),(105,'GTEL-2026-1005',105,5,88,'entrevista','2026-10-06 17:46:54','/api/recruiter/cv/valeria_ponce_cv.pdf','CV_Valeria_Ponce_Talento.pdf'),(106,'GTEL-2026-1006',106,1,52,'rechazada','2026-10-02 17:46:54','/api/recruiter/cv/jose_castillo_cv.pdf','CV_Jose_Castillo.pdf'),(107,'GTEL-2026-2840',107,1,NULL,'aprobada','2026-10-20 02:52:51','/api/candidate/cv/cv_107_1792446771474_c70071c2.pdf','Informe de Auditoría Comparativa y Propuesta de Unificación – GTEL Talento ATS.pdf'),(108,'GTEL-2026-9515',1,1,NULL,'entrevista','2026-10-20 02:54:58','/api/candidate/cv/cv_1_1792446898602_d2c5ad8c.pdf','Informe de Auditoría Comparativa y Propuesta de Unificación – GTEL Talento ATS.pdf');
/*!40000 ALTER TABLE `postulaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `postulantes`
--

DROP TABLE IF EXISTS `postulantes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `postulantes` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `usuario_id` bigint(20) NOT NULL,
  `nombres` varchar(100) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  `dni` varchar(8) DEFAULT NULL,
  `telefono` varchar(16) DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `cv_url` varchar(255) DEFAULT NULL,
  `experiencia` text DEFAULT NULL,
  `educacion` text DEFAULT NULL,
  `estado` enum('activo','inactivo','anonimizado') NOT NULL DEFAULT 'activo',
  `consentimiento_datos` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Consentimiento expl?cito Ley 29733',
  `fecha_consentimiento` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Fecha de aceptaci?n de t?rminos de privacidad',
  `consentimiento_version` varchar(30) NOT NULL DEFAULT 'v1.0-ley29733' COMMENT 'Versi?n de la pol?tica aceptada',
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `fk_postulantes_usuarios` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=108 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `postulantes`
--

LOCK TABLES `postulantes` WRITE;
/*!40000 ALTER TABLE `postulantes` DISABLE KEYS */;
INSERT INTO `postulantes` VALUES (1,2,'Brian','De Prueba','12344556','123456789',NULL,'/api/candidate/cv/cv_1_1792446898602_d2c5ad8c.pdf',NULL,NULL,'activo',1,'2026-10-09 21:00:40','v1.0-ley29733'),(101,101,'Ana','Torres Vega','72145896','+51987432110','1998-05-14','/api/recruiter/cv/ana_torres_cv.pdf','2 a?os en ventas telef?nicas y telemarketing','T?cnico en Administraci?n','activo',1,'2026-10-09 21:00:40','v1.0-ley29733'),(102,102,'Carlos','Mendoza Quispe','74859632','+51966521880','1997-11-20','/api/recruiter/cv/carlos_mendoza_cv.pdf','3 a?os en mesa de ayuda TI y conectividad','T?cnico en Computaci?n e Inform?tica','activo',1,'2026-10-09 21:00:40','v1.0-ley29733'),(103,103,'Luc?a','Ramos Flores','71258963','+51955398214','1994-03-08','/api/recruiter/cv/lucia_ramos_cv.pdf','5 a?os liderando operaciones de contact center','Licenciatura en Administraci?n de Empresas','activo',1,'2026-10-09 21:00:40','v1.0-ley29733'),(104,104,'Diego','Salazar Paredes','76321458','+51944126390','2001-08-22','/api/recruiter/cv/diego_salazar_cv.pdf','1 a?o en atenci?n al cliente presencial','Secundaria completa','activo',1,'2026-10-09 21:00:40','v1.0-ley29733'),(105,105,'Valeria','Ponce C?rdova','75896321','+51933764205','1996-09-17','/api/recruiter/cv/valeria_ponce_cv.pdf','3 a?os en selecci?n de talento y evaluaci?n','Licenciatura en Psicolog?a Organizacional','activo',1,'2026-10-09 21:00:40','v1.0-ley29733'),(106,106,'Jos? Luis','Castillo Rivas','70451236','+51922456789','1999-12-03','/api/recruiter/cv/jose_castillo_cv.pdf','6 meses en ventas de campo','Secundaria completa','activo',1,'2026-10-09 21:00:40','v1.0-ley29733'),(107,1,'Brian','Rivera Bautista','12344567','123456789',NULL,'/api/candidate/cv/cv_107_1792446771474_c70071c2.pdf',NULL,NULL,'activo',1,'2026-10-20 02:52:51','v1.0-ley29733');
/*!40000 ALTER TABLE `postulantes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recuperacion_acceso`
--

DROP TABLE IF EXISTS `recuperacion_acceso`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recuperacion_acceso` (
  `usuario_id` bigint(20) NOT NULL,
  `token_hash` varchar(64) NOT NULL,
  `expira` bigint(20) NOT NULL,
  `solicitado` bigint(20) NOT NULL,
  PRIMARY KEY (`usuario_id`),
  UNIQUE KEY `token_hash` (`token_hash`),
  CONSTRAINT `fk_recuperacion_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recuperacion_acceso`
--

LOCK TABLES `recuperacion_acceso` WRITE;
/*!40000 ALTER TABLE `recuperacion_acceso` DISABLE KEYS */;
/*!40000 ALTER TABLE `recuperacion_acceso` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `requerimientos_personal`
--

DROP TABLE IF EXISTS `requerimientos_personal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `requerimientos_personal` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `departamento_id` bigint(20) NOT NULL,
  `solicitante_id` bigint(20) NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `cantidad` int(11) DEFAULT 1,
  `estado` enum('pendiente','aprobado','rechazado','cerrado') DEFAULT 'pendiente',
  `fecha_solicitud` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_aprobacion` timestamp NULL DEFAULT NULL,
  `observaciones` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_req_departamentos` (`departamento_id`),
  KEY `fk_req_usuarios` (`solicitante_id`),
  CONSTRAINT `fk_req_departamentos` FOREIGN KEY (`departamento_id`) REFERENCES `departamentos` (`id`),
  CONSTRAINT `fk_req_usuarios` FOREIGN KEY (`solicitante_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `requerimientos_personal`
--

LOCK TABLES `requerimientos_personal` WRITE;
/*!40000 ALTER TABLE `requerimientos_personal` DISABLE KEYS */;
INSERT INTO `requerimientos_personal` VALUES (1,3,4,'Ingeniero de Redes y Conectividad N2','Se requiere ampliar el equipo t?cnico para atenci?n de clientes corporativos de fibra ?ptica con guardias rotativas.',2,'aprobado','2026-10-03 20:00:48','2026-10-07 20:00:48','Aprobado por Gerencia de RRHH para apertura inmediata de vacante.'),(2,3,4,'Desarrollador Backend Java Spring','Incorporaci?n de desarrollador para modernizaci?n de servicios internos e integraciones API de telecomunicaciones.',1,'pendiente','2026-10-08 20:00:48',NULL,'En revisi?n de presupuesto de TI para el ?ltimo trimestre.'),(3,1,4,'Asesor Comercial Corporativo B2B','Apertura de nueva cartera de cuentas empresariales en Lima Metropolitana.',3,'rechazado','2026-09-29 20:00:48',NULL,'Se priorizar?n contrataciones outbound masivas antes de cuentas corporativas grandes.');
/*!40000 ALTER TABLE `requerimientos_personal` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `descripcion` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'CANDIDATO','Postulante externo a convocatorias'),(2,'RECLUTADOR','Gesti?n de procesos de selecci?n y reclutamiento'),(3,'ADMIN','Administrador de seguridad y usuarios del sistema'),(4,'JEFATURA_SOLICITANTE','Jefatura o l?der de ?rea solicitante de personal'),(5,'ANALISTA_RRHH','Analista de recursos humanos para filtrado y coordinaci?n'),(6,'ENTREVISTADOR','Evaluador t?cnico y conductor de entrevistas asignadas');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `solicitudes_arco`
--

DROP TABLE IF EXISTS `solicitudes_arco`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitudes_arco` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `usuario_id` bigint(20) DEFAULT NULL,
  `email_solicitante` varchar(150) NOT NULL,
  `tipo_solicitud` enum('ACCESO','RECTIFICACION','CANCELACION_OLVIDO','OPOSICION') NOT NULL,
  `estado` enum('EJECUTADA','PENDIENTE','RECHAZADA') NOT NULL DEFAULT 'EJECUTADA',
  `detalle` text DEFAULT NULL,
  `ip_origen` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_solicitudes_arco_usuario` (`usuario_id`),
  KEY `idx_solicitudes_arco_tipo` (`tipo_solicitud`),
  CONSTRAINT `fk_solicitudes_arco_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `solicitudes_arco`
--

LOCK TABLES `solicitudes_arco` WRITE;
/*!40000 ALTER TABLE `solicitudes_arco` DISABLE KEYS */;
INSERT INTO `solicitudes_arco` VALUES (1,2,'postulante1@gmail.com','ACCESO','EJECUTADA','Exportación completa de legajo bajo derecho de portabilidad y acceso','0:0:0:0:0:0:0:1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-PE) WindowsPowerShell/5.1.19041.6456','2026-10-10 06:55:14');
/*!40000 ALTER TABLE `solicitudes_arco` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `auth_version` int(11) NOT NULL DEFAULT 0,
  `otp_exempt` tinyint(1) NOT NULL DEFAULT 0,
  `rol_id` bigint(20) NOT NULL,
  `estado` enum('activo','inactivo','anonimizado') NOT NULL DEFAULT 'activo',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_usuarios_roles` (`rol_id`),
  CONSTRAINT `fk_usuarios_roles` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=107 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'administrador@gmail.com','$2a$10$6wccwZvidcExyauzXPSEQuCIbn/1wUWpS0DxZGIF8.AvWucGwxz5W',0,1,3,'activo','2026-10-02 18:18:54'),(2,'postulante1@gmail.com','$2a$10$6wccwZvidcExyauzXPSEQuCIbn/1wUWpS0DxZGIF8.AvWucGwxz5W',0,1,1,'activo','2026-10-02 18:18:54'),(3,'reclutador1@gmail.com','$2a$10$6wccwZvidcExyauzXPSEQuCIbn/1wUWpS0DxZGIF8.AvWucGwxz5W',0,1,2,'activo','2026-10-02 18:18:54'),(4,'jefatura1@gmail.com','$2a$10$6wccwZvidcExyauzXPSEQuCIbn/1wUWpS0DxZGIF8.AvWucGwxz5W',0,1,4,'activo','2026-10-09 20:00:48'),(5,'analista1@gmail.com','$2a$10$6wccwZvidcExyauzXPSEQuCIbn/1wUWpS0DxZGIF8.AvWucGwxz5W',0,1,5,'activo','2026-10-09 20:00:48'),(6,'entrevistador1@gmail.com','$2a$10$6wccwZvidcExyauzXPSEQuCIbn/1wUWpS0DxZGIF8.AvWucGwxz5W',0,1,6,'activo','2026-10-09 20:00:48'),(101,'ana.torres@gmail.com','$2a$10$6wccwZvidcExyauzXPSEQuCIbn/1wUWpS0DxZGIF8.AvWucGwxz5W',0,0,1,'activo','2026-10-09 17:46:54'),(102,'carlos.mendoza@gmail.com','$2a$10$6wccwZvidcExyauzXPSEQuCIbn/1wUWpS0DxZGIF8.AvWucGwxz5W',0,0,1,'activo','2026-10-09 17:46:54'),(103,'lucia.ramos@gmail.com','$2a$10$6wccwZvidcExyauzXPSEQuCIbn/1wUWpS0DxZGIF8.AvWucGwxz5W',0,0,1,'activo','2026-10-09 17:46:54'),(104,'diego.salazar@gmail.com','$2a$10$6wccwZvidcExyauzXPSEQuCIbn/1wUWpS0DxZGIF8.AvWucGwxz5W',0,0,1,'activo','2026-10-09 17:46:54'),(105,'valeria.ponce@gmail.com','$2a$10$6wccwZvidcExyauzXPSEQuCIbn/1wUWpS0DxZGIF8.AvWucGwxz5W',0,0,1,'activo','2026-10-09 17:46:54'),(106,'jose.castillo@gmail.com','$2a$10$6wccwZvidcExyauzXPSEQuCIbn/1wUWpS0DxZGIF8.AvWucGwxz5W',0,0,1,'activo','2026-10-09 17:46:54');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vacantes`
--

DROP TABLE IF EXISTS `vacantes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vacantes` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `requerimiento_id` bigint(20) DEFAULT NULL,
  `titulo` varchar(150) NOT NULL,
  `departamento_id` bigint(20) NOT NULL,
  `reclutador_id` bigint(20) NOT NULL,
  `num_vacantes` int(11) DEFAULT 1,
  `sueldo_min` decimal(10,2) DEFAULT NULL,
  `sueldo_max` decimal(10,2) DEFAULT NULL,
  `tipo_jornada` enum('full_time','part_time','por_turnos','freelance') NOT NULL,
  `modalidad` enum('presencial','remoto','hibrido') NOT NULL,
  `sede` varchar(150) DEFAULT NULL,
  `fecha_publicacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_limite_postulacion` date DEFAULT NULL,
  `fecha_cierre` date DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `nivel_educativo` varchar(80) DEFAULT NULL,
  `experiencia_minima` varchar(80) DEFAULT NULL,
  `habilidades` varchar(255) DEFAULT NULL,
  `estado` enum('activa','pausada','cerrada') DEFAULT 'activa',
  PRIMARY KEY (`id`),
  KEY `fk_vacantes_requerimientos` (`requerimiento_id`),
  KEY `fk_vacantes_departamentos` (`departamento_id`),
  KEY `fk_vacantes_reclutador` (`reclutador_id`),
  CONSTRAINT `fk_vacantes_departamentos` FOREIGN KEY (`departamento_id`) REFERENCES `departamentos` (`id`),
  CONSTRAINT `fk_vacantes_reclutador` FOREIGN KEY (`reclutador_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `fk_vacantes_requerimientos` FOREIGN KEY (`requerimiento_id`) REFERENCES `requerimientos_personal` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vacantes`
--

LOCK TABLES `vacantes` WRITE;
/*!40000 ALTER TABLE `vacantes` DISABLE KEYS */;
INSERT INTO `vacantes` VALUES (1,NULL,'Asesor de Ventas Telef?nicas Outbound',1,3,5,1500.00,2200.00,'full_time','presencial','Lima, Per?','2026-10-05 19:52:27','2026-11-19',NULL,'Buscamos asesores comerciales talentosos para contactar clientes potenciales, ofrecer planes corporativos y de telecomunicaciones GTEL, y cumplir metas mensuales con excelentes comisiones y todos los beneficios de ley.','Secundaria completa','6 meses - 1 a?o','Ventas, Negociaci?n, Comunicaci?n asertiva, CRM','activa'),(2,NULL,'Soporte T?cnico Nivel 1 - Mesa de Ayuda',3,3,2,1800.00,2500.00,'full_time','hibrido','Lima, Per?','2026-10-05 19:52:27','2026-12-04',NULL,'Atenci?n de tickets e incidencias t?cnicas de conectividad de fibra ?ptica, configuraci?n de routers y asistencia t?cnica remota a usuarios corporativos de GTEL Telecomunicaciones.','T?cnico','1 - 2 a?os','Redes, Helpdesk, Routers, Windows, Linux, Diagn?stico de conectividad','activa'),(3,NULL,'Supervisor de Operaciones Call Center',5,3,1,2800.00,3600.00,'full_time','presencial','Arequipa, Per?','2026-10-05 19:52:27','2026-11-04',NULL,'Liderar y supervisar equipos de agentes telef?nicos, monitorear m?tricas operativas (AHT, FCR, CSAT, Adherencia) y asegurar el cumplimiento de KPIs de calidad y satisfacci?n del cliente.','Universitario','2 - 5 a?os','Liderazgo, KPIs, Feedback constructivo, Coaching, Excel avanzado','activa'),(4,NULL,'Asesor de Atenci?n al Cliente y Reclamos',2,3,4,1300.00,1800.00,'part_time','remoto','Remoto','2026-10-05 19:52:27','2026-11-14',NULL,'Brindar atenci?n oportuna, profesional y emp?tica a consultas y reclamos de usuarios de servicios GTEL, garantizando una alta satisfacci?n y pronta resoluci?n de casos.','Secundaria completa','Sin experiencia','Atenci?n al cliente, Empat?a, Resoluci?n de problemas, Redacci?n','activa'),(5,NULL,'Especialista de Atracci?n del Talento',4,3,1,2400.00,3200.00,'full_time','hibrido','Lima, Per?','2026-10-05 19:52:27','2026-11-24',NULL,'Gesti?n de procesos integrales de selecci?n masiva y perfiles t?cnicos, entrevistas por competencias, aplicaci?n de evaluaciones psicol?gicas y coordinaci?n de inducci?n e ingreso.','Universitario','1 - 2 a?os','Entrevistas por competencias, Reclutamiento masivo, ATS, Pruebas psicot?cnicas','activa');
/*!40000 ALTER TABLE `vacantes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vacantes_papelera`
--

DROP TABLE IF EXISTS `vacantes_papelera`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vacantes_papelera` (
  `vacante_id` bigint(20) NOT NULL,
  `eliminada_en` bigint(20) NOT NULL,
  `eliminar_despues` bigint(20) NOT NULL,
  `usuario_id` bigint(20) NOT NULL,
  PRIMARY KEY (`vacante_id`),
  KEY `idx_papelera_vencimiento` (`eliminar_despues`),
  KEY `fk_papelera_usuario` (`usuario_id`),
  CONSTRAINT `fk_papelera_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_papelera_vacante` FOREIGN KEY (`vacante_id`) REFERENCES `vacantes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vacantes_papelera`
--

LOCK TABLES `vacantes_papelera` WRITE;
/*!40000 ALTER TABLE `vacantes_papelera` DISABLE KEYS */;
/*!40000 ALTER TABLE `vacantes_papelera` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'gtel_talento'
--
--
-- WARNING: can't read the INFORMATION_SCHEMA.libraries table. It's most probably an old server 5.5.5-10.4.32-MariaDB.
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-20 17:53:32
