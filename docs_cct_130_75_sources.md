# Fuentes y decisiones de modelado del CCT 130/75

Fecha de revisión: 2026-08-14.

La fuente oficial publicada por Argentina.gob.ar identifica el Convenio Colectivo de Trabajo N.º 130/75 para empleados de comercio, con ámbito territorial nacional y categorías generales de maestranza y servicios, administrativos, auxiliar, auxiliar especializado y ventas. Fuente: https://www.argentina.gob.ar/sites/default/files/mteyss-ese-conveniocolectivodetrabajo-comercio-130-75.pdf

La publicación de FAECYS consultada se utiliza únicamente como fuente dinámica de circulares y escalas salariales. EDV no hardcodea importes: el parámetro salarial debe versionarse, renovarse antes de cada liquidación y elevarse a revisión humana si queda desactualizado. Fuente: https://www.faecys.org.ar/faecys-circular-escalas-salariales-abril-2026-julio-2026-cct-130-75-rama-gremial/

La referencia oficial de InfoLEG consultada muestra la articulación de instrumentos posteriores con el CCT 130/75 y la necesidad de considerar normas convencionales específicas, vigencia y alcance. EDV utiliza este principio como guardrail: el sistema no decide el encuadramiento definitivo ni reemplaza la revisión profesional. Fuente: https://servicios.infoleg.gob.ar/infolegInternet/anexos/205000-209999/209035/norma.htm

Decisión de arquitectura: se cargaron tres reglas activas de ADN con jurisdicción Argentina y convenio CCT 130/75: ámbito y categorías; fuente dinámica de escalas y acuerdos; y controles de encuadramiento. Las reglas obligan a revisar actividad, categoría, territorio, acuerdos posteriores, versión salarial y parámetros de cargas sociales antes de liquidar.
