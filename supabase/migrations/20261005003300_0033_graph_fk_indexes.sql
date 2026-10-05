-- Index untuk foreign key yang dipakai cascade dan pemeriksaan FK saat node/fitur dihapus.
-- Tanpa index ini menghapus venue 10 lantai (20.000 edge) memindai nav_edges sekali per node
-- dan memakan ±63 detik, melewati batas waktu statement API (temuan T-412).
create index if not exists nav_edges_from_node_idx on public.nav_edges (from_node_id);
create index if not exists nav_edges_to_node_idx on public.nav_edges (to_node_id);
create index if not exists nav_nodes_feature_idx on public.nav_nodes (feature_id);
create index if not exists connector_stops_node_idx on public.connector_stops (node_id);
create index if not exists location_units_feature_idx on public.location_units (feature_id);
create index if not exists closures_edge_idx on public.closures (edge_id);
