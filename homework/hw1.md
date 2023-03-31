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

```sql
SELECT adm.rayon_name, 
       (SELECT COUNT(*) FROM med_centers WHERE ST_Within(med_centers.geom, adm.geom)) AS med_centers_count, 
       (SELECT COUNT(*) FROM pharmacies_gmaps WHERE ST_Within(pharmacies_gmaps.geom, adm.geom)) AS pharmacies_count
FROM adm_rayoni_nag AS adm;
```

# Calculate the total area of parks in each administrative region.

```sql
select
	adm.obns_cyr,
	SUM(ST_Area(ST_Intersection(adm.geom, park.geom))) as total_park_area
from
	adm_rayoni_nag_2017 as adm
join parkove_gradini_sofpl_2019 as park on
	ST_Intersects(adm.geom,
	park.geom)
group by
	adm.obns_cyr ;
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

```sql
select mcg.id as medcentr_id, 
	   ljres.id as pharm_id, 
       mcg.geom,
       ljres.geom,
       ljres.geom <-> mcg.geom
from med_centers_gmaps_2023 mcg,
lateral
	(select pg_in.geom, pg_in.id 
	 from med_centers_gmaps_2023 mcg_in, 
	      pharmacies_gmaps_2023 pg_in 
	 where  mcg_in.id = mcg.id
	 order by mcg_in.geom <-> pg_in.geom asc
	 limit 1) ljres
order by mcg.id;
```

```sql
select * from (
	select
		mcg_in.id as medcentr_id,
		pg_in.id as pharmacy_id,
		rank() over (
		   partition by mcg_in.id  
		   order by mcg_in.geom <-> pg_in.geom asc ) rnk
	from
		med_centers_gmaps_2023 mcg_in, 
		pharmacies_gmaps_2023 pg_in) inr where inr.rnk = 1;
```

# Identify urban entities with no medical centers or pharmacies.

```sql
select
	arn.id,
	arn.geom,
	arn.obns_cyr 
from
	adm_rayoni_nag_2017 arn 
where not exists (
	select 1 from med_centers_gmaps_2023 mcg 
	where st_within (mcg.geom, arn.geom)
) 
and not exists (
	select 1 from pharmacies_gmaps_2023 pg  
	where st_within (pg.geom, arn.geom)
)
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
