# Plan

El objetivo es agregar al backend el soporte para el nuevo modulo de cineticas de adsorcion siguiendo la estructura actual del proyecto: controladores Flask en `app/controller`, logica de negocio en `app/services`, entidades/esquemas en `app/entities`, persistencia en `app/database.py` y migraciones en `db/migrations`. La recomendacion es no mezclar cineticas con los endpoints actuales de isotermas bajo `/investigation/*`, sino crear una familia clara bajo `/kinetics/*`.

## Scope

- In: definir donde van los nuevos endpoints, que archivos del backend hay que tocar/crear, que datos recibe el backend desde el frontend y que estructura devuelve.
- Out: implementar codigo, migraciones definitivas, formulas matematicas finales y decisiones cientificas que todavia deban validar Jorge/Silvia.

## Backend actual relevante

- `app/__init__.py`: crea la app Flask y registra los blueprints. Aca se deberia registrar el nuevo `kinetics_controller`.
- `app/start.py`: punto de entrada y handlers globales de errores. No deberia necesitar cambios salvo que aparezcan nuevas excepciones especificas.
- `app/controller/model_controller.py`: expone `GET /models` y `GET /models/methods` para modelos de isotermas. Sirve como referencia para `GET /kinetics/models`.
- `app/controller/sample_controller.py`: expone `GET /samples`, `GET /sample/:id`, `POST /sample`, `DELETE /sample/:id`. Sirve como referencia para muestras cineticas.
- `app/controller/investigation_controller.py`: expone el flujo principal actual: linearizacion, prediccion de seeds, ajuste no lineal, guardado, historico/versiones. Es el espejo mas importante para el nuevo flujo cinetico.
- `app/services/model_service.py`: busca modelos y metodos de optimizacion en base de datos. Para cineticas conviene crear un service separado o extender con filtro por tipo.
- `app/services/sample_service.py`: valida y guarda muestras `ce/qe`. Para cineticas no alcanza tal cual porque los datos pasan a ser `time/qt` o `time/concentration`.
- `app/services/investigation_service.py`: coordina el flujo de isotermas usando muestra, modelos, ajuste y comparacion. Para cineticas conviene crear `kinetics_investigation_service.py`.
- `app/services/no_linear_model_service.py`: ejecuta modelos no lineales actuales usando `sample.ce` como x y `sample.qe` como y. Para cineticas sirve como referencia, pero deberia tener implementacion separada usando `time` como x y `qt` como y.
- `app/services/linearization_service.py`: ejecuta linearizaciones actuales. Si se implementan linearizaciones cineticas, conviene crear `kinetics_linearization_service.py`.
- `app/services/comparison_service.py`: compara modelos ajustados. Puede servir como referencia, pero probablemente cineticas necesite comparacion separada para evitar dependencias conceptuales de isotermas.
- `app/services/version_service.py`: guarda y recupera versiones del historico actual. Para cineticas hay que decidir si se reutilizan tablas con un campo `type` o si se crean tablas separadas.
- `app/database.py`: define tablas SQLAlchemy actuales: `Model`, `Sample`, `Investigation`, `Version`, `FittedModel`, `Comparison`, etc. Aca se agregarian tablas/columnas para cineticas.
- `app/entities/sample.py`: entidad actual con `ce` y `qe`. Para cineticas crear entidad propia con `time`, `qt`, `concentration`, etc.
- `app/entities/model.py` y `app/entities/no_linear_model.py`: base de modelos/formulas y ajuste no lineal actual. Para cineticas se puede reutilizar la idea, pero no conviene acoplar a nombres `ce/qe`.
- `app/entities/schemas/sample_schema.py`: schema Marshmallow actual para `ce/qe`. Crear `kinetics_sample_schema.py`.
- `app/entities/schemas/model_schema.py`: schema actual de modelos. Si se separan modelos cineticos, crear `kinetics_model_schema.py` o reutilizar con campo `type`.
- `app/entities/schemas/historic_schema.py`: schema de guardado/recuperacion de versiones. Crear schema cinetico o extender el actual con cuidado.
- `openapi-spec.yml`: documentacion formal de la API. Agregar los paths `/kinetics/*` y sus schemas.
- `db/migrations/*`: crear migraciones para tablas nuevas o columnas nuevas.
- `test/controller/*` y `test/entities/*`: agregar tests de controladores, schemas y calculos cineticos.

