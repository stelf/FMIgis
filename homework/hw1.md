Here are five homework assignment tasks that can be solved using popular spatial SQL functions for PostGIS. These tasks assume you have the mentioned datasets uploaded and are using a PostGIS-enabled PostgreSQL database.

# Find the number of medical centers and pharmacies in each administrative region.

```sql
select
	adm.obns_cyr,
	COUNT(distinct med_centers.*) as med_centers_count,
	COUNT(distinct pharmacies_gmaps.*) as pharmacies_count
from
	adm_rayoni_nag_2017 as adm
left join med_centers_gmaps_2023 med_centers on
	ST_Within(med_centers.geom,
	adm.geom)
left join pharmacies_gmaps_2023 pharmacies_gmaps on
	ST_Within(pharmacies_gmaps.geom,
	adm.geom)
group by
	adm.obns_cyr ;
```

# Calculate the total area of parks in each administrative region.

```sql
SELECT adm.rayon_name, SUM(ST_Area(ST_Intersection(adm.geom, park.geom))) AS total_park_area
FROM adm_rayoni_nag AS adm
JOIN parkove_gradini_sofp AS park ON ST_Intersects(adm.geom, park.geom)
GROUP BY adm.rayon_name;
```
# Find the distance between each medical center and the nearest pharmacy.

```sql
SELECT med_centers.id AS med_center_id, pharmacies_gmaps.id AS pharmacy_id, ST_Distance(med_centers.geom, pharmacies_gmaps.geom) AS distance
FROM med_centers, pharmacies_gmaps
WHERE med_centers.id IN (
  SELECT DISTINCT ON (med_centers.id) med_centers.id
  FROM med_centers, pharmacies_gmaps
  ORDER BY med_centers.geom <-> pharmacies_gmaps.geom
);
```

# Identify urban entities with no medical centers or pharmacies.

```sql
SELECT ue.id AS urban_entity_id
FROM gradoustroystveni_edinici AS ue
WHERE NOT EXISTS (
  SELECT 1
  FROM med_centers
  WHERE ST_Within(med_centers.geom, ue.geom)
) AND NOT EXISTS (
  SELECT 1
  FROM pharmacies_gmaps
  WHERE ST_Within(pharmacies_gmaps.geom, ue.geom)
);
```

# Find the medical center or pharmacy closest to the centroid of each park.

```sql
WITH park_centroids AS (
  SELECT id, ST_Centroid(geom) AS centroid
  FROM parkove_gradini_sofp
)
SELECT pc.id AS park_id, COALESCE(med_centers.id, pharmacies_gmaps.id) AS facility_id, ST_Distance(pc.centroid, COALESCE(med_centers.geom, pharmacies_gmaps.geom)) AS distance
FROM park_centroids AS pc
LEFT JOIN med_centers ON pc.centroid <-> med_centers.geom = (
  SELECT MIN(pc.centroid <-> med_centers.geom)
  FROM med_centers
)
LEFT JOIN pharmacies_gmaps ON pc.centroid <-> pharmacies_gmaps.geom = (
  SELECT MIN(pc.centroid <-> pharmacies_gmaps.geom)
  FROM pharmacies_gmaps
)
ORDER BY pc.id;
```
