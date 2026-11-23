-- Consolidación del registro y control operativo de incidentes.
-- Requiere 017, 018 y 019. No modifica tickets ni datos históricos.
USE gtel_talento;

ALTER TABLE incidentes_produccion
  ADD COLUMN canal_reporte
    ENUM('WEB','TELEFONO','MONITOREO','INTEGRACION') NOT NULL DEFAULT 'WEB'
    AFTER fuente,
  ADD COLUMN reportante_detalle VARCHAR(200) NULL AFTER canal_reporte,
  ADD COLUMN registrado_por BIGINT NULL AFTER reportado_por,
  ADD CONSTRAINT fk_incidente_registrador FOREIGN KEY (registrado_por)
    REFERENCES usuarios(id) ON DELETE SET NULL;

CREATE OR REPLACE VIEW vw_control_incidentes AS
SELECT
  i.codigo AS codigo,
  i.detectado_at AS fecha_hora_deteccion,
  COALESCE(rep.email,i.reportante_detalle,'Sin identificar') AS reportado_por,
  i.descripcion AS descripcion,
  c.nombre AS categoria,
  COALESCE(i.prioridad,i.prioridad_sugerida) AS prioridad,
  resp.email AS responsable,
  i.estado AS estado,
  i.primera_atencion_at AS fecha_hora_primera_atencion,
  i.cerrado_at AS fecha_hora_cierre,
  i.solucion_aplicada AS solucion_aplicada,
  CONCAT_WS('\n',i.causa_raiz,i.aprendizaje) AS causa_y_aprendizaje,
  i.falla_repetida AS falla_repetida,
  CASE WHEN i.primera_atencion_at IS NULL THEN NULL
       ELSE ROUND(TIMESTAMPDIFF(MINUTE,i.detectado_at,i.primera_atencion_at)/60,2)
  END AS horas_hasta_primera_atencion,
  CASE WHEN i.recuperado_at IS NULL THEN NULL
       ELSE ROUND(TIMESTAMPDIFF(MINUTE,i.detectado_at,i.recuperado_at)/60,2)
  END AS horas_hasta_solucion,
  CASE WHEN sla.minutos_resolucion IS NULL THEN NULL
       ELSE ROUND(sla.minutos_resolucion/60,2)
  END AS tiempo_limite_h,
  CASE WHEN i.sla_resolucion_at IS NULL THEN NULL
       WHEN COALESCE(i.recuperado_at,CURRENT_TIMESTAMP) > i.sla_resolucion_at THEN TRUE
       ELSE FALSE
  END AS vencido
FROM incidentes_produccion i
LEFT JOIN usuarios rep ON rep.id=i.reportado_por
LEFT JOIN usuarios resp ON resp.id=i.responsable_id
LEFT JOIN incidente_categorias c ON c.codigo=i.categoria_codigo
LEFT JOIN incidente_sla_politicas sla ON sla.id=i.sla_politica_id;