## Estructura recomendada

[ ] Crear `app/controller/kinetics_controller.py` con los endpoints del flujo cinetico.

[ ] Registrar el blueprint nuevo en `app/__init__.py`, junto a `model_controller`, `investigation_controller`, `sample_controller`, etc.

[ ] Crear `app/services/kinetics_model_service.py` para listar modelos cineticos y metodos disponibles.

[ ] Crear `app/services/kinetics_sample_service.py` para validar, ordenar y guardar datos temporales.

[ ] Crear `app/services/kinetics_investigation_service.py` para coordinar prediccion de seeds, ajuste, comparacion, guardado e historico.

[ ] Crear `app/services/kinetics_no_linear_model_service.py` para ejecutar ajuste no lineal usando `time` como variable independiente y `qt` como variable dependiente.

[ ] Crear `app/entities/kinetics_sample.py`, `app/entities/kinetics_model.py` si hace falta separar dominio, y schemas en `app/entities/schemas/kinetics_*_schema.py`.

[ ] Crear migraciones en `db/migrations` para persistir muestras, investigaciones, versiones y modelos cineticos.

[ ] Documentar todos los endpoints nuevos en `openapi-spec.yml`.

[ ] Agregar tests en `test/controller` y `test/entities` para contratos, validaciones y resultados principales.

## Endpoints propuestos

### 1. Listar modelos cineticos

`GET /kinetics/models`

Responsabilidad:
- Devolver los modelos cineticos disponibles para que el frontend muestre tarjetas/checkboxes.
- No ejecuta calculos.

Archivo:
- Controller: `app/controller/kinetics_controller.py`
- Service: `app/services/kinetics_model_service.py`
- Schema: `app/entities/schemas/kinetics_model_schema.py` o `model_schema.py` extendido
- DB: `app/database.py`, tabla nueva `kinetic_model` o tabla `model` extendida con campo `type`

Respuesta sugerida:

```json
{
  "models": [
    {
      "_id": 1,
      "code": "pfo",
      "name": "Pseudo primer orden",
      "description": "{\"es\":\"...\",\"en\":\"...\"}",
      "formula": "qt = qe * (1 - exp(-k1 * t))",
      "latex_formula": "...",
      "parameters": {
        "qe": { "unit": "mg/g", "required": true },
        "k1": { "unit": "1/min", "required": true }
      },
      "linearizations": []
    }
  ]
}
```

### 2. Crear muestra cinetica

`POST /kinetics/sample`

Responsabilidad:
- Guardar una muestra cinetica creada desde archivo o formulario.
- Asociarla al usuario autenticado, igual que `POST /sample`.

Archivo:
- Controller: `app/controller/kinetics_controller.py`
- Service: `app/services/kinetics_sample_service.py`
- Entity: `app/entities/kinetics_sample.py`
- Schema: `app/entities/schemas/kinetics_sample_schema.py`
- DB: tabla `kinetic_sample`

Request sugerido:

```json
{
  "time": [0, 5, 10, 20, 30],
  "qt": [0, 3.2, 5.1, 6.8, 7.4],
  "concentration": null,
  "initial_concentration": 50,
  "volume": 0.25,
  "adsorbent_mass": 0.5,
  "title": "Ensayo cinetico carbon activado",
  "description": "Datos de laboratorio",
  "temperature": 298,
  "time_unit": "min",
  "measure_unit": "mg/g",
  "adsorbate_id": 1,
  "adsorbent_id": 1
}
```

Regla recomendada:
- El backend deberia aceptar `time + qt` directamente.
- Si recibe `time + concentration`, deberia requerir `initial_concentration`, `volume` y `adsorbent_mass` para calcular `qt`.
- `time` y la serie dependiente deben tener la misma longitud.
- Los valores no deben ser negativos.
- Ordenar por `time` antes de persistir.

Respuesta sugerida:

```json
{
  "kinetic_sample_id": 10,
  "time": [0, 5, 10, 20, 30],
  "qt": [0, 3.2, 5.1, 6.8, 7.4],
  "title": "francisco-298K-cinetica-01-06-2026",
  "description": "Datos de laboratorio",
  "temperature": 298,
  "time_unit": "min",
  "measure_unit": "mg/g",
  "adsorbate_id": 1,
  "adsorbent_id": 1,
  "user_id": 1
}
```

### 3. Listar muestras cineticas

`GET /kinetics/samples`

