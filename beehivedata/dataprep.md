
### using jq tool to convert from arbitrary JSON to valid FeatureCollection

```bash
jq '{
  type: "FeatureCollection",
  features: map({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [.LNGMAX, .LATMAX]
    },
    properties: {
      label: .LABEL,
      type: .TYPE,
      volgnr: .VOLGNR
    }
  })
}' beehives.data.json > beehives.geojson.json
```

### feed data from the CSV into the server

```sql
\copy geodata (label, latmax, lngmax, type, volgnr) 
from 'beehives.data.csv' with (format csv, header true);
```

### Calculate k-means cluster using PostGIS 

```sql
  UPDATE beehives
  SET cluster_id = kmeans
  FROM (
    SELECT geom, ST_ClusterKMeans(geom, 5) OVER () AS kmeans
    FROM beehives
  ) AS subquery
  WHERE beehives.geom = subquery.geom;
```


### Calculate the Voronoi diagram based on the clusters with PostGIS

```sql
WITH cluster_centroids AS (
    SELECT
        cluster_id,
        ST_Centroid(ST_Collect(geom)) AS centroid
    FROM beehives
    GROUP BY cluster_id
)
INSERT INTO beehives_voronoi (geom)
SELECT 
    (ST_Dump(ST_VoronoiPolygons(ST_Collect(centroid)))).geom
FROM cluster_centroids;
```

### Calculate the Delaunay based on the cluster centroids

```sql
WITH cluster_centroids AS (
    SELECT
        cluster_id,
        ST_Centroid(ST_Collect(geom)) AS centroid
    FROM beehives
    GROUP BY cluster_id
)
INSERT INTO beehives_delaunay (geom)
SELECT 
    (ST_Dump(ST_DelaunayTriangles(ST_Collect(centroid)))).geom, 
FROM cluster_centroids;
```