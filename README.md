# AdsoLab
Plataforma para el modelado y validación del equilibrio en los procesos de adsorción de contaminantes.

## Docker
# Crear nueva imagen
docker build -t adsolab-front .

# Levantar app usando la imagen creada antes
docker run -p 4201:4200 adsolab-front

Access http://localhost:4201/