Responsabilidad:
- Devolver muestras cineticas existentes para reutilizar en el modulo.

Archivo:
- Controller: `app/controller/kinetics_controller.py`
- Service: `app/services/kinetics_sample_service.py`
- Schema: `app/entities/schemas/kinetics_sample_schema.py`

Respuesta sugerida:

```json
{
  "samples": [
    {
      "kinetic_sample_id": 10,
      "title": "Ensayo cinetico carbon activado",
      "description": "Datos de laboratorio",
      "temperature": 298,
      "time_unit": "min",
      "measure_unit": "mg/g",
      "adsorbate_id": 1,
      "adsorbent_id": 1
    }
  ]
}
```

### 4. Obtener muestra cinetica por id

`GET /kinetics/sample/{kinetic_sample_id}`

Responsabilidad:
- Recuperar datos completos de una muestra cinetica.

Archivo:
- Controller: `app/controller/kinetics_controller.py`
- Service: `app/services/kinetics_sample_service.py`

Respuesta sugerida:

```json
{
  "kinetic_sample_id": 10,
  "time": [0, 5, 10, 20, 30],
  "qt": [0, 3.2, 5.1, 6.8, 7.4],
  "temperature": 298,
  "time_unit": "min",
  "measure_unit": "mg/g",
  "adsorbate_id": 1,
  "adsorbent_id": 1
}
```

### 5. Predecir parametros iniciales

`POST /kinetics/predict-seeds`

Responsabilidad:
- Estimar seeds iniciales por modelo antes del ajuste no lineal.
- Similar a `POST /investigation/predict-seeds`, pero usando muestra cinetica.

Archivo:
- Controller: `app/controller/kinetics_controller.py`
- Service: `app/services/kinetics_investigation_service.py`
- Calculo: `app/services/kinetics_no_linear_model_service.py`

Request sugerido:

```json
{
  "kinetic_sample_id": 10,
  "models": [
    { "model": "pfo" },
    { "model": "pso" },
    { "model": "intraparticle_diffusion" }
  ],
  "filter": [2]
}
```

Respuesta sugerida:

```json
{
  "kinetic_sample_id": 10,
  "results": [
    {
      "id": "pfo",
      "name": "Pseudo primer orden",
      "seeds": [
        { "name": "qe", "value": 7.4 },
        { "name": "k1", "value": 0.1 }
      ]
    }
  ]
}
```

### 6. Ejecutar linearizaciones cineticas

`POST /kinetics/run-linearization`

Responsabilidad:
- Ejecutar linearizaciones si el modelo cinetico las define.
- Puede postergarse si el primer alcance solo requiere ajuste no lineal.

Archivo:
- Controller: `app/controller/kinetics_controller.py`
- Service: `app/services/kinetics_investigation_service.py`
- Calculo: `app/services/kinetics_linearization_service.py`

Request sugerido:

```json
{
  "kinetic_sample_id": 10,
  "models": [
    {
      "model": "pfo",
      "linearizations": ["pfo_log"]
    }
  ],
  "filter": []
}
```

Respuesta sugerida:

```json
{
  "kinetic_sample_id": 10,
  "results": [
    {
      "model": "pfo",
      "linearizations": [
        {
          "name": "pfo_log",
          "params": [
            { "name": "qe", "value": 7.5 },
            { "name": "k1", "value": 0.11 }
          ],
          "statistics": {},
          "transformed": {
            "x": [0, 5, 10],
            "y": [0, 1, 2]
          }
        }
      ]
    }
  ]
}
```

### 7. Ejecutar ajuste no lineal cinetico

`POST /kinetics/run-no-linear-model`

Responsabilidad:
- Ejecutar el ajuste no lineal de uno o varios modelos cineticos.
- Es el endpoint central del modulo.
- Devuelve parametros, estadisticas, residuos, curvas predichas y comparacion.

Archivo:
- Controller: `app/controller/kinetics_controller.py`
- Service coordinador: `app/services/kinetics_investigation_service.py`
- Calculo no lineal: `app/services/kinetics_no_linear_model_service.py`
- Comparacion: `app/services/kinetics_comparison_service.py`

Request sugerido:

```json
{
  "kinetic_sample_id": 10,
  "models": [
    {
      "model": "pfo",
      "seeds": [
        { "name": "qe", "value": 7.4 },
        { "name": "k1", "value": 0.1 }
      ],
      "iterations": 10000,
      "step": 0.1,
      "bounds": {
        "qe": { "min": 0, "max": null },
        "k1": { "min": 0, "max": null }
      }
    }
  ],
  "filter": []
}
```

