-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: gtel_talento
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
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
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auditoria` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `tabla_afectada` varchar(50) NOT NULL,
  `registro_id` bigint(20) NOT NULL,
  `accion` enum('crear','actualizar','eliminar') NOT NULL,
  `detalle` varchar(255) DEFAULT NULL,
  `usuario_id` bigint(20) DEFAULT NULL,
  `fecha_accion` timestamp NOT NULL DEFAULT current_timestamp(),
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
/*!40101 SET character_set_client = utf8 */;
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
/*!40101 SET character_set_client = utf8 */;
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
/*!40101 SET character_set_client = utf8 */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `entrevistas`
--

LOCK TABLES `entrevistas` WRITE;
/*!40000 ALTER TABLE `entrevistas` DISABLE KEYS */;
/*!40000 ALTER TABLE `entrevistas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluacion_detalle`
--

DROP TABLE IF EXISTS `evaluacion_detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluacion_detalle`
--

LOCK TABLES `evaluacion_detalle` WRITE;
/*!40000 ALTER TABLE `evaluacion_detalle` DISABLE KEYS */;
/*!40000 ALTER TABLE `evaluacion_detalle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluaciones`
--

DROP TABLE IF EXISTS `evaluaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluaciones`
--

LOCK TABLES `evaluaciones` WRITE;
/*!40000 ALTER TABLE `evaluaciones` DISABLE KEYS */;
/*!40000 ALTER TABLE `evaluaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `postulacion_timeline`
--

DROP TABLE IF EXISTS `postulacion_timeline`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `postulacion_timeline`
--

LOCK TABLES `postulacion_timeline` WRITE;
/*!40000 ALTER TABLE `postulacion_timeline` DISABLE KEYS */;
/*!40000 ALTER TABLE `postulacion_timeline` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `postulaciones`
--

DROP TABLE IF EXISTS `postulaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `postulaciones`
--

LOCK TABLES `postulaciones` WRITE;
/*!40000 ALTER TABLE `postulaciones` DISABLE KEYS */;
/*!40000 ALTER TABLE `postulaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `postulantes`
--

DROP TABLE IF EXISTS `postulantes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
  `estado` enum('activo','inactivo') DEFAULT 'activo',
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `fk_postulantes_usuarios` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `postulantes`
--

LOCK TABLES `postulantes` WRITE;
/*!40000 ALTER TABLE `postulantes` DISABLE KEYS */;
INSERT INTO `postulantes` VALUES (1,2,'Postulante','De Prueba',NULL,NULL,NULL,NULL,NULL,NULL,'activo');
/*!40000 ALTER TABLE `postulantes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `requerimientos_personal`
--

DROP TABLE IF EXISTS `requerimientos_personal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `requerimientos_personal`
--

LOCK TABLES `requerimientos_personal` WRITE;
/*!40000 ALTER TABLE `requerimientos_personal` DISABLE KEYS */;
/*!40000 ALTER TABLE `requerimientos_personal` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `roles` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `descripcion` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'CANDIDATO','Postulante externo a convocatorias'),(2,'RECLUTADOR','Gesti?n de procesos de selecci?n y reclutamiento'),(3,'ADMIN','Administrador de seguridad y usuarios del sistema');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `usuarios` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `auth_version` int(11) NOT NULL DEFAULT 0,
  `otp_exempt` tinyint(1) NOT NULL DEFAULT 0,
  `rol_id` bigint(20) NOT NULL,
  `estado` enum('activo','inactivo') DEFAULT 'activo',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_usuarios_roles` (`rol_id`),
  CONSTRAINT `fk_usuarios_roles` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'administrador@gmail.com','$2a$10$KQLlXdMYTuU4DW6S/ETrseKqGDjFQWcSSSkSps4BnqgXZ3uf3gSWW',0,1,3,'activo','2026-10-02 18:18:54'),(2,'postulante1@gmail.com','$2a$10$05zqAdPTwtKhlABiE4IJW.wcMlKwX9jXULfTbaRx.Bx5DwGMaspBe',0,1,1,'activo','2026-10-02 18:18:54'),(3,'reclutador1@gmail.com','$2a$10$3AOUjefsfjAC5mpW1OmXGOTifLykcoSaQMXu6vk7/yE8xWJ.vL9te',0,1,2,'activo','2026-10-02 18:18:54');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vacantes`
--

DROP TABLE IF EXISTS `vacantes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
-- Dumping routines for database 'gtel_talento'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-08 23:06:54