Respuesta sugerida:

```json
{
  "kinetic_sample_id": 10,
  "results": [
    {
      "model": "pfo",
      "best_adjust": "least_squares",
      "adjustment_methods": [
        {
          "name": "least_squares",
          "parameters": [
            { "name": "qe", "value": 7.62, "std_err": 0.14 },
            { "name": "k1", "value": 0.108, "std_err": 0.01 }
          ],
          "statistics": {
            "r_squared": 0.991,
            "adjust_r_squared": 0.987,
            "SSE": 0.12,
            "RMSE": 0.05,
            "AIC": -18.4,
            "BIC": -17.2
          },
          "residuals": {
            "values": [0, -0.1, 0.05, 0.2, -0.04],
            "analysis": {}
          },
          "transformed": {
            "x": [0, 1, 2, 3, 4, 5],
            "y": [0, 0.75, 1.42, 2.02, 2.56, 3.04],
            "qt_pred": [0, 3.1, 5.0, 6.9, 7.3]
          },
          "success": true
        }
      ],
      "seeds": [
        { "name": "qe", "value": 7.4 },
        { "name": "k1", "value": 0.1 }
      ]
    }
  ],
  "comparison": {
    "heuristic": {
      "best_model": "pfo",
      "scores": {}
    }
  }
}
```

Notas de contrato:
- Mantener nombres parecidos al flujo actual (`results`, `best_adjust`, `adjustment_methods`, `statistics`, `residuals`, `transformed`) ayuda a reutilizar componentes del frontend.
- En `transformed`, usar `x/y` para graficar generico y agregar `qt_pred` para prediccion en los tiempos experimentales.
- El backend no deberia depender de `ce/qe` en este flujo; internamente debe usar `time/qt`.

### 8. Guardar investigacion cinetica

`POST /kinetics/investigation/save`

Responsabilidad:
- Crear investigacion cinetica si no existe.
- Guardar una version con resultados, parametros, comparacion y configuracion.

Archivo:
- Controller: `app/controller/kinetics_controller.py`
- Service: `app/services/kinetics_investigation_service.py`
- Versionado: `app/services/kinetics_version_service.py` o extension cuidada de `version_service.py`
- Schema: `app/entities/schemas/kinetics_historic_schema.py`
- DB: `kinetic_investigation`, `kinetic_version`, `kinetic_fitted_model`, `kinetic_comparison`

Request sugerido:

```json
{
  "kinetic_sample_id": 10,
  "kinetic_investigation_id": null,
  "iterations": 10000,
  "steps": 0.1,
  "results": [
    {
      "model": "pfo",
      "best_adjust": "least_squares",
      "seeds": [
        { "name": "qe", "value": 7.4 },
        { "name": "k1", "value": 0.1 }
      ],
      "adjustment_methods": []
    }
  ],
  "comparison": {
    "heuristic": {
      "best_model": "pfo",
      "scores": {}
    }
  }
}
```

Respuesta sugerida:

```json
{
  "status": "ok",
  "kinetic_investigation_id": 5,
  "version_id": 1
}
```

### 9. Historico cinetico

`GET /kinetics/investigations`

Responsabilidad:
- Listar investigaciones cineticas paginadas.
- Similar a `GET /investigations`, pero separado para no mezclar equilibrio y cinetica.

Archivo:
- Controller: `app/controller/kinetics_controller.py`
- Service: `app/services/kinetics_investigation_service.py`
- Schema: `app/entities/schemas/kinetics_investigation_schema.py`

Query params:
- `page`
- `per_page`
- `user_id`

Respuesta sugerida:

```json
{
  "investigations": [
    {
      "kinetic_investigation_id": 5,
      "kinetic_sample_id": 10,
      "sample": {
        "title": "Ensayo cinetico carbon activado",
        "description": "Datos de laboratorio"
      },
      "user": {
        "id": 1,
        "email": "usuario@fi.uba.ar"
      }
    }
  ],
  "page": 1,
  "per_page": 20,
  "total": 1,
  "pages": 1
}
```

### 10. Versiones cineticas

`GET /kinetics/investigation/{kinetic_investigation_id}/versions`

`GET /kinetics/investigation/{kinetic_investigation_id}/version/{version_id}`

`DELETE /kinetics/investigation/{kinetic_investigation_id}/version/{version_id}`

`DELETE /kinetics/investigation/{kinetic_investigation_id}`

Responsabilidad:
- Reproducir el comportamiento actual de historico/versiones, pero con entidades cineticas.

Archivo:
- Controller: `app/controller/kinetics_controller.py`
- Service: `app/services/kinetics_version_service.py` y/o `app/services/kinetics_investigation_service.py`
- Schema: `app/entities/schemas/kinetics_historic_schema.py`

## Persistencia recomendada

Opcion recomendada para avanzar sin romper isotermas: tablas separadas.

[ ] `kinetic_model`: modelos cineticos, formulas, parametros, latex, descripcion.

[ ] `kinetic_linearization`: linearizaciones asociadas a modelos cineticos.

[ ] `kinetic_sample`: `time`, `qt`, `concentration`, `initial_concentration`, `volume`, `adsorbent_mass`, metadatos, `user_id`, `deleted_at`.

[ ] `kinetic_investigation`: referencia a `kinetic_sample` y `user`.

[ ] `kinetic_version`: versionado por investigacion, iteraciones, steps, fecha.

[ ] `kinetic_fitted_model`: resultados por modelo, seeds, best_adjust, adjustment_methods.

[ ] `kinetic_comparison`: comparacion y mejor modelo.

Alternativa:
- Reutilizar tablas actuales agregando un campo `type` o `domain` con valores `isotherm` y `kinetic`.
- Tiene menos tablas, pero aumenta el riesgo de romper pantallas existentes porque `sample` hoy exige `ce/qe` y muchas funciones asumen esos nombres.

## Contrato de datos frontend-backend

El frontend deberia enviar:

- `kinetic_sample_id` cuando ya existe una muestra.
- `time` y `qt` para muestras nuevas.
- Opcionalmente `concentration`, `initial_concentration`, `volume`, `adsorbent_mass` si se quiere calcular `qt`.
- `models` con `model`, `seeds`, `iterations`, `step` y eventualmente `bounds`.
- `filter` como lista de indices a excluir, igual que el flujo actual.
- `results` y `comparison` al guardar una version.

El backend deberia devolver:

- Modelos con formula, latex, parametros y linearizaciones.
- Seeds iniciales por modelo.
- Resultados por modelo y metodo de ajuste.
- Parametros ajustados con `value` y `std_err`.
- Estadisticas comparables.
- Residuos y analisis de residuos.
- Curva extendida lista para Plotly.
- Mejor modelo sugerido.
- IDs de investigacion/version al guardar.

## Riesgos y decisiones a cerrar

- Confirmar si el primer alcance requiere linearizaciones cineticas o solo ajuste no lineal.
- Confirmar formulas definitivas con Jorge/Silvia antes de persistir modelos iniciales.
- Definir si el input principal sera siempre `time/qt` o si el backend debe soportar formalmente `time/concentration`.
- Definir unidades esperadas para tiempo, concentracion, masa y volumen.
- Definir si el historico del frontend debe estar separado por modulo o unificado con un campo `type`.
- Revisar nombres: el backend actual usa `/investigation/run-no-linear-model`, mientras el frontend menciona a veces `run-no-linear-adjustment`; conviene unificar el contrato antes de implementar cineticas.

## Validacion

[ ] Agregar tests de schema para rechazar longitudes distintas, valores negativos y muestras sin `qt` ni datos suficientes para calcularlo.

[ ] Agregar tests de controller para `GET /kinetics/models`, `POST /kinetics/sample`, `POST /kinetics/predict-seeds`, `POST /kinetics/run-no-linear-model` y `POST /kinetics/investigation/save`.

[ ] Agregar tests de servicio para al menos un modelo simple, por ejemplo pseudo-primer orden, con datos sinteticos conocidos.

[ ] Actualizar `openapi-spec.yml` y revisar en Swagger Editor.

[ ] Ejecutar `pytest` antes de conectar el frontend.

## Open questions

- Los modelos cineticos iniciales definitivos son solo pseudo-primer orden, pseudo-segundo orden y difusion intraparticular?
- El frontend va a cargar `qt` calculado, o espera que el backend calcule `qt` desde concentracion, volumen y masa?
- El historico de cineticas se quiere ver como pantalla separada o mezclado con el historico actual de equilibrio?
